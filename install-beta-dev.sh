#!/bin/bash

set -e

# App name used in PM2 (must be different from production "eClassify")
APP_NAME="Beta-eClassify"

# Project directory on the server (beta subdomain)
PROJECT_DIR="/home/arablaza/domains/beta.arablaza.com/public_html"

# Function to display status messages
status_message() {
    echo "==== $1 ===="
}

# Load NVM if already installed, otherwise install it
export NVM_DIR="$HOME/.nvm"
if [ -s "$NVM_DIR/nvm.sh" ]; then
  status_message "Loading existing NVM"
  \. "$NVM_DIR/nvm.sh"
else
  status_message "Installing NVM"
  wget -O nvm.sh https://raw.githubusercontent.com/creationix/nvm/master/install.sh
  bash nvm.sh
  \. "$NVM_DIR/nvm.sh"
fi

# Install/use Node.js 20
status_message "Setting up Node.js"
nvm install 20
nvm use 20

# Verify Node.js installation
node -v
npm -v

# Install PM2 globally if not present
if ! command -v pm2 &> /dev/null; then
  status_message "Installing PM2"
  npm install -g pm2
fi

# Change to project directory
status_message "Changing to project directory"
cd "$PROJECT_DIR"
echo "Working in: $(pwd)"

# Stop and delete ALL old Beta-eClassify PM2 processes before starting fresh
status_message "Cleaning up old PM2 processes"
pm2 delete "$APP_NAME" 2>/dev/null || true

# Function to find an available port
find_available_port() {
    for port in $(seq 8003 9001); do
        if ! sudo lsof -i :$port > /dev/null 2>&1; then
            echo $port
            return 0
        fi
    done
    echo "No available ports found between 8003 and 9001" >&2
    return 1
}

# Find an available port
status_message "Finding an available port"
PORT=$(find_available_port)
if [ $? -ne 0 ]; then
    exit 1
fi
echo "Found available port: $PORT"

# Write DEV-specific .htaccess: proxy EVERYTHING to Node (no serving _next from disk)
# In dev mode, Next.js serves _next/static/chunks from memory; Apache must not serve .next/ from disk.
status_message "Writing .htaccess for dev mode (proxy all to Node)"
cat > .htaccess << HTACCESS_EOF
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /
    RewriteRule ^.well-known/acme-challenge/(.*) /.well-known/acme-challenge/\$1 [L]
    RewriteRule ^(.*)\$ http://127.0.0.1:$PORT/\$1 [P,L]
</IfModule>
HTACCESS_EOF

# Update package.json file (so start script would use it if you ever switch to prod mode here)
status_message "Updating package.json file"
sed -i "s/NODE_PORT=*[0-9]*/NODE_PORT=$PORT/" package.json

# Install project dependencies
status_message "Installing project dependencies"
npm install --loglevel verbose

# DEV MODE: skip production build, run Next.js dev server (hot reload, dev errors)
status_message "Starting in DEV mode (no build)"
pm2 start npm --name "$APP_NAME" -- run dev -- -p "$PORT"

# Save PM2 process list so it survives reboots
pm2 save

# Display PM2 processes
status_message "Displaying PM2 processes"
pm2 ls

status_message "Installation and deployment complete! (Beta running in dev mode)"