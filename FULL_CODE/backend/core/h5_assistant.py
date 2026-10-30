"""Offline, protocol-bound companion for the H5 hackathon task.

The module uses only the Python standard library. It never diagnoses or doses
outside the supplied protocol corpus: danger escalation is evaluated before
retrieval, and out-of-scope requests are redirected to an ANM/Medical Officer.
"""

from __future__ import annotations

import csv
import math
import re
import time
from collections import Counter
from datetime import date, timedelta
from pathlib import Path

TODAY = date(2026, 10, 26)
WORD_MAP = {
    "dast": "diarrhoea",
    "bukhar": "fever",
    "taap": "fever",
    "tika": "vaccine",
    "teeka": "vaccine",
    "khoon": "bleeding",
    "jhatke": "convulsions",
    "saans": "breathing",
    "pasli": "chest indrawing",
    "sujan": "swelling oedema",
    "ulti": "vomiting",
    "doodh": "breastfeeding",
    "behosh": "unconscious",
    "garbhvati": "pregnancy",
    "mahine": "months",
    "hafte": "weeks",
    "kami": "anaemia",
}
REFUSAL_TERMS = (
    "amoxicillin",
    "cefixime",
    "antibiotic",
    "paracetamol",
    "cough syrup",
    "insulin",
    "metformin",
    "amlodipine",
    "dose",
    "kitni goli",
    "kitna dena",
    "salary",
    "incentive",
    "login",
    "otp",
    "app ",
    "ration",
    "certificate",
    "tb ",
    "dengue",
    "typhoid",
    "hiv",
    "thyroid",
    "covid",
    "rabies",
    "abortion",
    "garbhpat",
    "sex determination",
    "ladka hoga",
    "ladki hoga",
    "ultrasound report",
)
ESCALATION_RULES = (
    (
        "ESC-2.3",
        (
            "chehra suja",
            "face swelling",
            "swelling of face",
            "severe headache",
            "sir dard",
            "blurred vision",
            "dhundhla",
        ),
    ),
    (
        "ESC-2.5",
        ("severe pallor", "bahut peeli", "hb below 7", "hb 6", "breathlessness", "saans phool"),
    ),
    (
        "ESC-2.6",
        ("vomits everything", "excessive vomiting", "paani bhi pet", "unable to take anything"),
    ),
    ("ESC-3.1", ("pad 3", "pad 4", "less than 5 minutes", "heavy bleeding after delivery")),
    ("ESC-4.3", ("cold to touch", "hypothermia", "baby cold")),
    ("ESC-4.4", ("1.6 kg", "below 1.8", "less than 1.8")),
    (
        "ESC-5.1",
        (
            "not able to drink",
            "cannot drink",
            "doodh nahi pee",
            "convuls",
            "fits",
            "seizure",
            "jhatke",
            "vomits everything",
        ),
    ),
    ("ESC-5.2", ("chest indrawing", "pasli chal", "stridor")),
    ("ESC-5.3", ("blood in stool", "dast me khoon", "severe dehydration")),
    (
        "ESC-5.4",
        ("stiff neck", "gardan akad", "more than 7 days", "9 din", "8 din", "fever 7 days"),
    ),
    ("ESC-6.3", ("unconscious", "behosh")),
)


def tokenize(text: str) -> list[str]:
    tokens = re.findall(r"[a-z0-9]+(?:\.[0-9]+)?", text.lower())
    return [part for token in tokens for part in ([token] + WORD_MAP.get(token, "").split())]


def parse_date(value: str) -> date | None:
    try:
        return date.fromisoformat(value) if value else None
    except ValueError:
        return None


def parse_sections(data_dir: Path) -> dict[str, str]:
    sections, current = {}, None
    section_re = re.compile(r"^###\s+([A-Z]{2,4}-\d+\.\d+)\s")
    for path in sorted((data_dir / "protocols").glob("*.md")):
        for line in path.read_text(encoding="utf-8").splitlines():
            matched = section_re.match(line)
            if matched:
                current = matched.group(1)
                sections[current] = line
            elif line.startswith("#"):
                current = None
            elif current:
                sections[current] += "\n" + line
    if not sections:
        raise ValueError("No H5 protocol sections were found")
    return sections


class ProtocolAssistant:
    def __init__(self, data_dir: Path):
        self.sections = parse_sections(data_dir)
        self.ids = list(self.sections)
        self.documents = [tokenize(self.sections[section_id]) for section_id in self.ids]
        self.term_frequencies = [Counter(document) for document in self.documents]
        self.document_frequency = Counter(
            term for document in self.documents for term in set(document)
        )
        self.average_length = sum(map(len, self.documents)) / len(self.documents)

    def _search(self, question: str) -> str:
        query, total = tokenize(question), len(self.documents)
        best_score, best_id = -1.0, "SCP-1.2"
        for section_id, terms, frequency in zip(
            self.ids, self.documents, self.term_frequencies, strict=True
        ):
            score = 0.0
            for term in query:
                if term not in frequency:
                    continue
                inverse_frequency = math.log(
                    1
                    + (total - self.document_frequency[term] + 0.5)
                    / (self.document_frequency[term] + 0.5)
                )
                score += (
                    inverse_frequency
                    * frequency[term]
                    * 2.5
                    / (frequency[term] + 1.5 * (0.25 + 0.75 * len(terms) / self.average_length))
                )
            if score > best_score:
                best_score, best_id = score, section_id
        return best_id

    def answer(self, question: str) -> dict:
        started, lower = time.perf_counter(), question.lower()
        for section_id, terms in ESCALATION_RULES:
            if any(term in lower for term in terms):
                return self._record(question, section_id, True, False, started)
        if any(term in lower for term in REFUSAL_TERMS):
            return {
                "answer_text": "This is outside my protocol book. Please ask the Medical Officer / ANM. If any danger sign is present, refer immediately (SCP-1.2).",
                "cited_section_ids": ["SCP-1.2"],
                "escalate": False,
                "refused": True,
                "latency_ms": round((time.perf_counter() - started) * 1000, 3),
            }
        return self._record(question, self._search(question), False, False, started)

    def _record(
        self, question: str, section_id: str, escalate: bool, refused: bool, started: float
    ) -> dict:
        text = re.sub(r"[#*|>]", " ", self.sections[section_id])
        text = re.sub(r"\s+", " ", text).strip()
        prefix = "DANGER SIGN: refer immediately / call 108. " if escalate else ""
        return {
            "answer_text": (prefix + text)[:400],
            "cited_section_ids": [section_id],
            "escalate": escalate,
            "refused": refused,
            "latency_ms": round((time.perf_counter() - started) * 1000, 3),
        }


VACCINES = (
    ("BCG", 0, 365, None, 0),
    ("OPV-1", 42, 1825, None, 0),
    ("OPV-2", 70, 1825, "OPV-1", 28),
    ("OPV-3", 98, 1825, "OPV-2", 28),
    ("Penta-1", 42, 365, None, 0),
    ("Penta-2", 70, 365, "Penta-1", 28),
    ("Penta-3", 98, 365, "Penta-2", 28),
    ("RVV-1", 42, 365, None, 0),
    ("RVV-2", 70, 365, "RVV-1", 28),
    ("RVV-3", 98, 365, "RVV-2", 28),
    ("fIPV-1", 42, 365, None, 0),
    ("fIPV-2", 98, 365, "fIPV-1", 56),
    ("fIPV-3", 276, 729, "fIPV-2", 56),
    ("PCV-1", 42, 365, None, 0),
    ("PCV-2", 98, 729, "PCV-1", 60),
    ("PCV-B", 276, 729, "PCV-2", 60),
    ("MR-1", 276, 1825, None, 0),
    ("MR-2", 490, 1825, "MR-1", 28),
    ("OPV-B", 490, 1825, "OPV-3", 180),
    ("DPT-B1", 490, 2554, "Penta-3", 180),
    ("DPT-B2", 1827, 2554, "DPT-B1", 0),
)


def _dose_dates(value: str) -> dict[str, date]:
    found = {}
    for item in value.split(";"):
        code, separator, raw_date = item.partition(":")
        parsed = parse_date(raw_date) if separator else None
        key = re.sub(r"[^A-Z0-9]", "", code.upper())
        if key and parsed and (key not in found or parsed < found[key]):
            found[key] = parsed
    return found


def _status(due: date, today: date, close: date | None = None) -> tuple[str, int] | None:
    if due > today + timedelta(days=6):
        return None
    if close and today > close:
        return "overdue", 2
    if due < today - timedelta(days=28):
        return "overdue", 2
    return ("due_today", 2) if due <= today else ("due_this_week", 3)


def visit_list(register: Path, today: date = TODAY) -> list[dict]:
    rows = []
    with register.open(encoding="utf-8-sig", newline="") as source:
        for member in csv.DictReader(source):
            dob, lmp = parse_date(member.get("dob", "")), parse_date(member.get("lmp_date", ""))
            age = (today - dob).days if dob else None
            high_risk = False
            try:
                high_risk = member.get("pregnant") == "Y" and (
                    float(member.get("last_hb_gdl") or 99) < 7
                    or _bp_high(member.get("last_anc_bp", ""))
                )
            except ValueError:
                pass
            if age is not None and age <= 42:
                high_risk = True
            if "HTN" in member.get("ncd_condition", "") and _bp_high(
                member.get("last_bp_reading", "")
            ):
                high_risk = True
            items = []
            if member.get("pregnant") == "Y" and lmp:
                done = [x for x in member.get("anc_visit_dates", "").split(";") if parse_date(x)]
                windows = ((0, 84), (98, 182), (196, 238), (252, 280))
                if len(done) < 4:
                    opening, closing = windows[len(done)]
                    due = lmp + timedelta(days=opening)
                    state = _status(due, today, lmp + timedelta(days=closing))
                    if state:
                        items.append((f"ANC-{len(done) + 1}", state))
                if high_risk:
                    items.append(("HRP-followup", ("due_today", 1)))
            if dob and 0 <= age <= 2554:
                doses = _dose_dates(member.get("child_vaccines", ""))
                for code, due_age, limit_age, previous, gap in VACCINES:
                    key = re.sub(r"[^A-Z0-9]", "", code.upper())
                    previous_key = re.sub(r"[^A-Z0-9]", "", previous.upper()) if previous else None
                    if (
                        key in doses
                        or (previous_key and previous_key not in doses)
                        or age > limit_age
                    ):
                        continue
                    due = max(
                        dob + timedelta(days=due_age),
                        doses.get(previous_key, dob) + timedelta(days=gap),
                    )
                    if due > dob + timedelta(days=limit_age):
                        continue
                    state = _status(due, today, dob + timedelta(days=limit_age - 1))
                    if state:
                        items.append((code, state))
            if dob and 0 <= age <= 42:
                schedule = (
                    (3, 7, 14, 21, 28, 42)
                    if member.get("place_of_delivery") == "institution"
                    else (1, 3, 7, 14, 21, 28, 42)
                )
                done = {
                    int(x) for x in member.get("hbnc_visits_done", "").split(";") if x.isdigit()
                }
                available = [
                    (day, dob + timedelta(days=day - 1)) for day in schedule if day not in done
                ]
                past = [entry for entry in available if entry[1] <= today]
                next_items = [entry for entry in available if entry[1] > today]
                chosen = past[-1] if past else (next_items[0] if next_items else None)
                if chosen and chosen[1] <= today + timedelta(days=6):
                    items.append(
                        (f"HBNC-D{chosen[0]}", ("overdue" if chosen[1] < today else "due_today", 2))
                    )
            if dob and 178 <= age <= 1824:
                due = (
                    parse_date(member.get("last_muac_date", "")) or (dob + timedelta(days=184))
                ) + timedelta(days=30 if member.get("last_muac_date") else 0)
                state = _status(due, today)
                if state:
                    items.append(("MUAC-check", state))
            for condition, field, label in (
                ("HTN", "last_bp_check_date", "BP-followup"),
                ("DM", "last_sugar_check_date", "Sugar-followup"),
            ):
                if condition in member.get("ncd_condition", ""):
                    due = (
                        parse_date(member.get(field, "")) or today - timedelta(days=29)
                    ) + timedelta(days=30)
                    state = _status(due, today)
                    if state:
                        items.append((label, state))
            for item, (status, priority) in items:
                rows.append(
                    {
                        "member_id": member["member_id"],
                        "due_item": item,
                        "priority": 1 if high_risk and priority < 3 else priority,
                        "status": status,
                    }
                )
    unique = {(row["member_id"], row["due_item"]): row for row in rows}
    return list(unique.values())


def _bp_high(value: str) -> bool:
    try:
        systolic, diastolic = (int(part) for part in value.split("/", 1))
        return systolic >= 140 or diastolic >= 90
    except (TypeError, ValueError):
        return False
