"""Reports API helpers and endpoints."""

from datetime import date

from django.http import HttpResponse, JsonResponse
from django.shortcuts import get_object_or_404
from django.views.decorators.http import require_http_methods

from ..models import FacilityReport
from .analytics import _insights_payload, _report_json
from .common import (
    _body,
    _error,
    _facility_code,
    _user_facility,
    _visible_facilities,
    api_login_required,
)


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
def report_collection(request):
    if request.method == "GET":
        reports = FacilityReport.objects.filter(
            facility__in=_visible_facilities(request)
        ).select_related("facility")
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
