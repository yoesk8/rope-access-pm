export type Role = 'owner' | 'lead_tech' | 'technician'
export type Plan = 'basic' | 'field' | 'operations'
export type ProjectStatus = 'draft' | 'active' | 'completed' | 'cancelled'
export type InventoryType = 'personal' | 'company'
export type InventoryStatus = 'active' | 'maintenance' | 'retired'
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

/** Core project fields stored on all projects. */
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

/**
 * Full database row for a project, including rope-access-specific fields
 * added in migration 002. Use this type when selecting `*` from the projects
 * table so that rope-access fields don't require `as any` casts.
 */
export interface ProjectRow extends Project {
  job_category: string | null
  access_type: string | null
  max_height: number | null
  anchor_points: string | null
  rigging_details: string | null
  risk_considerations: string | null
  site_contact_name: string | null
  site_contact_role: string | null
  site_contact_phone: string | null
  tools_needed: string[] | null
}

export interface ProjectMember {
  id: string
  project_id: string
  user_id: string
  profile?: Profile
}

export interface InventoryItem {
  id: string
  owner_id: string
  name: string
  category: string
  type: InventoryType
  assigned_to: string | null
  serial_number: string | null
  status: InventoryStatus
  notes: string | null
  created_at: string
  assignee?: Profile | null
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
