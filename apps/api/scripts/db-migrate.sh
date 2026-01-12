#!/bin/bash
# Vortex Protocol - Database Migration Script
# Usage: ./scripts/db-migrate.sh [push|generate|seed]

set -e

ACTION=${1:-push}

echo "🗃️  Vortex Database Migration ($ACTION)"

# Load environment
if [ -f "../../.env.local" ]; then
    export $(cat ../../.env.local | grep -v '^#' | xargs)
fi

case $ACTION in
    push)
        echo "📤 Pushing schema to database..."
        bun run db:push
        echo "✅ Schema pushed successfully!"
        ;;
    generate)
        echo "📝 Generating migration files..."
        bun run db:generate
        echo "✅ Migration files generated in ./drizzle"
        ;;
    seed)
        echo "🌱 Seeding database with test data..."
        bun run db:seed
        echo "✅ Database seeded successfully!"
        ;;
    studio)
        echo "🎨 Opening Drizzle Studio..."
        bun run db:studio
        ;;
    *)
        echo "❌ Unknown action: $ACTION"
        echo "Usage: ./scripts/db-migrate.sh [push|generate|seed|studio]"
        exit 1
        ;;
esac
