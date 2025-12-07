#!/bin/bash
set -e

# User data script for ML services EC2 instance
# Installs Docker and sets up both sentiment and relevance services

echo "🚀 Setting up ML services EC2 instance"

# Update system
dnf update -y

# Install Docker
dnf install -y docker
systemctl start docker
systemctl enable docker

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Create app directory
mkdir -p /opt/ml-services
cd /opt/ml-services

# Create docker-compose.yml
cat > docker-compose.yml <<'EOF'
version: '3.8'

services:
  sentiment:
    image: 767397974418.dkr.ecr.us-east-1.amazonaws.com/marketminute-sentiment:latest
    container_name: sentiment
    ports:
      - "8001:8001"
    environment:
      - HOST=0.0.0.0
      - PORT=8001
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8001/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  relevance:
    image: 767397974418.dkr.ecr.us-east-1.amazonaws.com/marketminute-relevance:latest
    container_name: relevance
    ports:
      - "8002:8002"
    environment:
      - HOST=0.0.0.0
      - PORT=8002
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8002/health"]
      interval: 30s
      timeout: 10s
      retries: 3
EOF

# Login to ECR (instance needs IAM role with ECR read permissions)
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 767397974418.dkr.ecr.us-east-1.amazonaws.com

# Pull and start services
docker-compose pull
docker-compose up -d

echo "✅ ML services started"
echo "Sentiment: http://localhost:8001"
echo "Relevance: http://localhost:8002"
