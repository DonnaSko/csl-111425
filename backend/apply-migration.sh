#!/bin/bash
# Script to apply email attachment database migration

echo "🚀 Applying Email Attachment Migration"
echo "======================================"
echo ""

# Run the migration script
npx ts-node src/scripts/apply-migration.ts

echo ""
echo "✅ Done!"

