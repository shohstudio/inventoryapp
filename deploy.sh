#!/bin/bash

# Stop on error
set -e

echo "🚀 Deployment boshlandi..."

# 1. Pull latest changes
echo "📥 Git pull..."
git pull origin main

# 2. Install & Build Frontend
echo "📦 Frontend o'rnatilmoqda va qurilmoqda..."
npm install
npm run build

# 3. Setup Backend
echo "🛠 Backend sozlanmoqda..."
cd server
npm install
npx prisma generate
npx prisma migrate deploy

# 4. Restart PM2
echo "🔄 Server qayta ishga tushirilmoqda..."
# Check if PM2 process exists, restart if yes, start if no
if pm2 list | grep -q "inventory-app"; then
    pm2 restart inventory-app
else
    pm2 start src/index.js --name "inventory-app"
fi

echo "✅ Muvaffaqiyatli yakunlandi!"
