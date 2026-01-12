#!/bin/bash
# Vortex Protocol API - Deployment Script
# Usage: ./scripts/deploy.sh [staging|production]

set -e

ENV=${1:-production}
APP_NAME="vortex-api"

echo "🚀 Deploying Vortex API to Fly.io ($ENV)"

# Check if flyctl is installed
if ! command -v flyctl &> /dev/null; then
    echo "❌ flyctl is not installed. Install from https://fly.io/docs/getting-started/installing-flyctl/"
    exit 1
fi

# Check if logged in
if ! flyctl auth whoami &> /dev/null; then
    echo "❌ Not logged in to Fly.io. Run: flyctl auth login"
    exit 1
fi

# Run TypeScript check
echo "📝 Running TypeScript check..."
bun run typecheck

# Set secrets if .env.local exists
if [ -f "../../.env.local" ]; then
    echo "🔐 Setting secrets from .env.local..."
    
    # Read required secrets
    source ../../.env.local
    
    flyctl secrets set \
        DATABASE_URL="$DATABASE_URL" \
        UPSTASH_REDIS_REST_URL="$UPSTASH_REDIS_REST_URL" \
        UPSTASH_REDIS_REST_TOKEN="$UPSTASH_REDIS_REST_TOKEN" \
        ALCHEMY_API_KEY="$ALCHEMY_API_KEY" \
        PIMLICO_API_KEY="$PIMLICO_API_KEY" \
        ONEINCH_API_KEY="$ONEINCH_API_KEY" \
        MORALIS_API_KEY="$MORALIS_API_KEY" \
        COINGECKO_API_KEY="$COINGECKO_API_KEY" \
        GOPLUS_API_KEY="$GOPLUS_API_KEY" \
        JWT_SECRET="$JWT_SECRET" \
        FRONTEND_URL="https://vortex.vercel.app" \
        --app $APP_NAME
fi

# Deploy
echo "📦 Building and deploying..."
flyctl deploy --app $APP_NAME

# Check deployment health
echo "🏥 Checking deployment health..."
sleep 10
HEALTH_URL="https://$APP_NAME.fly.dev/api/health"
HEALTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $HEALTH_URL)

if [ "$HEALTH_RESPONSE" = "200" ]; then
    echo "✅ Deployment successful! API is healthy."
    echo "🌐 URL: https://$APP_NAME.fly.dev"
else
    echo "⚠️  Deployment completed but health check returned $HEALTH_RESPONSE"
    echo "Check logs: flyctl logs --app $APP_NAME"
fi

echo "
📊 Useful commands:
  flyctl logs --app $APP_NAME          # View logs
  flyctl status --app $APP_NAME        # Check status
  flyctl ssh console --app $APP_NAME   # SSH into container
  flyctl scale show --app $APP_NAME    # Show scaling
"
