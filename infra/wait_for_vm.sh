#!/usr/bin/env bash
# =============================================================================
# wait_for_vm.sh — Wait for VM SSH + cloud-init completion before deploy
#
# Usage:
#   export VM_HOST=1.2.3.4 VM_USERNAME=azureuser
#   ./infra/wait_for_vm.sh
#
# Optional:
#   SSH_PRIVATE_KEY_FILE — path to private key (default: use agent / default key)
#   MAX_RETRIES          — default 60
#   RETRY_INTERVAL_SEC   — default 10
#   TIMEOUT_SEC          — default 600 (10 minutes)
# =============================================================================

set -euo pipefail

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
VM_HOST="${VM_HOST:-}"
VM_USERNAME="${VM_USERNAME:-azureuser}"
SSH_PRIVATE_KEY_FILE="${SSH_PRIVATE_KEY_FILE:-}"
MAX_RETRIES="${MAX_RETRIES:-60}"
RETRY_INTERVAL_SEC="${RETRY_INTERVAL_SEC:-10}"
TIMEOUT_SEC="${TIMEOUT_SEC:-600}"

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
log()  { printf '[wait_for_vm] %s\n' "$*"; }
warn() { printf '[wait_for_vm][WARN] %s\n' "$*" >&2; }
die()  { printf '[wait_for_vm][ERROR] %s\n' "$*" >&2; exit 1; }

ssh_base_args=(
  -o StrictHostKeyChecking=no
  -o UserKnownHostsFile=/dev/null
  -o ConnectTimeout=10
  -o BatchMode=yes
)

if [[ -n "$SSH_PRIVATE_KEY_FILE" ]]; then
  [[ -f "$SSH_PRIVATE_KEY_FILE" ]] || die "SSH key file not found: $SSH_PRIVATE_KEY_FILE"
  ssh_base_args+=(-i "$SSH_PRIVATE_KEY_FILE")
fi

run_ssh() {
  ssh "${ssh_base_args[@]}" "${VM_USERNAME}@${VM_HOST}" "$@"
}

# ---------------------------------------------------------------------------
# Pre-flight
# ---------------------------------------------------------------------------
[[ -n "$VM_HOST" ]] || die "VM_HOST is required (public IP or DNS)."

START_TIME="$(date +%s)"
attempt=0

log "Waiting for VM at ${VM_USERNAME}@${VM_HOST} (timeout=${TIMEOUT_SEC}s)..."

# ---------------------------------------------------------------------------
# Phase 1: Wait for SSH port / connectivity
# ---------------------------------------------------------------------------
while (( attempt < MAX_RETRIES )); do
  attempt=$((attempt + 1))
  elapsed=$(( $(date +%s) - START_TIME ))

  if (( elapsed > TIMEOUT_SEC )); then
    die "Timed out after ${TIMEOUT_SEC}s waiting for VM SSH."
  fi

  if run_ssh "echo ssh_ok" >/dev/null 2>&1; then
    log "SSH reachable on attempt $attempt (${elapsed}s elapsed)."
    break
  fi

  log "SSH not ready (attempt $attempt/$MAX_RETRIES) — retrying in ${RETRY_INTERVAL_SEC}s..."
  sleep "$RETRY_INTERVAL_SEC"
done

if ! run_ssh "echo ssh_ok" >/dev/null 2>&1; then
  die "VM SSH never became reachable."
fi

# ---------------------------------------------------------------------------
# Phase 2: Wait for cloud-init to finish
# ---------------------------------------------------------------------------
attempt=0
log "SSH up — waiting for cloud-init to complete..."

while (( attempt < MAX_RETRIES )); do
  attempt=$((attempt + 1))
  elapsed=$(( $(date +%s) - START_TIME ))

  if (( elapsed > TIMEOUT_SEC )); then
    die "Timed out after ${TIMEOUT_SEC}s waiting for cloud-init."
  fi

  # cloud-init status --wait blocks until done; use short remote check instead
  cloud_init_status="$(run_ssh "cloud-init status 2>/dev/null || echo unknown" 2>/dev/null || echo unknown)"

  if [[ "$cloud_init_status" == *"status: done"* ]]; then
    log "cloud-init finished (${elapsed}s elapsed)."
    break
  fi

  if [[ "$cloud_init_status" == *"status: error"* ]]; then
    warn "cloud-init reported error — fetching logs..."
    run_ssh "sudo tail -n 50 /var/log/cloud-init-output.log" || true
    die "cloud-init failed on VM."
  fi

  log "cloud-init status: $cloud_init_status (attempt $attempt/$MAX_RETRIES)"
  sleep "$RETRY_INTERVAL_SEC"
done

# ---------------------------------------------------------------------------
# Phase 3: Verify Docker + Compose V2 installed by cloud-init
# ---------------------------------------------------------------------------
log "Verifying Docker and Compose V2..."
run_ssh "docker --version && docker compose version"

# Optional bootstrap marker from cloud-init
if run_ssh "test -f /var/lib/cloud/instance/hirebot-bootstrap-complete" 2>/dev/null; then
  log "Bootstrap marker found — VM ready for deployment."
else
  warn "Bootstrap marker not found; Docker checks passed — proceeding."
fi

log "VM is ready for application deployment."
