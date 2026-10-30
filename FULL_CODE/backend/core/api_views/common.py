"""Common API helpers and endpoints."""

import json
import uuid
from datetime import date
from functools import wraps
from pathlib import Path

from django.conf import settings
from django.db import models
from django.http import JsonResponse
from django.utils import timezone

from ..models import (
    FacilityAshaAssignment,
    FacilityIdentifier,
    FacilityLoginIdentity,
    FacilityProfile,
)


def _body(request):
    try:
        value = json.loads(request.body or "{}")
    except json.JSONDecodeError:
        return None
    return value if isinstance(value, dict) else None


def _generate_facility_code(facility_type):
    prefix = "SC" if facility_type == "SUBCENTRE" else "PHC"
    while True:
        code = f"{prefix}-{uuid.uuid4().int % 10_000_000_000:010d}"
        if (
            not FacilityProfile.objects.filter(facility_code=code).exists()
            and not FacilityIdentifier.objects.filter(identification_number=code).exists()
        ):
            return code


def _role_value(value):
    normalized = str(value or "").strip().upper()
    return (
        "SUBCENTRE"
        if normalized in {"SUBCENTRE", "SUB-CENTRE", "SUBCENTER", "SUB-CENTER"}
        else normalized
    )


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
    return max(
        0,
        today.year
        - birth_date.year
        - ((today.month, today.day) < (birth_date.month, birth_date.day)),
    )


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


def _user_role(request):
    user = getattr(request, "user", None)
    if user and user.is_authenticated:
        identity = (
            FacilityLoginIdentity.objects.filter(
                account=user,
                is_active=True,
                facility__is_active=True,
                neon_user__is_active=True,
            )
            .select_related("facility", "neon_user")
            .first()
        )
        if identity:
            return identity.facility.facility_type, identity.facility

        profile = FacilityProfile.objects.filter(account=user, is_active=True).first()
        if profile:
            return profile.facility_type, profile

    facility_id = (
        request.session.get("facility_profile_id") if hasattr(request, "session") else None
    )
    if user and user.is_authenticated and facility_id:
        profile = FacilityProfile.objects.filter(
            pk=facility_id,
            account=user,
            is_active=True,
            facility_type__in=["PHC", "SUBCENTRE"],
        ).first()
        if profile:
            return profile.facility_type, profile
    return None, None


def _visible_asha_ids(request):
    assigned = list(
        FacilityAshaAssignment.objects.filter(
            facility__in=_visible_facilities(request),
        ).values_list("asha_id", flat=True)
    )
    return assigned


def _facility_code(facility):
    try:
        return facility.identifier.identification_number
    except FacilityIdentifier.DoesNotExist:
        return facility.facility_code


def _user_facility(request):
    _, profile = _user_role(request)
    return profile


def _h5_data_dir():
    data_dir = Path(settings.H5_DATA_DIR) if settings.H5_DATA_DIR else None
    if not data_dir or not (data_dir / "protocols").is_dir():
        return None
    return data_dir


def _error(message, status=400):
    return JsonResponse({"error": message}, status=status)


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


def api_login_required(view):
    @wraps(view)
    def wrapped(request, *args, **kwargs):
        if not request.user.is_authenticated:
            return _error("Please sign in to continue", 401)
        identity_id = request.session.get("facility_login_identity_id")
        if (
            identity_id
            and FacilityLoginIdentity.objects.filter(
                pk=identity_id,
                account=request.user,
                is_active=True,
                account__is_active=True,
                facility__is_active=True,
                neon_user__is_active=True,
            ).exists()
        ):
            return view(request, *args, **kwargs)

        facility_id = request.session.get("facility_profile_id")
        if (
            facility_id
            and FacilityProfile.objects.filter(
                pk=facility_id,
                account=request.user,
                is_active=True,
                account__is_active=True,
                facility_type__in=["PHC", "SUBCENTRE"],
            ).exists()
        ):
            return view(request, *args, **kwargs)

        profile = FacilityProfile.objects.filter(
            account=request.user,
            is_active=True,
            facility_type__in=["PHC", "SUBCENTRE"],
        ).first()
        if profile:
            request.session["facility_profile_id"] = str(profile.pk)
            request.session["facility_role"] = profile.facility_type
            return view(request, *args, **kwargs)

        return _error("Please sign in with your assigned facility account", 401)

    return wrapped
