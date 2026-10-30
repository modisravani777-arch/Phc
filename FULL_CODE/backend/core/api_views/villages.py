"""Villages API helpers and endpoints."""

from django.db import models
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods

from ..models import Asha, FacilityVillage, Household, Member
from .common import (
    _body,
    _error,
    _user_facility,
    _visible_asha_ids,
    _visible_facilities,
    api_login_required,
)


@api_login_required
@require_http_methods(["GET", "POST"])
def village_collection(request):
    if request.method == "GET":
        asha_ids = _visible_asha_ids(request)
        ashas = list(Asha.objects.filter(asha_id__in=asha_ids))
        hh_stats = {
            r["village"]: r["count"]
            for r in Household.objects.filter(asha_id__in=asha_ids)
            .values("village")
            .annotate(count=models.Count("household_id"))
        }
        member_stats = {
            r["village"]: r
            for r in Member.objects.filter(asha_id__in=asha_ids, village__isnull=False)
            .exclude(village="")
            .values("village")
            .annotate(
                population=models.Count("member_id"),
                anc_count=models.Count(
                    "member_id", filter=models.Q(pregnant__in=["Y", "yes", "Yes", "True", "true"])
                ),
                immunized=models.Count(
                    "member_id", filter=~models.Q(child_vaccines__in=["", None])
                ),
            )
        }
        configured = list(
            FacilityVillage.objects.filter(
                facility__in=_visible_facilities(request)
            ).select_related("facility")
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
                asha.asha_name for asha in ashas if v_name.casefold() in asha.villages.casefold()
            ]
            results.append(
                {
                    "id": f"VIL-{idx + 1:03d}",
                    "name": v_name,
                    "gram_panchayat": metadata.gram_panchayat if metadata else "",
                    "total_population": population
                    or (metadata.total_population if metadata else 0),
                    "total_households": households_count
                    or (metadata.total_households if metadata else 0),
                    "eligible_couples": metadata.eligible_couples if metadata else 0,
                    "target_anc": stat.get("anc_count", 0)
                    or (metadata.target_anc if metadata else 0),
                    "children_under_5": metadata.children_under_5 if metadata else 0,
                    "assigned_asha": ", ".join(names)
                    or (metadata.assigned_asha if metadata else ""),
                    "assigned_anm": metadata.assigned_anm if metadata else "",
                    "immunization_coverage_pct": round(
                        (stat.get("immunized", 0) / population * 100)
                        if population
                        else (float(metadata.immunization_coverage_pct) if metadata else 0),
                        1,
                    ),
                    "distance_from_centre_km": float(metadata.distance_from_centre_km)
                    if metadata
                    else 0,
                }
            )
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
    return JsonResponse(
        {
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
        },
        status=201 if created else 200,
    )
