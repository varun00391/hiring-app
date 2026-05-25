#!/usr/bin/env bash
# =============================================================================
# create_acr.sh — Idempotently provision Azure Resource Group + Container Registry
#
# Usage:
#   export RESOURCE_GROUP=hirebot-rg ACR_NAME=hirebotacr LOCATION=eastus
#   ./infra/create_acr.sh
#
# Required env vars (or defaults):
#   RESOURCE_GROUP — Azure resource group name
#   ACR_NAME       — globally unique ACR name (alphanumeric only, 5–50 chars)
#   LOCATION       — Azure region
# =============================================================================

set -euo pipefail

# ---------------------------------------------------------------------------
# Configuration (override via environment)
# ---------------------------------------------------------------------------
RESOURCE_GROUP="${RESOURCE_GROUP:-hirebot-rg}"
ACR_NAME="${ACR_NAME:-hirebotacr}"
LOCATION="${LOCATION:-eastus}"
ACR_SKU="${ACR_SKU:-Basic}"

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
log()  { printf '[create_acr] %s\n' "$*"; }
warn() { printf '[create_acr][WARN] %s\n' "$*" >&2; }
die()  { printf '[create_acr][ERROR] %s\n' "$*" >&2; exit 1; }

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || die "Required command not found: $1"
}

# ---------------------------------------------------------------------------
# Pre-flight
# ---------------------------------------------------------------------------
require_cmd az

if ! az account show >/dev/null 2>&1; then
  die "Not logged into Azure CLI. Run 'az login' or configure AZURE_CREDENTIALS."
fi

# ACR names must be alphanumeric only
if [[ ! "$ACR_NAME" =~ ^[a-zA-Z0-9]{5,50}$ ]]; then
  die "ACR_NAME must be 5–50 alphanumeric characters (no hyphens). Got: $ACR_NAME"
fi

log "Target: resource group='$RESOURCE_GROUP' acr='$ACR_NAME' location='$LOCATION'"

# ---------------------------------------------------------------------------
# Resource Group (idempotent)
# ---------------------------------------------------------------------------
if az group show --name "$RESOURCE_GROUP" >/dev/null 2>&1; then
  log "Resource group '$RESOURCE_GROUP' already exists — skipping create."
else
  log "Creating resource group '$RESOURCE_GROUP' in '$LOCATION'..."
  az group create \
    --name "$RESOURCE_GROUP" \
    --location "$LOCATION" \
    --tags project=hirebot managed-by=github-actions \
    --output none
  log "Resource group created."
fi

# ---------------------------------------------------------------------------
# Azure Container Registry (idempotent)
# ---------------------------------------------------------------------------
if az acr show --name "$ACR_NAME" --resource-group "$RESOURCE_GROUP" >/dev/null 2>&1; then
  log "ACR '$ACR_NAME' already exists — skipping create."
else
  log "Creating ACR '$ACR_NAME' (sku=$ACR_SKU)..."
  # admin-enabled=false: prefer managed identity / service principal for pulls
  az acr create \
    --resource-group "$RESOURCE_GROUP" \
    --name "$ACR_NAME" \
    --sku "$ACR_SKU" \
    --admin-enabled false \
    --tags project=hirebot managed-by=github-actions \
    --output none
  log "ACR created."
fi

# ---------------------------------------------------------------------------
# Fetch login server (always refresh — useful for downstream steps)
# ---------------------------------------------------------------------------
LOGIN_SERVER="$(az acr show \
  --name "$ACR_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --query loginServer \
  --output tsv)"

[[ -n "$LOGIN_SERVER" ]] || die "Failed to resolve ACR login server."

log "ACR login server: $LOGIN_SERVER"

# Emit outputs for GitHub Actions / callers
if [[ -n "${GITHUB_OUTPUT:-}" ]]; then
  {
    echo "acr_name=$ACR_NAME"
    echo "acr_login_server=$LOGIN_SERVER"
    echo "resource_group=$RESOURCE_GROUP"
  } >>"$GITHUB_OUTPUT"
fi

# Human-readable summary
cat <<EOF

=============================================================================
ACR provisioning complete
=============================================================================
  Resource Group : $RESOURCE_GROUP
  Location       : $LOCATION
  ACR Name       : $ACR_NAME
  Login Server   : $LOGIN_SERVER

Next steps:
  1. Store ACR_NAME and RESOURCE_GROUP as GitHub repository secrets.
  2. Include ACR_LOGIN_SERVER=$LOGIN_SERVER in your ENV_FILE secret if
     docker-compose on the VM references \${ACR_LOGIN_SERVER}.
  3. Run create_vm.sh to provision the VM and grant AcrPull access.
=============================================================================
EOF
