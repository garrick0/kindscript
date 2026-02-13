#!/bin/bash

set -e

echo "🚀 Deploying Storybook to Production..."

# Require explicit confirmation
read -p "⚠️  Are you sure you want to deploy to PRODUCTION? (yes/no): " -r
if [[ ! $REPLY =~ ^yes$ ]]; then
    echo "❌ Deployment cancelled."
    exit 1
fi

# Configuration
ENVIRONMENT="production"
IMAGE_TAG="${1:-latest}"
NAMESPACE="induction"

# Run tests first
echo "🧪 Running tests..."
pnpm test || exit 1

# Build and tag image
echo "📦 Building Docker image..."
docker build -t induction-storybook:${IMAGE_TAG} -f Dockerfile ../..

# Tag for registry
echo "🏷️  Tagging image for registry..."
docker tag induction-storybook:${IMAGE_TAG} registry.example.com/induction/storybook:${IMAGE_TAG}

# Push to registry
echo "📤 Pushing image to registry..."
docker push registry.example.com/induction/storybook:${IMAGE_TAG}

# Create backup
echo "💾 Creating backup of current deployment..."
kubectl get deployment storybook -n ${NAMESPACE} -o yaml > deployment-backup-$(date +%Y%m%d-%H%M%S).yaml

# Deploy to Kubernetes
echo "☸️  Deploying to Kubernetes..."
kubectl set image deployment/storybook storybook=registry.example.com/induction/storybook:${IMAGE_TAG} -n ${NAMESPACE}

# Wait for rollout
echo "⏳ Waiting for rollout to complete..."
kubectl rollout status deployment/storybook -n ${NAMESPACE}

# Run health check
echo "🏥 Running health check..."
PRODUCTION_URL="https://storybook.example.com"
curl -f ${PRODUCTION_URL}/health || {
    echo "❌ Health check failed! Rolling back..."
    kubectl rollout undo deployment/storybook -n ${NAMESPACE}
    exit 1
}

# Send notification
echo "📢 Sending deployment notification..."
curl -X POST https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK \
    -H "Content-Type: application/json" \
    -d "{\"text\":\"✅ Storybook deployed to production (version: ${IMAGE_TAG})\"}"

echo "✅ Deployment to production complete!"
echo "🌐 URL: ${PRODUCTION_URL}"