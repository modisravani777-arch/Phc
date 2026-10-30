import {
  Facility,
  StaffMember,
  Report,
  Affiliation,
  NotificationItem,
  CreateFacilityPayload,
  CreateStaffPayload,
  CreateReportPayload,
  CreateAffiliationPayload,
  ClinicalRegisterEntry,
  InventoryItem,
  VillageCatchment,
  DashboardStats,
  FacilityRole,
  FacilityInsights,
  FacilitySchedule,
  SchedulePayload,
  AuthSession,
} from '../types';

const API_BASE = import.meta.env.VITE_API_URL || '';
const API_TIMEOUT_MS = 15_000;
const DASHBOARD_STATS_TIMEOUT_MS = 30_000;
const RETRYABLE_GET_STATUSES = new Set([502, 503, 504]);

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null;
  }
  return null;
}

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message.trim() ? error.message : fallback;
}

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs = API_TIMEOUT_MS,
): Promise<Response> {
  const method = (options.method || 'GET').toUpperCase();
  const maxAttempts = method === 'GET' ? 2 : 1;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const controller = new AbortController();
    const externalSignal = options.signal;
    let timedOut = false;
    const timeout = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, timeoutMs);
    const forwardAbort = () => controller.abort();

    if (externalSignal?.aborted) {
      controller.abort();
    } else {
      externalSignal?.addEventListener('abort', forwardAbort, { once: true });
    }

    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      if (method === 'GET' && attempt === 0 && RETRYABLE_GET_STATUSES.has(response.status)) {
        await response.body?.cancel();
        await wait(250);
        continue;
      }
      return response;
    } catch (error: unknown) {
      if (timedOut) {
        throw new ApiError('The request timed out. Please try again.', 408);
      }
      if (externalSignal?.aborted) {
        throw error;
      }
      if (attempt === 0 && method === 'GET') {
        await wait(250);
        continue;
      }
      if (error instanceof TypeError) {
        throw new ApiError(
          'Unable to connect to the service. Check your connection and try again.',
          0,
        );
      }
      throw error;
    } finally {
      clearTimeout(timeout);
      externalSignal?.removeEventListener('abort', forwardAbort);
    }
  }

  throw new ApiError('The request could not be completed. Please try again.', 0);
}

async function readResponse(response: Response): Promise<unknown> {
  const body = await response.text();
  if (!body) return null;
  if (!response.headers.get('content-type')?.includes('application/json')) return body;

  try {
    return JSON.parse(body);
  } catch (error: unknown) {
    if (error instanceof SyntaxError) {
      throw new ApiError('The service returned an invalid response.', response.status, body);
    }
    throw error;
  }
}

async function ensureCsrfCookie(): Promise<void> {
  const response = await fetchWithTimeout(`${API_BASE}/api/auth/csrf/`, {
    credentials: 'include',
    headers: { Accept: 'application/json' },
  });
  if (!response.ok || !getCookie('csrftoken')) {
    throw new ApiError(
      'Unable to start a secure sign-in session. Please try again.',
      response.status,
    );
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && options.body && typeof options.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }

  // Handle Django CSRF protection for non-GET requests
  if (options.method && options.method.toUpperCase() !== 'GET') {
    const csrfToken = getCookie('csrftoken');
    if (csrfToken) {
      headers.set('X-CSRFToken', csrfToken);
    }
  }

  const response = await fetchWithTimeout(
    url,
    {
      ...options,
      headers,
      credentials: 'include',
    },
    endpoint === '/api/stats/' ? DASHBOARD_STATS_TIMEOUT_MS : API_TIMEOUT_MS,
  );
  const responseData = await readResponse(response);

  if (!response.ok) {
    let errorMessage = `Request failed with status ${response.status}`;
    if (
      responseData &&
      typeof responseData === 'object' &&
      'error' in responseData &&
      typeof responseData.error === 'string'
    ) {
      errorMessage = responseData.error;
    } else if (
      typeof responseData === 'string' &&
      responseData.length < 200 &&
      responseData.trim()
    ) {
      errorMessage = responseData;
    }
    throw new ApiError(errorMessage, response.status, responseData);
  }

  return responseData as T;
}

function makeInFlightRequest<T>(sendRequest: () => Promise<T>): () => Promise<T> {
  let inFlight: Promise<T> | null = null;

  return () => {
    if (!inFlight) {
      inFlight = sendRequest().finally(() => {
        inFlight = null;
      });
    }
    return inFlight;
  };
}

const getAuthSessionRequest = makeInFlightRequest(() => request<AuthSession>('/api/auth/session/'));
const getStaffRequest = makeInFlightRequest(async () => {
  const res = await request<{ results: StaffMember[] }>('/api/staff/');
  return res.results || [];
});
const getNotificationsRequest = makeInFlightRequest(async () => {
  const res = await request<{ results: NotificationItem[] }>('/api/notifications/');
  return res.results || [];
});
const getDashboardStatsRequest = makeInFlightRequest(() => request<DashboardStats>('/api/stats/'));

export const api = {
  // Check backend server reachability
  async checkHealth(): Promise<{ ok: boolean; statusText?: string }> {
    try {
      const res = await fetchWithTimeout(`${API_BASE}/api/auth/csrf/`, {
        credentials: 'include',
        headers: { Accept: 'application/json' },
      });
      if (res.ok) {
        return { ok: true, statusText: `Online (HTTP ${res.status})` };
      }
      return { ok: false, statusText: `HTTP ${res.status}` };
    } catch (error: unknown) {
      return { ok: false, statusText: getErrorMessage(error, 'Offline') };
    }
  },

  // Facilities
  async getFacilityMe(): Promise<Facility> {
    const res = await request<{ facility: Facility }>('/api/facilities/me/');
    return res.facility;
  },

  async createFacility(
    data: CreateFacilityPayload & {
      block?: string;
      address?: string;
      location?: string;
      phone?: string;
      email?: string;
      phc_code?: string;
    },
  ): Promise<Facility> {
    const res = await request<{ facility: Facility }>('/api/facilities/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.facility;
  },

  async updateFacility(
    data: Partial<CreateFacilityPayload> & {
      block?: string;
      address?: string;
      location?: string;
      phone?: string;
      email?: string;
      phc_code?: string;
    },
  ): Promise<Facility> {
    const res = await request<{ facility: Facility }>('/api/facilities/me/', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return res.facility;
  },

  getAuthSession(): Promise<AuthSession> {
    return getAuthSessionRequest();
  },

  async getFacilityInsights(): Promise<FacilityInsights> {
    return await request<FacilityInsights>('/api/analytics/');
  },

  async getSchedules(date?: string): Promise<FacilitySchedule[]> {
    const query = date ? `?date=${encodeURIComponent(date)}` : '';
    const res = await request<{ results: FacilitySchedule[] }>(`/api/schedules/${query}`);
    return res.results;
  },

  async createSchedule(data: SchedulePayload): Promise<FacilitySchedule> {
    const res = await request<{ schedule: FacilitySchedule }>('/api/schedules/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.schedule;
  },

  async updateSchedule(scheduleId: string, data: SchedulePayload): Promise<FacilitySchedule> {
    const res = await request<{ schedule: FacilitySchedule }>(`/api/schedules/${scheduleId}/`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return res.schedule;
  },

  async deleteSchedule(scheduleId: string): Promise<void> {
    await request<{ deleted: boolean }>(`/api/schedules/${scheduleId}/`, { method: 'DELETE' });
  },

  // Staff
  getStaff(): Promise<StaffMember[]> {
    return getStaffRequest();
  },

  async createStaff(data: CreateStaffPayload): Promise<StaffMember> {
    const res = await request<{ staff: StaffMember }>('/api/staff/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.staff;
  },

  // Reports
  async getReports(): Promise<Report[]> {
    const res = await request<{ results: Report[] }>('/api/reports/');
    return res.results || [];
  },

  async createReport(
    data: CreateReportPayload,
  ): Promise<{ id: string; title: string; status: string }> {
    const res = await request<{ report: { id: string; title: string; status: string } }>(
      '/api/reports/',
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
    );
    return res.report;
  },

  // Affiliations
  async getAffiliations(): Promise<Affiliation[]> {
    const res = await request<{ results: Affiliation[] }>('/api/affiliations/');
    return res.results || [];
  },

  async createAffiliation(data: CreateAffiliationPayload): Promise<{ id: string; status: string }> {
    const res = await request<{ affiliation: { id: string; status: string } }>(
      '/api/affiliations/',
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
    );
    return res.affiliation;
  },

  async approveAffiliation(
    affiliationId: string,
    reason = '',
  ): Promise<{ id: string; status: string; decision_reason: string }> {
    const res = await request<{
      affiliation: { id: string; status: string; decision_reason: string };
    }>(`/api/affiliations/${affiliationId}/approve/`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
    return res.affiliation;
  },

  async rejectAffiliation(
    affiliationId: string,
    reason = '',
  ): Promise<{ id: string; status: string; decision_reason: string }> {
    const res = await request<{
      affiliation: { id: string; status: string; decision_reason: string };
    }>(`/api/affiliations/${affiliationId}/reject/`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
    return res.affiliation;
  },

  // Notifications
  getNotifications(): Promise<NotificationItem[]> {
    return getNotificationsRequest();
  },

  async markNotificationRead(notificationId: number): Promise<{ id: number; read: boolean }> {
    const res = await request<{ notification: { id: number; read: boolean } }>(
      `/api/notifications/${notificationId}/read/`,
      {
        method: 'POST',
        body: JSON.stringify({}),
      },
    );
    return res.notification;
  },

  // Dynamic Clinical Registers (Neon PostgreSQL backed)
  async getRegisters(serviceType?: string, search?: string): Promise<ClinicalRegisterEntry[]> {
    const params = new URLSearchParams();
    if (serviceType && serviceType !== 'ALL') params.set('service_type', serviceType);
    if (search) params.set('search', search);
    const queryStr = params.toString() ? `?${params.toString()}` : '';
    const res = await request<{ results: ClinicalRegisterEntry[] }>(`/api/registers/${queryStr}`);
    return res.results || [];
  },

  async createRegister(data: Partial<ClinicalRegisterEntry>): Promise<ClinicalRegisterEntry> {
    const res = await request<{ record: ClinicalRegisterEntry }>('/api/registers/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.record;
  },

  // Dynamic Inventory (Neon PostgreSQL backed)
  async getInventory(category?: string, search?: string): Promise<InventoryItem[]> {
    const params = new URLSearchParams();
    if (category && category !== 'ALL') params.set('category', category);
    if (search) params.set('search', search);
    const queryStr = params.toString() ? `?${params.toString()}` : '';
    const res = await request<{ results: InventoryItem[] }>(`/api/inventory/${queryStr}`);
    return res.results || [];
  },

  async createInventory(data: Partial<InventoryItem>): Promise<InventoryItem> {
    const res = await request<{ item: InventoryItem }>('/api/inventory/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.item;
  },

  // Dynamic Catchment Villages (Neon PostgreSQL backed)
  async getVillages(): Promise<VillageCatchment[]> {
    const res = await request<{ results: VillageCatchment[] }>('/api/villages/');
    return res.results || [];
  },

  async createVillage(data: Partial<VillageCatchment>): Promise<VillageCatchment> {
    const res = await request<{ village: VillageCatchment }>('/api/villages/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.village;
  },

  // Dynamic Real-Time Dashboard Stats
  getDashboardStats(): Promise<DashboardStats> {
    return getDashboardStatsRequest();
  },

  // Staff Deactivation
  async deactivateStaff(staffId: string): Promise<void> {
    await request<{ ok: boolean }>(`/api/staff/${staffId}/`, {
      method: 'DELETE',
    });
  },

  // Database Seeding Helper
  async seedDatabase(): Promise<void> {
    await request<{ ok: boolean }>('/api/seed/', {
      method: 'POST',
    });
  },

  // Session Authentication Helpers
  async requestPhoneOtp(
    phone: string,
    role: FacilityRole,
  ): Promise<{ ok: boolean; message: string }> {
    await ensureCsrfCookie();
    return await request<{ ok: boolean; message: string }>('/api/auth/otp/request/', {
      method: 'POST',
      body: JSON.stringify({ phone, role }),
    });
  },

  async login(phone: string, otp: string, role: FacilityRole): Promise<AuthSession> {
    return await request<AuthSession>('/api/auth/otp/verify/', {
      method: 'POST',
      body: JSON.stringify({ phone, otp, role }),
    });
  },

  async loginWithEmail(email: string, password: string, role: FacilityRole): Promise<AuthSession> {
    await ensureCsrfCookie();
    return await request<AuthSession>('/api/auth/email-login/', {
      method: 'POST',
      body: JSON.stringify({ email, password, role }),
    });
  },

  async logout(): Promise<void> {
    await request<{ ok: boolean }>('/api/auth/logout/', {
      method: 'POST',
      body: JSON.stringify({}),
    });
  },
};
