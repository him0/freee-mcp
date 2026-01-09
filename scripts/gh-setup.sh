#!/bin/bash
# SessionStart hook: GitHub CLI auto-installation for remote environments
# This script installs gh CLI when running in Claude Code on the Web
# following best practices: idempotent, fail-safe, proper logging

set -e

LOG_PREFIX="[gh-setup]"

log() {
    echo "$LOG_PREFIX $1" >&2
}

# Only run in remote Claude Code environment
if [ "$CLAUDE_CODE_REMOTE" != "true" ]; then
    exit 0
fi

log "Remote session detected, checking gh CLI..."

# Check if gh is already available
if command -v gh &>/dev/null; then
    log "gh CLI already available: $(gh --version | head -1)"
    exit 0
fi

# Determine install location: prefer /usr/local/bin if writable, else ~/.local/bin
if [ -w "/usr/local/bin" ]; then
    LOCAL_BIN="/usr/local/bin"
else
    LOCAL_BIN="$HOME/.local/bin"
    mkdir -p "$LOCAL_BIN"
fi

# Check if gh exists in local bin
if [ -x "$LOCAL_BIN/gh" ]; then
    log "gh found in $LOCAL_BIN"
    # Ensure PATH includes local bin (only needed for ~/.local/bin)
    if [ "$LOCAL_BIN" = "$HOME/.local/bin" ] && [[ ":$PATH:" != *":$LOCAL_BIN:"* ]]; then
        export PATH="$LOCAL_BIN:$PATH"
        # Persist to CLAUDE_ENV_FILE if available
        if [ -n "$CLAUDE_ENV_FILE" ]; then
            echo "export PATH=\"$LOCAL_BIN:\$PATH\"" >> "$CLAUDE_ENV_FILE"
            log "PATH updated in CLAUDE_ENV_FILE"
        fi
    fi
    exit 0
fi

log "Installing gh CLI to $LOCAL_BIN..."

# Create temp directory for installation
TEMP_DIR=$(mktemp -d)
trap "rm -rf $TEMP_DIR" EXIT

# Detect architecture
ARCH=$(uname -m)
case "$ARCH" in
    x86_64)
        GH_ARCH="amd64"
        ;;
    aarch64|arm64)
        GH_ARCH="arm64"
        ;;
    *)
        log "Unsupported architecture: $ARCH"
        exit 0  # Fail-safe: exit 0 even on failure
        ;;
esac

# Get latest version from GitHub API
log "Fetching latest gh CLI version..."
GH_VERSION=$(curl -sL https://api.github.com/repos/cli/cli/releases/latest | grep '"tag_name":' | sed -E 's/.*"v([^"]+)".*/\1/')

if [ -z "$GH_VERSION" ]; then
    log "Failed to get latest version, using fallback"
    GH_VERSION="2.82.2"
fi

GH_TARBALL="gh_${GH_VERSION}_linux_${GH_ARCH}.tar.gz"
GH_URL="https://github.com/cli/cli/releases/download/v${GH_VERSION}/${GH_TARBALL}"

log "Downloading gh v${GH_VERSION} for ${GH_ARCH}..."

if ! curl -sL "$GH_URL" -o "$TEMP_DIR/$GH_TARBALL"; then
    log "Failed to download gh CLI"
    exit 0  # Fail-safe
fi

log "Extracting..."
if ! tar -xzf "$TEMP_DIR/$GH_TARBALL" -C "$TEMP_DIR"; then
    log "Failed to extract gh CLI"
    exit 0  # Fail-safe
fi

# Move binary to local bin
if ! mv "$TEMP_DIR/gh_${GH_VERSION}_linux_${GH_ARCH}/bin/gh" "$LOCAL_BIN/gh"; then
    log "Failed to install gh CLI"
    exit 0  # Fail-safe
fi

chmod +x "$LOCAL_BIN/gh"

# Update PATH (only needed for ~/.local/bin)
if [ "$LOCAL_BIN" = "$HOME/.local/bin" ]; then
    export PATH="$LOCAL_BIN:$PATH"
    # Persist PATH to CLAUDE_ENV_FILE if available
    if [ -n "$CLAUDE_ENV_FILE" ]; then
        echo "export PATH=\"$LOCAL_BIN:\$PATH\"" >> "$CLAUDE_ENV_FILE"
        log "PATH persisted to CLAUDE_ENV_FILE"
    fi
fi

log "gh CLI installed successfully: $($LOCAL_BIN/gh --version | head -1)"
log ""
log "Hints for remote environment:"
log "  - origin/main is not fetched by default. Run: git fetch origin main"
log "  - Create PR: gh pr create --repo him0/freee-mcp --head <branch> --title \"Title\" --body \"Body\""
log "  - Update PR: gh pr edit <number> --repo him0/freee-mcp --title \"Title\" --body \"Body\""
exit 0
