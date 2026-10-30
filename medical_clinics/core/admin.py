import uuid

from django.contrib import admin
from django.contrib.auth import get_user_model
from django.db import transaction
from .models import (
    Asha, Household, Member, Protocol, NeonUser, DangerEscalation,
    VisitOutcome, FacilityProfile, FacilityLoginIdentity, FacilityIdentifier, FacilityAshaAssignment, FacilityAffiliation, FacilityNotification, FacilityReport,
    FacilitySchedule, FacilityVillage, ClinicalVisit, MedicalInventory,
)

@admin.register(Asha)
class AshaAdmin(admin.ModelAdmin):
    list_display = ('asha_id', 'asha_name', 'villages', 'created_at')
    search_fields = ('asha_id', 'asha_name', 'villages')

@admin.register(Household)
class HouseholdAdmin(admin.ModelAdmin):
    list_display = ('household_id', 'head_name', 'village', 'asha', 'members_count', 'house_no')
    list_filter = ('village', 'asha')
    search_fields = ('household_id', 'head_name', 'village')

@admin.register(Member)
class MemberAdmin(admin.ModelAdmin):
    list_display = ('member_id', 'name', 'sex', 'dob', 'village', 'asha', 'pregnant', 'ncd_condition')
    list_filter = ('village', 'asha', 'pregnant', 'ncd_condition')
    search_fields = ('member_id', 'name', 'village')

@admin.register(DangerEscalation)
class DangerEscalationAdmin(admin.ModelAdmin):
    list_display = ('escalation_id', 'patient_name', 'village', 'asha', 'urgency_level', 'status', 'created_at')
    list_filter = ('urgency_level', 'status', 'village')
    search_fields = ('patient_name', 'danger_signs', 'query_text')

@admin.register(Protocol)
class ProtocolAdmin(admin.ModelAdmin):
    list_display = ('section_id', 'category', 'title')
    list_filter = ('category',)
    search_fields = ('section_id', 'title', 'text')

@admin.register(NeonUser)
class NeonUserAdmin(admin.ModelAdmin):
    list_display = ('email', 'full_name', 'role', 'assigned_facility', 'assigned_asha')
    list_filter = ('role', 'assigned_facility')
    search_fields = ('email', 'full_name')

@admin.register(FacilityProfile)
class FacilityProfileAdmin(admin.ModelAdmin):
    list_display = ('facility_code', 'name', 'facility_type', 'account', 'parent_phc', 'district', 'state')
    list_filter = ('facility_type', 'is_active')
    search_fields = ('facility_code', 'name', 'account__username')

    def save_model(self, request, obj, form, change):
        super().save_model(request, obj, form, change)
        if not FacilityIdentifier.objects.filter(facility=obj).exists():
            prefix = 'SC' if obj.facility_type == 'SUBCENTRE' else obj.facility_type
            while True:
                code = f"{prefix}-{uuid.uuid4().int % 10_000_000_000:010d}"
                if not FacilityIdentifier.objects.filter(identification_number=code).exists():
                    break
            FacilityIdentifier.objects.create(facility=obj, identification_number=code)


@admin.register(FacilityLoginIdentity)
class FacilityLoginIdentityAdmin(admin.ModelAdmin):
    list_display = ('neon_user', 'masked_phone', 'facility', 'account', 'is_active')
    list_filter = ('facility__facility_type', 'is_active', 'facility')
    search_fields = ('neon_user__email', 'neon_user__full_name', 'facility__name', 'account__username')
    autocomplete_fields = ('neon_user', 'facility')
    readonly_fields = ('account',)

    @transaction.atomic
    def save_model(self, request, obj, form, change):
        if obj.account_id is None:
            user_model = get_user_model()
            internal_username = f"facility-otp-{obj.neon_user_id.hex}"
            account, created = user_model.objects.get_or_create(
                username=internal_username,
                defaults={
                    'first_name': obj.neon_user.full_name[:150],
                    'is_active': True,
                },
            )
            if created:
                account.set_unusable_password()
                account.save(update_fields=['password'])
            obj.account = account
        super().save_model(request, obj, form, change)

    @admin.display(description='Mobile')
    def masked_phone(self, obj):
        digits = ''.join(character for character in obj.neon_user.phone or '' if character.isdigit())
        return f"***-***-{digits[-4:]}" if digits else "Not added"


@admin.register(FacilityIdentifier)
class FacilityIdentifierAdmin(admin.ModelAdmin):
    list_display = ('identification_number', 'facility', 'created_at')
    search_fields = ('identification_number', 'facility__name')

@admin.register(FacilityAshaAssignment)
class FacilityAshaAssignmentAdmin(admin.ModelAdmin):
    list_display = ('facility', 'asha', 'assigned_at')
    list_filter = ('facility',)
    search_fields = ('facility__name', 'asha__asha_name', 'asha__asha_id')

@admin.register(FacilityAffiliation)
class FacilityAffiliationAdmin(admin.ModelAdmin):
    list_display = ('subcentre', 'phc', 'status', 'requested_at', 'decided_at')
    list_filter = ('status', 'phc')
    search_fields = ('subcentre__name', 'phc__name')

@admin.register(FacilityNotification)
class FacilityNotificationAdmin(admin.ModelAdmin):
    list_display = ('facility', 'title', 'is_read', 'created_at', 'read_at')
    list_filter = ('is_read', 'facility')
    search_fields = ('title', 'message', 'facility__name')

@admin.register(FacilityReport)
class FacilityReportAdmin(admin.ModelAdmin):
    list_display = ('title', 'facility', 'period_start', 'period_end', 'status', 'created_at')
    list_filter = ('status', 'facility')
    search_fields = ('title', 'facility__name')

@admin.register(FacilitySchedule)
class FacilityScheduleAdmin(admin.ModelAdmin):
    list_display = ('title', 'facility', 'schedule_type', 'scheduled_date', 'start_time')
    list_filter = ('schedule_type', 'scheduled_date', 'facility')
    search_fields = ('title', 'facility__name', 'location')

@admin.register(FacilityVillage)
class FacilityVillageAdmin(admin.ModelAdmin):
    list_display = ('name', 'facility', 'total_population', 'assigned_asha')
    list_filter = ('facility',)
    search_fields = ('name', 'gram_panchayat', 'assigned_asha')

@admin.register(ClinicalVisit)
class ClinicalVisitAdmin(admin.ModelAdmin):
    list_display = ('visit_code', 'member', 'asha', 'service_type', 'visit_date', 'status')
    list_filter = ('service_type', 'status', 'visit_date')
    search_fields = ('visit_code', 'member__name')

@admin.register(MedicalInventory)
class MedicalInventoryAdmin(admin.ModelAdmin):
    list_display = ('item_code', 'name', 'category', 'quantity', 'unit', 'reorder_level', 'expiry_date')
    list_filter = ('category',)
    search_fields = ('item_code', 'name')
