"""Facilities API helpers and endpoints."""

from django.db import IntegrityError, models, transaction
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods

from ..models import FacilityIdentifier, FacilityProfile
from .common import (
    _body,
    _error,
    _facility_json,
    _generate_facility_code,
    _role_value,
    _user_facility,
    _user_role,
    _visible_facilities,
    api_login_required,
)


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
        and code[len(prefix) + 1 :].isdigit()
    ):
        return _error("Facility identification numbers are assigned automatically", 400)
    parent_phc = None
    phc_code = str(data.get("phc_code", "")).strip()
    if facility_type == "SUBCENTRE" and phc_code:
        parent_phc = FacilityProfile.objects.filter(
            models.Q(facility_code__iexact=phc_code)
            | models.Q(identifier__identification_number__iexact=phc_code),
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
                    models.Q(facility_code__iexact=code)
                    | models.Q(identifier__identification_number__iexact=code),
                    facility_type="PHC",
                    is_active=True,
                ).first()
                if parent is None:
                    return _error("No active PHC matches that identification code", 400)
            facility.parent_phc = parent
        facility.save()
    return JsonResponse({"facility": _facility_json(facility)})
