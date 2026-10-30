from django.urls import path

from . import views

urlpatterns = [
    path("dashboard/", views.dashboard, name="dashboard"),
    path("auth/csrf/", views.csrf_token, name="csrf-token"),
    path("auth/otp/request/", views.request_phone_otp, name="request-phone-otp"),
    path("auth/otp/verify/", views.verify_phone_otp, name="verify-phone-otp"),
    path("auth/email-login/", views.email_password_login, name="email-password-login"),
    path("auth/session/", views.auth_session, name="auth-session"),
    path("auth/logout/", views.role_logout, name="role-logout"),
    path("facilities/", views.facility_collection, name="facilities"),
    path("facilities/me/", views.facility_me, name="facility-me"),
    path("analytics/", views.insights_overview, name="analytics"),
    path("schedules/", views.schedule_collection, name="schedules"),
    path("schedules/<uuid:schedule_id>/", views.schedule_detail, name="schedule-detail"),
    path("staff/", views.staff_collection, name="staff"),
    path("staff/<uuid:staff_id>/", views.staff_detail, name="staff-detail"),
    path("reports/", views.report_collection, name="reports"),
    path("reports/<uuid:report_id>/download/", views.download_report, name="download-report"),
    path("affiliations/", views.affiliation_collection, name="affiliations"),
    path(
        "affiliations/<int:affiliation_id>/approve/",
        views.approve_affiliation,
        name="approve-affiliation",
    ),
    path(
        "affiliations/<int:affiliation_id>/reject/",
        views.reject_affiliation,
        name="reject-affiliation",
    ),
    path("notifications/", views.notification_collection, name="notifications"),
    path(
        "notifications/<int:notification_id>/read/",
        views.mark_notification_read,
        name="notification-read",
    ),
    # Dynamic clinical, inventory, catchment & dashboard endpoints
    path("registers/", views.registers_collection, name="registers"),
    path("inventory/", views.inventory_collection, name="inventory"),
    path("villages/", views.village_collection, name="villages"),
    path("stats/", views.stats_overview, name="stats"),
    path("seed/", views.seed_dynamic_data, name="seed"),
    path("companion/answer/", views.companion_answer, name="companion-answer"),
    path("companion/visit-list/", views.companion_visit_list, name="companion-visit-list"),
]
