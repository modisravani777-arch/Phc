"""Clinical API helpers and endpoints."""

import uuid
from datetime import date, timedelta

from django.db import models
from django.http import JsonResponse
from django.utils import timezone
from django.views.decorators.http import require_http_methods

from ..models import Asha, ClinicalVisit, DangerEscalation, Household, MedicalInventory, Member
from .common import (
    _age_years,
    _body,
    _error,
    _user_facility,
    _visible_asha_ids,
    _visible_facilities,
    api_login_required,
)


@api_login_required
@require_http_methods(["GET", "POST"])
def registers_collection(request):
    if request.method == "GET":
        service_type = request.GET.get("service_type", "ALL").upper()
        search = request.GET.get("search", "").strip().lower()

        visible_asha_ids = _visible_asha_ids(request)
        members_qs = Member.objects.select_related("asha", "household").filter(
            asha_id__in=visible_asha_ids
        )

        if search:
            members_qs = members_qs.filter(
                models.Q(name__icontains=search)
                | models.Q(member_id__icontains=search)
                | models.Q(village__icontains=search)
            )

        results = []
        seen_keys = set()
        seen_names = set()
        seen_member_ids = set()

        def add_record(entry, member_id=None):
            eid = entry.get("id")
            name = entry.get("patient_name", "").strip().lower()

            if eid in seen_keys or (name and name in seen_names):
                return
            if member_id and member_id in seen_member_ids:
                return

            seen_keys.add(eid)
            if name:
                seen_names.add(name)
            if member_id:
                seen_member_ids.add(member_id)
            results.append(entry)

        # 1. Real recorded Clinical Visits first (latest live vitals, prescription & notes)
        visits_filter = models.Q(facility__in=_visible_facilities(request))
        if service_type != "ALL":
            mapped_service = "EMERGENCY_TRIAGE" if service_type == "REFERRAL" else service_type
            visits_filter &= models.Q(service_type=mapped_service)

        visits_qs = ClinicalVisit.objects.select_related("member", "asha").filter(visits_filter)[
            :50
        ]
        for v in visits_qs:
            add_record(
                {
                    "id": v.visit_code,
                    "patient_name": v.member.name,
                    "age": _age_years(v.member.dob),
                    "gender": v.member.sex or "",
                    "village": v.member.village or "",
                    "service_type": "REFERRAL"
                    if v.service_type == "EMERGENCY_TRIAGE"
                    else v.service_type,
                    "date": v.visit_date.strftime("%Y-%m-%d"),
                    "vitals": v.vitals or {},
                    "details": f"{v.clinical_notes} | Rx: {v.prescribed_medicines}"
                    if v.prescribed_medicines
                    else v.clinical_notes,
                    "assigned_worker": v.asha.asha_name,
                    "status": v.status,
                },
                member_id=v.member.member_id,
            )

        # 2. Emergency Escalations from Neon danger_escalations
        if service_type in ("REFERRAL", "ALL"):
            escalations = DangerEscalation.objects.select_related("asha").filter(
                asha_id__in=visible_asha_ids
            )
            for esc in escalations:
                add_record(
                    {
                        "id": f"REF-{str(esc.escalation_id)[:8].upper()}",
                        "patient_name": esc.patient_name or "",
                        "age": None,
                        "gender": "",
                        "village": esc.village or "",
                        "service_type": "REFERRAL",
                        "date": esc.created_at.strftime("%Y-%m-%d"),
                        "vitals": {},
                        "details": f"CRITICAL: {esc.danger_signs} | Query: {esc.query_text}",
                        "assigned_worker": esc.asha.asha_name,
                        "status": "REFERRED" if esc.status == "PENDING_TRIAGE" else "COMPLETED",
                    }
                )

        # 3. Maternal Care (ANC) from Neon members table
        if service_type in ("ANC", "ALL"):
            anc_qs = members_qs.filter(pregnant__in=["Y", "yes", "Yes", "True", "true"])[:100]
            for m in anc_qs:
                hb_val = None
                try:
                    hb_val = float(m.last_hb_gdl) if m.last_hb_gdl else None
                except (ValueError, TypeError):
                    pass

                vitals = {}
                if m.last_anc_bp:
                    vitals["bp"] = m.last_anc_bp
                if hb_val is not None:
                    vitals["hemoglobin"] = hb_val
                details = [
                    value
                    for value in (
                        f"EDD: {m.edd}" if m.edd else "",
                        f"Visits: {m.anc_visit_dates}" if m.anc_visit_dates else "",
                        f"TD doses: {m.td_doses}" if m.td_doses else "",
                    )
                    if value
                ]
                add_record(
                    {
                        "id": m.member_id,
                        "patient_name": m.name,
                        "age": _age_years(m.dob),
                        "gender": "F",
                        "village": m.village or (m.household.village if m.household else ""),
                        "service_type": "ANC",
                        "date": m.lmp_date or m.created_at.strftime("%Y-%m-%d"),
                        "vitals": vitals,
                        "details": " | ".join(details) or "Active pregnancy register",
                        "assigned_worker": m.asha.asha_name if m.asha else "",
                        "status": "COMPLETED" if m.anc_visit_dates else "FOLLOW_UP_REQUIRED",
                    },
                    member_id=m.member_id,
                )

        # 4. Universal Immunization (UIP) from Neon members table
        if service_type in ("IMMUNIZATION", "ALL"):
            imm_qs = members_qs.exclude(child_vaccines__isnull=True).exclude(child_vaccines="")[
                :100
            ]
            for m in imm_qs:
                vitals = {}
                if m.last_muac_cm:
                    vitals["muac_cm"] = m.last_muac_cm
                details = [f"Vaccines: {m.child_vaccines}"]
                if m.last_muac_cm:
                    details.append(f"MUAC: {m.last_muac_cm} cm")
                add_record(
                    {
                        "id": m.member_id,
                        "patient_name": m.name,
                        "age": _age_years(m.dob),
                        "gender": m.sex or "",
                        "village": m.village or (m.household.village if m.household else ""),
                        "service_type": "IMMUNIZATION",
                        "date": m.last_muac_date or m.created_at.strftime("%Y-%m-%d"),
                        "vitals": vitals,
                        "details": " | ".join(details),
                        "assigned_worker": m.asha.asha_name if m.asha else "",
                        "status": "COMPLETED",
                    },
                    member_id=m.member_id,
                )

        # 5. NCD Screening from Neon members table
        if service_type in ("NCD_SCREENING", "ALL"):
            ncd_qs = members_qs.exclude(ncd_condition__isnull=True).exclude(ncd_condition="")[:100]
            for m in ncd_qs:
                sugar_val = None
                try:
                    sugar_val = int(m.last_rbs_mg_dl) if m.last_rbs_mg_dl else None
                except (ValueError, TypeError):
                    pass

                vitals = {}
                if m.last_bp_reading:
                    vitals["bp"] = m.last_bp_reading
                if sugar_val is not None:
                    vitals["blood_sugar"] = sugar_val
                details = [f"Diagnosis: {m.ncd_condition}"]
                if sugar_val is not None:
                    details.append(f"RBS: {sugar_val} mg/dL")
                add_record(
                    {
                        "id": m.member_id,
                        "patient_name": m.name,
                        "age": _age_years(m.dob),
                        "gender": m.sex or "",
                        "village": m.village or (m.household.village if m.household else ""),
                        "service_type": "NCD_SCREENING",
                        "date": m.last_bp_check_date or m.created_at.strftime("%Y-%m-%d"),
                        "vitals": vitals,
                        "details": " | ".join(details),
                        "assigned_worker": m.asha.asha_name if m.asha else "",
                        "status": "COMPLETED",
                    },
                    member_id=m.member_id,
                )

        return JsonResponse({"results": results[:150]})

    # POST: create a new ClinicalVisit record linked to real Member and Asha
    data = _body(request)
    if not data:
        return _error("Invalid payload")

    patient_name = str(data.get("patient_name", "")).strip()
    village = str(data.get("village", "")).strip()
    raw_service = str(data.get("service_type", "GENERAL_OPD")).strip().upper()

    service_map = {
        "ANC": "ANC",
        "PNC": "PNC",
        "IMMUNIZATION": "IMMUNIZATION",
        "NCD_SCREENING": "NCD_SCREENING",
        "GENERAL_OPD": "GENERAL_OPD",
        "REFERRAL": "EMERGENCY_TRIAGE",
        "EMERGENCY_TRIAGE": "EMERGENCY_TRIAGE",
    }
    requested_service = service_map.get(raw_service)
    if requested_service is None:
        return _error("Choose a valid clinical service type")
    if not patient_name:
        return _error("Patient name is required")

    vitals = data.get("vitals", {})
    if not isinstance(vitals, dict):
        return _error("Vitals must be an object")

    age = data.get("age")
    dob = None
    if age not in (None, ""):
        try:
            age = int(age)
        except (TypeError, ValueError):
            return _error("Age must be a whole number")
        if age < 0 or age > 130:
            return _error("Age must be between 0 and 130")
        dob = (timezone.now() - timedelta(days=age * 365.2425)).date().isoformat()

    # 1. Resolve facility
    facility = _user_facility(request)
    if facility is None:
        return _error("Create a facility profile before recording a visit", 409)

    asha_ids = _visible_asha_ids(request)
    if not asha_ids:
        return _error("Assign an ASHA worker to this facility before recording a visit", 409)

    # 2. Resolve ASHA worker intelligently
    worker_name = str(data.get("assigned_worker", "")).strip()
    selected_asha = None
    if worker_name and worker_name.lower() not in ("duty anm / cho", "unassigned", "anm", "staff"):
        selected_asha = Asha.objects.filter(
            asha_id__in=asha_ids, asha_name__iexact=worker_name
        ).first()
        if selected_asha is None:
            return _error("The selected ASHA worker is not assigned to your facility", 400)

    if not selected_asha and village:
        selected_asha = Asha.objects.filter(
            asha_id__in=asha_ids, villages__icontains=village
        ).first()

    if not selected_asha:
        selected_asha = Asha.objects.filter(asha_id__in=asha_ids).order_by("asha_name").first()
    if selected_asha is None:
        return _error("No assigned ASHA worker is available for this visit", 409)

    # 3. Resolve or create household and patient (Member), within this ASHA only.
    member = Member.objects.filter(
        name__iexact=patient_name,
        asha=selected_asha,
    ).first()

    if not member:
        household = Household.objects.filter(asha=selected_asha).first()
        if not household:
            hh_village = village or (
                selected_asha.villages.split(",")[0].strip()
                if selected_asha.villages
                else "Chandrapuri"
            )
            household = Household.objects.create(
                household_id=f"HH-{uuid.uuid4().hex[:6].upper()}",
                head_name=patient_name,
                village=hh_village,
                asha=selected_asha,
            )

        sex = str(data.get("gender", "")).upper()
        if sex not in ("M", "F", "OTHER"):
            sex = "F" if requested_service in ("ANC", "PNC") else "M"

        member = Member.objects.create(
            member_id=f"MEM-{uuid.uuid4().hex[:6].upper()}",
            name=patient_name,
            village=village or household.village,
            sex=sex,
            dob=dob,
            pregnant="Y" if requested_service == "ANC" else "N",
            asha=selected_asha,
            household=household,
        )
    else:
        if requested_service == "ANC" and member.pregnant != "Y":
            member.pregnant = "Y"
            member.save(update_fields=["pregnant"])

    # 4. Create ClinicalVisit record
    visit = ClinicalVisit.objects.create(
        visit_code=f"VST-{uuid.uuid4().hex[:6].upper()}",
        member=member,
        asha=selected_asha,
        household=member.household,
        facility=facility,
        service_type=requested_service,
        visit_date=timezone.now().date(),
        vitals=vitals,
        clinical_notes=str(data.get("details", "")).strip(),
        prescribed_medicines=str(data.get("prescribed_medicines", "")).strip(),
        status=data.get("status", "COMPLETED"),
    )

    age_display = _age_years(member.dob) if member.dob else data.get("age")
    return JsonResponse(
        {
            "record": {
                "id": visit.visit_code,
                "patient_name": member.name,
                "age": age_display,
                "gender": member.sex or "",
                "village": member.village,
                "service_type": visit.service_type,
                "date": visit.visit_date.strftime("%Y-%m-%d"),
                "vitals": visit.vitals,
                "details": visit.clinical_notes,
                "assigned_worker": visit.asha.asha_name,
                "status": visit.status,
            }
        },
        status=201,
    )


@api_login_required
@require_http_methods(["GET", "POST"])
def inventory_collection(request):
    if request.method == "GET":
        category = request.GET.get("category", "ALL").upper()
        search = request.GET.get("search", "").strip()

        qs = MedicalInventory.objects.filter(facility__in=_visible_facilities(request))
        if category != "ALL":
            qs = qs.filter(category=category)
        if search:
            qs = qs.filter(models.Q(name__icontains=search) | models.Q(item_code__icontains=search))

        results = []
        for item in qs:
            status = "IN_STOCK"
            if item.expiry_date and item.expiry_date < timezone.localdate():
                status = "EXPIRED"
            elif item.quantity <= item.reorder_level / 2:
                status = "CRITICAL"
            elif item.quantity <= item.reorder_level:
                status = "LOW_STOCK"

            results.append(
                {
                    "id": str(item.id),
                    "item_code": item.item_code,
                    "name": item.name,
                    "category": item.category,
                    "batch_number": item.batch_number,
                    "current_stock": item.quantity,
                    "unit": item.unit,
                    "min_reorder_level": item.reorder_level,
                    "expiry_date": item.expiry_date.strftime("%Y-%m-%d")
                    if item.expiry_date
                    else "N/A",
                    "storage_location": item.storage_location,
                    "status": status,
                }
            )

        return JsonResponse({"results": results})

    data = _body(request)
    if not data:
        return _error("Invalid payload")

    name = str(data.get("name", "")).strip()
    if not name:
        return _error("Item name is required")

    code = str(data.get("item_code", "")).strip() or f"MED-{uuid.uuid4().hex[:4].upper()}"
    category = str(data.get("category", "MEDICINE")).upper()
    valid_categories = {
        choice[0] for choice in MedicalInventory._meta.get_field("category").choices
    }
    if category not in valid_categories:
        return _error("Choose a valid inventory category")
    try:
        quantity = int(data.get("current_stock", 100))
        reorder_level = int(data.get("min_reorder_level", 20))
    except (TypeError, ValueError):
        return _error("Stock quantity and reorder level must be whole numbers")
    if quantity < 0 or reorder_level < 0:
        return _error("Stock quantity and reorder level cannot be negative")
    expiry_value = str(data.get("expiry_date", "")).strip()
    try:
        expiry_date = date.fromisoformat(expiry_value) if expiry_value else None
    except ValueError:
        return _error("Expiry date must use YYYY-MM-DD format")
    fac = _user_facility(request)
    if fac is None:
        return _error("Create a facility profile before adding inventory", 409)
    existing_item = MedicalInventory.objects.filter(item_code=code).first()
    if existing_item and existing_item.facility_id not in _visible_facilities(request).values_list(
        "id", flat=True
    ):
        return _error("That item code is already assigned to another facility", 409)

    item, created = MedicalInventory.objects.update_or_create(
        item_code=code,
        defaults={
            "facility": fac,
            "name": name,
            "category": category,
            "batch_number": data.get("batch_number", "BATCH-01"),
            "quantity": quantity,
            "unit": data.get("unit", "Units"),
            "reorder_level": reorder_level,
            "expiry_date": expiry_date,
            "storage_location": data.get("storage_location", "Main Dispensary"),
        },
    )

    return JsonResponse(
        {
            "item": {
                "id": str(item.id),
                "item_code": item.item_code,
                "name": item.name,
                "category": item.category,
                "batch_number": item.batch_number,
                "current_stock": item.quantity,
                "unit": item.unit,
                "min_reorder_level": item.reorder_level,
                "expiry_date": item.expiry_date.isoformat() if item.expiry_date else "N/A",
                "storage_location": item.storage_location,
                "status": "IN_STOCK",
            }
        },
        status=201 if created else 200,
    )
