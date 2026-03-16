#!/bin/bash

set -e

# App name used in PM2
APP_NAME="eClassify"

# Project directory on the server
PROJECT_DIR="/home/arablaza/public_html"

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
  wget -qO- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
  \. "$NVM_DIR/nvm.sh"
fi

# Install/use Node.js 20 (try short form first, then specific LTS version)
status_message "Setting up Node.js"
NODE_VER="20"
if ! nvm install 20 2>/dev/null; then
  # Fallback: install Node 20 LTS by exact version (when "20" alias is not found)
  if nvm install 20.18.0 2>/dev/null; then
    NODE_VER="20.18.0"
  elif nvm install 20.20.0 2>/dev/null; then
    NODE_VER="20.20.0"
  else
    # Last resort: current LTS or latest node
    nvm install lts/iron 2>/dev/null && NODE_VER="lts/iron" || { nvm install node; NODE_VER="node"; }
  fi
fi
nvm use "$NODE_VER"

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

# Stop and delete ALL old eClassify PM2 processes before starting fresh
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

# Update .htaccess file
status_message "Updating .htaccess file"
sed -i "s/http:\/\/127\.0\.0\.1:[0-9]*\//http:\/\/127.0.0.1:$PORT\//g" .htaccess

# Update package.json file
status_message "Updating package.json file"
sed -i "s/NODE_PORT=*[0-9]*/NODE_PORT=$PORT/" package.json

# Install project dependencies
status_message "Installing project dependencies"
npm install --loglevel verbose

# Build the project
status_message "Building the project"
npm run build

# Start the project with PM2 (single instance)
status_message "Starting the project with PM2"
pm2 start npm --name "$APP_NAME" -- start

# Save PM2 process list so it survives reboots
pm2 save

# Display PM2 processes
status_message "Displaying PM2 processes"
pm2 ls

status_message "Installation and deployment complete!"