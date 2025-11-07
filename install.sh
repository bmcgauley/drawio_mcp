#!/bin/bash

# Draw.io Diagram Generator MCP Server - Installation Script
# This script automates the installation and configuration process

set -e  # Exit on error

echo "═══════════════════════════════════════════════════════════════════════════"
echo "  Draw.io Diagram Generator MCP Server - Installation"
echo "═══════════════════════════════════════════════════════════════════════════"
echo

# Check Node.js version
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is not installed"
    echo "   Please install Node.js 20.0.0 or higher from https://nodejs.org"
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo "❌ Error: Node.js version $NODE_VERSION is too old"
    echo "   Please install Node.js 20.0.0 or higher"
    exit 1
fi

echo "✓ Node.js $(node --version) detected"
echo

# Check npm
if ! command -v npm &> /dev/null; then
    echo "❌ Error: npm is not installed"
    exit 1
fi

echo "✓ npm $(npm --version) detected"
echo

# Determine installation directory
INSTALL_DIR="${1:-$HOME/.mcp-servers/drawio-diagram-generator}"

echo "Installation directory: $INSTALL_DIR"
echo

# Check if already installed
if [ -d "$INSTALL_DIR" ]; then
    echo "⚠️  Warning: Directory already exists"
    read -p "   Overwrite existing installation? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Installation cancelled"
        exit 0
    fi
    rm -rf "$INSTALL_DIR"
fi

# Create installation directory
mkdir -p "$INSTALL_DIR"
echo "✓ Created installation directory"

# Extract files
echo "Extracting files..."
tar -xzf drawio-diagram-generator.tar.gz -C "$INSTALL_DIR"
echo "✓ Files extracted"
echo

# Install dependencies
echo "Installing dependencies (this may take a minute)..."
cd "$INSTALL_DIR"
npm install --silent
echo "✓ Dependencies installed"
echo

# Verify build
if [ ! -f "$INSTALL_DIR/build/index.js" ]; then
    echo "❌ Error: Build failed - index.js not found"
    exit 1
fi

echo "✓ Build verified"
echo

# Detect MCP client
echo "Detecting MCP clients..."
echo

CLAUDE_DESKTOP_CONFIG=""
DETECTED_CLIENT=""

# Check for Claude Desktop
if [ "$(uname)" == "Darwin" ]; then
    # macOS
    CLAUDE_DESKTOP_CONFIG="$HOME/Library/Application Support/Claude/claude_desktop_config.json"
    if [ -f "$CLAUDE_DESKTOP_CONFIG" ]; then
        DETECTED_CLIENT="Claude Desktop (macOS)"
    fi
elif [ "$(expr substr $(uname -s) 1 5)" == "Linux" ]; then
    # Linux
    CLAUDE_DESKTOP_CONFIG="$HOME/.config/Claude/claude_desktop_config.json"
    if [ -f "$CLAUDE_DESKTOP_CONFIG" ]; then
        DETECTED_CLIENT="Claude Desktop (Linux)"
    fi
elif [ "$(expr substr $(uname -s) 1 10)" == "MINGW32_NT" ] || [ "$(expr substr $(uname -s) 1 10)" == "MINGW64_NT" ]; then
    # Windows
    CLAUDE_DESKTOP_CONFIG="$APPDATA/Claude/claude_desktop_config.json"
    if [ -f "$CLAUDE_DESKTOP_CONFIG" ]; then
        DETECTED_CLIENT="Claude Desktop (Windows)"
    fi
fi

if [ -n "$DETECTED_CLIENT" ]; then
    echo "✓ Detected: $DETECTED_CLIENT"
    echo "  Config file: $CLAUDE_DESKTOP_CONFIG"
    echo
    
    read -p "Configure Claude Desktop automatically? (Y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Nn]$ ]]; then
        # Backup existing config
        if [ -f "$CLAUDE_DESKTOP_CONFIG" ]; then
            cp "$CLAUDE_DESKTOP_CONFIG" "$CLAUDE_DESKTOP_CONFIG.backup.$(date +%s)"
            echo "✓ Backed up existing config"
        fi
        
        # Create or update config
        if [ ! -f "$CLAUDE_DESKTOP_CONFIG" ]; then
            mkdir -p "$(dirname "$CLAUDE_DESKTOP_CONFIG")"
            echo '{"mcpServers": {}}' > "$CLAUDE_DESKTOP_CONFIG"
        fi
        
        # Add our server to config (using Python for JSON manipulation)
        python3 -c "
import json
import sys

config_file = '$CLAUDE_DESKTOP_CONFIG'
with open(config_file, 'r') as f:
    config = json.load(f)

if 'mcpServers' not in config:
    config['mcpServers'] = {}

config['mcpServers']['drawio'] = {
    'command': 'node',
    'args': ['$INSTALL_DIR/build/index.js']
}

with open(config_file, 'w') as f:
    json.dump(config, f, indent=2)

print('✓ Configuration updated')
" || {
            echo "⚠️  Automatic configuration failed"
            echo "   Please configure manually (see instructions below)"
        }
    fi
else
    echo "ℹ️  No Claude Desktop installation detected"
    echo "   You can configure manually for your MCP client"
fi

echo
echo "═══════════════════════════════════════════════════════════════════════════"
echo "  Installation Complete! ✓"
echo "═══════════════════════════════════════════════════════════════════════════"
echo
echo "Installation path: $INSTALL_DIR"
echo

if [ -n "$DETECTED_CLIENT" ]; then
    echo "Next steps:"
    echo "  1. Restart $DETECTED_CLIENT"
    echo "  2. Ask Claude: 'Create a simple flowchart for user login'"
    echo "  3. Save the generated XML as a .drawio file"
    echo "  4. Open in draw.io"
else
    echo "Manual Configuration Required:"
    echo
    echo "For Claude Desktop, add to claude_desktop_config.json:"
    echo
    echo '  "mcpServers": {'
    echo '    "drawio": {'
    echo '      "command": "node",'
    echo '      "args": ["'$INSTALL_DIR'/build/index.js"]'
    echo '    }'
    echo '  }'
    echo
    echo "Config file locations:"
    echo "  macOS:   ~/Library/Application Support/Claude/claude_desktop_config.json"
    echo "  Linux:   ~/.config/Claude/claude_desktop_config.json"
    echo "  Windows: %APPDATA%\\Claude\\claude_desktop_config.json"
fi

echo
echo "Documentation:"
echo "  - Quick Start: See QUICKSTART.md"
echo "  - Full Docs:   See README.md"
echo "  - Examples:    See EXAMPLES.md"
echo
echo "Test the server:"
echo "  npx @modelcontextprotocol/inspector node $INSTALL_DIR/build/index.js"
echo
echo "═══════════════════════════════════════════════════════════════════════════"
