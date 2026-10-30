"""Analytics API helpers and endpoints."""

from django.db import models
from django.http import JsonResponse
from django.utils import timezone
from django.views.decorators.http import require_http_methods

from ..models import (
    Asha,
    DangerEscalation,
    FacilityAshaAssignment,
    FacilityProfile,
    FacilityReport,
    Household,
    MedicalInventory,
    Member,
    NeonUser,
    VisitOutcome,
)
from .common import (
    _error,
    _facility_code,
    _facility_json,
    _user_facility,
    _visible_asha_ids,
    api_login_required,
)


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
        by_asha.append(
            {
                "id": row["asha_id"],
                "name": row["asha__asha_name"],
                "families": household_counts.get(row["asha_id"], 0),
                "members": row["member_count"],
                "pregnancies": row["pregnancies"],
                "immunization_records": row["immunization_records"],
                "ncd_records": row["ncd_records"],
            }
        )
    for asha in asha_rows:
        if not any(row["id"] == asha["asha_id"] for row in by_asha):
            by_asha.append(
                {
                    "id": asha["asha_id"],
                    "name": asha["asha_name"],
                    "families": household_counts.get(asha["asha_id"], 0),
                    "members": 0,
                    "pregnancies": 0,
                    "immunization_records": 0,
                    "ncd_records": 0,
                }
            )

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
                filter=member_period
                & models.Q(members__pregnant__in=["Y", "yes", "Yes", "True", "true"]),
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
def stats_overview(request):
    fac = _user_facility(request)
    if fac is None:
        return _error("Create a facility profile before viewing the dashboard", 409)

    if fac.facility_type == "PHC":
        visible_facilities = FacilityProfile.objects.filter(
            models.Q(pk=fac.pk) | models.Q(parent_phc=fac),
            is_active=True,
        )
    else:
        visible_facilities = FacilityProfile.objects.filter(pk=fac.pk, is_active=True)
    asha_ids = list(
        FacilityAshaAssignment.objects.filter(facility__in=visible_facilities).values_list(
            "asha_id", flat=True
        )
    )
    total_ashas = Asha.objects.filter(asha_id__in=asha_ids).count()
    staff_counts = NeonUser.objects.filter(
        is_active=True,
        assigned_facility__in=visible_facilities.values_list("name", flat=True),
    ).aggregate(
        other=models.Count(
            "pk",
            filter=~models.Q(role__iexact="ASHA") & models.Q(assigned_asha__isnull=True),
        ),
        anm=models.Count("pk", filter=models.Q(role__icontains="anm")),
        supervisors=models.Count("pk", filter=models.Q(role__icontains="supervisor")),
    )
    total_staff = total_ashas + staff_counts["other"]
    village_household_counts = list(
        Household.objects.filter(asha_id__in=asha_ids)
        .order_by()
        .values("village")
        .annotate(count=models.Count("household_id"))
    )
    total_households = sum(row["count"] for row in village_household_counts)
    total_villages = len(village_household_counts)
    members = Member.objects.filter(asha_id__in=asha_ids)
    member_counts = members.aggregate(
        total=models.Count("member_id"),
        anc=models.Count(
            "member_id",
            filter=models.Q(pregnant__in=["Y", "yes", "Yes", "True", "true"]),
        ),
        immunization=models.Count(
            "member_id",
            filter=~models.Q(child_vaccines__in=["", None]),
        ),
        ncd=models.Count("member_id", filter=~models.Q(ncd_condition__in=["", None])),
    )
    total_members = member_counts["total"]
    emergency_referrals = DangerEscalation.objects.filter(asha_id__in=asha_ids).count()

    inventory_counts = MedicalInventory.objects.filter(facility__in=visible_facilities).aggregate(
        total=models.Count("pk"),
        low_stock=models.Count("pk", filter=models.Q(quantity__lte=models.F("reorder_level"))),
    )
    reports = FacilityReport.objects.filter(facility__in=visible_facilities)
    report_counts = reports.aggregate(
        total=models.Count("pk"),
        approved=models.Count("pk", filter=models.Q(status="APPROVED")),
        submitted=models.Count("pk", filter=models.Q(status="SUBMITTED")),
        draft=models.Count("pk", filter=models.Q(status="DRAFT")),
    )
    affiliations = FacilityProfile.objects.filter(parent_phc=fac, is_active=True)

    recent_escalations = (
        DangerEscalation.objects.filter(
            asha_id__in=asha_ids,
        )
        .select_related("asha")
        .order_by("-created_at")[:4]
    )
    activities = []
    for esc in recent_escalations:
        activities.append(
            {
                "id": str(esc.escalation_id),
                "action": f"Emergency Escalation: {esc.danger_signs[:40]}",
                "entity_type": "EMERGENCY_REFERRAL",
                "timestamp": esc.created_at.strftime("%b %d, %H:%M"),
                "actor": esc.asha.asha_name,
                "_sort": esc.created_at,
            }
        )

    for member in members.order_by("-created_at")[:4]:
        activities.append(
            {
                "id": member.member_id,
                "action": f"Family member record added: {member.name}",
                "entity_type": "MEMBER_RECORD",
                "timestamp": timezone.localtime(member.created_at).strftime("%b %d, %H:%M"),
                "actor": member.asha.asha_name if member.asha_id else "",
                "_sort": member.created_at,
            }
        )
    recent_outcomes = (
        VisitOutcome.objects.filter(
            asha_id__in=asha_ids,
        )
        .select_related("asha")
        .order_by("-synced_at")[:4]
    )
    for outcome in recent_outcomes:
        activities.append(
            {
                "id": outcome.outcome_id,
                "action": f"Follow-up updated: {outcome.due_item} — {outcome.status}",
                "entity_type": "VISIT_OUTCOME",
                "timestamp": timezone.localtime(outcome.synced_at).strftime("%b %d, %H:%M"),
                "actor": outcome.asha.asha_name if outcome.asha_id else "",
                "_sort": outcome.synced_at,
            }
        )
    activities.sort(key=lambda activity: activity["_sort"], reverse=True)
    for activity in activities[:8]:
        activity.pop("_sort")
    activities = activities[:8]

    return JsonResponse(
        {
            "facility": _facility_json(fac),
            "kpis": {
                "total_staff": total_staff,
                "asha_count": total_ashas,
                "anm_count": staff_counts["anm"],
                "supervisor_count": staff_counts["supervisors"],
                "total_reports": report_counts["total"],
                "approved_reports": report_counts["approved"],
                "submitted_reports": report_counts["submitted"],
                "draft_reports": report_counts["draft"],
                "total_affiliations": affiliations.count()
                if fac.facility_type == "PHC"
                else int(bool(fac.parent_phc_id)),
                "pending_affiliations": 0,
                "total_clinical_records": total_members,
                "anc_records": member_counts["anc"],
                "immunization_records": member_counts["immunization"],
                "ncd_records": member_counts["ncd"],
                "referrals": emergency_referrals,
                "total_inventory_items": inventory_counts["total"],
                "low_stock_items": inventory_counts["low_stock"],
                "total_villages": total_villages,
                "catchment_population": total_members,
                "catchment_households": total_households,
            },
            "recent_activities": activities,
        }
    )


@api_login_required
@require_http_methods(["GET"])
def insights_overview(request):
    return JsonResponse(_insights_payload(request))
