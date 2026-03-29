# Dashboard Deployment

The dashboard is a Next.js application that connects to your Supabase project. It can be deployed locally, on Vercel, or via Docker.

## Prerequisites

- Node.js 20+
- A configured Supabase project (see [Supabase Setup](supabase-setup.md))

## Local Development

```bash
cd dashboard
cp .env.example .env.local
```

Edit `.env.local` and fill in your credentials:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

Then install dependencies and start the dev server:

```bash
npm install
npm run dev
```

The dashboard will be available at `http://localhost:3000`.

## Vercel Deployment

1. **Fork** this repository on GitHub.

2. **Import** the repository into [Vercel](https://vercel.com):
   - Click "Add New Project" and select your fork.
   - Set **Root Directory** to `dashboard/`.
   - Framework Preset will auto-detect Next.js.

3. **Add environment variables** in the Vercel project settings:

   | Variable | Value |
   |----------|-------|
   | `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon public key |
   | `DASHBOARD_SECRET` | A strong password for dashboard login |

4. **Deploy.** Vercel will build and deploy automatically.

5. **Login** at your Vercel URL using the `DASHBOARD_SECRET` value as the password.

### Updating

Push to your fork's `main` branch. Vercel will redeploy automatically.

## Docker

The dashboard can also run as part of the `docker-compose` setup. This is useful if you want to self-host everything on a single server.

```bash
cp .env.example .env
# Fill in SUPABASE_URL, SUPABASE_SERVICE_KEY, DASHBOARD_SECRET
docker-compose up -d
```

See the root `docker-compose.yml` for available profiles and configuration.

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon (public) key |
| `DASHBOARD_SECRET` | Yes (production) | Password for dashboard authentication |
