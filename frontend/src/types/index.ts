export type FacilityType = 'SUBCENTRE' | 'PHC';
export type FacilityRole = FacilityType;

export interface Facility {
  id: string;
  code: string;
  name: string;
  facility_type: FacilityType;
  district: string;
  state: string;
  block: string;
  address: string;
  location: string;
  phone: string;
  email: string;
  phc_code: string;
  phc_name: string;
  is_active: boolean;
}

export interface AuthSession {
  authenticated: boolean;
  username: string;
  role: FacilityRole | null;
  facility: Facility | null;
}

export interface FacilityInsights {
  summary: {
    asha_workers: number;
    families: number;
    members: number;
    pregnancies: number;
    immunization_records: number;
    ncd_records: number;
    villages: number;
  };
  by_asha: Array<{
    id: string;
    name: string;
    families: number;
    members: number;
    pregnancies: number;
    immunization_records: number;
    ncd_records: number;
  }>;
  by_village: Array<{
    name: string;
    families: number;
    members: number;
    pregnancies: number;
  }>;
}

export type ScheduleType = 'MEDICAL_CAMP' | 'APPOINTMENT' | 'MEETING' | 'OTHER';

export interface FacilitySchedule {
  id: string;
  title: string;
  schedule_type: ScheduleType;
  date: string;
  start_time: string;
  end_time: string;
  location: string;
  notes: string;
  facility_name: string;
  facility_code: string;
}

export interface SchedulePayload {
  title: string;
  schedule_type: ScheduleType;
  date: string;
  start_time?: string;
  end_time?: string;
  location?: string;
  notes?: string;
}

export type StaffRole = 'ASHA' | 'ANM' | 'SUPERVISOR' | 'OTHER';

export interface StaffMember {
  id: string;
  full_name: string;
  role: StaffRole;
  phone: string;
  employee_code: string;
}

export type ReportStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED';

export interface Report {
  id: string;
  title: string;
  period_start: string;
  period_end: string;
  status: ReportStatus;
  facility_name?: string;
  facility_code?: string;
  created_at?: string;
}

export type AffiliationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface Affiliation {
  id: string;
  subcentre: string;
  phc: string;
  status: AffiliationStatus;
  permissions: string[];
  decision_reason: string;
}

export interface NotificationItem {
  id: number;
  title: string;
  message: string;
  read: boolean;
}

export interface CreateFacilityPayload {
  name: string;
  facility_type: FacilityType;
  district: string;
  state: string;
  code?: string;
}

export interface CreateStaffPayload {
  full_name: string;
  role: StaffRole;
  phone: string;
  employee_code: string;
}

export interface CreateReportPayload {
  title: string;
  period_start: string;
  period_end: string;
  payload?: Record<string, unknown>;
}

export interface CreateAffiliationPayload {
  phc_id: string;
  permissions?: string[];
}

export interface ApiError {
  error: string;
}

export interface UserSession {
  username: string;
  isAuthenticated: boolean;
  facility: Facility | null;
}

export interface ClinicalRegisterEntry {
  id: string;
  patient_name: string;
  age: number;
  gender: 'F' | 'M' | 'Other';
  village: string;
  service_type: 'ANC' | 'PNC' | 'IMMUNIZATION' | 'NCD_SCREENING' | 'GENERAL_OPD' | 'REFERRAL';
  date: string;
  vitals?: {
    bp?: string;
    pulse?: number;
    weight_kg?: number;
    blood_sugar?: number;
    hemoglobin?: number;
  };
  details: string;
  assigned_worker: string;
  status: 'COMPLETED' | 'FOLLOW_UP_REQUIRED' | 'REFERRED';
}

export interface InventoryItem {
  id: string;
  item_code: string;
  name: string;
  category: 'MEDICINE' | 'VACCINE' | 'CONSUMABLE' | 'EQUIPMENT' | 'DIAGNOSTIC_KIT';
  batch_number: string;
  current_stock: number;
  unit: string;
  min_reorder_level: number;
  expiry_date: string;
  storage_location: string;
  status: 'IN_STOCK' | 'LOW_STOCK' | 'CRITICAL' | 'EXPIRED';
}

export interface VillageCatchment {
  id: string;
  name: string;
  gram_panchayat: string;
  total_population: number;
  total_households: number;
  eligible_couples: number;
  target_anc: number;
  children_under_5: number;
  assigned_asha: string;
  assigned_anm: string;
  immunization_coverage_pct: number;
  distance_from_centre_km: number;
}

export interface DashboardStats {
  facility: Facility | null;
  kpis: {
    total_staff: number;
    asha_count: number;
    anm_count: number;
    supervisor_count: number;
    total_reports: number;
    approved_reports: number;
    submitted_reports: number;
    draft_reports: number;
    total_affiliations: number;
    pending_affiliations: number;
    total_clinical_records: number;
    anc_records: number;
    immunization_records: number;
    ncd_records: number;
    referrals: number;
    total_inventory_items: number;
    low_stock_items: number;
    total_villages: number;
    catchment_population: number;
    catchment_households: number;
  };
  recent_activities: Array<{
    id: string;
    action: string;
    entity_type: string;
    timestamp: string;
    actor: string;
  }>;
}
