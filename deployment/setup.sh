#!/bin/bash

set -e

echo "Updating server..."

sudo apt update && sudo apt upgrade -y

echo "Installing Git..."

sudo apt install git -y

echo "Installing Docker..."

sudo apt install docker.io docker-compose-v2 -y

sudo systemctl enable docker
sudo systemctl start docker

sudo usermod -aG docker $USER

echo "Setup complete"