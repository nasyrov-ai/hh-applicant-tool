export interface Database {
  public: {
    Tables: {
      negotiations: {
        Row: {
          id: string;
          state: string;
          vacancy_id: number;
          employer_id: number | null;
          resume_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          state: string;
          vacancy_id: number;
          employer_id?: number | null;
          resume_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          state?: string;
          vacancy_id?: number;
          employer_id?: number | null;
          resume_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      vacancies: {
        Row: {
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
        };
        Insert: {
          id?: number;
          name: string;
          remote?: boolean;
          area_name?: string | null;
          salary_from?: number | null;
          salary_to?: number | null;
          currency?: string | null;
          experience?: string | null;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
          alternate_url?: string | null;
        };
        Update: {
          id?: number;
          name?: string;
          remote?: boolean;
          area_name?: string | null;
          salary_from?: number | null;
          salary_to?: number | null;
          currency?: string | null;
          experience?: string | null;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
          alternate_url?: string | null;
        };
        Relationships: [];
      };
      employers: {
        Row: {
          id: number;
          name: string;
          type: string | null;
          area_name: string | null;
          site_url: string | null;
          alternate_url: string | null;
          updated_at: string;
        };
        Insert: {
          id?: number;
          name: string;
          type?: string | null;
          area_name?: string | null;
          site_url?: string | null;
          alternate_url?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: number;
          name?: string;
          type?: string | null;
          area_name?: string | null;
          site_url?: string | null;
          alternate_url?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      employer_sites: {
        Row: {
          employer_id: number;
          site_url: string | null;
          emails: string | null;
          generator: string | null;
          powered_by: string | null;
          server_name: string | null;
        };
        Insert: {
          employer_id: number;
          site_url?: string | null;
          emails?: string | null;
          generator?: string | null;
          powered_by?: string | null;
          server_name?: string | null;
        };
        Update: {
          employer_id?: number;
          site_url?: string | null;
          emails?: string | null;
          generator?: string | null;
          powered_by?: string | null;
          server_name?: string | null;
        };
        Relationships: [];
      };
      resumes: {
        Row: {
          id: string;
          title: string;
          status_id: string | null;
          status_name: string | null;
          alternate_url: string | null;
          can_publish_or_update: boolean;
          total_views: number;
          new_views: number;
          updated_at: string;
        };
        Insert: {
          id: string;
          title: string;
          status_id?: string | null;
          status_name?: string | null;
          alternate_url?: string | null;
          can_publish_or_update?: boolean;
          total_views?: number;
          new_views?: number;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          status_id?: string | null;
          status_name?: string | null;
          alternate_url?: string | null;
          can_publish_or_update?: boolean;
          total_views?: number;
          new_views?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      command_queue: {
        Row: {
          id: string;
          command: string;
          args: Record<string, unknown> | null;
          status: string;
          created_at: string;
          started_at: string | null;
          completed_at: string | null;
          error_message: string | null;
        };
        Insert: {
          id?: string;
          command: string;
          args?: Record<string, unknown> | null;
          status?: string;
          created_at?: string;
          started_at?: string | null;
          completed_at?: string | null;
          error_message?: string | null;
        };
        Update: {
          id?: string;
          command?: string;
          args?: Record<string, unknown> | null;
          status?: string;
          created_at?: string;
          started_at?: string | null;
          completed_at?: string | null;
          error_message?: string | null;
        };
        Relationships: [];
      };
      execution_logs: {
        Row: {
          id: number;
          command_id: string;
          level: string;
          message: string;
          created_at: string;
        };
        Insert: {
          id?: number;
          command_id: string;
          level: string;
          message: string;
          created_at?: string;
        };
        Update: {
          id?: number;
          command_id?: string;
          level?: string;
          message?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      worker_config: {
        Row: {
          key: string;
          value: unknown;
        };
        Insert: {
          key: string;
          value: unknown;
        };
        Update: {
          key?: string;
          value?: unknown;
        };
        Relationships: [];
      };
      worker_status: {
        Row: {
          status: string;
          last_seen_at: string;
        };
        Insert: {
          status: string;
          last_seen_at?: string;
        };
        Update: {
          status?: string;
          last_seen_at?: string;
        };
        Relationships: [];
      };
      blacklist: {
        Row: {
          employer_id: number;
          employer_name: string;
          reason: string | null;
          created_at: string;
        };
        Insert: {
          employer_id: number;
          employer_name: string;
          reason?: string | null;
          created_at?: string;
        };
        Update: {
          employer_id?: number;
          employer_name?: string;
          reason?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      cron_schedules: {
        Row: {
          id: string;
          name: string;
          command: string;
          args: Record<string, unknown> | null;
          cron_expression: string;
          enabled: boolean;
          last_run_at: string | null;
          next_run_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          command: string;
          args?: Record<string, unknown> | null;
          cron_expression: string;
          enabled?: boolean;
          last_run_at?: string | null;
          next_run_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          command?: string;
          args?: Record<string, unknown> | null;
          cron_expression?: string;
          enabled?: boolean;
          last_run_at?: string | null;
          next_run_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      sync_log: {
        Row: {
          id: number;
          type: string;
          synced_count: number;
          created_at: string;
        };
        Insert: {
          id?: number;
          type: string;
          synced_count?: number;
          created_at?: string;
        };
        Update: {
          id?: number;
          type?: string;
          synced_count?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      vacancy_contacts: {
        Row: {
          vacancy_id: number;
          name: string | null;
          email: string | null;
          phones: string | null;
          created_at: string;
        };
        Insert: {
          vacancy_id: number;
          name?: string | null;
          email?: string | null;
          phones?: string | null;
          created_at?: string;
        };
        Update: {
          vacancy_id?: number;
          name?: string | null;
          email?: string | null;
          phones?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

/** Helper: extract Row type for a given table name */
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

/** Helper: extract Insert type for a given table name */
export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];

/** Helper: extract Update type for a given table name */
export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
