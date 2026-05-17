#!/bin/bash

set -e

REPO_URL="https://github.com/varun00391/hiring-app.git"

APP_DIR="$HOME/hirebot"

if [ ! -d "$APP_DIR" ]; then
    echo "Cloning repository..."
    git clone $REPO_URL $APP_DIR
else
    echo "Repository exists. Pulling latest code..."
    cd $APP_DIR
    git pull origin main
fi

cd $APP_DIR

docker compose up -d --build

echo "Application started"