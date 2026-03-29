#!/usr/bin/env bash
set -euo pipefail

# -- Colors --
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BOLD='\033[1m'
NC='\033[0m' # No Color

info()    { echo -e "${BOLD}$*${NC}"; }
success() { echo -e "${GREEN}$*${NC}"; }
warn()    { echo -e "${YELLOW}$*${NC}"; }
error()   { echo -e "${RED}$*${NC}" >&2; }

ask() {
    local prompt="$1"
    local answer
    echo -en "${BOLD}${prompt} [y/N]: ${NC}"
    read -r answer
    [[ "$answer" =~ ^[Yy]$ ]]
}

# -- Prerequisites --
info "Checking prerequisites..."

missing=0

check_cmd() {
    local cmd="$1"
    local label="${2:-$cmd}"
    if command -v "$cmd" &>/dev/null; then
        success "  [ok] $label ($(command -v "$cmd"))"
    else
        error "  [missing] $label"
        missing=1
    fi
}

check_cmd python3 "Python 3"
check_cmd node    "Node.js"
check_cmd npm     "npm"

if [[ "$missing" -eq 1 ]]; then
    error ""
    error "Some prerequisites are missing. Please install them and try again."
    exit 1
fi

# Python version check
py_version=$(python3 -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")')
py_major=$(echo "$py_version" | cut -d. -f1)
py_minor=$(echo "$py_version" | cut -d. -f2)
if [[ "$py_major" -lt 3 || ("$py_major" -eq 3 && "$py_minor" -lt 11) ]]; then
    error "Python 3.11+ is required (found $py_version)"
    exit 1
fi
success "  Python version: $py_version"

echo ""

# -- .env file --
if [[ ! -f .env ]]; then
    if [[ -f .env.example ]]; then
        if ask "Create .env from .env.example?"; then
            cp .env.example .env
            success "Created .env -- please edit it with your credentials."
        fi
    else
        warn "No .env.example found, skipping .env creation."
    fi
else
    success ".env already exists, skipping."
fi

echo ""

# -- Python package --
if ask "Install Python package (pip install -e .)?"; then
    info "Installing Python package..."
    pip install -e . 2>&1 | tail -5
    success "Python package installed."
else
    warn "Skipped Python package installation."
fi

echo ""

# -- Dashboard --
if [[ -d dashboard ]]; then
    if ask "Install dashboard dependencies (npm install)?"; then
        info "Installing dashboard dependencies..."
        (cd dashboard && npm install) 2>&1 | tail -5
        success "Dashboard dependencies installed."
    else
        warn "Skipped dashboard setup."
    fi
else
    warn "No dashboard/ directory found, skipping."
fi

echo ""

# -- Done --
success "========================================="
success "  Setup complete!"
success "========================================="
echo ""
info "Next steps:"
echo "  1. Edit .env with your Supabase and HH.ru credentials"
echo "  2. Run:  hh-applicant-tool authorize"
echo "  3. Run:  hh-applicant-tool apply-vacancies --help"
echo "  4. Dashboard:  cd dashboard && npm run dev"
echo ""
