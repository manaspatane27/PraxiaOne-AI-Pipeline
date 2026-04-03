/**
 * Type definitions for Praxia5Chronic
 */

// ==================== USER & AUTH ====================

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  avatar?: string;
  created_at: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

// ==================== CHRONIC DISEASE ====================

export interface ChronicDisease {
  id: number;
  user: number;
  disease_type: DiseaseType;
  disease_name: string;
  diagnosis_date: string;
  severity: 'mild' | 'moderate' | 'severe' | 'critical';
  risk_score: number;
  is_active: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;

  // Nested relations
  metrics?: DiseaseMetric[];
  medications?: MedicationPlan[];
  care_goals?: CareGoal[];
  risk_assessments?: RiskAssessment[];
  timeline_events?: DiseaseTimeline[];
}

export type DiseaseType =
  | 'type2_diabetes'
  | 'hypertension'
  | 'coronary_artery_disease'
  | 'copd'
  | 'asthma'
  | 'chronic_kidney_disease'
  | 'heart_failure'
  | 'arthritis'
  | 'depression'
  | 'obesity';

export const DISEASE_NAMES: Record<DiseaseType, string> = {
  'type2_diabetes': 'Type 2 Diabetes',
  'hypertension': 'Hypertension (High Blood Pressure)',
  'coronary_artery_disease': 'Coronary Artery Disease',
  'copd': 'COPD (Chronic Obstructive Pulmonary Disease)',
  'asthma': 'Asthma',
  'chronic_kidney_disease': 'Chronic Kidney Disease',
  'heart_failure': 'Heart Failure',
  'arthritis': 'Arthritis',
  'depression': 'Depression',
  'obesity': 'Obesity',
};

// ==================== DISEASE METRICS ====================

export interface DiseaseMetric {
  id: number;
  disease: number;
  metric_type: MetricType;
  value: number;
  unit: string;
  measured_at: string;
  notes?: string;
  created_at: string;
}

export type MetricType =
  | 'hba1c'
  | 'fasting_glucose'
  | 'blood_glucose'
  | 'systolic_bp'
  | 'diastolic_bp'
  | 'ldl_cholesterol'
  | 'hdl_cholesterol'
  | 'triglycerides'
  | 'weight'
  | 'bmi'
  | 'fev1'
  | 'creatinine'
  | 'egfr'
  | 'mood_score'
  | 'pain_level'
  | 'other';

export const METRIC_REFERENCE_RANGES: Record<MetricType, {
  unit: string;
  min: number;
  max: number;
  danger_min?: number;
  danger_max?: number;
}> = {
  'hba1c': { unit: '%', min: 0, max: 7 },
  'fasting_glucose': { unit: 'mg/dL', min: 70, max: 100 },
  'blood_glucose': { unit: 'mg/dL', min: 70, max: 140, danger_min: 50, danger_max: 300 },
  'systolic_bp': { unit: 'mmHg', min: 90, max: 130 },
  'diastolic_bp': { unit: 'mmHg', min: 60, max: 80 },
  'ldl_cholesterol': { unit: 'mg/dL', min: 0, max: 100 },
  'hdl_cholesterol': { unit: 'mg/dL', min: 40, max: 300 },
  'triglycerides': { unit: 'mg/dL', min: 0, max: 150 },
  'weight': { unit: 'kg', min: 30, max: 200 },
  'bmi': { unit: 'kg/m²', min: 18.5, max: 24.9 },
  'fev1': { unit: '%', min: 0, max: 100 },
  'creatinine': { unit: 'mg/dL', min: 0.6, max: 1.2 },
  'egfr': { unit: 'mL/min/1.73m²', min: 90, max: 1000 },
  'mood_score': { unit: '1-10', min: 1, max: 10 },
  'pain_level': { unit: '1-10', min: 1, max: 10 },
  'other': { unit: '', min: 0, max: 100 },
};

// ==================== MEDICATIONS ====================

export interface MedicationPlan {
  id: number;
  disease: number;
  medication_name: string;
  dosage: string;
  frequency: string;
  start_date: string;
  end_date?: string;
  status: 'active' | 'inactive' | 'discontinued';
  adherence_percentage: number;
  side_effects?: string[];
  notes?: string;
  created_at: string;
}

// ==================== CARE GOALS ====================

export interface CareGoal {
  id: number;
  disease: number;
  goal_title: string;
  goal_type: 'reduce' | 'increase' | 'maintain';
  metric_type: MetricType;
  baseline_value: number;
  target_value: number;
  current_value: number;
  progress_percentage: number;
  status: 'not_started' | 'in_progress' | 'achieved' | 'abandoned';
  target_date: string;
  achieved_date?: string;
  created_at: string;
  updated_at: string;
}

// ==================== RISK ASSESSMENT ====================

export interface RiskAssessment {
  id: number;
  disease: number;
  risk_level: 'low' | 'moderate' | 'high' | 'critical';
  risk_score: number;
  contributing_factors: string[];
  recommendations: string[];
  last_assessment_date: string;
  next_assessment_date: string;
  created_at: string;
  updated_at: string;
}

// ==================== ALERT RULES ====================

export interface AlertRule {
  id: number;
  disease: number;
  alert_type: string;
  metric_type: MetricType;
  threshold_min?: number;
  threshold_max?: number;
  severity: 'low' | 'moderate' | 'high' | 'critical';
  is_active: boolean;
  created_at: string;
}

// ==================== TIMELINE ====================

export interface DiseaseTimeline {
  id: number;
  disease: number;
  event_type: 'diagnosis' | 'medication_change' | 'alert' | 'achievement' | 'note' | 'other';
  event_title: string;
  event_description?: string;
  event_date: string;
  impact_level: 'low' | 'neutral' | 'high' | 'critical' | 'positive';
  created_at: string;
}

// ==================== WEARABLE DEVICES ====================

export interface WearableDevice {
  id: number;
  user: number;
  provider: 'apple_health' | 'google_fit' | 'fitbit';
  device_name: string;
  access_token: string;
  refresh_token?: string;
  is_active: boolean;
  last_sync: string;
  created_at: string;
  updated_at: string;
}

export interface HealthMetric {
  id: number;
  device: number;
  metric_type: string;
  value: number;
  unit: string;
  recorded_at: string;
  created_at: string;
}

export interface WearableSyncLog {
  id: number;
  device: number;
  status: 'pending' | 'syncing' | 'success' | 'failed';
  metrics_synced: number;
  error_message?: string;
  synced_at: string;
  created_at: string;
}

// ==================== FHIR ====================

export interface FHIRAccount {
  id: number;
  user: number;
  fhir_server_url: string;
  patient_id: string;
  sync_status: 'pending' | 'syncing' | 'success' | 'failed';
  last_sync: string;
  created_at: string;
  updated_at: string;
}

export interface FHIRResource {
  id: number;
  account: number;
  resource_type: string;
  resource_id: string;
  raw_json: Record<string, any>;
  synced_at: string;
  created_at: string;
}

// ==================== CONSENT ====================

export interface ConsentRecord {
  id: number;
  user: number;
  consent_type: 'data_privacy' | 'health_data_share' | 'marketing';
  is_accepted: boolean;
  accepted_at?: string;
  version: string;
  created_at: string;
  updated_at: string;
}

// ==================== UI STATE ====================

export interface LoadingState {
  isLoading: boolean;
  error: Error | null;
  isSuccess: boolean;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface APIError {
  detail?: string;
  [key: string]: any;
}

// ==================== DASHBOARD ====================

export interface DashboardSummary {
  total_diseases: number;
  critical_risk_count: number;
  high_risk_count: number;
  moderate_risk_count: number;
  low_risk_count: number;
  active_alerts_count: number;
  pending_goals_count: number;
  diseases: ChronicDisease[];
}

export interface HealthInsight {
  id: string;
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'critical';
  actionable: boolean;
  recommendation?: string;
  disease_id?: number;
  created_at: string;
}

export interface HealthRecommendation {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  category: string;
  disease_ids: number[];
  implementation_steps: string[];
  expected_benefit: string;
}

// ==================== UTILS ====================

export function getRiskColor(riskLevel: string): string {
  switch (riskLevel) {
    case 'low':
      return 'text-green-500';
    case 'moderate':
      return 'text-yellow-500';
    case 'high':
      return 'text-orange-500';
    case 'critical':
      return 'text-red-500';
    default:
      return 'text-slate-500';
  }
}

export function getRiskBgColor(riskLevel: string): string {
  switch (riskLevel) {
    case 'low':
      return 'bg-green-500/10 border-green-500/30';
    case 'moderate':
      return 'bg-yellow-500/10 border-yellow-500/30';
    case 'high':
      return 'bg-orange-500/10 border-orange-500/30';
    case 'critical':
      return 'bg-red-500/10 border-red-500/30';
    default:
      return 'bg-slate-500/10 border-slate-500/30';
  }
}

export function getSeverityColor(severity: string): string {
  switch (severity) {
    case 'mild':
      return 'text-cyan-400';
    case 'moderate':
      return 'text-amber-400';
    case 'severe':
      return 'text-orange-400';
    case 'critical':
      return 'text-red-400';
    default:
      return 'text-slate-400';
  }
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getProgressColor(percentage: number): string {
  if (percentage >= 75) return 'bg-green-500';
  if (percentage >= 50) return 'bg-yellow-500';
  if (percentage >= 25) return 'bg-orange-500';
  return 'bg-red-500';
}
