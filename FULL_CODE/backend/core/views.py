"""Compatibility exports for the domain-organized API views."""

from .api_views.affiliations import affiliation_collection, approve_affiliation, reject_affiliation
from .api_views.analytics import insights_overview, stats_overview
from .api_views.auth import (
    auth_session,
    csrf_token,
    email_password_login,
    request_phone_otp,
    role_logout,
    verify_phone_otp,
)
from .api_views.clinical import inventory_collection, registers_collection
from .api_views.common import api_login_required
from .api_views.facilities import facility_collection, facility_me
from .api_views.notifications import mark_notification_read, notification_collection
from .api_views.other import companion_answer, companion_visit_list, dashboard, seed_dynamic_data
from .api_views.reports import download_report, report_collection
from .api_views.schedules import schedule_collection, schedule_detail
from .api_views.staff import staff_collection, staff_detail
from .api_views.villages import village_collection

__all__ = [
    "affiliation_collection",
    "api_login_required",
    "approve_affiliation",
    "auth_session",
    "companion_answer",
    "companion_visit_list",
    "csrf_token",
    "dashboard",
    "download_report",
    "email_password_login",
    "facility_collection",
    "facility_me",
    "insights_overview",
    "inventory_collection",
    "mark_notification_read",
    "notification_collection",
    "registers_collection",
    "reject_affiliation",
    "report_collection",
    "request_phone_otp",
    "role_logout",
    "schedule_collection",
    "schedule_detail",
    "seed_dynamic_data",
    "staff_collection",
    "staff_detail",
    "stats_overview",
    "verify_phone_otp",
    "village_collection",
]
