#!/bin/bash

# Stop execution on error
set -e

echo "🚀 Deployment started..."

# 1. Pull latest changes
echo "📥 Pulling latest changes from GitHub..."
git pull origin main

# 2. Install dependencies for frontend
echo "📦 Installing frontend dependencies..."
npm install

# 3. Build frontend
echo "🏗️ Building frontend..."
npm run build

# 4. Install dependencies for backend
echo "📦 Installing backend dependencies..."
cd server
npm install

# 5. Generate Prisma Client
echo "🔄 Generating Prisma Client..."
npx prisma generate

# 6. Apply database changes (if any)
# Note: For SQLite in production with simple setup, we might use db push or migrate deploy.
# Using db push for now to be safe with rapid iteration, but migrate is better for prod.
echo "🗄️ Syncing database schema..."
npx prisma db push

cd ..

# 7. Restart Backend (PM2)
echo "🔄 Restarting application..."
# Check if PM2 is running 'inventory-server' or similar. 
# If you used a different name, update this part or just restart all.
pm2 restart all || echo "⚠️ PM2 not found or no process to restart. If this is the first run, start manually."

echo "✅ Deployment completed successfully!"
