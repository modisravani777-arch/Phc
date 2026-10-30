"""Auth API helpers and endpoints."""

import logging
import re
import secrets
from datetime import timedelta

from django.conf import settings
from django.contrib.auth import authenticate, get_user_model, login, logout
from django.contrib.auth.hashers import check_password, make_password
from django.db import connection, models, transaction
from django.http import JsonResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_protect, ensure_csrf_cookie
from django.views.decorators.http import require_http_methods

from ..models import FacilityLoginIdentity, FacilityProfile, NeonUser, PhoneLoginChallenge
from .common import _body, _error, _facility_json, _role_value, api_login_required

logger = logging.getLogger("core.views")


@api_login_required
@require_http_methods(["POST"])
def role_logout(request):
    logout(request)
    return JsonResponse({"ok": True})


def _facility_login_identity(neon_user, requested_role):
    identity = (
        FacilityLoginIdentity.objects.filter(
            neon_user=neon_user,
            is_active=True,
            account__is_active=True,
            facility__is_active=True,
        )
        .select_related("account", "facility", "neon_user")
        .first()
    )
    if not identity or identity.facility.facility_type != requested_role:
        return None
    return identity


def _matching_neon_users(normalized_phone):
    users = NeonUser.objects.filter(is_active=True).only("id", "phone", "full_name")
    if connection.vendor == "postgresql":
        digits = models.Func(
            models.F("phone"),
            function="regexp_replace",
            template="%(function)s(%(expressions)s, '[^0-9]', '', 'g')",
        )
        last_ten_digits = models.Func(
            digits,
            function="right",
            template="%(function)s(%(expressions)s, 10)",
        )
        users = users.annotate(phone_digits=last_ten_digits).filter(
            phone_digits=normalized_phone[-10:]
        )
    return [
        user
        for user in users.iterator()
        if _normalize_login_phone(user.phone) == normalized_phone
    ]


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
                latest = (
                    PhoneLoginChallenge.objects.filter(
                        neon_user=neon_user,
                        role=requested_role,
                    )
                    .order_by("-created_at")
                    .first()
                )
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

    return JsonResponse(
        {
            "ok": True,
            "message": "If this number is assigned to the selected facility, a verification code is available to the system operator.",
        }
    )


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
    if (
        requested_role not in {"PHC", "SUBCENTRE"}
        or not normalized_phone
        or not re.fullmatch(r"[0-9]{6}", otp)
    ):
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
        challenge = (
            PhoneLoginChallenge.objects.select_for_update()
            .filter(
                neon_user=neon_user,
                role=requested_role,
                consumed_at__isnull=True,
            )
            .order_by("-created_at")
            .first()
        )
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


def _auth_session_payload(identity):
    return {
        "authenticated": True,
        "username": identity.neon_user.full_name,
        "role": identity.facility.facility_type,
        "facility": _facility_json(identity.facility),
    }


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
    return JsonResponse(
        {
            "authenticated": True,
            "username": account.email or account.get_username(),
            "role": facility.facility_type,
            "facility": _facility_json(facility),
        }
    )


def _normalize_login_phone(value):
    digits = re.sub(r"[^0-9]", "", str(value or ""))
    if len(digits) == 10:
        digits = f"91{digits}"
    elif len(digits) == 11 and digits.startswith("0"):
        digits = f"91{digits[1:]}"
    if len(digits) != 12 or not digits.startswith("91"):
        return None
    return digits


@require_http_methods(["GET"])
def auth_session(request):
    if not request.user.is_authenticated:
        return JsonResponse(
            {
                "authenticated": False,
                "username": "",
                "role": None,
                "facility": None,
            }
        )
    identity_id = request.session.get("facility_login_identity_id")
    identity = (
        FacilityLoginIdentity.objects.filter(
            pk=identity_id,
            account=request.user,
            is_active=True,
            facility__is_active=True,
            neon_user__is_active=True,
        )
        .select_related("facility", "neon_user")
        .first()
    )
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
        return JsonResponse(
            {
                "authenticated": True,
                "username": request.user.email or request.user.get_username(),
                "role": facility.facility_type,
                "facility": _facility_json(facility),
            }
        )

    return JsonResponse(
        {
            "authenticated": False,
            "username": "",
            "role": None,
            "facility": None,
        }
    )


@ensure_csrf_cookie
@require_http_methods(["GET"])
def csrf_token(request):
    return JsonResponse({"ok": True})
