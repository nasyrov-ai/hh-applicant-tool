# Supabase Setup

Each user creates their own Supabase project. There is no shared backend -- your data stays in your own database.

## 1. Create a Supabase Account

Go to [supabase.com](https://supabase.com) and sign up for a free account. The free tier is more than sufficient for this project.

## 2. Create a New Project

1. Click **New Project** in the Supabase dashboard.
2. Choose any region (pick one closest to your VPS if you run a worker).
3. Set a strong database password and save it somewhere -- you will not need it for normal operation, but it is required for direct PostgreSQL access.
4. Wait for the project to finish provisioning (usually under a minute).

## 3. Copy API Credentials

Go to **Settings > API** in your Supabase dashboard. You need three values:

| Value | Where to find it | Used by |
|-------|-------------------|---------|
| **Project URL** | `Settings > API > Project URL` | Dashboard, Worker |
| **anon public key** | `Settings > API > Project API keys > anon public` | Dashboard |
| **service_role key** | `Settings > API > Project API keys > service_role` | Worker |

> **Warning:** The `service_role` key bypasses Row Level Security. Never expose it in client-side code or commit it to version control.

## 4. Run the Schema Migration

1. Go to **SQL Editor** in the Supabase dashboard.
2. Click **New query**.
3. Open [`docs/supabase-schema.sql`](supabase-schema.sql) from this repository and copy its entire contents.
4. Paste into the SQL Editor and click **Run**.

This creates all tables, indexes, RLS policies, triggers, and realtime subscriptions.

## 5. Enable Realtime

Go to **Database > Replication** and verify that realtime is enabled for the following tables (the schema migration enables this automatically, but confirm):

- `command_queue`
- `execution_logs`
- `worker_status`

If they are not listed under "Source", add them manually.

## 6. Configure the Tool

Run the setup wizard:

```bash
hh-applicant-tool setup
```

Enter your Supabase URL and keys when prompted. This generates the `.env` files for the worker and dashboard.

Alternatively, configure manually:

```bash
# Root .env (for the worker)
cp .env.example .env
# Edit: SUPABASE_URL, SUPABASE_SERVICE_KEY

# Dashboard .env.local
cd dashboard
cp .env.example .env.local
# Edit: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
```

## 7. Verify

Open the **Table Editor** in Supabase. You should see the following tables:

- **Data tables:** `employers`, `vacancies`, `vacancy_contacts`, `negotiations`, `resumes`, `employer_sites`, `sync_log`
- **Management tables:** `command_queue`, `execution_logs`, `worker_config`, `worker_status`, `cron_schedules`, `blacklist`

If all tables are present, your Supabase project is ready.

## Schema Overview

```
Data tables (synced from hh.ru API):
  employers, vacancies, vacancy_contacts, negotiations, resumes, employer_sites

Management tables (dashboard <-> worker communication):
  command_queue       -- commands sent from dashboard to worker
  execution_logs      -- real-time log output per command
  worker_status       -- worker heartbeat and version info
  worker_config       -- key-value configuration store
  cron_schedules      -- scheduled recurring commands
  blacklist           -- blocked employers
  sync_log            -- tracks last sync time per table
```

## Troubleshooting

**"relation already exists" errors** -- Safe to ignore. The schema uses `CREATE TABLE IF NOT EXISTS`.

**Realtime not working** -- Make sure the tables are added to the `supabase_realtime` publication. You can check with:

```sql
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
```

**RLS blocking requests** -- The schema creates permissive policies for the `anon` role. If you have customized RLS, ensure the dashboard's anon key and the worker's service_role key both have appropriate access.
