#!/bin/bash

# Telegram Vocabulary Trainer - Deployment Script
# This script helps deploy the application to an Ubuntu server

set -e

echo "🚀 Telegram Vocabulary Trainer - Deployment Script"
echo "=================================================="

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    echo -e "${RED}Error: Please don't run as root${NC}"
    exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}Docker is not installed. Installing Docker...${NC}"
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
    echo -e "${GREEN}Docker installed successfully${NC}"
fi

# Check if docker-compose is installed
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${YELLOW}Docker Compose is not installed. Installing...${NC}"
    sudo apt-get update
    sudo apt-get install docker-compose-plugin -y
    echo -e "${GREEN}Docker Compose installed successfully${NC}"
fi

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}.env file not found. Creating from template...${NC}"
    cp .env.example .env
    echo -e "${RED}IMPORTANT: Please edit .env file with your configuration${NC}"
    echo "Press Enter to continue after editing .env..."
    read
fi

# Build and start services
echo -e "${GREEN}Building and starting services...${NC}"
docker-compose build
docker-compose up -d

# Wait for services to be healthy
echo -e "${YELLOW}Waiting for services to start...${NC}"
sleep 10

# Check service status
echo -e "${GREEN}Service Status:${NC}"
docker-compose ps

echo ""
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo "Services are running:"
echo "- Backend API: http://localhost:5005"
echo "- Swagger Docs: http://localhost:5005/api"
echo "- WebApp: http://localhost:5173"
echo ""
echo "To view logs: docker-compose logs -f"
echo "To restart: docker-compose restart"
echo "To stop: docker-compose down"
echo ""

# Setup webhook if telegram token is configured
if [ -n "$TELEGRAM_BOT_TOKEN" ]; then
    echo -e "${YELLOW}Setting up Telegram webhook...${NC}"
    echo "Please configure your webhook URL:"
    echo "curl -F \"url=https://yourdomain.com/bot/webhook/$TELEGRAM_BOT_TOKEN\" \\"
    echo "  https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook"
fi

