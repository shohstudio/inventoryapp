#!/bin/bash

# Apache Setup Script for Inventory App
# This script disables Nginx and installs/configures Apache as a reverse proxy.

echo "🚀 Apache o'rnatish boshlandi..."

# 1. Update system
echo "📦 Tizim yangilanmoqda..."
sudo apt update

# 2. Stop and Disable Nginx (if running)
echo "🛑 Nginx to'xtatilmoqda (port 80 ni bo'shatish uchun)..."
if systemctl is-active --quiet nginx; then
    sudo systemctl stop nginx
    sudo systemctl disable nginx
    echo "✅ Nginx to'xtatildi va o'chirildi."
else
    echo "ℹ️ Nginx allaqachon o'chirilgan yoki o'rnatilmagan."
fi

# 3. Install Apache2
echo "📥 Apache o'rnatilmoqda..."
sudo apt install -y apache2

# 4. Enable Proxy Modules
echo "🔌 Proxy modullari yoqilmoqda..."
sudo a2enmod proxy
sudo a2enmod proxy_http
sudo a2enmod rewrite
sudo a2enmod headers

# 5. Configure Apache VirtualHost
echo "⚙️ VirtualHost sozlanmoqda..."

# Create config file
sudo tee /etc/apache2/sites-available/inventory-app.conf > /dev/null <<EOF
<VirtualHost *:80>
    ServerAdmin webmaster@localhost
    ServerName _
    DocumentRoot /var/www/html

    # Allow Certbot authentication (Do not proxy .well-known)
    ProxyPass /.well-known !

    # Proxy Settings
    ProxyPreserveHost On
    ProxyRequests Off
    
    # Proxy to Node.js app running on port 5000
    ProxyPass / http://localhost:5000/
    ProxyPassReverse / http://localhost:5000/

    # Logs
    ErrorLog \${APACHE_LOG_DIR}/inventory-error.log
    CustomLog \${APACHE_LOG_DIR}/inventory-access.log combined

    # Upgrade headers for WebSocket (if needed, e.g. for Vite HMR or Socket.io)
    RewriteEngine On
    RewriteCond %{HTTP:Upgrade} =websocket [NC]
    RewriteRule /(.*)           ws://localhost:5000/\$1 [P,L]
    RewriteCond %{HTTP:Upgrade} !=websocket [NC]
    RewriteRule /(.*)           http://localhost:5000/\$1 [P,L]
</VirtualHost>
EOF

# 6. Enable Site and Restart Apache
echo "✅ Sayt yoqilmoqda..."
sudo a2dissite 000-default.conf  # Disable default site
sudo a2ensite inventory-app.conf # Enable our site

# Check config syntax
echo "🔍 Konfiguratsiya tekshirilmoqda..."
if sudo apache2ctl configtest; then
    echo "🔄 Apache qayta ishga tushirilmoqda..."
    sudo systemctl restart apache2
    echo "🎉 Apache muvaffaqiyatli o'rnatildi va sozlandi!"
    echo "🌐 Endi brauzer orqali server IP manziliga kirib ko'ring."
else
    echo "❌ Konfiguratsiyada xatolik bor. Iltimos tekshiring."
fi
