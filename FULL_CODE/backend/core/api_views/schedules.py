"""Schedules API helpers and endpoints."""

from datetime import date, datetime

from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.views.decorators.http import require_http_methods

from ..models import FacilitySchedule
from .common import (
    _body,
    _error,
    _facility_code,
    _user_facility,
    _visible_facilities,
    api_login_required,
)


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
        return JsonResponse(
            {"results": [_schedule_json(event) for event in schedules.select_related("facility")]}
        )

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
