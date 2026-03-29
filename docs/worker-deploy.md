# Worker Deployment

The worker is a long-running Python process that polls the Supabase `command_queue` table, executes CLI operations against the hh.ru API, and writes results back. It is the bridge between the dashboard and hh.ru.

## Prerequisites

- A configured Supabase project (see [Supabase Setup](supabase-setup.md))
- An authorized hh.ru account (`hh-applicant-tool authorize`)

## Option A: Docker (recommended)

The simplest way to run the worker.

```bash
cp .env.example .env
```

Edit `.env` and fill in:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key-here
```

Start the worker:

```bash
docker-compose --profile worker up -d
```

View logs:

```bash
docker-compose --profile worker logs -f
```

### Updating

```bash
git pull
docker-compose --profile worker up -d --build
```

## Option B: systemd on VPS

For running the worker as a system service on a Linux server.

### 1. Clone and install

```bash
git clone https://github.com/nasyrov-ai/hh-applicant-tool.git /opt/hh-applicant-tool
cd /opt/hh-applicant-tool
python3 -m venv .venv
.venv/bin/pip install -e '.[worker]'
```

### 2. Install the systemd service

```bash
sudo cp deploy/hh-worker.service /etc/systemd/system/
```

### 3. Edit the service file

Open `/etc/systemd/system/hh-worker.service` and adjust:

- `User` -- your Linux user
- `WorkingDirectory` -- path to the cloned repository
- `EnvironmentFile` -- path to your `.env.worker` file

### 4. Create the environment file

```bash
cat > /opt/hh-applicant-tool/.env.worker <<EOF
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key-here
EOF
chmod 600 /opt/hh-applicant-tool/.env.worker
```

### 5. Enable and start

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now hh-worker
```

### Updating

```bash
cd /opt/hh-applicant-tool
git pull
.venv/bin/pip install -e '.[worker]'
sudo systemctl restart hh-worker
```

## Option C: Deploy Script

A convenience script that handles syncing, installing, and restarting the worker on a remote server.

```bash
./deploy/deploy-worker.sh user@your-server
```

This script:

1. Syncs the repository to `/opt/hh-applicant-tool` on the remote server via rsync.
2. Creates a virtualenv and installs dependencies.
3. Copies the systemd service file and restarts the worker.

Make sure the remote server has Python 3.11+ and that you have SSH access with sudo privileges. Create the `.env.worker` file on the server before running the script for the first time.

## Monitoring

### Dashboard

The dashboard shows a worker online/offline indicator based on the `worker_status` table. The worker sends a heartbeat every 30 seconds.

### Logs

For systemd deployments:

```bash
journalctl -u hh-worker -f
```

For Docker deployments:

```bash
docker-compose --profile worker logs -f
```

### Supabase

Check the `worker_status` table directly in the Supabase Table Editor to see:

- `status` -- current state (`online`, `offline`, `unknown`)
- `last_seen_at` -- last heartbeat timestamp
- `version` -- worker version
- `hostname` -- server hostname
