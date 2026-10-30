import type { ClinicalRegisterEntry } from '../../types';

export interface RegisterFormData {
  patient_name: string;
  age: string;
  gender: 'F' | 'M' | 'Other';
  village: string;
  service_type: ClinicalRegisterEntry['service_type'];
  bp: string;
  pulse: string;
  weight_kg: string;
  blood_sugar: string;
  hemoglobin: string;
  details: string;
  assigned_worker: string;
  status: ClinicalRegisterEntry['status'];
}

export const createInitialRegisterFormData = (): RegisterFormData => ({
  patient_name: '',
  age: '',
  gender: 'F',
  village: '',
  service_type: 'ANC',
  bp: '',
  pulse: '',
  weight_kg: '',
  blood_sugar: '',
  hemoglobin: '',
  details: '',
  assigned_worker: '',
  status: 'COMPLETED',
});
