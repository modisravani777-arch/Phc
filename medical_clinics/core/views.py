import json
import logging
import re
import secrets
import uuid
from datetime import date, datetime, timedelta
from functools import wraps
from django.conf import settings
from django.contrib.auth import authenticate, get_user_model, login, logout
from django.contrib.auth.hashers import check_password, make_password
from django.db import IntegrityError, transaction, models
from django.http import HttpResponse, JsonResponse
from django.shortcuts import get_object_or_404, render
from django.utils import timezone
from django.views.decorators.csrf import csrf_protect, ensure_csrf_cookie
from django.views.decorators.http import require_http_methods

from .models import (
    Asha,
    Household,
    Member,
    Protocol,
    NeonUser,
    DangerEscalation,
    VisitOutcome,
    FacilityProfile,
    FacilityLoginIdentity,
    PhoneLoginChallenge,
    FacilityIdentifier,
    FacilityAshaAssignment,
    FacilityReport,
    FacilitySchedule,
    FacilityVillage,
    ClinicalVisit,
    MedicalInventory,
)

logger = logging.getLogger(__name__)


def _body(request):
    try:
        value = json.loads(request.body or "{}")
    except json.JSONDecodeError:
        return None
    return value if isinstance(value, dict) else None


def _error(message, status=400):
    return JsonResponse({"error": message}, status=status)


def api_login_required(view):
    @wraps(view)
    def wrapped(request, *args, **kwargs):
        if not request.user.is_authenticated:
            return _error("Please sign in to continue", 401)
        identity_id = request.session.get("facility_login_identity_id")
        if identity_id and FacilityLoginIdentity.objects.filter(
                pk=identity_id,
                account=request.user,
                is_active=True,
                account__is_active=True,
                facility__is_active=True,
                neon_user__is_active=True,
        ).exists():
            return view(request, *args, **kwargs)

        facility_id = request.session.get("facility_profile_id")
        if not facility_id or not FacilityProfile.objects.filter(
            pk=facility_id,
            account=request.user,
            is_active=True,
            account__is_active=True,
            facility_type__in=["PHC", "SUBCENTRE"],
        ).exists():
            return _error("Please sign in with your assigned facility account", 401)
        return view(request, *args, **kwargs)
    return wrapped


def _role_value(value):
    normalized = str(value or "").strip().upper()
    return "SUBCENTRE" if normalized in {"SUBCENTRE", "SUB-CENTRE", "SUBCENTER", "SUB-CENTER"} else normalized


def _user_role(request):
    identity = FacilityLoginIdentity.objects.filter(
        account=request.user,
        is_active=True,
        facility__is_active=True,
        neon_user__is_active=True,
    ).select_related("facility", "neon_user").first()
    if identity:
        return identity.facility.facility_type, identity.facility

    profile = FacilityProfile.objects.filter(account=request.user, is_active=True).first()
    if profile:
        return profile.facility_type, profile
    return request.session.get("facility_role"), None


def _user_facility(request):
    _, profile = _user_role(request)
    if profile:
        return profile
    return None


def _visible_facilities(request):
    facility = _user_facility(request)
    if facility is None:
        return FacilityProfile.objects.none()
    if facility.facility_type == "PHC":
        return FacilityProfile.objects.filter(
            models.Q(pk=facility.pk) | models.Q(parent_phc=facility),
            is_active=True,
        )
    return FacilityProfile.objects.filter(pk=facility.pk, is_active=True)


def _visible_asha_ids(request):
    return FacilityAshaAssignment.objects.filter(
        facility__in=_visible_facilities(request),
    ).values_list("asha_id", flat=True)


def _generate_facility_code(facility_type):
    prefix = "SC" if facility_type == "SUBCENTRE" else "PHC"
    while True:
        code = f"{prefix}-{uuid.uuid4().int % 10_000_000_000:010d}"
        if (
            not FacilityProfile.objects.filter(facility_code=code).exists()
            and not FacilityIdentifier.objects.filter(identification_number=code).exists()
        ):
            return code


def _facility_code(facility):
    try:
        return facility.identifier.identification_number
    except FacilityIdentifier.DoesNotExist:
        return facility.facility_code


def _age_years(dob):
    if not dob:
        return None
    try:
        birth_date = date.fromisoformat(str(dob)[:10])
    except ValueError:
        try:
            birth_date = date(int(str(dob)[:4]), 1, 1)
        except (ValueError, TypeError):
            return None
    today = timezone.localdate()
    return max(0, today.year - birth_date.year - ((today.month, today.day) < (birth_date.month, birth_date.day)))


def _facility_json(facility):
    if not facility:
        return None
    return {
        "id": str(facility.id),
        "code": _facility_code(facility),
        "name": facility.name,
        "facility_type": facility.facility_type,
        "district": facility.district,
        "state": facility.state,
        "block": facility.block,
        "address": facility.address,
        "location": facility.location,
        "phone": facility.contact_phone,
        "email": facility.contact_email,
        "phc_code": _facility_code(facility.parent_phc) if facility.parent_phc else "",
        "phc_name": facility.parent_phc.name if facility.parent_phc else "",
        "is_active": facility.is_active,
    }


# =========================================================================
# Role-based session authentication
# =========================================================================

@ensure_csrf_cookie
@require_http_methods(["GET"])
def csrf_token(request):
    return JsonResponse({"ok": True})


def _normalize_login_phone(value):
    digits = re.sub(r"[^0-9]", "", str(value or ""))
    if len(digits) == 10:
        digits = f"91{digits}"
    elif len(digits) == 11 and digits.startswith("0"):
        digits = f"91{digits[1:]}"
    if len(digits) != 12 or not digits.startswith("91"):
        return None
    return digits


def _matching_neon_users(normalized_phone):
    return [
        user
        for user in NeonUser.objects.filter(is_active=True).only("id", "phone", "full_name").iterator()
        if _normalize_login_phone(user.phone) == normalized_phone
    ]


def _facility_login_identity(neon_user, requested_role):
    identity = FacilityLoginIdentity.objects.filter(
        neon_user=neon_user,
        is_active=True,
        account__is_active=True,
        facility__is_active=True,
    ).select_related("account", "facility", "neon_user").first()
    if not identity or identity.facility.facility_type != requested_role:
        return None
    return identity


def _auth_session_payload(identity):
    return {
        "authenticated": True,
        "username": identity.neon_user.full_name,
        "role": identity.facility.facility_type,
        "facility": _facility_json(identity.facility),
    }


@csrf_protect
@require_http_methods(["POST"])
def request_phone_otp(request):
    if not settings.DEBUG:
        return _error("Phone verification is not configured", 503)

    data = _body(request)
    if not data:
        return _error("Invalid verification request")
    normalized_phone = _normalize_login_phone(data.get("phone"))
    requested_role = _role_value(data.get("role"))
    if requested_role not in {"PHC", "SUBCENTRE"} or not normalized_phone:
        return _error("Enter a valid mobile number and choose a facility role", 400)

    users = _matching_neon_users(normalized_phone)
    if len(users) == 1:
        neon_user = users[0]
        identity = _facility_login_identity(neon_user, requested_role)
        if identity:
            now = timezone.now()
            with transaction.atomic():
                neon_user = NeonUser.objects.select_for_update().get(pk=neon_user.pk)
                latest = PhoneLoginChallenge.objects.filter(
                    neon_user=neon_user,
                    role=requested_role,
                ).order_by("-created_at").first()
                if not latest or now - latest.created_at >= timedelta(seconds=60):
                    PhoneLoginChallenge.objects.filter(
                        neon_user=neon_user,
                        role=requested_role,
                        consumed_at__isnull=True,
                    ).update(consumed_at=now)
                    otp = f"{secrets.randbelow(1_000_000):06d}"
                    PhoneLoginChallenge.objects.create(
                        neon_user=neon_user,
                        role=requested_role,
                        otp_hash=make_password(otp),
                        phone_hash=make_password(normalized_phone),
                        expires_at=now + timedelta(minutes=5),
                    )
                    logger.warning(
                        "Development OTP for %s: %s",
                        f"***-***-{normalized_phone[-4:]}",
                        otp,
                    )

    return JsonResponse({
        "ok": True,
        "message": "If this number is assigned to the selected facility, a verification code is available to the system operator.",
    })


@csrf_protect
@require_http_methods(["POST"])
def verify_phone_otp(request):
    if not settings.DEBUG:
        return _error("Phone verification is not configured", 503)

    data = _body(request)
    if not data:
        return _error("Invalid verification request")
    normalized_phone = _normalize_login_phone(data.get("phone"))
    requested_role = _role_value(data.get("role"))
    otp = str(data.get("otp", "")).strip()
    if requested_role not in {"PHC", "SUBCENTRE"} or not normalized_phone or not re.fullmatch(r"[0-9]{6}", otp):
        return _error("Enter the mobile number, facility role and six-digit code", 400)

    users = _matching_neon_users(normalized_phone)
    if len(users) != 1:
        return _error("The verification code is invalid or expired", 401)
    neon_user = users[0]
    identity = _facility_login_identity(neon_user, requested_role)
    if not identity:
        return _error("The verification code is invalid or expired", 401)

    now = timezone.now()
    with transaction.atomic():
        challenge = PhoneLoginChallenge.objects.select_for_update().filter(
            neon_user=neon_user,
            role=requested_role,
            consumed_at__isnull=True,
        ).order_by("-created_at").first()
        if not challenge or challenge.expires_at <= now or challenge.failed_attempts >= 5:
            if challenge and challenge.consumed_at is None:
                challenge.consumed_at = now
                challenge.save(update_fields=["consumed_at"])
            return _error("The verification code is invalid or expired", 401)

        if not check_password(normalized_phone, challenge.phone_hash):
            challenge.consumed_at = now
            challenge.save(update_fields=["consumed_at"])
            return _error("The verification code is invalid or expired", 401)

        if not check_password(otp, challenge.otp_hash):
            challenge.failed_attempts += 1
            if challenge.failed_attempts >= 5:
                challenge.consumed_at = now
            challenge.save(update_fields=["failed_attempts", "consumed_at"])
            return _error("The verification code is invalid or expired", 401)

        challenge.consumed_at = now
        challenge.save(update_fields=["consumed_at"])
        login(request, identity.account)

    request.session["facility_role"] = identity.facility.facility_type
    request.session["facility_login_identity_id"] = identity.pk
    request.session.pop("facility_profile_id", None)
    return JsonResponse(_auth_session_payload(identity))


@csrf_protect
@require_http_methods(["POST"])
def email_password_login(request):
    if not settings.DEBUG:
        return _error("Email and password sign-in is available only in development", 503)

    data = _body(request)
    if not data:
        return _error("Invalid login request")
    email = str(data.get("email", "")).strip().casefold()
    password = str(data.get("password", ""))
    requested_role = _role_value(data.get("role"))
    if requested_role not in {"PHC", "SUBCENTRE"} or not email or not password:
        return _error("Enter your email, password and facility role", 400)

    user_model = get_user_model()
    users = user_model.objects.filter(email__iexact=email, is_active=True)
    if users.count() != 1:
        return _error("Email, password or facility role is incorrect", 401)

    account = authenticate(request, username=users.first().get_username(), password=password)
    if not account:
        return _error("Email, password or facility role is incorrect", 401)
    if account.get_username().startswith("demo-") and not settings.DEBUG:
        return _error("Email, password or facility role is incorrect", 401)

    facility = FacilityProfile.objects.filter(account=account, is_active=True).first()
    if not facility or facility.facility_type != requested_role:
        return _error("Email, password or facility role is incorrect", 401)

    login(request, account)
    request.session["facility_role"] = facility.facility_type
    request.session["facility_profile_id"] = str(facility.pk)
    request.session.pop("facility_login_identity_id", None)
    return JsonResponse({
        "authenticated": True,
        "username": account.email or account.get_username(),
        "role": facility.facility_type,
        "facility": _facility_json(facility),
    })


@require_http_methods(["GET"])
def auth_session(request):
    if not request.user.is_authenticated:
        return JsonResponse({
            "authenticated": False,
            "username": "",
            "role": None,
            "facility": None,
        })
    identity_id = request.session.get("facility_login_identity_id")
    identity = FacilityLoginIdentity.objects.filter(
        pk=identity_id,
        account=request.user,
        is_active=True,
        facility__is_active=True,
        neon_user__is_active=True,
    ).select_related("facility", "neon_user").first()
    if identity:
        return JsonResponse(_auth_session_payload(identity))

    facility_id = request.session.get("facility_profile_id")
    facility = FacilityProfile.objects.filter(
        pk=facility_id,
        account=request.user,
        is_active=True,
        account__is_active=True,
        facility_type__in=["PHC", "SUBCENTRE"],
    ).first()
    if facility:
        return JsonResponse({
            "authenticated": True,
            "username": request.user.email or request.user.get_username(),
            "role": facility.facility_type,
            "facility": _facility_json(facility),
        })

    return JsonResponse({
        "authenticated": False,
        "username": "",
        "role": None,
        "facility": None,
    })


@api_login_required
@require_http_methods(["POST"])
def role_logout(request):
    logout(request)
    return JsonResponse({"ok": True})


# =========================================================================
# Facilities
# =========================================================================

@api_login_required
@require_http_methods(["GET", "POST"])
def facility_collection(request):
    if request.method == "GET":
        facilities = _visible_facilities(request)
        return JsonResponse({"results": [_facility_json(f) for f in facilities]})

    data = _body(request)
    if not data:
        return _error("Invalid JSON payload")

    role, current_facility = _user_role(request)
    facility_type = _role_value(data.get("facility_type") or role)
    if facility_type not in {"PHC", "SUBCENTRE"} or facility_type != role:
        return _error("Facility type must match your account role", 403)
    if current_facility:
        return _error("A facility profile is already linked to this account", 409)

    required = ("name", "district", "state")
    if any(not str(data.get(k, "")).strip() for k in required):
        return _error("name, district and state are required")

    prefix = "SC" if facility_type == "SUBCENTRE" else "PHC"
    code = str(data.get("code", "")).strip() or _generate_facility_code(facility_type)
    if not (
        code.startswith(f"{prefix}-")
        and len(code) == len(prefix) + 11
        and code[len(prefix) + 1:].isdigit()
    ):
        return _error("Facility identification numbers are assigned automatically", 400)
    parent_phc = None
    phc_code = str(data.get("phc_code", "")).strip()
    if facility_type == "SUBCENTRE" and phc_code:
        parent_phc = FacilityProfile.objects.filter(
            models.Q(facility_code__iexact=phc_code) |
            models.Q(identifier__identification_number__iexact=phc_code),
            facility_type="PHC",
            is_active=True,
        ).first()
        if parent_phc is None:
            return _error("No active PHC matches that identification code", 400)

    try:
        with transaction.atomic():
            facility = FacilityProfile.objects.create(
                facility_code=code,
                name=data["name"].strip(),
                facility_type=facility_type,
                district=data["district"].strip(),
                state=data["state"].strip(),
                block=str(data.get("block", "")).strip(),
                assigned_doctor=str(data.get("assigned_doctor", "")).strip(),
                address=str(data.get("address", "")).strip(),
                location=str(data.get("location", "")).strip(),
                contact_phone=str(data.get("phone", "")).strip(),
                contact_email=str(data.get("email", "")).strip(),
                parent_phc=parent_phc,
                account=request.user,
                is_active=True,
            )
            FacilityIdentifier.objects.create(
                facility=facility,
                identification_number=code,
            )
    except IntegrityError:
        return _error("That facility identification code is already in use", 409)

    return JsonResponse({"facility": _facility_json(facility)}, status=201)


@api_login_required
@require_http_methods(["GET", "PUT"])
def facility_me(request):
    facility = _user_facility(request)
    if facility is None:
        if request.method == "GET":
            return _error("Create a profile for this facility account", 404)
        return _error("Create a facility profile before editing it", 404)
    if request.method == "PUT":
        data = _body(request)
        if data is None:
            return _error("Invalid JSON payload")
        for key in ("name", "district", "state"):
            if key in data:
                value = str(data[key]).strip()
                if not value:
                    return _error(f"{key} cannot be empty")
                setattr(facility, key, value)
        for key, field in (
            ("block", "block"),
            ("address", "address"),
            ("location", "location"),
            ("phone", "contact_phone"),
            ("email", "contact_email"),
        ):
            if key in data:
                setattr(facility, field, str(data[key]).strip())
        if "phc_code" in data and facility.facility_type == "SUBCENTRE":
            code = str(data["phc_code"]).strip()
            parent = None
            if code:
                parent = FacilityProfile.objects.filter(
                    models.Q(facility_code__iexact=code) |
                    models.Q(identifier__identification_number__iexact=code),
                    facility_type="PHC",
                    is_active=True,
                ).first()
                if parent is None:
                    return _error("No active PHC matches that identification code", 400)
            facility.parent_phc = parent
        facility.save()
    return JsonResponse({"facility": _facility_json(facility)})


# =========================================================================
# Staff (Direct Neon PostgreSQL ashas + users)
# =========================================================================

@api_login_required
@require_http_methods(["GET", "POST"])
def staff_collection(request):
    if request.method == "GET":
        asha_ids = _visible_asha_ids(request)
        ashas = Asha.objects.filter(asha_id__in=asha_ids).order_by("asha_name")
        facility_names = _visible_facilities(request).values_list("name", flat=True)
        users = NeonUser.objects.filter(
            is_active=True,
            assigned_facility__in=facility_names,
        ).order_by("full_name")

        results = []
        for a in ashas:
            results.append({
                "id": a.asha_id,
                "full_name": a.asha_name,
                "role": "ASHA",
                "phone": "",
                "employee_code": a.asha_id,
                "villages": a.villages,
            })

        for u in users:
            role_display = "ANM" if "anm" in u.role.lower() else "SUPERVISOR" if "cho" in u.role.lower() or "mo" in u.role.lower() else "OTHER"
            results.append({
                "id": str(u.id),
                "full_name": u.full_name,
                "role": role_display,
                "phone": u.phone or "",
                "employee_code": u.email,
                "villages": u.assigned_facility,
            })

        return JsonResponse({"results": results})

    data = _body(request)
    if not data:
        return _error("Invalid JSON payload")

    full_name = str(data.get("full_name", "")).strip()
    role = str(data.get("role", "ASHA")).strip().upper()
    phone = str(data.get("phone", "")).strip()
    code = str(data.get("employee_code", "")).strip()

    if not full_name:
        return _error("full_name is required")

    if role == "ASHA":
        facility = _user_facility(request)
        if facility is None:
            return _error("Create a facility profile before adding staff", 409)
        asha_id = code or f"ASHA-{uuid.uuid4().hex[:4].upper()}"
        villages = str(data.get("villages", "")).strip()
        asha, created = Asha.objects.update_or_create(
            asha_id=asha_id,
            defaults={"asha_name": full_name, "villages": villages}
        )
        FacilityAshaAssignment.objects.get_or_create(facility=facility, asha=asha)
        return JsonResponse({
            "staff": {
                "id": asha.asha_id,
                "full_name": asha.asha_name,
                "role": "ASHA",
                "phone": phone,
                "employee_code": asha.asha_id,
                "villages": asha.villages,
            }
        }, status=201 if created else 200)
    else:
        facility = _user_facility(request)
        if facility is None:
            return _error("Create a facility profile before adding staff", 409)
        email = code if "@" in code else f"{uuid.uuid4().hex[:6]}@arogyasathi.in"
        user, created = NeonUser.objects.update_or_create(
            email=email,
            defaults={
                "full_name": full_name,
                "role": role.lower(),
                "phone": phone,
                "assigned_facility": facility.name,
                "is_active": True,
            }
        )
        return JsonResponse({
            "staff": {
                "id": str(user.id),
                "full_name": user.full_name,
                "role": role,
                "phone": user.phone or phone,
                "employee_code": user.email,
            }
        }, status=201 if created else 200)


@api_login_required
@require_http_methods(["GET", "PUT", "DELETE"])
def staff_detail(request, staff_id):
    str_id = str(staff_id)
    asha = Asha.objects.filter(asha_id=str_id, asha_id__in=_visible_asha_ids(request)).first()
    if asha:
        if request.method == "DELETE":
            FacilityAshaAssignment.objects.filter(
                facility__in=_visible_facilities(request),
                asha=asha,
            ).delete()
            return JsonResponse({"deleted": True})
        return JsonResponse({
            "staff": {
                "id": asha.asha_id,
                "full_name": asha.asha_name,
                "role": "ASHA",
                "phone": "",
                "employee_code": asha.asha_id,
                "villages": asha.villages,
            }
        })

    user = NeonUser.objects.filter(
        id=str_id,
        assigned_facility__in=_visible_facilities(request).values_list("name", flat=True),
    ).first()
    if user:
        if request.method == "DELETE":
            user.is_active = False
            user.save()
            return JsonResponse({"deleted": True})
        return JsonResponse({
            "staff": {
                "id": str(user.id),
                "full_name": user.full_name,
                "role": user.role.upper(),
                "phone": user.phone or "",
                "employee_code": user.email,
            }
        })

    return _error("Staff member not found", 404)


# =========================================================================
# Villages (Catchment dynamically aggregated from Neon households & members)
# =========================================================================

@api_login_required
@require_http_methods(["GET", "POST"])
def village_collection(request):
    if request.method == "GET":
        asha_ids = _visible_asha_ids(request)
        ashas = list(Asha.objects.filter(asha_id__in=asha_ids))
        hh_stats = {
            r["village"]: r["count"]
            for r in Household.objects.filter(asha_id__in=asha_ids)
            .values("village").annotate(count=models.Count("household_id"))
        }
        member_stats = {
            r["village"]: r
            for r in Member.objects.filter(asha_id__in=asha_ids, village__isnull=False).exclude(village="").values("village").annotate(
                population=models.Count("member_id"),
                anc_count=models.Count("member_id", filter=models.Q(pregnant__in=["Y", "yes", "Yes", "True", "true"])),
                immunized=models.Count("member_id", filter=~models.Q(child_vaccines__in=["", None])),
            )
        }
        configured = list(
            FacilityVillage.objects.filter(facility__in=_visible_facilities(request))
            .select_related("facility")
        )
        village_names = sorted(set(hh_stats) | set(member_stats) | {v.name for v in configured})
        configured_by_name = {}
        for village in configured:
            configured_by_name.setdefault(village.name, village)
        results = []
        for idx, v_name in enumerate(village_names):
            stat = member_stats.get(v_name, {})
            metadata = configured_by_name.get(v_name)
            population = stat.get("population", 0)
            households_count = hh_stats.get(v_name, 0)
            names = [
                asha.asha_name for asha in ashas
                if v_name.casefold() in asha.villages.casefold()
            ]
            results.append({
                "id": f"VIL-{idx + 1:03d}",
                "name": v_name,
                "gram_panchayat": metadata.gram_panchayat if metadata else "",
                "total_population": population or (metadata.total_population if metadata else 0),
                "total_households": households_count or (metadata.total_households if metadata else 0),
                "eligible_couples": metadata.eligible_couples if metadata else 0,
                "target_anc": stat.get("anc_count", 0) or (metadata.target_anc if metadata else 0),
                "children_under_5": metadata.children_under_5 if metadata else 0,
                "assigned_asha": ", ".join(names) or (metadata.assigned_asha if metadata else ""),
                "assigned_anm": metadata.assigned_anm if metadata else "",
                "immunization_coverage_pct": round(
                    (stat.get("immunized", 0) / population * 100) if population else
                    (float(metadata.immunization_coverage_pct) if metadata else 0),
                    1,
                ),
                "distance_from_centre_km": float(metadata.distance_from_centre_km) if metadata else 0,
            })
        return JsonResponse({"results": results})

    data = _body(request)
    if not data:
        return _error("Invalid payload")
    name = str(data.get("name", "")).strip()
    if not name:
        return _error("Village name is required")
    facility = _user_facility(request)
    if facility is None:
        return _error("Create a facility profile before adding catchment villages", 409)
    try:
        village, created = FacilityVillage.objects.update_or_create(
            facility=facility,
            name=name,
            defaults={
                "gram_panchayat": str(data.get("gram_panchayat", "")).strip(),
                "total_population": int(data.get("total_population", 0)),
                "total_households": int(data.get("total_households", 0)),
                "eligible_couples": int(data.get("eligible_couples", 0)),
                "target_anc": int(data.get("target_anc", 0)),
                "children_under_5": int(data.get("children_under_5", 0)),
                "assigned_asha": str(data.get("assigned_asha", "")).strip(),
                "assigned_anm": str(data.get("assigned_anm", "")).strip(),
                "immunization_coverage_pct": data.get("immunization_coverage_pct", 0),
                "distance_from_centre_km": data.get("distance_from_centre_km", 0),
            },
        )
    except (TypeError, ValueError):
        return _error("Village counts and distances must be valid numbers")
    return JsonResponse({
        "village": {
            "id": f"VIL-{village.pk}",
            "name": village.name,
            "gram_panchayat": village.gram_panchayat,
            "total_population": village.total_population,
            "total_households": village.total_households,
            "eligible_couples": village.eligible_couples,
            "target_anc": village.target_anc,
            "children_under_5": village.children_under_5,
            "assigned_asha": village.assigned_asha,
            "assigned_anm": village.assigned_anm,
            "immunization_coverage_pct": float(village.immunization_coverage_pct),
            "distance_from_centre_km": float(village.distance_from_centre_km),
        }
    }, status=201 if created else 200)


# =========================================================================
# Registers (Live Neon Members: ANC, Immunization, NCD & Visits)
# =========================================================================

@api_login_required
@require_http_methods(["GET", "POST"])
def registers_collection(request):
    if request.method == "GET":
        service_type = request.GET.get("service_type", "ALL").upper()
        search = request.GET.get("search", "").strip().lower()

        # Build list from real Neon Member table
        members_qs = Member.objects.select_related("asha", "household").filter(asha_id__in=_visible_asha_ids(request))

        if search:
            members_qs = members_qs.filter(
                models.Q(name__icontains=search) |
                models.Q(member_id__icontains=search) |
                models.Q(village__icontains=search)
            )

        results = []

        if service_type in ("ANC", "ALL"):
            anc_qs = members_qs.filter(pregnant__in=["Y", "yes", "Yes", "True", "true"])[:100]
            for m in anc_qs:
                hb_val = None
                try:
                    hb_val = float(m.last_hb_gdl) if m.last_hb_gdl else None
                except (ValueError, TypeError):
                    pass

                vitals = {}
                if m.last_anc_bp:
                    vitals["bp"] = m.last_anc_bp
                if hb_val is not None:
                    vitals["hemoglobin"] = hb_val
                details = [value for value in (
                    f"EDD: {m.edd}" if m.edd else "",
                    f"Visits: {m.anc_visit_dates}" if m.anc_visit_dates else "",
                    f"TD doses: {m.td_doses}" if m.td_doses else "",
                ) if value]
                results.append({
                    "id": m.member_id,
                    "patient_name": m.name,
                    "age": _age_years(m.dob),
                    "gender": "F",
                    "village": m.village or (m.household.village if m.household else ""),
                    "service_type": "ANC",
                    "date": m.lmp_date or m.created_at.strftime("%Y-%m-%d"),
                    "vitals": vitals,
                    "details": " | ".join(details),
                    "assigned_worker": m.asha.asha_name if m.asha else "",
                    "status": "COMPLETED" if m.anc_visit_dates else "FOLLOW_UP_REQUIRED",
                })

        if service_type in ("IMMUNIZATION", "ALL"):
            imm_qs = members_qs.exclude(child_vaccines__isnull=True).exclude(child_vaccines="")[:100]
            for m in imm_qs:
                vitals = {}
                if m.last_muac_cm:
                    vitals["muac_cm"] = m.last_muac_cm
                details = [f"Vaccines: {m.child_vaccines}"]
                if m.last_muac_cm:
                    details.append(f"MUAC: {m.last_muac_cm} cm")
                results.append({
                    "id": m.member_id,
                    "patient_name": m.name,
                    "age": _age_years(m.dob),
                    "gender": m.sex or "",
                    "village": m.village or (m.household.village if m.household else ""),
                    "service_type": "IMMUNIZATION",
                    "date": m.last_muac_date or m.created_at.strftime("%Y-%m-%d"),
                    "vitals": vitals,
                    "details": " | ".join(details),
                    "assigned_worker": m.asha.asha_name if m.asha else "",
                    "status": "COMPLETED",
                })

        if service_type in ("NCD_SCREENING", "ALL"):
            ncd_qs = members_qs.exclude(ncd_condition__isnull=True).exclude(ncd_condition="")[:100]
            for m in ncd_qs:
                sugar_val = None
                try:
                    sugar_val = int(m.last_rbs_mg_dl) if m.last_rbs_mg_dl else None
                except (ValueError, TypeError):
                    pass

                vitals = {}
                if m.last_bp_reading:
                    vitals["bp"] = m.last_bp_reading
                if sugar_val is not None:
                    vitals["blood_sugar"] = sugar_val
                details = [f"Diagnosis: {m.ncd_condition}"]
                if sugar_val is not None:
                    details.append(f"RBS: {sugar_val} mg/dL")
                results.append({
                    "id": m.member_id,
                    "patient_name": m.name,
                    "age": _age_years(m.dob),
                    "gender": m.sex or "",
                    "village": m.village or (m.household.village if m.household else ""),
                    "service_type": "NCD_SCREENING",
                    "date": m.last_bp_check_date or m.created_at.strftime("%Y-%m-%d"),
                    "vitals": vitals,
                    "details": " | ".join(details),
                    "assigned_worker": m.asha.asha_name if m.asha else "",
                    "status": "COMPLETED",
                })

        # Also include real Recorded Clinical Visits
        visits_qs = ClinicalVisit.objects.select_related("member", "asha").filter(facility__in=_visible_facilities(request))[:50]
        for v in visits_qs:
            results.append({
                "id": v.visit_code,
                "patient_name": v.member.name,
                "age": _age_years(v.member.dob),
                "gender": v.member.sex or "",
                "village": v.member.village or "",
                "service_type": v.service_type,
                "date": v.visit_date.strftime("%Y-%m-%d"),
                "vitals": v.vitals or {},
                "details": f"{v.clinical_notes} | Rx: {v.prescribed_medicines}",
                "assigned_worker": v.asha.asha_name,
                "status": v.status,
            })

        # Include emergency referrals from DangerEscalation
        if service_type in ("REFERRAL", "ALL"):
            escalations = DangerEscalation.objects.select_related("asha").filter(asha_id__in=_visible_asha_ids(request))
            for esc in escalations:
                results.append({
                    "id": f"REF-{str(esc.escalation_id)[:8].upper()}",
                        "patient_name": esc.patient_name or "",
                        "age": None,
                        "gender": "",
                        "village": esc.village or "",
                    "service_type": "REFERRAL",
                    "date": esc.created_at.strftime("%Y-%m-%d"),
                    "vitals": {},
                    "details": f"CRITICAL: {esc.danger_signs} | Query: {esc.query_text}",
                    "assigned_worker": esc.asha.asha_name,
                    "status": "REFERRED" if esc.status == "PENDING_TRIAGE" else "COMPLETED",
                })

        return JsonResponse({"results": results[:150]})

    # POST: create a new ClinicalVisit record linked to real Member and Asha
    data = _body(request)
    if not data:
        return _error("Invalid payload")

    patient_name = str(data.get("patient_name", "")).strip()
    village = str(data.get("village", "")).strip()
    service_type = str(data.get("service_type", "GENERAL_OPD")).strip()

    asha_ids = _visible_asha_ids(request)
    worker_name = str(data.get("assigned_worker", "")).strip()
    worker_filter = Asha.objects.filter(asha_id__in=asha_ids)
    if worker_name:
        worker_filter = worker_filter.filter(asha_name__iexact=worker_name)
    selected_asha = worker_filter.order_by("asha_name").first()
    facility = _user_facility(request)
    if selected_asha is None or facility is None:
        return _error("Assign an ASHA worker and complete the facility profile before adding clinical records", 409)

    member = Member.objects.filter(
        name__iexact=patient_name,
        asha=selected_asha,
    ).first() if patient_name else None
    if not member:
        household = Household.objects.filter(asha=selected_asha).first()
        if not patient_name or household is None:
            return _error("Choose a family member assigned to this ASHA worker")
        member = Member.objects.create(
            member_id=f"MEM-{uuid.uuid4().hex[:6].upper()}",
            name=patient_name,
            village=village,
            sex=data.get("gender", ""),
            asha=selected_asha,
            household=household,
        )

    requested_service = "EMERGENCY_TRIAGE" if service_type == "REFERRAL" else service_type
    valid_services = dict(ClinicalVisit._meta.get_field('service_type').choices)
    if requested_service not in valid_services:
        return _error("Choose a valid register category")
    visit = ClinicalVisit.objects.create(
        visit_code=f"VST-{uuid.uuid4().hex[:6].upper()}",
        member=member,
        asha=selected_asha,
        household=member.household,
        facility=facility,
        service_type=requested_service,
        visit_date=timezone.now().date(),
        vitals=data.get("vitals", {}),
        clinical_notes=str(data.get("details", "")).strip(),
        prescribed_medicines=str(data.get("prescribed_medicines", "")).strip(),
        status=data.get("status", "COMPLETED"),
    )

    return JsonResponse({
        "record": {
            "id": visit.visit_code,
            "patient_name": member.name,
            "age": _age_years(member.dob),
            "gender": member.sex or "",
            "village": member.village,
            "service_type": visit.service_type,
            "date": visit.visit_date.strftime("%Y-%m-%d"),
            "vitals": visit.vitals,
            "details": visit.clinical_notes,
            "assigned_worker": visit.asha.asha_name,
            "status": visit.status,
        }
    }, status=201)


# =========================================================================
# Inventory (Synchronized with MedicalInventory table)
# =========================================================================

@api_login_required
@require_http_methods(["GET", "POST"])
def inventory_collection(request):
    if request.method == "GET":
        category = request.GET.get("category", "ALL").upper()
        search = request.GET.get("search", "").strip()

        qs = MedicalInventory.objects.filter(facility__in=_visible_facilities(request))
        if category != "ALL":
            qs = qs.filter(category=category)
        if search:
            qs = qs.filter(models.Q(name__icontains=search) | models.Q(item_code__icontains=search))

        results = []
        for item in qs:
            status = "IN_STOCK"
            if item.quantity <= item.reorder_level / 2:
                status = "CRITICAL"
            elif item.quantity <= item.reorder_level:
                status = "LOW_STOCK"

            results.append({
                "id": str(item.id),
                "item_code": item.item_code,
                "name": item.name,
                "category": item.category,
                "batch_number": item.batch_number,
                "current_stock": item.quantity,
                "unit": item.unit,
                "min_reorder_level": item.reorder_level,
                "expiry_date": item.expiry_date.strftime("%Y-%m-%d") if item.expiry_date else "N/A",
                "storage_location": item.storage_location,
                "status": status,
            })

        return JsonResponse({"results": results})

    data = _body(request)
    if not data:
        return _error("Invalid payload")

    name = str(data.get("name", "")).strip()
    if not name:
        return _error("Item name is required")

    code = str(data.get("item_code", "")).strip() or f"MED-{uuid.uuid4().hex[:4].upper()}"
    fac = _user_facility(request)
    if fac is None:
        return _error("Create a facility profile before adding inventory", 409)
    existing_item = MedicalInventory.objects.filter(item_code=code).first()
    if existing_item and existing_item.facility_id not in _visible_facilities(request).values_list("id", flat=True):
        return _error("That item code is already assigned to another facility", 409)

    item, created = MedicalInventory.objects.update_or_create(
        item_code=code,
        defaults={
            "facility": fac,
            "name": name,
            "category": data.get("category", "MEDICINE"),
            "batch_number": data.get("batch_number", "BATCH-01"),
            "quantity": int(data.get("current_stock", 100)),
            "unit": data.get("unit", "Units"),
            "reorder_level": int(data.get("min_reorder_level", 20)),
            "storage_location": data.get("storage_location", "Main Dispensary"),
        }
    )

    return JsonResponse({
        "item": {
            "id": str(item.id),
            "item_code": item.item_code,
            "name": item.name,
            "category": item.category,
            "batch_number": item.batch_number,
            "current_stock": item.quantity,
            "unit": item.unit,
            "min_reorder_level": item.reorder_level,
            "expiry_date": item.expiry_date.isoformat() if item.expiry_date else "N/A",
            "storage_location": item.storage_location,
            "status": "IN_STOCK",
        }
    }, status=201 if created else 200)


# =========================================================================
# Live Real-Time Dashboard Stats
# =========================================================================

@api_login_required
@require_http_methods(["GET"])
def stats_overview(request):
    fac = _user_facility(request)
    if fac is None:
        return _error("Create a facility profile before viewing the dashboard", 409)

    asha_ids = _visible_asha_ids(request)
    visible_facilities = _visible_facilities(request)
    total_ashas = Asha.objects.filter(asha_id__in=asha_ids).count()
    total_users = NeonUser.objects.filter(
        is_active=True,
        assigned_facility__in=visible_facilities.values_list("name", flat=True),
    ).count()
    total_households = Household.objects.filter(asha_id__in=asha_ids).count()
    total_members = Member.objects.filter(asha_id__in=asha_ids).count()

    members = Member.objects.filter(asha_id__in=asha_ids)
    anc_count = members.filter(pregnant__in=["Y", "yes", "Yes", "True", "true"]).count()
    child_vaccines_count = members.exclude(child_vaccines__in=["", None]).count()
    ncd_count = members.exclude(ncd_condition__in=["", None]).count()
    emergency_referrals = DangerEscalation.objects.filter(asha_id__in=asha_ids).count()

    total_inventory = MedicalInventory.objects.filter(facility__in=visible_facilities).count()
    low_stock = MedicalInventory.objects.filter(
        facility__in=visible_facilities,
        quantity__lte=models.F('reorder_level'),
    ).count()
    reports = FacilityReport.objects.filter(facility__in=visible_facilities)
    affiliations = FacilityProfile.objects.filter(parent_phc=fac, is_active=True)

    recent_escalations = DangerEscalation.objects.filter(
        asha_id__in=asha_ids,
    ).select_related("asha").order_by("-created_at")[:4]
    activities = []
    for esc in recent_escalations:
        activities.append({
            "id": str(esc.escalation_id),
            "action": f"Emergency Escalation: {esc.danger_signs[:40]}",
            "entity_type": "EMERGENCY_REFERRAL",
            "timestamp": esc.created_at.strftime("%b %d, %H:%M"),
            "actor": esc.asha.asha_name,
            "_sort": esc.created_at,
        })

    for member in members.order_by("-created_at")[:4]:
        activities.append({
            "id": member.member_id,
            "action": f"Family member record added: {member.name}",
            "entity_type": "MEMBER_RECORD",
            "timestamp": timezone.localtime(member.created_at).strftime("%b %d, %H:%M"),
            "actor": member.asha.asha_name if member.asha_id else "",
            "_sort": member.created_at,
        })
    recent_outcomes = VisitOutcome.objects.filter(
        asha_id__in=asha_ids,
    ).select_related("asha").order_by("-synced_at")[:4]
    for outcome in recent_outcomes:
        activities.append({
            "id": outcome.outcome_id,
            "action": f"Follow-up updated: {outcome.due_item} — {outcome.status}",
            "entity_type": "VISIT_OUTCOME",
            "timestamp": timezone.localtime(outcome.synced_at).strftime("%b %d, %H:%M"),
            "actor": outcome.asha.asha_name if outcome.asha_id else "",
            "_sort": outcome.synced_at,
        })
    activities.sort(key=lambda activity: activity["_sort"], reverse=True)
    for activity in activities[:8]:
        activity.pop("_sort")
    activities = activities[:8]

    return JsonResponse({
        "facility": _facility_json(fac),
        "kpis": {
            "total_staff": total_ashas + total_users,
            "asha_count": total_ashas,
            "anm_count": NeonUser.objects.filter(is_active=True, role__icontains="anm", assigned_facility__in=visible_facilities.values_list("name", flat=True)).count(),
            "supervisor_count": NeonUser.objects.filter(is_active=True, role__icontains="supervisor", assigned_facility__in=visible_facilities.values_list("name", flat=True)).count(),
            "total_reports": reports.count(),
            "approved_reports": reports.filter(status="APPROVED").count(),
            "submitted_reports": reports.filter(status="SUBMITTED").count(),
            "draft_reports": reports.filter(status="DRAFT").count(),
            "total_affiliations": affiliations.count() if fac.facility_type == "PHC" else int(bool(fac.parent_phc_id)),
            "pending_affiliations": 0,
            "total_clinical_records": total_members,
            "anc_records": anc_count,
            "immunization_records": child_vaccines_count,
            "ncd_records": ncd_count,
            "referrals": emergency_referrals,
            "total_inventory_items": total_inventory,
            "low_stock_items": low_stock,
            "total_villages": len(_insights_payload(request)["by_village"]),
            "catchment_population": total_members,
            "catchment_households": total_households,
        },
        "recent_activities": activities,
    })


# =========================================================================
# Facility insights, schedules and persisted reports
# =========================================================================

def _report_json(report):
    return {
        "id": str(report.id),
        "title": report.title,
        "period_start": report.period_start.isoformat(),
        "period_end": report.period_end.isoformat(),
        "status": report.status,
        "facility_name": report.facility.name,
        "facility_code": _facility_code(report.facility),
        "created_at": report.created_at.isoformat(),
        "payload": report.payload,
    }


@api_login_required
@require_http_methods(["GET"])
def insights_overview(request):
    return JsonResponse(_insights_payload(request))


def _insights_payload(request, period_start=None, period_end=None):
    asha_ids = _visible_asha_ids(request)
    households = Household.objects.filter(asha_id__in=asha_ids)
    members = Member.objects.filter(asha_id__in=asha_ids)
    if period_start and period_end:
        households = households.filter(created_at__date__range=(period_start, period_end))
        members = members.filter(created_at__date__range=(period_start, period_end))
    asha_rows = list(
        Asha.objects.filter(asha_id__in=asha_ids)
        .values("asha_id", "asha_name")
        .order_by("asha_name")
    )
    household_counts = {
        row["asha_id"]: row["count"]
        for row in households.values("asha_id").annotate(count=models.Count("household_id"))
    }
    member_rows = list(
        members.values("asha_id", "asha__asha_name")
        .annotate(
            families=models.Count("household_id", distinct=True),
            member_count=models.Count("member_id"),
            pregnancies=models.Count(
                "member_id",
                filter=models.Q(pregnant__in=["Y", "yes", "Yes", "True", "true"]),
            ),
            immunization_records=models.Count(
                "member_id",
                filter=~models.Q(child_vaccines__in=["", None]),
            ),
            ncd_records=models.Count(
                "member_id",
                filter=~models.Q(ncd_condition__in=["", None]),
            ),
        )
        .order_by("asha__asha_name")
    )
    by_asha = []
    for row in member_rows:
        by_asha.append({
            "id": row["asha_id"],
            "name": row["asha__asha_name"],
            "families": household_counts.get(row["asha_id"], 0),
            "members": row["member_count"],
            "pregnancies": row["pregnancies"],
            "immunization_records": row["immunization_records"],
            "ncd_records": row["ncd_records"],
        })
    for asha in asha_rows:
        if not any(row["id"] == asha["asha_id"] for row in by_asha):
            by_asha.append({
                "id": asha["asha_id"],
                "name": asha["asha_name"],
                "families": household_counts.get(asha["asha_id"], 0),
                "members": 0,
                "pregnancies": 0,
                "immunization_records": 0,
                "ncd_records": 0,
            })

    member_period = models.Q()
    if period_start and period_end:
        member_period = models.Q(members__created_at__date__range=(period_start, period_end))
    by_village = list(
        households.values("village")
        .annotate(
            families=models.Count("household_id", distinct=True),
            member_count=models.Count("members__member_id", distinct=True, filter=member_period),
            pregnancies=models.Count(
                "members__member_id",
                distinct=True,
                filter=member_period & models.Q(members__pregnant__in=["Y", "yes", "Yes", "True", "true"]),
            ),
        )
        .order_by("village")
    )
    by_village = [
        {
            "name": row["village"],
            "families": row["families"],
            "members": row["member_count"],
            "pregnancies": row["pregnancies"],
        }
        for row in by_village
    ]
    return {
        "summary": {
            "asha_workers": len(asha_rows),
            "families": households.count(),
            "members": members.count(),
            "pregnancies": members.filter(pregnant__in=["Y", "yes", "Yes", "True", "true"]).count(),
            "immunization_records": members.exclude(child_vaccines__in=["", None]).count(),
            "ncd_records": members.exclude(ncd_condition__in=["", None]).count(),
            "villages": len(by_village),
        },
        "by_asha": by_asha,
        "by_village": by_village,
    }


def _schedule_json(schedule):
    return {
        "id": str(schedule.id),
        "title": schedule.title,
        "schedule_type": schedule.schedule_type,
        "date": schedule.scheduled_date.isoformat(),
        "start_time": schedule.start_time.strftime("%H:%M") if schedule.start_time else "",
        "end_time": schedule.end_time.strftime("%H:%M") if schedule.end_time else "",
        "location": schedule.location,
        "notes": schedule.notes,
        "facility_name": schedule.facility.name,
        "facility_code": _facility_code(schedule.facility),
    }


def _schedule_fields(data):
    title = str(data.get("title", "")).strip()
    if not title:
        return None, "A schedule title is required"
    try:
        scheduled_date = date.fromisoformat(str(data.get("date", "")))
    except ValueError:
        return None, "Choose a valid schedule date"
    schedule_type = str(data.get("schedule_type", "OTHER")).upper()
    allowed_types = {choice[0] for choice in FacilitySchedule.SCHEDULE_TYPES}
    if schedule_type not in allowed_types:
        return None, "Choose a valid schedule type"
    parsed_times = []
    for key in ("start_time", "end_time"):
        value = str(data.get(key, "")).strip()
        if not value:
            parsed_times.append(None)
            continue
        try:
            parsed_times.append(datetime.strptime(value, "%H:%M").time())
        except ValueError:
            return None, "Enter schedule times in HH:MM format"
    if parsed_times[0] and parsed_times[1] and parsed_times[1] < parsed_times[0]:
        return None, "End time must be after start time"
    return {
        "title": title,
        "scheduled_date": scheduled_date,
        "schedule_type": schedule_type,
        "start_time": parsed_times[0],
        "end_time": parsed_times[1],
        "location": str(data.get("location", "")).strip(),
        "notes": str(data.get("notes", "")).strip(),
    }, None


@api_login_required
@require_http_methods(["GET", "POST"])
def schedule_collection(request):
    if request.method == "GET":
        schedules = FacilitySchedule.objects.filter(facility__in=_visible_facilities(request))
        date_filter = request.GET.get("date")
        if date_filter:
            try:
                schedules = schedules.filter(scheduled_date=date.fromisoformat(date_filter))
            except ValueError:
                return _error("Choose a valid date")
        return JsonResponse({"results": [_schedule_json(event) for event in schedules.select_related("facility")]})

    data = _body(request)
    if data is None:
        return _error("Invalid JSON payload")
    fields, error = _schedule_fields(data)
    facility = _user_facility(request)
    if error:
        return _error(error)
    if facility is None:
        return _error("Create a facility profile before adding schedules", 409)
    event = FacilitySchedule.objects.create(facility=facility, created_by=request.user, **fields)
    return JsonResponse({"schedule": _schedule_json(event)}, status=201)


@api_login_required
@require_http_methods(["PUT", "DELETE"])
def schedule_detail(request, schedule_id):
    facility = _user_facility(request)
    event = get_object_or_404(FacilitySchedule, id=schedule_id, facility=facility)
    if request.method == "DELETE":
        event.delete()
        return JsonResponse({"deleted": True})

    data = _body(request)
    if data is None:
        return _error("Invalid JSON payload")
    fields, error = _schedule_fields(data)
    if error:
        return _error(error)
    for field, value in fields.items():
        setattr(event, field, value)
    event.save()
    return JsonResponse({"schedule": _schedule_json(event)})


def _report_text(report):
    snapshot = report.payload
    summary = snapshot.get("summary", {})
    lines = [
        report.title,
        "=" * len(report.title),
        f"Facility: {report.facility.name} ({_facility_code(report.facility)})",
        f"Reporting period: {report.period_start.isoformat()} to {report.period_end.isoformat()}",
        f"Generated: {report.created_at.strftime('%Y-%m-%d %H:%M %Z')}",
        "",
        "Summary",
        f"ASHA workers: {summary.get('asha_workers', 0)}",
        f"Villages: {summary.get('villages', 0)}",
        f"Families: {summary.get('families', 0)}",
        f"Family members: {summary.get('members', 0)}",
        f"Pregnancies recorded: {summary.get('pregnancies', 0)}",
        f"Immunization records: {summary.get('immunization_records', 0)}",
        f"NCD records: {summary.get('ncd_records', 0)}",
        "",
        "ASHA worker details",
    ]
    for row in snapshot.get("by_asha", []):
        lines.append(
            f"- {row['name']}: {row['families']} families, {row['members']} members, "
            f"{row['pregnancies']} pregnancies, {row['immunization_records']} immunization records"
        )
    lines.extend(["", "Village details"])
    for row in snapshot.get("by_village", []):
        lines.append(
            f"- {row['name']}: {row['families']} families, {row['members']} members, "
            f"{row['pregnancies']} pregnancies"
        )
    if snapshot.get("notes"):
        lines.extend(["", "Notes", str(snapshot["notes"])])
    return "\n".join(lines) + "\n"


@api_login_required
@require_http_methods(["GET", "POST"])
def report_collection(request):
    if request.method == "GET":
        reports = FacilityReport.objects.filter(facility__in=_visible_facilities(request)).select_related("facility")
        return JsonResponse({"results": [_report_json(report) for report in reports]})

    data = _body(request)
    if data is None:
        return _error("Invalid JSON payload")
    title = str(data.get("title", "")).strip()
    try:
        period_start = date.fromisoformat(str(data.get("period_start", "")))
        period_end = date.fromisoformat(str(data.get("period_end", "")))
    except ValueError:
        return _error("Choose valid reporting dates")
    if not title:
        return _error("Report title is required")
    if period_start > period_end:
        return _error("Period start date cannot be after end date")

    facility = _user_facility(request)
    if facility is None:
        return _error("Create a facility profile before creating reports", 409)

    snapshot = _insights_payload(request, period_start, period_end)
    payload = {
        **snapshot,
        "notes": str(data.get("notes", "")).strip(),
        "submitted_details": data.get("payload", {}),
    }
    report = FacilityReport.objects.create(
        facility=facility,
        created_by=request.user,
        title=title,
        period_start=period_start,
        period_end=period_end,
        status="SUBMITTED",
        payload=payload,
    )
    return JsonResponse({"report": _report_json(report)}, status=201)


@api_login_required
@require_http_methods(["GET"])
def download_report(request, report_id):
    report = get_object_or_404(
        FacilityReport.objects.select_related("facility"),
        id=report_id,
        facility__in=_visible_facilities(request),
    )
    response = HttpResponse(_report_text(report), content_type="text/plain; charset=utf-8")
    response["Content-Disposition"] = f'attachment; filename="health-report-{report.id}.txt"'
    return response


@api_login_required
@require_http_methods(["GET", "POST"])
def affiliation_collection(request):
    facility = _user_facility(request)
    if request.method == "POST":
        data = _body(request)
        if data is None:
            return _error("Invalid JSON payload")
        if facility is None or facility.facility_type != "SUBCENTRE":
            return _error("Only a Sub-Centre can connect to a PHC", 403)
        phc_code = str(data.get("phc_id", data.get("phc_code", ""))).strip()
        phc_query = FacilityProfile.objects.filter(
            models.Q(facility_code__iexact=phc_code) |
            models.Q(identifier__identification_number__iexact=phc_code),
            facility_type="PHC",
            is_active=True,
        )
        phc = phc_query.first()
        if phc is None:
            try:
                phc_uuid = uuid.UUID(phc_code)
            except ValueError:
                phc_uuid = None
            if phc_uuid:
                phc = FacilityProfile.objects.filter(
                    id=phc_uuid,
                    facility_type="PHC",
                    is_active=True,
                ).first()
        if phc is None:
            return _error("No active PHC matches that identification code", 400)
        facility.parent_phc = phc
        facility.save(update_fields=["parent_phc", "updated_at"])
        affiliation = {
            "id": str(facility.id),
            "subcentre": facility.name,
            "phc": phc.name,
            "status": "APPROVED",
            "permissions": ["view_records", "submit_referrals"],
            "decision_reason": "Connected using the PHC identification code",
        }
        return JsonResponse({"affiliation": affiliation}, status=201)

    if facility is None:
        return JsonResponse({"results": []})
    if facility.facility_type == "PHC":
        sub_centres = FacilityProfile.objects.filter(parent_phc=facility, is_active=True).select_related("parent_phc")
    else:
        sub_centres = FacilityProfile.objects.filter(pk=facility.pk, parent_phc__isnull=False).select_related("parent_phc")
    results = [
        {
            "id": str(subcentre.id),
            "subcentre": subcentre.name,
            "phc": subcentre.parent_phc.name,
            "status": "APPROVED",
            "permissions": ["view_records", "submit_referrals"],
            "decision_reason": "",
        }
        for subcentre in sub_centres
    ]
    return JsonResponse({"results": results})


@api_login_required
@require_http_methods(["POST"])
def approve_affiliation(request, affiliation_id):
    facility = _user_facility(request)
    child = get_object_or_404(
        FacilityProfile,
        id=affiliation_id,
        parent_phc=facility,
        facility_type="SUBCENTRE",
    )
    return JsonResponse({"affiliation": {
        "id": str(child.id),
        "status": "APPROVED",
        "decision_reason": "Sub-Centre is connected to this PHC",
    }})


@api_login_required
@require_http_methods(["POST"])
def reject_affiliation(request, affiliation_id):
    facility = _user_facility(request)
    child = get_object_or_404(
        FacilityProfile,
        id=affiliation_id,
        parent_phc=facility,
        facility_type="SUBCENTRE",
    )
    child.parent_phc = None
    child.save(update_fields=["parent_phc", "updated_at"])
    return JsonResponse({"affiliation": {
        "id": str(child.id),
        "status": "REJECTED",
        "decision_reason": "PHC connection removed",
    }})


@api_login_required
@require_http_methods(["GET"])
def notification_collection(request):
    # Live notifications based on real danger escalations
    notifications = []
    escalations = DangerEscalation.objects.filter(
        status="PENDING_TRIAGE",
        asha_id__in=_visible_asha_ids(request),
    ).select_related("asha")
    for idx, esc in enumerate(escalations):
        notifications.append({
            "id": idx + 1,
            "title": f"🚨 EMERGENCY: {esc.danger_signs[:35]}",
            "message": f"Patient: {esc.patient_name} in {esc.village}. Escalated by {esc.asha.asha_name}. Urgency: {esc.urgency_level}.",
            "read": False,
        })

    return JsonResponse({"results": notifications})


@api_login_required
@require_http_methods(["POST"])
def mark_notification_read(request, notification_id):
    if notification_id < 1:
        return _error("Notification not found", 404)
    return JsonResponse({"notification": {"id": notification_id, "read": True}})


@api_login_required
@require_http_methods(["POST"])
def seed_dynamic_data(request):
    return _error("No sample data is available to seed", 409)


@api_login_required
@require_http_methods(["GET"])
def dashboard(request):
    return JsonResponse({"status": "ok", "app": "ArogyaSathi Medical Clinic API"})
