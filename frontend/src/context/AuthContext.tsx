import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Facility, CreateFacilityPayload, FacilityRole } from '../types';
import { api, ApiError } from '../lib/api';

type FacilityProfilePayload = CreateFacilityPayload & {
  block?: string;
  address?: string;
  location?: string;
  phone?: string;
  email?: string;
  phc_code?: string;
};

interface AuthContextType {
  isAuthenticated: boolean;
  username: string;
  role: FacilityRole | null;
  facility: Facility | null;
  needsFacilityRegistration: boolean;
  isBackendOnline: boolean;
  isLoading: boolean;
  error: string | null;
  requestOtp: (phone: string, role: FacilityRole) => Promise<void>;
  loginWithOtp: (phone: string, otp: string, role: FacilityRole) => Promise<boolean>;
  loginWithEmail: (email: string, password: string, role: FacilityRole) => Promise<boolean>;
  logout: () => Promise<void>;
  registerFacility: (data: FacilityProfilePayload) => Promise<Facility>;
  saveFacility: (data: Partial<FacilityProfilePayload>) => Promise<Facility>;
  refreshFacility: () => Promise<void>;
  checkConnection: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState<string>(() => {
    return '';
  });
  const [role, setRole] = useState<FacilityRole | null>(null);
  const [facility, setFacility] = useState<Facility | null>(null);
  const [needsFacilityRegistration, setNeedsFacilityRegistration] = useState<boolean>(false);
  const [isBackendOnline, setIsBackendOnline] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const checkConnection = useCallback(async (): Promise<boolean> => {
    const health = await api.checkHealth();
    setIsBackendOnline(health.ok);
    return health.ok;
  }, []);

  const refreshFacility = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const session = await api.getAuthSession();
      if (!session.authenticated) {
        setFacility(null);
        setRole(null);
        setNeedsFacilityRegistration(false);
        setIsAuthenticated(false);
        setUsername('');
        return;
      }
      setUsername(session.username);
      setRole(session.role);
      setFacility(session.facility);
      setNeedsFacilityRegistration(!session.facility);
      setIsAuthenticated(true);
    } catch (err: any) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        setFacility(null);
        setRole(null);
        setNeedsFacilityRegistration(false);
        setIsAuthenticated(false);
      }
    } finally {
      setIsLoading(false);
    }
  }, [checkConnection]);

  useEffect(() => {
    refreshFacility();
    checkConnection();
  }, [refreshFacility, checkConnection]);

  const requestOtp = async (phone: string, selectedRole: FacilityRole): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      await api.requestPhoneOtp(phone, selectedRole);
    } catch (err: any) {
      const message = err?.message || 'Unable to request a verification code';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithOtp = async (phone: string, otp: string, selectedRole: FacilityRole): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const session = await api.login(phone, otp, selectedRole);
      setIsAuthenticated(true);
      setUsername(session.username);
      setRole(session.role);
      setFacility(session.facility);
      setNeedsFacilityRegistration(!session.facility);
      return true;
    } catch (err: any) {
      setError(err?.message || 'Login failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithEmail = async (email: string, password: string, selectedRole: FacilityRole): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const session = await api.loginWithEmail(email, password, selectedRole);
      setIsAuthenticated(true);
      setUsername(session.username);
      setRole(session.role);
      setFacility(session.facility);
      setNeedsFacilityRegistration(!session.facility);
      return true;
    } catch (err: any) {
      setError(err?.message || 'Login failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch {
      // Ignore network errors on logout
    }
    setIsAuthenticated(false);
    setFacility(null);
    setRole(null);
    setNeedsFacilityRegistration(false);
  };

  const registerFacility = async (data: FacilityProfilePayload): Promise<Facility> => {
    setIsLoading(true);
    setError(null);
    try {
      const newFacility = await api.createFacility(data);
      setFacility(newFacility);
      setRole(newFacility.facility_type);
      setNeedsFacilityRegistration(false);
      return newFacility;
    } catch (err: any) {
      const msg = err?.message || 'Failed to register facility';
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const saveFacility = async (data: Parameters<typeof api.updateFacility>[0]): Promise<Facility> => {
    setIsLoading(true);
    setError(null);
    try {
      const updatedFacility = await api.updateFacility(data);
      setFacility(updatedFacility);
      return updatedFacility;
    } catch (err: any) {
      const msg = err?.message || 'Failed to update facility profile';
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        username,
        role,
        facility,
        needsFacilityRegistration,
        isBackendOnline,
        isLoading,
        error,
        requestOtp,
        loginWithOtp,
        loginWithEmail,
        logout,
        registerFacility,
        saveFacility,
        refreshFacility,
        checkConnection,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
