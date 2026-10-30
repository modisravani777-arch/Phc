"""Staff API helpers and endpoints."""

import uuid

from django.db import models
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods

from ..models import Asha, FacilityAshaAssignment, NeonUser
from .common import (
    _body,
    _error,
    _user_facility,
    _visible_asha_ids,
    _visible_facilities,
    api_login_required,
)

STAFF_ROLE_VALUES = {
    "ANM": "ANM",
    "ADMIN": "ADMIN",
    "DOCTOR": "MEDICAL_OFFICER",
    "MEDICAL_OFFICER": "MEDICAL_OFFICER",
    "OTHER": "OTHER",
    "SUPERVISOR": "SUPERVISOR",
}


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
        return JsonResponse(
            {
                "staff": {
                    "id": asha.asha_id,
                    "full_name": asha.asha_name,
                    "role": "ASHA",
                    "phone": "",
                    "employee_code": asha.asha_id,
                    "villages": asha.villages,
                }
            }
        )

    user = NeonUser.objects.filter(
        id=str_id,
        assigned_facility__in=_visible_facilities(request).values_list("name", flat=True),
    ).first()
    if user:
        if request.method == "DELETE":
            user.is_active = False
            user.save()
            return JsonResponse({"deleted": True})
        return JsonResponse(
            {
                "staff": {
                    "id": str(user.id),
                    "full_name": user.full_name,
                    "role": user.role.upper(),
                    "phone": user.phone or "",
                    "employee_code": user.email,
                }
            }
        )

    return _error("Staff member not found", 404)


@api_login_required
@require_http_methods(["GET", "POST"])
def staff_collection(request):
    if request.method == "GET":
        visible_facilities = _visible_facilities(request)
        asha_ids = _visible_asha_ids(request)
        ashas = list(Asha.objects.filter(asha_id__in=asha_ids).order_by("asha_name"))
        visible_facility_names = visible_facilities.values_list("name", flat=True)
        users = list(
            NeonUser.objects.filter(is_active=True)
            .filter(
                models.Q(assigned_facility__in=visible_facility_names)
                | models.Q(assigned_asha_id__in=asha_ids)
            )
            .order_by("full_name")
        )

        # Map users by assigned_asha_id and name for clean enrichment without duplicate rows
        user_by_asha = {u.assigned_asha_id: u for u in users if u.assigned_asha_id}
        user_by_name = {u.full_name.strip().lower(): u for u in users}

        results = []
        seen_names = set()

        for a in ashas:
            linked_user = user_by_asha.get(a.asha_id) or user_by_name.get(
                a.asha_name.strip().lower()
            )
            phone = linked_user.phone if linked_user and linked_user.phone else ""
            results.append(
                {
                    "id": a.asha_id,
                    "full_name": a.asha_name,
                    "role": "ASHA",
                    "phone": phone,
                    "employee_code": a.asha_id,
                    "villages": a.villages,
                }
            )
            seen_names.add(a.asha_name.strip().lower())

        for u in users:
            if (
                u.full_name.strip().lower() in seen_names
                or u.assigned_asha_id
                or u.role.upper() == "ASHA"
            ):
                continue
            normalized_role = u.role.strip().upper()
            role_display = (
                "DOCTOR"
                if normalized_role == "MEDICAL_OFFICER"
                else normalized_role
                if normalized_role in STAFF_ROLE_VALUES
                else "SUPERVISOR"
                if "cho" in normalized_role.lower() or "super" in normalized_role.lower()
                else "DOCTOR"
                if "medic" in normalized_role.lower()
                or "doctor" in normalized_role.lower()
                or "mo" in normalized_role.lower()
                else "ADMIN"
                if "admin" in normalized_role.lower()
                else "SUPERVISOR"
            )
            results.append(
                {
                    "id": str(u.id),
                    "full_name": u.full_name,
                    "role": role_display,
                    "phone": u.phone or "",
                    "employee_code": u.email,
                    "villages": u.assigned_facility,
                }
            )
            seen_names.add(u.full_name.strip().lower())

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
    if role != "ASHA" and role not in STAFF_ROLE_VALUES:
        return _error("role must be ASHA, ANM, SUPERVISOR, DOCTOR, ADMIN or OTHER")

    if role == "ASHA":
        facility = _user_facility(request)
        if facility is None:
            return _error("Create a facility profile before adding staff", 409)
        asha_id = code or f"ASHA-{uuid.uuid4().hex[:4].upper()}"
        villages = str(data.get("villages", "")).strip()
        existing_asha = Asha.objects.filter(pk=asha_id).first()
        if (
            existing_asha
            and FacilityAshaAssignment.objects.filter(asha=existing_asha)
            .exclude(facility__in=_visible_facilities(request))
            .exists()
        ):
            return _error("That ASHA is assigned to another facility", 409)
        asha, created = Asha.objects.update_or_create(
            asha_id=asha_id, defaults={"asha_name": full_name, "villages": villages}
        )
        FacilityAshaAssignment.objects.get_or_create(facility=facility, asha=asha)
        return JsonResponse(
            {
                "staff": {
                    "id": asha.asha_id,
                    "full_name": asha.asha_name,
                    "role": "ASHA",
                    "phone": phone,
                    "employee_code": asha.asha_id,
                    "villages": asha.villages,
                }
            },
            status=201 if created else 200,
        )
    else:
        facility = _user_facility(request)
        if facility is None:
            return _error("Create a facility profile before adding staff", 409)
        email = code if "@" in code else f"{uuid.uuid4().hex[:6]}@arogyasathi.in"
        existing_user = NeonUser.objects.filter(email__iexact=email).first()
        if existing_user and existing_user.assigned_facility not in set(
            _visible_facilities(request).values_list("name", flat=True)
        ):
            return _error("That staff account is assigned to another facility", 409)
        user, created = NeonUser.objects.update_or_create(
            email=email,
            defaults={
                "full_name": full_name,
                "role": STAFF_ROLE_VALUES[role],
                "phone": phone,
                "assigned_facility": facility.name,
                "is_active": True,
            },
        )
        return JsonResponse(
            {
                "staff": {
                    "id": str(user.id),
                    "full_name": user.full_name,
                    "role": "DOCTOR" if role == "MEDICAL_OFFICER" else role,
                    "phone": user.phone or phone,
                    "employee_code": user.email,
                }
            },
            status=201 if created else 200,
        )
