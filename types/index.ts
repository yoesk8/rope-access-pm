export type Role = 'owner' | 'lead_tech' | 'technician'
export type Plan = 'basic' | 'field' | 'operations'
export type ProjectStatus = 'draft' | 'active' | 'completed' | 'cancelled'
export type TimesheetStatus = 'pending' | 'approved' | 'rejected'
export type DocumentType = 'risk_assessment' | 'method_statement' | 'inspection_report' | 'certificate' | 'other'

export interface Profile {
  id: string
  full_name: string | null
  role: Role
  plan: Plan
  phone: string | null
  avatar_url: string | null
  created_at: string
}

export interface Project {
  id: string
  name: string
  client: string | null
  location: string | null
  status: ProjectStatus
  description: string | null
  start_date: string | null
  end_date: string | null
  created_by: string
  created_at: string
}

export interface ProjectMember {
  id: string
  project_id: string
  user_id: string
  profile?: Profile
}

export interface Timesheet {
  id: string
  project_id: string
  user_id: string
  date: string
  hours: number
  description: string | null
  status: TimesheetStatus
  approved_by: string | null
  created_at: string
  project?: Project
  profile?: Profile
}

export interface Document {
  id: string
  project_id: string
  name: string
  type: DocumentType
  file_url: string
  file_size: number | null
  uploaded_by: string
  created_at: string
  project?: Project
  profile?: Profile
}
