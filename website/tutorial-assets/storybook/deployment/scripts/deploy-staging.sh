#!/bin/bash

set -e

echo "🚀 Deploying Storybook to Staging..."

# Configuration
ENVIRONMENT="staging"
IMAGE_TAG="${1:-latest}"
NAMESPACE="induction-staging"

# Build and tag image
echo "📦 Building Docker image..."
docker build -t induction-storybook:${IMAGE_TAG} -f Dockerfile ../..

# Tag for registry
echo "🏷️  Tagging image for registry..."
docker tag induction-storybook:${IMAGE_TAG} registry.example.com/induction/storybook:${IMAGE_TAG}

# Push to registry
echo "📤 Pushing image to registry..."
docker push registry.example.com/induction/storybook:${IMAGE_TAG}

# Deploy to Kubernetes
echo "☸️  Deploying to Kubernetes..."
kubectl set image deployment/storybook storybook=registry.example.com/induction/storybook:${IMAGE_TAG} -n ${NAMESPACE}

# Wait for rollout
echo "⏳ Waiting for rollout to complete..."
kubectl rollout status deployment/storybook -n ${NAMESPACE}

# Run health check
echo "🏥 Running health check..."
STAGING_URL="https://storybook-staging.example.com"
curl -f ${STAGING_URL}/health || exit 1

echo "✅ Deployment to staging complete!"
echo "🌐 URL: ${STAGING_URL}"