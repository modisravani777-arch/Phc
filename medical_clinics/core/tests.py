import json
import re
import uuid
from datetime import date

from django.contrib.auth.models import User
from django.db import connection
from django.test import TestCase, override_settings

from .models import (
    Asha,
    DangerEscalation,
    FacilityAshaAssignment,
    FacilityLoginIdentity,
    FacilityProfile,
    FacilityReport,
    Household,
    Member,
    NeonUser,
    PhoneLoginChallenge,
    VisitOutcome,
)


class NeonBackedTestCase(TestCase):
    @classmethod
    def setUpClass(cls):
        table_names = set(connection.introspection.table_names())
        cls.created_neon_models = [
            model for model in (
                Asha,
                Household,
                Member,
                NeonUser,
                DangerEscalation,
                VisitOutcome,
            )
            if model._meta.db_table not in table_names
        ]
        with connection.schema_editor() as schema_editor:
            for model in cls.created_neon_models:
                schema_editor.create_model(model)
        super().setUpClass()

    @classmethod
    def tearDownClass(cls):
        super().tearDownClass()
        with connection.schema_editor() as schema_editor:
            for model in reversed(cls.created_neon_models):
                schema_editor.delete_model(model)

    def authenticate_identity(self, identity):
        self.client.force_login(identity.account)
        session = self.client.session
        session["facility_role"] = identity.facility.facility_type
        session["facility_login_identity_id"] = identity.pk
        session.save()


class FacilityRoleTests(NeonBackedTestCase):
    def test_legacy_authenticated_account_without_phone_mapping_is_denied(self):
        user = User.objects.create_user(username="legacy_user", password=None)
        self.client.force_login(user)

        response = self.client.get("/api/facilities/")
        session = self.client.get("/api/auth/session/")

        self.assertEqual(response.status_code, 401)
        self.assertEqual(session.status_code, 200)
        self.assertFalse(session.json()["authenticated"])

    def test_password_login_api_is_removed(self):
        response = self.client.post(
            "/api/auth/login/",
            data=json.dumps({"username": "legacy_user", "password": "unused", "role": "PHC"}),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 404)


@override_settings(DEBUG=True)
class EmailPasswordLoginTests(NeonBackedTestCase):
    def setUp(self):
        self.account = User.objects.create_user(
            username="demo.phc@example.test",
            email="demo.phc@example.test",
            password="TestDemoPassword#1",
        )
        self.facility = FacilityProfile.objects.create(
            facility_code="PHC-0000000009",
            name="Demo Primary Health Centre",
            facility_type="PHC",
            district="Test district",
            state="Test state",
            account=self.account,
        )

    def test_email_password_login_opens_only_the_linked_facility_session(self):
        response = self.client.post(
            "/api/auth/email-login/",
            data=json.dumps({
                "email": "DEMO.PHC@example.test",
                "password": "TestDemoPassword#1",
                "role": "PHC",
            }),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["username"], "demo.phc@example.test")
        self.assertEqual(response.json()["facility"]["id"], str(self.facility.id))
        self.assertTrue(self.client.get("/api/auth/session/").json()["authenticated"])
        self.assertEqual(self.client.get("/api/facilities/").status_code, 200)

    def test_email_login_rejects_wrong_role_and_wrong_password(self):
        wrong_role = self.client.post(
            "/api/auth/email-login/",
            data=json.dumps({
                "email": "demo.phc@example.test",
                "password": "TestDemoPassword#1",
                "role": "SUBCENTRE",
            }),
            content_type="application/json",
        )
        wrong_password = self.client.post(
            "/api/auth/email-login/",
            data=json.dumps({
                "email": "demo.phc@example.test",
                "password": "incorrect",
                "role": "PHC",
            }),
            content_type="application/json",
        )

        self.assertEqual(wrong_role.status_code, 401)
        self.assertEqual(wrong_password.status_code, 401)

    def test_email_password_login_is_disabled_outside_debug_mode(self):
        with self.settings(DEBUG=False):
            response = self.client.post(
                "/api/auth/email-login/",
                data=json.dumps({
                    "email": "demo.phc@example.test",
                    "password": "TestDemoPassword#1",
                    "role": "PHC",
                }),
                content_type="application/json",
            )
        self.assertEqual(response.status_code, 503)


@override_settings(DEBUG=True)
class PhoneOtpTests(NeonBackedTestCase):
    def setUp(self):
        self.neon_user = NeonUser.objects.create(
            id=uuid.uuid4(),
            email="medical.officer@example.test",
            full_name="Test Medical Officer",
            role="MEDICAL_OFFICER",
            phone="+91 9876543210",
        )
        self.account = User.objects.create_user(username="otp-account", password=None)
        facility = FacilityProfile.objects.create(
            facility_code="PHC-0000000001",
            name="Sample PHC",
            facility_type="PHC",
            district="Test district",
            state="Test state",
        )
        FacilityLoginIdentity.objects.create(
            neon_user=self.neon_user,
            account=self.account,
            facility=facility,
        )

    def request_code(self, role="PHC"):
        with self.assertLogs("core.views", level="WARNING") as captured:
            response = self.client.post(
                "/api/auth/otp/request/",
                data=json.dumps({"phone": "9876543210", "role": role}),
                content_type="application/json",
            )
        match = re.search(r": ([0-9]{6})$", captured.output[-1])
        self.assertIsNotNone(match)
        return response, match.group(1)

    def test_verified_phone_otp_opens_the_mapped_facility_session(self):
        response, otp = self.request_code()
        self.assertEqual(response.status_code, 200)

        verified = self.client.post(
            "/api/auth/otp/verify/",
            data=json.dumps({
                "phone": "+91 (987) 654-3210",
                "otp": otp,
                "role": "PHC",
            }),
            content_type="application/json",
        )
        self.assertEqual(verified.status_code, 200)
        self.assertEqual(verified.json()["username"], "Test Medical Officer")
        self.assertEqual(verified.json()["facility"]["name"], "Sample PHC")

        session = self.client.get("/api/auth/session/")
        self.assertEqual(session.status_code, 200)
        self.assertTrue(session.json()["authenticated"])
        self.assertEqual(session.json()["role"], "PHC")

        replay = self.client.post(
            "/api/auth/otp/verify/",
            data=json.dumps({
                "phone": "9876543210",
                "otp": otp,
                "role": "PHC",
            }),
            content_type="application/json",
        )
        self.assertEqual(replay.status_code, 401)

    def test_unmapped_or_wrong_role_phone_does_not_receive_a_challenge(self):
        identity = FacilityLoginIdentity.objects.get(neon_user=self.neon_user)
        identity.delete()

        response = self.client.post(
            "/api/auth/otp/request/",
            data=json.dumps({
                "phone": "9876543210",
                "role": "PHC",
            }),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(PhoneLoginChallenge.objects.count(), 0)

        FacilityLoginIdentity.objects.create(
            neon_user=self.neon_user,
            account=self.account,
            facility=FacilityProfile.objects.get(facility_code="PHC-0000000001"),
        )
        wrong_role = self.client.post(
            "/api/auth/otp/request/",
            data=json.dumps({
                "phone": "9876543210",
                "role": "SUBCENTRE",
            }),
            content_type="application/json",
        )
        self.assertEqual(wrong_role.status_code, 200)
        self.assertEqual(PhoneLoginChallenge.objects.count(), 0)

    def test_otp_is_rate_limited_and_invalid_attempts_consume_the_challenge(self):
        _, otp = self.request_code()
        second_request = self.client.post(
            "/api/auth/otp/request/",
            data=json.dumps({"phone": "9876543210", "role": "PHC"}),
            content_type="application/json",
        )
        self.assertEqual(second_request.status_code, 200)
        self.assertEqual(PhoneLoginChallenge.objects.count(), 1)

        wrong_otp = "000000" if otp != "000000" else "000001"
        for _ in range(5):
            rejected = self.client.post(
                "/api/auth/otp/verify/",
                data=json.dumps({"phone": "9876543210", "otp": wrong_otp, "role": "PHC"}),
                content_type="application/json",
            )
            self.assertEqual(rejected.status_code, 401)

        challenge = PhoneLoginChallenge.objects.get()
        self.assertEqual(challenge.failed_attempts, 5)
        self.assertIsNotNone(challenge.consumed_at)

    def test_phone_change_invalidates_an_otp_requested_for_the_previous_number(self):
        _, otp = self.request_code()
        self.neon_user.phone = "+91 9876543211"
        self.neon_user.save(update_fields=["phone"])

        response = self.client.post(
            "/api/auth/otp/verify/",
            data=json.dumps({
                "phone": "9876543211",
                "otp": otp,
                "role": "PHC",
            }),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 401)
        self.assertFalse(response.json().get("authenticated", False))

    def test_dashboard_stats_and_analytics_load_with_assigned_asha_data(self):
        asha = Asha.objects.create(
            asha_id="asha-test-01",
            asha_name="Test ASHA",
            villages="Test Village",
        )
        household = Household.objects.create(
            household_id="household-test-01",
            village="Test Village",
            asha=asha,
            members_count=1,
        )
        Member.objects.create(
            member_id="member-test-01",
            household=household,
            asha=asha,
            name="Test Resident",
            village="Test Village",
            pregnant="Y",
        )
        identity = FacilityLoginIdentity.objects.get(neon_user=self.neon_user)
        FacilityAshaAssignment.objects.create(facility=identity.facility, asha=asha)
        self.authenticate_identity(identity)

        stats = self.client.get("/api/stats/")
        analytics = self.client.get("/api/analytics/")

        self.assertEqual(stats.status_code, 200)
        self.assertEqual(stats.json()["kpis"]["total_villages"], 1)
        self.assertEqual(analytics.status_code, 200)
        self.assertEqual(analytics.json()["by_village"], [{
            "name": "Test Village",
            "families": 1,
            "members": 1,
            "pregnancies": 1,
        }])


class ScheduleAndReportTests(NeonBackedTestCase):
    def setUp(self):
        self.phc_user = User.objects.create_user(username="phc_user", password="StrongPass123!")
        self.phc_neon_user = NeonUser.objects.create(
            id=uuid.uuid4(),
            email="phc@example.test",
            full_name="PHC User",
            role="MEDICAL_OFFICER",
            phone="+91 9876543210",
        )
        self.phc = FacilityProfile.objects.create(
            facility_code="PHC-0000000001",
            name="Central PHC",
            facility_type="PHC",
            district="Test district",
            state="Test state",
            account=self.phc_user,
        )
        self.phc_identity = FacilityLoginIdentity.objects.create(
            neon_user=self.phc_neon_user,
            account=self.phc_user,
            facility=self.phc,
        )
        self.subcentre_user = User.objects.create_user(username="sc_user", password="StrongPass123!")
        self.subcentre_neon_user = NeonUser.objects.create(
            id=uuid.uuid4(),
            email="subcentre@example.test",
            full_name="Sub-Centre User",
            role="SUPERVISOR",
            phone="+91 9876543211",
        )
        self.subcentre = FacilityProfile.objects.create(
            facility_code="SC-0000000001",
            name="River Sub-Centre",
            facility_type="SUBCENTRE",
            district="Test district",
            state="Test state",
            account=self.subcentre_user,
            parent_phc=self.phc,
        )
        self.subcentre_identity = FacilityLoginIdentity.objects.create(
            neon_user=self.subcentre_neon_user,
            account=self.subcentre_user,
            facility=self.subcentre,
        )

    def test_schedule_can_be_added_updated_and_deleted(self):
        self.authenticate_identity(self.subcentre_identity)
        created = self.client.post(
            "/api/schedules/",
            data=json.dumps({
                "title": "Village health camp",
                "schedule_type": "MEDICAL_CAMP",
                "date": "2026-11-05",
                "start_time": "09:00",
                "end_time": "13:00",
                "location": "Community hall",
            }),
            content_type="application/json",
        )
        self.assertEqual(created.status_code, 201)
        schedule_id = created.json()["schedule"]["id"]

        selected_date = self.client.get("/api/schedules/?date=2026-11-05")
        self.assertEqual(len(selected_date.json()["results"]), 1)

        updated = self.client.put(
            f"/api/schedules/{schedule_id}/",
            data=json.dumps({
                "title": "Updated health camp",
                "schedule_type": "MEDICAL_CAMP",
                "date": "2026-11-05",
                "start_time": "10:00",
                "end_time": "13:00",
                "location": "Community hall",
            }),
            content_type="application/json",
        )
        self.assertEqual(updated.status_code, 200)
        self.assertEqual(updated.json()["schedule"]["title"], "Updated health camp")

        deleted = self.client.delete(f"/api/schedules/{schedule_id}/")
        self.assertEqual(deleted.status_code, 200)
        self.assertEqual(self.client.get("/api/schedules/").json()["results"], [])

    def test_phc_can_download_affiliated_subcentre_report(self):
        report = FacilityReport.objects.create(
            facility=self.subcentre,
            title="Monthly family report",
            period_start=date(2026, 10, 1),
            period_end=date(2026, 10, 31),
            payload={
                "summary": {
                    "asha_workers": 2,
                    "villages": 3,
                    "families": 18,
                    "members": 64,
                    "pregnancies": 4,
                    "immunization_records": 12,
                    "ncd_records": 5,
                },
                "by_asha": [],
                "by_village": [],
            },
        )

        self.authenticate_identity(self.phc_identity)
        response = self.client.get(f"/api/reports/{report.id}/download/")

        self.assertEqual(response.status_code, 200)
        self.assertIn("River Sub-Centre", response.content.decode())
        self.assertIn("Families: 18", response.content.decode())
        self.assertIn("text/plain", response["Content-Type"])
