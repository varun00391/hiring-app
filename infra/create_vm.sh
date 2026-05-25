#!/usr/bin/env bash
# =============================================================================
# create_vm.sh — Idempotently provision Azure VM + networking + cloud-init
#
# Usage:
#   export RESOURCE_GROUP=hirebot-rg VM_NAME=hirebot-vm SSH_PUBLIC_KEY="$(cat ~/.ssh/id_rsa.pub)"
#   ./infra/create_vm.sh
#
# Required env vars:
#   SSH_PUBLIC_KEY — public key for VM admin user (must match SSH_PRIVATE_KEY secret)
#
# Optional env vars (defaults shown):
#   RESOURCE_GROUP, LOCATION, VM_NAME, VM_SIZE, ADMIN_USERNAME, ACR_NAME
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
RESOURCE_GROUP="${RESOURCE_GROUP:-hirebot-rg}"
LOCATION="${LOCATION:-eastus}"
VM_NAME="${VM_NAME:-hirebot-vm}"
VM_SIZE="${VM_SIZE:-Standard_B2s}"
ADMIN_USERNAME="${ADMIN_USERNAME:-azureuser}"
ACR_NAME="${ACR_NAME:-hirebotacr}"

VNET_NAME="${VNET_NAME:-${VM_NAME}-vnet}"
SUBNET_NAME="${SUBNET_NAME:-${VM_NAME}-subnet}"
NSG_NAME="${NSG_NAME:-${VM_NAME}-nsg}"
PUBLIC_IP_NAME="${PUBLIC_IP_NAME:-${VM_NAME}-pip}"
NIC_NAME="${NIC_NAME:-${VM_NAME}-nic}"

UBUNTU_IMAGE="${UBUNTU_IMAGE:-Canonical:0001-com-ubuntu-server-jammy:22_04-lts-gen2:latest}"
CLOUD_INIT_FILE="${CLOUD_INIT_FILE:-${SCRIPT_DIR}/cloud-init.yml}"

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
log()  { printf '[create_vm] %s\n' "$*"; }
warn() { printf '[create_vm][WARN] %s\n' "$*" >&2; }
die()  { printf '[create_vm][ERROR] %s\n' "$*" >&2; exit 1; }

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || die "Required command not found: $1"
}

resource_exists() {
  # Usage: resource_exists <az show command...>
  "$@" >/dev/null 2>&1
}

# Azure CLI --custom-data must be latin-1 encodable (ASCII-safe).
prepare_custom_data() {
  local src="$1"
  local dest
  dest="$(mktemp)"
  python3 - "$src" "$dest" <<'PY'
import sys

src, dest = sys.argv[1], sys.argv[2]
text = open(src, encoding="utf-8").read()
for old, new in [
    ("\u2014", "-"), ("\u2013", "-"),
    ("\u2018", "'"), ("\u2019", "'"),
    ("\u201c", '"'), ("\u201d", '"'),
]:
    text = text.replace(old, new)
text = text.encode("latin-1", errors="replace").decode("latin-1")
open(dest, "w", encoding="latin-1").write(text)
PY
  echo "$dest"
}

# ---------------------------------------------------------------------------
# Pre-flight
# ---------------------------------------------------------------------------
require_cmd az

if ! az account show >/dev/null 2>&1; then
  die "Not logged into Azure CLI. Run 'az login' or configure AZURE_CREDENTIALS."
fi

[[ -f "$CLOUD_INIT_FILE" ]] || die "cloud-init file not found: $CLOUD_INIT_FILE"
[[ -n "${SSH_PUBLIC_KEY:-}" ]] || die "SSH_PUBLIC_KEY is required (public half of deploy key pair)."

log "Target: vm='$VM_NAME' rg='$RESOURCE_GROUP' location='$LOCATION' size='$VM_SIZE'"

# Ensure resource group exists (create_vm may run standalone after create_acr)
if ! resource_exists az group show --name "$RESOURCE_GROUP"; then
  log "Resource group '$RESOURCE_GROUP' not found — creating..."
  az group create --name "$RESOURCE_GROUP" --location "$LOCATION" --output none
fi

# ---------------------------------------------------------------------------
# Virtual Network + Subnet (idempotent)
# ---------------------------------------------------------------------------
if resource_exists az network vnet show --resource-group "$RESOURCE_GROUP" --name "$VNET_NAME"; then
  log "VNet '$VNET_NAME' already exists — skipping."
else
  log "Creating VNet '$VNET_NAME'..."
  az network vnet create \
    --resource-group "$RESOURCE_GROUP" \
    --name "$VNET_NAME" \
    --location "$LOCATION" \
    --address-prefix 10.10.0.0/16 \
    --subnet-name "$SUBNET_NAME" \
    --subnet-prefix 10.10.1.0/24 \
    --output none
fi

# ---------------------------------------------------------------------------
# Network Security Group — ports 22, 80, 443, 8000, 8080 (idempotent)
# ---------------------------------------------------------------------------
if resource_exists az network nsg show --resource-group "$RESOURCE_GROUP" --name "$NSG_NAME"; then
  log "NSG '$NSG_NAME' already exists — ensuring rules..."
else
  log "Creating NSG '$NSG_NAME'..."
  az network nsg create \
    --resource-group "$RESOURCE_GROUP" \
    --name "$NSG_NAME" \
    --location "$LOCATION" \
    --output none
fi

ensure_nsg_rule() {
  local rule_name="$1"
  local port="$2"
  local priority="$3"

  if az network nsg rule show \
    --resource-group "$RESOURCE_GROUP" \
    --nsg-name "$NSG_NAME" \
    --name "$rule_name" >/dev/null 2>&1; then
    log "NSG rule '$rule_name' already exists — skipping."
  else
    log "Creating NSG rule '$rule_name' (port $port)..."
    az network nsg rule create \
      --resource-group "$RESOURCE_GROUP" \
      --nsg-name "$NSG_NAME" \
      --name "$rule_name" \
      --priority "$priority" \
      --direction Inbound \
      --access Allow \
      --protocol Tcp \
      --source-address-prefixes '*' \
      --source-port-ranges '*' \
      --destination-address-prefixes '*' \
      --destination-port-ranges "$port" \
      --output none
  fi
}

ensure_nsg_rule "AllowSSH"       22   1000
ensure_nsg_rule "AllowHTTP"      80   1010
ensure_nsg_rule "AllowHTTPS"     443  1020
ensure_nsg_rule "AllowBackend"   8000 1030
ensure_nsg_rule "AllowFrontend"  8080 1040

# Associate NSG with subnet (safe to re-run)
az network vnet subnet update \
  --resource-group "$RESOURCE_GROUP" \
  --vnet-name "$VNET_NAME" \
  --name "$SUBNET_NAME" \
  --network-security-group "$NSG_NAME" \
  --output none

# ---------------------------------------------------------------------------
# Public IP (idempotent)
# ---------------------------------------------------------------------------
if resource_exists az network public-ip show --resource-group "$RESOURCE_GROUP" --name "$PUBLIC_IP_NAME"; then
  log "Public IP '$PUBLIC_IP_NAME' already exists — skipping."
else
  log "Creating public IP '$PUBLIC_IP_NAME'..."
  az network public-ip create \
    --resource-group "$RESOURCE_GROUP" \
    --name "$PUBLIC_IP_NAME" \
    --location "$LOCATION" \
    --sku Standard \
    --allocation-method Static \
    --output none
fi

# ---------------------------------------------------------------------------
# Network Interface (idempotent)
# ---------------------------------------------------------------------------
if resource_exists az network nic show --resource-group "$RESOURCE_GROUP" --name "$NIC_NAME"; then
  log "NIC '$NIC_NAME' already exists — skipping."
else
  log "Creating NIC '$NIC_NAME'..."
  az network nic create \
    --resource-group "$RESOURCE_GROUP" \
    --name "$NIC_NAME" \
    --location "$LOCATION" \
    --vnet-name "$VNET_NAME" \
    --subnet "$SUBNET_NAME" \
    --network-security-group "$NSG_NAME" \
    --public-ip-address "$PUBLIC_IP_NAME" \
    --output none
fi

# ---------------------------------------------------------------------------
# Virtual Machine (idempotent — skip if already exists)
# ---------------------------------------------------------------------------
if resource_exists az vm show --resource-group "$RESOURCE_GROUP" --name "$VM_NAME"; then
  warn "VM '$VM_NAME' already exists — skipping VM create."
else
  log "Creating VM '$VM_NAME' with cloud-init bootstrap..."
  CUSTOM_DATA_FILE="$(prepare_custom_data "$CLOUD_INIT_FILE")"
  trap 'rm -f "$CUSTOM_DATA_FILE"' RETURN
  az vm create \
    --resource-group "$RESOURCE_GROUP" \
    --name "$VM_NAME" \
    --location "$LOCATION" \
    --size "$VM_SIZE" \
    --nics "$NIC_NAME" \
    --image "$UBUNTU_IMAGE" \
    --admin-username "$ADMIN_USERNAME" \
    --authentication-type ssh \
    --ssh-key-values "$SSH_PUBLIC_KEY" \
    --assign-identity \
    --custom-data "$CUSTOM_DATA_FILE" \
    --os-disk-name "${VM_NAME}-osdisk" \
    --storage-sku Premium_LRS \
    --tags project=hirebot managed-by=github-actions \
    --output none
  log "VM created."
fi

# ---------------------------------------------------------------------------
# Grant VM managed identity AcrPull on ACR (idempotent)
# ---------------------------------------------------------------------------
if resource_exists az acr show --name "$ACR_NAME" --resource-group "$RESOURCE_GROUP"; then
  PRINCIPAL_ID="$(az vm show \
    --resource-group "$RESOURCE_GROUP" \
    --name "$VM_NAME" \
    --query identity.principalId \
    --output tsv)"

  ACR_ID="$(az acr show \
    --name "$ACR_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --query id \
    --output tsv)"

  if [[ -n "$PRINCIPAL_ID" && -n "$ACR_ID" ]]; then
    # Role assignment is idempotent at the Azure level — duplicate returns existing
    log "Granting AcrPull to VM managed identity on ACR '$ACR_NAME'..."
    az role assignment create \
      --assignee-object-id "$PRINCIPAL_ID" \
      --assignee-principal-type ServicePrincipal \
      --role AcrPull \
      --scope "$ACR_ID" \
      --output none 2>/dev/null || log "AcrPull role assignment already present or pending propagation."
  else
    warn "Could not resolve VM identity or ACR ID — skip AcrPull assignment."
  fi
else
  warn "ACR '$ACR_NAME' not found in '$RESOURCE_GROUP'. Run create_acr.sh first."
fi

# ---------------------------------------------------------------------------
# Fetch public IP
# ---------------------------------------------------------------------------
PUBLIC_IP="$(az network public-ip show \
  --resource-group "$RESOURCE_GROUP" \
  --name "$PUBLIC_IP_NAME" \
  --query ipAddress \
  --output tsv)"

[[ -n "$PUBLIC_IP" ]] || die "Failed to resolve VM public IP."

log "VM public IP: $PUBLIC_IP"

if [[ -n "${GITHUB_OUTPUT:-}" ]]; then
  {
    echo "vm_name=$VM_NAME"
    echo "vm_public_ip=$PUBLIC_IP"
    echo "vm_username=$ADMIN_USERNAME"
  } >>"$GITHUB_OUTPUT"
fi

cat <<EOF

=============================================================================
VM provisioning complete
=============================================================================
  VM Name        : $VM_NAME
  Public IP      : $PUBLIC_IP
  Admin Username : $ADMIN_USERNAME
  Resource Group : $RESOURCE_GROUP

Store these GitHub secrets for deploy workflow:
  VM_HOST=$PUBLIC_IP
  VM_USERNAME=$ADMIN_USERNAME
  SSH_PRIVATE_KEY=<private key matching SSH_PUBLIC_KEY>

Verify bootstrap:
  ssh ${ADMIN_USERNAME}@${PUBLIC_IP} 'cloud-init status --long'
=============================================================================
EOF
