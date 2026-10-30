import uuid
from django.conf import settings
from django.db import models
from django.utils import timezone


# =========================================================================
# 1. Exact Pre-Existing Neon PostgreSQL Tables (Live Synchronized)
# =========================================================================

class Asha(models.Model):
    asha_id = models.CharField(max_length=64, primary_key=True)
    asha_name = models.CharField(max_length=200)
    villages = models.TextField()
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'ashas'
        managed = False
        ordering = ['asha_name']

    def __str__(self):
        return f"{self.asha_name} ({self.asha_id})"


class Household(models.Model):
    household_id = models.CharField(max_length=64, primary_key=True)
    village = models.CharField(max_length=200)
    asha = models.ForeignKey(Asha, on_delete=models.CASCADE, db_column='asha_id', related_name='households')
    house_no = models.CharField(max_length=64, blank=True, null=True)
    head_member_id = models.CharField(max_length=64, blank=True, null=True)
    head_name = models.CharField(max_length=200, blank=True, null=True)
    members_count = models.IntegerField(default=1)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'households'
        managed = False
        ordering = ['village', 'house_no']

    def __str__(self):
        return f"{self.household_id} - {self.head_name} ({self.village})"


class Member(models.Model):
    member_id = models.CharField(max_length=64, primary_key=True)
    household = models.ForeignKey(Household, on_delete=models.CASCADE, db_column='household_id', related_name='members')
    village = models.CharField(max_length=200, blank=True, null=True)
    asha = models.ForeignKey(Asha, on_delete=models.CASCADE, db_column='asha_id', related_name='members')
    name = models.CharField(max_length=200)
    relation = models.CharField(max_length=64, blank=True, null=True)
    sex = models.CharField(max_length=10, blank=True, null=True)
    dob = models.CharField(max_length=30, blank=True, null=True)

    # Maternal / Antenatal Care (ANC) Fields
    pregnant = models.CharField(max_length=20, blank=True, null=True)
    lmp_date = models.CharField(max_length=30, blank=True, null=True)
    edd = models.CharField(max_length=30, blank=True, null=True)
    anc_visit_dates = models.TextField(blank=True, null=True)
    last_anc_bp = models.CharField(max_length=30, blank=True, null=True)
    last_hb_gdl = models.CharField(max_length=30, blank=True, null=True)
    td_booster_eligible = models.CharField(max_length=20, blank=True, null=True)
    td_doses = models.CharField(max_length=30, blank=True, null=True)
    place_of_delivery = models.CharField(max_length=100, blank=True, null=True)
    birth_weight_kg = models.CharField(max_length=20, blank=True, null=True)
    hbnc_visits_done = models.CharField(max_length=20, blank=True, null=True)

    # Child Immunization & Nutrition
    child_vaccines = models.TextField(blank=True, null=True)
    last_muac_cm = models.CharField(max_length=20, blank=True, null=True)
    last_muac_date = models.CharField(max_length=30, blank=True, null=True)
    bilateral_pitting_oedema = models.CharField(max_length=20, blank=True, null=True)

    # Non-Communicable Disease (NCD)
    ncd_condition = models.CharField(max_length=100, blank=True, null=True)
    last_bp_check_date = models.CharField(max_length=30, blank=True, null=True)
    last_bp_reading = models.CharField(max_length=30, blank=True, null=True)
    last_sugar_check_date = models.CharField(max_length=30, blank=True, null=True)
    last_rbs_mg_dl = models.CharField(max_length=30, blank=True, null=True)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'members'
        managed = False
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.member_id})"


class Protocol(models.Model):
    section_id = models.CharField(max_length=64, primary_key=True)
    category = models.CharField(max_length=64)
    title = models.TextField()
    text = models.TextField()
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'protocols'
        managed = False
        ordering = ['section_id']

    def __str__(self):
        return f"{self.section_id} - {self.title}"


class NeonUser(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    email = models.CharField(max_length=255, unique=True)
    full_name = models.CharField(max_length=255)
    role = models.CharField(max_length=64)
    assigned_asha = models.ForeignKey(Asha, null=True, blank=True, on_delete=models.SET_NULL, db_column='assigned_asha_id')
    assigned_facility = models.CharField(max_length=255, default='Chandrapuri CHC')
    phone = models.CharField(max_length=32, blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'users'
        managed = False
        ordering = ['full_name']

    def __str__(self):
        return f"{self.full_name} ({self.role})"


class DangerEscalation(models.Model):
    escalation_id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    asha = models.ForeignKey(Asha, on_delete=models.CASCADE, db_column='asha_id', related_name='escalations')
    member_id = models.CharField(max_length=64, blank=True, null=True)
    patient_name = models.CharField(max_length=255, blank=True, null=True)
    village = models.CharField(max_length=200, blank=True, null=True)
    query_text = models.TextField()
    danger_signs = models.TextField()
    cited_section = models.CharField(max_length=64, blank=True, null=True)
    urgency_level = models.CharField(max_length=64, default='CRITICAL_108')
    status = models.CharField(max_length=64, default='PENDING_TRIAGE')
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'danger_escalations'
        managed = False
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.patient_name} - {self.danger_signs}"


class VisitOutcome(models.Model):
    outcome_id = models.CharField(max_length=64, primary_key=True)
    household = models.ForeignKey(Household, null=True, blank=True, on_delete=models.SET_NULL, db_column='household_id')
    member = models.ForeignKey(Member, null=True, blank=True, on_delete=models.SET_NULL, db_column='member_id')
    member_name = models.CharField(max_length=200, blank=True, null=True)
    asha = models.ForeignKey(Asha, null=True, blank=True, on_delete=models.SET_NULL, db_column='asha_id')
    due_item = models.CharField(max_length=100)
    status = models.CharField(max_length=64)
    notes = models.TextField(blank=True, null=True)
    recorded_at_epoch = models.BigIntegerField()
    synced_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'visit_outcomes'
        managed = False


# =========================================================================
# 2. Synchronized Relational Application Models
# =========================================================================

class FacilityProfile(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    facility_code = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=200)
    facility_type = models.CharField(max_length=20, choices=[('PHC', 'PHC'), ('SUBCENTRE', 'Sub-Centre'), ('CHC', 'CHC')], default='PHC')
    block = models.CharField(max_length=100, default='Chandrapuri')
    district = models.CharField(max_length=100, default='Varanasi')
    state = models.CharField(max_length=100, default='Uttar Pradesh')
    assigned_doctor = models.CharField(max_length=200, default='Dr. Anand Sharma (Medical Officer)')
    address = models.TextField(blank=True)
    location = models.CharField(max_length=200, blank=True)
    contact_phone = models.CharField(max_length=32, blank=True)
    contact_email = models.EmailField(blank=True)
    account = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='facility_profile',
    )
    parent_phc = models.ForeignKey(
        'self',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='sub_centres',
        limit_choices_to={'facility_type': 'PHC'},
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'clinic_facility_profiles'
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.facility_code})"


class FacilityLoginIdentity(models.Model):
    neon_user = models.OneToOneField(
        NeonUser,
        on_delete=models.DO_NOTHING,
        db_constraint=False,
        related_name='facility_login_identity',
    )
    account = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name='facility_login_identity',
    )
    facility = models.ForeignKey(
        FacilityProfile,
        on_delete=models.CASCADE,
        related_name='login_identities',
        limit_choices_to={'facility_type__in': ['PHC', 'SUBCENTRE']},
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'clinic_facility_login_identities'
        ordering = ['facility__name', 'neon_user__full_name']

    def __str__(self):
        return f"{self.neon_user.full_name} - {self.facility.name}"


class PhoneLoginChallenge(models.Model):
    neon_user = models.ForeignKey(
        NeonUser,
        on_delete=models.DO_NOTHING,
        db_constraint=False,
        db_index=False,
        related_name='phone_login_challenges',
    )
    role = models.CharField(max_length=20, choices=[('PHC', 'PHC'), ('SUBCENTRE', 'Sub-Centre')])
    otp_hash = models.CharField(max_length=128)
    phone_hash = models.CharField(max_length=128)
    expires_at = models.DateTimeField()
    failed_attempts = models.PositiveSmallIntegerField(default=0)
    consumed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'clinic_phone_login_challenges'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['neon_user', 'created_at'], name='phone_login_user_created_idx'),
        ]


class FacilityIdentifier(models.Model):
    facility = models.OneToOneField(
        FacilityProfile,
        on_delete=models.CASCADE,
        related_name='identifier',
    )
    identification_number = models.CharField(max_length=32, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'clinic_facility_identifiers'
        ordering = ['identification_number']


class FacilityAshaAssignment(models.Model):
    facility = models.ForeignKey(
        FacilityProfile,
        on_delete=models.CASCADE,
        related_name='asha_assignments',
    )
    asha = models.ForeignKey(
        Asha,
        on_delete=models.CASCADE,
        related_name='facility_assignments',
    )
    assigned_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'clinic_facility_asha_assignments'
        constraints = [
            models.UniqueConstraint(fields=['facility', 'asha'], name='unique_facility_asha_assignment'),
        ]


class FacilityReport(models.Model):
    STATUS_CHOICES = [
        ('DRAFT', 'Draft'),
        ('SUBMITTED', 'Submitted'),
        ('APPROVED', 'Approved'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    facility = models.ForeignKey(FacilityProfile, on_delete=models.CASCADE, related_name='reports')
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='facility_reports',
    )
    title = models.CharField(max_length=200)
    period_start = models.DateField()
    period_end = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='SUBMITTED')
    payload = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'clinic_facility_reports'
        ordering = ['-created_at']


class FacilitySchedule(models.Model):
    SCHEDULE_TYPES = [
        ('MEDICAL_CAMP', 'Medical camp'),
        ('APPOINTMENT', 'Appointment'),
        ('MEETING', 'Meeting'),
        ('OTHER', 'Other'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    facility = models.ForeignKey(FacilityProfile, on_delete=models.CASCADE, related_name='schedules')
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
    )
    title = models.CharField(max_length=200)
    schedule_type = models.CharField(max_length=20, choices=SCHEDULE_TYPES, default='OTHER')
    scheduled_date = models.DateField()
    start_time = models.TimeField(null=True, blank=True)
    end_time = models.TimeField(null=True, blank=True)
    location = models.CharField(max_length=200, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'clinic_facility_schedules'
        ordering = ['scheduled_date', 'start_time', 'title']


class FacilityVillage(models.Model):
    facility = models.ForeignKey(FacilityProfile, on_delete=models.CASCADE, related_name='villages')
    name = models.CharField(max_length=200)
    gram_panchayat = models.CharField(max_length=200, blank=True)
    total_population = models.PositiveIntegerField(default=0)
    total_households = models.PositiveIntegerField(default=0)
    eligible_couples = models.PositiveIntegerField(default=0)
    target_anc = models.PositiveIntegerField(default=0)
    children_under_5 = models.PositiveIntegerField(default=0)
    assigned_asha = models.CharField(max_length=200, blank=True)
    assigned_anm = models.CharField(max_length=200, blank=True)
    immunization_coverage_pct = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    distance_from_centre_km = models.DecimalField(max_digits=6, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'clinic_facility_villages'
        ordering = ['name']
        constraints = [
            models.UniqueConstraint(fields=['facility', 'name'], name='unique_facility_village_name'),
        ]


class ClinicalVisit(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    visit_code = models.CharField(max_length=64, unique=True)
    member = models.ForeignKey(Member, on_delete=models.CASCADE, related_name='clinical_visits')
    asha = models.ForeignKey(Asha, on_delete=models.CASCADE, related_name='clinical_visits')
    household = models.ForeignKey(Household, null=True, blank=True, on_delete=models.SET_NULL, related_name='clinical_visits')
    facility = models.ForeignKey(FacilityProfile, null=True, blank=True, on_delete=models.SET_NULL, related_name='clinical_visits')
    service_type = models.CharField(
        max_length=30,
        choices=[
            ('ANC', 'Antenatal Care'),
            ('PNC', 'Postnatal Care'),
            ('IMMUNIZATION', 'Universal Immunization'),
            ('NCD_SCREENING', 'NCD Screening'),
            ('GENERAL_OPD', 'General OPD'),
            ('EMERGENCY_TRIAGE', 'Emergency Triage'),
        ],
        default='ANC'
    )
    visit_date = models.DateField(default=timezone.now)
    vitals = models.JSONField(default=dict, blank=True)
    clinical_notes = models.TextField(blank=True)
    prescribed_medicines = models.TextField(blank=True)
    status = models.CharField(max_length=30, default='COMPLETED')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'clinic_clinical_visits'
        ordering = ['-visit_date', '-created_at']

    def __str__(self):
        return f"{self.visit_code} - {self.member.name} ({self.service_type})"


class MedicalInventory(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    item_code = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=200)
    category = models.CharField(max_length=50, choices=[
        ('MEDICINE', 'Essential Medicine'),
        ('VACCINE', 'Cold-Chain Vaccine'),
        ('DIAGNOSTIC_KIT', 'Diagnostic Kit'),
        ('CONSUMABLE', 'Medical Consumable'),
        ('EQUIPMENT', 'Clinical Equipment'),
    ], default='MEDICINE')
    batch_number = models.CharField(max_length=50)
    quantity = models.PositiveIntegerField(default=0)
    unit = models.CharField(max_length=50, default='Tablets')
    reorder_level = models.PositiveIntegerField(default=50)
    expiry_date = models.DateField(null=True, blank=True)
    storage_location = models.CharField(max_length=100, default='General Dispensary')
    facility = models.ForeignKey(FacilityProfile, null=True, blank=True, on_delete=models.SET_NULL, related_name='inventory_items')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'clinic_medical_inventory'
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.quantity} {self.unit})"
