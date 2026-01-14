#!/bin/bash

# Domain and SSL Setup Script for Inventory App
# Uses Certbot to configure HTTPS for Apache

# Stop on error
set -e

echo "🔒 Domen va SSL sozlash boshlandi..."

# 1. Ask for Domain
read -p "Domen nomingizni kiriting (masalan, example.com): " DOMAIN_NAME

if [ -z "$DOMAIN_NAME" ]; then
    echo "❌ Domen nomi kiritilmadi. Bekor qilindi."
    exit 1
fi

echo "🌐 Tanlangan domen: $DOMAIN_NAME"

# 2. Install Certbot
echo "📥 Certbot o'rnatilmoqda..."
sudo apt install -y certbot python3-certbot-apache

# 3. Update Apache Config with ServerName
CONFIG_FILE="/etc/apache2/sites-available/inventory-app.conf"

echo "⚙️ Apache konfiguratsiyasi yangilanmoqda ($CONFIG_FILE)..."

# Check if file exists
if [ ! -f "$CONFIG_FILE" ]; then
    echo "❌ Apache konfiguratsiya fayli topilmadi: $CONFIG_FILE"
    echo "Oldin 'setup_apache.sh' ni ishga tushiring."
    exit 1
fi

# Replace ServerName _ or ServerName example.com with actual domain
# We use sed to replace the line starting with ServerName
sudo sed -i "s/ServerName .*/ServerName $DOMAIN_NAME/" "$CONFIG_FILE"

# Reload Apache to pick up ServerName change
sudo systemctl reload apache2

echo "✅ ServerName o'zgartirildi."

# 4. Run Certbot (Webroot mode for reliability)
echo "🔐 SSL sertifikat olinmoqda (Certbot - Webroot usuli)..."
echo "⚠️  ESLATMA: Domen A Recordi server IP siga ulangan bo'lishi SHART!"

# Use webroot authentication (places file in /var/www/html/.well-known/acme-challenge)
# but use apache plugin for installation (updating config to HTTPS)
sudo certbot --authenticator webroot --installer apache -w /var/www/html -d "$DOMAIN_NAME"

echo "🎉 SSL o'rnatish yakunlandi!"
echo "➡️  https://$DOMAIN_NAME manzilini tekshirib ko'ring."
