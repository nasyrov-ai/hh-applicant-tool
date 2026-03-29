-- =============================================================================
-- Supabase Schema for hh-applicant-tool
-- =============================================================================
--
-- This migration creates all tables, indexes, RLS policies, realtime
-- subscriptions, and triggers needed by the hh-applicant-tool project.
--
-- Run this in the Supabase SQL Editor or via `supabase db push`.
--
-- Notes:
--   - No foreign keys between data tables (vacancies, negotiations, employers)
--     by design. The worker syncs data from hh.ru API and references are
--     resolved at the application level.
--   - RLS is enabled on every table with anon full-access policies.
--   - Realtime is enabled for command_queue, execution_logs, worker_status.
-- =============================================================================

-- ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
-- 1. DATA TABLES (translated from SQLite schema)
-- ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

-- ---------------------------------------------------------------------------
-- employers
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS employers (
    id BIGINT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT,
    description TEXT,
    site_url TEXT,
    area_id INTEGER,
    area_name TEXT,
    alternate_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- vacancies
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS vacancies (
    id BIGINT PRIMARY KEY,
    name TEXT NOT NULL,
    area_id INTEGER,
    area_name TEXT,
    salary_from INTEGER,
    salary_to INTEGER,
    currency VARCHAR(3),
    gross BOOLEAN,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    remote BOOLEAN,
    experience TEXT,
    professional_roles JSONB,
    alternate_url TEXT
);

-- ---------------------------------------------------------------------------
-- vacancy_contacts
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS vacancy_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vacancy_id BIGINT NOT NULL,
    vacancy_alternate_url TEXT,
    vacancy_name TEXT,
    vacancy_area_id INTEGER,
    vacancy_area_name TEXT,
    vacancy_salary_from INTEGER,
    vacancy_salary_to INTEGER,
    vacancy_currency VARCHAR(3),
    vacancy_gross BOOLEAN,
    employer_id BIGINT,
    employer_name TEXT,
    name TEXT,
    email TEXT,
    phone_numbers TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (vacancy_id, email)
);

-- ---------------------------------------------------------------------------
-- negotiations (NO FK to vacancies — intentional)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS negotiations (
    id BIGINT PRIMARY KEY,
    state TEXT NOT NULL,
    vacancy_id BIGINT NOT NULL,
    employer_id BIGINT,
    chat_id BIGINT NOT NULL,
    resume_id TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- resumes
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS resumes (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    url TEXT,
    alternate_url TEXT,
    status_id TEXT,
    status_name TEXT,
    can_publish_or_update BOOLEAN,
    total_views INTEGER DEFAULT 0,
    new_views INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- employer_sites
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS employer_sites (
    id SERIAL PRIMARY KEY,
    employer_id BIGINT NOT NULL,
    site_url TEXT NOT NULL,
    ip_address TEXT,
    title TEXT,
    description TEXT,
    generator TEXT,
    server_name TEXT,
    powered_by TEXT,
    emails TEXT,
    subdomains TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (employer_id, site_url)
);

-- ---------------------------------------------------------------------------
-- sync_log
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sync_log (
    table_name TEXT PRIMARY KEY,
    last_synced_at TIMESTAMPTZ,
    rows_synced INTEGER DEFAULT 0
);

-- ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
-- 2. MANAGEMENT TABLES (used by worker and dashboard)
-- ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

-- ---------------------------------------------------------------------------
-- command_queue
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS command_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    command TEXT NOT NULL,
    args JSONB DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'pending',
    worker_id TEXT,
    exit_code INTEGER,
    error_message TEXT,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_command_queue_status
    ON command_queue(status);

-- ---------------------------------------------------------------------------
-- execution_logs
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS execution_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    command_id UUID NOT NULL REFERENCES command_queue(id) ON DELETE CASCADE,
    level TEXT NOT NULL DEFAULT 'INFO',
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_execution_logs_command
    ON execution_logs(command_id);

-- ---------------------------------------------------------------------------
-- worker_config
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS worker_config (
    key TEXT PRIMARY KEY,
    value JSONB,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- worker_status
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS worker_status (
    worker_id TEXT PRIMARY KEY,
    status TEXT NOT NULL DEFAULT 'unknown',
    last_seen_at TIMESTAMPTZ DEFAULT now(),
    version TEXT,
    hostname TEXT
);

-- ---------------------------------------------------------------------------
-- cron_schedules
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cron_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL DEFAULT 'Untitled',
    command TEXT NOT NULL,
    args JSONB DEFAULT '{}',
    cron_expression TEXT NOT NULL,
    enabled BOOLEAN DEFAULT true,
    last_run_at TIMESTAMPTZ,
    next_run_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- blacklist
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS blacklist (
    employer_id BIGINT PRIMARY KEY,
    employer_name TEXT,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
-- 3. INDEXES ON updated_at (for data tables)
-- ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

CREATE INDEX IF NOT EXISTS idx_employers_updated_at
    ON employers(updated_at);

CREATE INDEX IF NOT EXISTS idx_vacancies_updated_at
    ON vacancies(updated_at);

CREATE INDEX IF NOT EXISTS idx_vacancy_contacts_updated_at
    ON vacancy_contacts(updated_at);

CREATE INDEX IF NOT EXISTS idx_negotiations_updated_at
    ON negotiations(updated_at);

CREATE INDEX IF NOT EXISTS idx_resumes_updated_at
    ON resumes(updated_at);

CREATE INDEX IF NOT EXISTS idx_employer_sites_updated_at
    ON employer_sites(updated_at);

-- ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
-- 4. ROW LEVEL SECURITY (RLS)
-- ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
-- Enable RLS on every table with anon full-access policy.
-- In production you would restrict this to authenticated users or
-- service_role only. For this project the dashboard uses the anon key.

ALTER TABLE employers          ENABLE ROW LEVEL SECURITY;
ALTER TABLE vacancies          ENABLE ROW LEVEL SECURITY;
ALTER TABLE vacancy_contacts   ENABLE ROW LEVEL SECURITY;
ALTER TABLE negotiations       ENABLE ROW LEVEL SECURITY;
ALTER TABLE resumes            ENABLE ROW LEVEL SECURITY;
ALTER TABLE employer_sites     ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_log           ENABLE ROW LEVEL SECURITY;
ALTER TABLE command_queue      ENABLE ROW LEVEL SECURITY;
ALTER TABLE execution_logs     ENABLE ROW LEVEL SECURITY;
ALTER TABLE worker_config      ENABLE ROW LEVEL SECURITY;
ALTER TABLE worker_status      ENABLE ROW LEVEL SECURITY;
ALTER TABLE cron_schedules     ENABLE ROW LEVEL SECURITY;
ALTER TABLE blacklist          ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for anon" ON employers          FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON vacancies          FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON vacancy_contacts   FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON negotiations       FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON resumes            FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON employer_sites     FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON sync_log           FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON command_queue      FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON execution_logs     FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON worker_config      FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON worker_status      FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON cron_schedules     FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON blacklist          FOR ALL TO anon USING (true) WITH CHECK (true);

-- ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
-- 5. REALTIME
-- ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
-- Enable realtime subscriptions for tables the dashboard listens to.

ALTER TABLE command_queue REPLICA IDENTITY FULL;
ALTER TABLE execution_logs REPLICA IDENTITY FULL;
ALTER TABLE worker_status REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE command_queue, execution_logs, worker_status;

-- ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
-- 6. UPDATED_AT TRIGGER FUNCTION AND TRIGGERS
-- ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Data tables
CREATE TRIGGER trg_employers_updated_at
    BEFORE UPDATE ON employers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_vacancies_updated_at
    BEFORE UPDATE ON vacancies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_vacancy_contacts_updated_at
    BEFORE UPDATE ON vacancy_contacts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_negotiations_updated_at
    BEFORE UPDATE ON negotiations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_resumes_updated_at
    BEFORE UPDATE ON resumes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_employer_sites_updated_at
    BEFORE UPDATE ON employer_sites
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Management tables (only those with updated_at)
CREATE TRIGGER trg_worker_config_updated_at
    BEFORE UPDATE ON worker_config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_worker_status_updated_at
    BEFORE UPDATE ON worker_status
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
