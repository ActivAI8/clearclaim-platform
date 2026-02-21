export type UserRole = 'org_admin' | 'site_admin' | 'supervisor' | 'caseworker' | 'intake_coordinator' | 'qa_reviewer' | 'veteran';

export type CaseStatus = 'intake_pending' | 'intake_in_progress' | 'intake_complete' | 'processing' | 'review' | 'packet_building' | 'ready_for_export' | 'exported' | 'closed';

export type CasePriority = 'low' | 'normal' | 'high' | 'urgent';

export type DocumentCategory = 'str' | 'va_notes' | 'civilian_notes' | 'imaging' | 'meds_list' | 'personal_statement' | 'buddy_statement' | 'other';

export type ProcessingStatus = 'pending' | 'uploading' | 'ocr_processing' | 'indexing' | 'extracting' | 'complete' | 'error';

export type ConditionStatus = 'draft' | 'approved' | 'rejected' | 'merged';

export type GapStatus = 'supported' | 'partial' | 'missing';

export type SnippetType = 'fact' | 'date' | 'diagnosis' | 'treatment' | 'symptom' | 'measurement' | 'medication' | 'procedure' | 'lab_result' | 'other';

export type TaskType = 'upload' | 'answer_questions' | 'clarify_timeline' | 'provide_statement' | 'other';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  settings: Record<string, unknown>;
  retention_days: number;
  created_at: string;
  updated_at: string;
}

export interface Site {
  id: string;
  organization_id: string;
  name: string;
  slug: string;
  address: string | null;
  phone: string | null;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Team {
  id: string;
  site_id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  organization_id: string | null;
  site_id: string | null;
  team_id: string | null;
  role: UserRole;
  full_name: string;
  email: string;
  phone: string | null;
  is_active: boolean;
  can_access_all_sites: boolean;
  mfa_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface Veteran {
  id: string;
  user_id: string | null;
  organization_id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  date_of_birth: string | null;
  branch_of_service: string | null;
  service_start_date: string | null;
  service_end_date: string | null;
  discharge_status: string | null;
  va_file_number: string | null;
  ssn_last_four: string | null;
  address: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Case {
  id: string;
  case_number: string;
  organization_id: string;
  site_id: string;
  veteran_id: string;
  assigned_to: string | null;
  status: CaseStatus;
  priority: CasePriority;
  intake_completeness: number;
  citation_coverage: number;
  packet_readiness_score: number;
  sla_due_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  veteran?: Veteran;
  site?: Site;
  assigned_user?: UserProfile;
}

export interface Document {
  id: string;
  case_id: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  file_hash: string | null;
  mime_type: string | null;
  category: DocumentCategory;
  page_count: number;
  processing_status: ProcessingStatus;
  processing_progress: number;
  ocr_text: string | null;
  metadata: Record<string, unknown>;
  uploaded_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface EvidenceSnippet {
  id: string;
  case_id: string;
  document_id: string;
  page_id: string | null;
  page_number: number | null;
  snippet_text: string;
  snippet_type: SnippetType;
  confidence: number;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface Condition {
  id: string;
  case_id: string;
  name: string;
  icd_code: string | null;
  status: ConditionStatus;
  onset_date: string | null;
  onset_description: string | null;
  symptoms: string[];
  functional_impact: string | null;
  treatments: string[];
  current_severity: string | null;
  confidence: number;
  conflict_flags: Array<{ type: string; description: string }>;
  ai_summary: string | null;
  staff_notes: string | null;
  approved_by: string | null;
  approved_at: string | null;
  merged_into: string | null;
  created_at: string;
  updated_at: string;
}

export interface EvidenceGap {
  id: string;
  case_id: string;
  condition_id: string;
  evidence_category_id: string | null;
  category_name: string;
  gap_status: GapStatus;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface VeteranTask {
  id: string;
  case_id: string;
  veteran_id: string;
  gap_id: string | null;
  task_type: TaskType;
  title: string;
  description: string | null;
  status: 'pending' | 'sent' | 'in_progress' | 'completed' | 'cancelled';
  due_date: string | null;
  completed_at: string | null;
  response: Record<string, unknown>;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface VASRDBodySystem {
  id: string;
  code: string;
  name: string;
  cfr_reference: string | null;
  sort_order: number;
  sections?: VASRDSection[];
}

export interface VASRDSection {
  id: string;
  body_system_id: string;
  section_number: string;
  title: string;
  description: string | null;
  cfr_url: string | null;
  diagnostic_codes: string[];
  criteria: unknown[];
  sort_order: number;
  evidence_categories?: VASRDEvidenceCategory[];
}

export interface VASRDEvidenceCategory {
  id: string;
  section_id: string;
  name: string;
  description: string | null;
  required_level: 'required' | 'recommended' | 'optional';
  sort_order: number;
}

export interface AuditLog {
  id: string;
  organization_id: string | null;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: Record<string, unknown>;
  ip_address: string | null;
  created_at: string;
}

export interface PacketExport {
  id: string;
  case_id: string;
  exported_by: string;
  format: 'pdf' | 'docx';
  file_path: string | null;
  file_url: string | null;
  version: number;
  citation_coverage: number;
  template_used: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

// Status display helpers
export const CASE_STATUS_LABELS: Record<CaseStatus, string> = {
  intake_pending: 'Intake Pending',
  intake_in_progress: 'Intake In Progress',
  intake_complete: 'Intake Complete',
  processing: 'Processing',
  review: 'Review',
  packet_building: 'Packet Building',
  ready_for_export: 'Ready for Export',
  exported: 'Exported',
  closed: 'Closed',
};

export const CASE_STATUS_COLORS: Record<CaseStatus, string> = {
  intake_pending: 'bg-yellow-100 text-yellow-800',
  intake_in_progress: 'bg-blue-100 text-blue-800',
  intake_complete: 'bg-indigo-100 text-indigo-800',
  processing: 'bg-purple-100 text-purple-800',
  review: 'bg-orange-100 text-orange-800',
  packet_building: 'bg-cyan-100 text-cyan-800',
  ready_for_export: 'bg-green-100 text-green-800',
  exported: 'bg-emerald-100 text-emerald-800',
  closed: 'bg-gray-100 text-gray-800',
};

export const PRIORITY_COLORS: Record<CasePriority, string> = {
  low: 'bg-slate-100 text-slate-700',
  normal: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700',
};
