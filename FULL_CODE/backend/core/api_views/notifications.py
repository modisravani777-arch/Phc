"""Notifications API helpers and endpoints."""

from django.db import transaction
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.views.decorators.http import require_http_methods

from ..models import DangerEscalation, FacilityNotification
from .common import _error, _user_facility, _visible_asha_ids, api_login_required


@api_login_required
@require_http_methods(["GET"])
def notification_collection(request):
    facility = _user_facility(request)
    if facility is None:
        return _error("Create a facility profile before viewing notifications", 409)
    escalations = list(
        DangerEscalation.objects.filter(
            status="PENDING_TRIAGE",
            asha_id__in=_visible_asha_ids(request),
        )
        .select_related("asha")
        .only(
            "escalation_id",
            "danger_signs",
            "patient_name",
            "village",
            "urgency_level",
            "asha__asha_id",
            "asha__asha_name",
        )
    )
    escalation_ids = [escalation.escalation_id for escalation in escalations]
    existing_ids = set(
        FacilityNotification.objects.filter(
            facility=facility,
            source_escalation_id__in=escalation_ids,
        ).values_list("source_escalation_id", flat=True)
    )
    new_notifications = [
        FacilityNotification(
            facility=facility,
            source_escalation_id=escalation.escalation_id,
            title=f"🚨 EMERGENCY: {escalation.danger_signs[:35]}",
            message=(
                f"Patient: {escalation.patient_name} in {escalation.village}. "
                f"Escalated by {escalation.asha.asha_name}. "
                f"Urgency: {escalation.urgency_level}."
            ),
        )
        for escalation in escalations
        if escalation.escalation_id not in existing_ids
    ]
    if new_notifications:
        with transaction.atomic():
            FacilityNotification.objects.bulk_create(new_notifications, ignore_conflicts=True)

    notifications = FacilityNotification.objects.filter(facility=facility)

    return JsonResponse(
        {
            "results": [
                {
                    "id": notification.id,
                    "title": notification.title,
                    "message": notification.message,
                    "read": notification.is_read,
                }
                for notification in notifications
            ]
        }
    )


@api_login_required
@require_http_methods(["POST"])
def mark_notification_read(request, notification_id):
    facility = _user_facility(request)
    notification = get_object_or_404(FacilityNotification, id=notification_id, facility=facility)
    if not notification.is_read:
        notification.is_read = True
        notification.read_at = timezone.now()
        notification.save(update_fields=["is_read", "read_at"])
    return JsonResponse({"notification": {"id": notification_id, "read": True}})
