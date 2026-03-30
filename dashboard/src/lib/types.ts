export interface Negotiation {
  id: string;
  state: string;
  vacancy_id: number;
  employer_id: number | null;
  resume_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Vacancy {
  id: number;
  name: string;
  remote: boolean;
  area_name: string | null;
  salary_from: number | null;
  salary_to: number | null;
  currency: string | null;
  experience: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  alternate_url: string | null;
}

export interface Employer {
  id: number;
  name: string;
  type: string | null;
  area_name: string | null;
  site_url: string | null;
  alternate_url: string | null;
  updated_at: string;
}

export interface EmployerSite {
  employer_id: number;
  site_url: string | null;
  emails: string | null;
  generator: string | null;
  powered_by: string | null;
  server_name: string | null;
}

export interface Resume {
  id: string;
  title: string;
  status_id: string | null;
  status_name: string | null;
  alternate_url: string | null;
  can_publish_or_update: boolean;
  total_views: number;
  new_views: number;
  updated_at: string;
}

export interface Command {
  id: string;
  command: string;
  args: Record<string, unknown> | null;
  status: string;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  error_message: string | null;
}

export interface LogEntry {
  id: number;
  command_id: string;
  level: string;
  message: string;
  created_at: string;
}

export interface RecentActivity {
  id: string;
  state: string;
  vacancy_id: number;
  updated_at: string;
}

export interface BlacklistEntry {
  employer_id: number;
  employer_name: string;
  reason: string | null;
  created_at: string;
}

export interface EmployerSearchResult {
  id: number;
  name: string;
  alternate_url?: string;
}
