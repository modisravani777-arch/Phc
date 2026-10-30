"""Affiliations API helpers and endpoints."""

import uuid

from django.db import models
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.views.decorators.http import require_http_methods

from ..models import FacilityAffiliation, FacilityProfile
from .common import _body, _error, _user_facility, api_login_required


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
            models.Q(facility_code__iexact=phc_code)
            | models.Q(identifier__identification_number__iexact=phc_code),
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
        affiliation, _ = FacilityAffiliation.objects.update_or_create(
            subcentre=facility,
            defaults={
                "phc": phc,
                "status": "PENDING",
                "decision_reason": "",
                "decided_at": None,
            },
        )
        affiliation = {
            "id": str(affiliation.id),
            "subcentre": facility.name,
            "phc": phc.name,
            "status": "PENDING",
            "permissions": [],
            "decision_reason": "",
        }
        return JsonResponse({"affiliation": affiliation}, status=201)

    if facility is None:
        return JsonResponse({"results": []})
    if facility.facility_type == "PHC":
        affiliations = FacilityAffiliation.objects.filter(
            phc=facility,
            subcentre__is_active=True,
        ).select_related("subcentre", "phc")
    else:
        affiliations = FacilityAffiliation.objects.filter(subcentre=facility).select_related(
            "subcentre", "phc"
        )
    results = [
        {
            "id": str(affiliation.id),
            "subcentre": affiliation.subcentre.name,
            "phc": affiliation.phc.name,
            "status": affiliation.status,
            "permissions": ["view_records", "submit_referrals"]
            if affiliation.status == "APPROVED"
            else [],
            "decision_reason": affiliation.decision_reason,
        }
        for affiliation in affiliations
    ]
    return JsonResponse({"results": results})


@api_login_required
@require_http_methods(["POST"])
def approve_affiliation(request, affiliation_id):
    facility = _user_facility(request)
    affiliation = get_object_or_404(
        FacilityAffiliation.objects.select_related("subcentre"),
        id=affiliation_id,
        phc=facility,
        status="PENDING",
    )
    data = _body(request) or {}
    affiliation.status = "APPROVED"
    affiliation.decision_reason = str(data.get("reason", "")).strip()
    affiliation.decided_at = timezone.now()
    affiliation.save(update_fields=["status", "decision_reason", "decided_at"])
    affiliation.subcentre.parent_phc = facility
    affiliation.subcentre.save(update_fields=["parent_phc", "updated_at"])
    return JsonResponse(
        {
            "affiliation": {
                "id": str(affiliation.id),
                "status": "APPROVED",
                "decision_reason": affiliation.decision_reason,
            }
        }
    )


@api_login_required
@require_http_methods(["POST"])
def reject_affiliation(request, affiliation_id):
    facility = _user_facility(request)
    affiliation = get_object_or_404(
        FacilityAffiliation.objects.select_related("subcentre"),
        id=affiliation_id,
        phc=facility,
        status="PENDING",
    )
    data = _body(request) or {}
    affiliation.status = "REJECTED"
    affiliation.decision_reason = str(data.get("reason", "")).strip()
    affiliation.decided_at = timezone.now()
    affiliation.save(update_fields=["status", "decision_reason", "decided_at"])
    return JsonResponse(
        {
            "affiliation": {
                "id": str(affiliation.id),
                "status": "REJECTED",
                "decision_reason": affiliation.decision_reason,
            }
        }
    )
