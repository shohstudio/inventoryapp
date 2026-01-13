#!/bin/bash

# Initial setup script for Ubuntu VPS

echo "🚀 VPS Sozlash boshlandi..."

# Update system
sudo apt update && sudo apt upgrade -y

# Install Curl & Git
sudo apt install -y curl git nginx

# Install Node.js (v20)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 globally
sudo npm install -g pm2

# Configure Nginx (Basic)
echo "🌐 Nginx sozlanmoqda..."

# Create Nginx config
# Note: User must manually replace 'YOUR_DOMAIN_OR_IP' later or we use strictly default
sudo tee /etc/nginx/sites-available/inventory-app > /dev/null <<EOF
server {
    listen 80;
    server_name _;  # Accepts all IP/Domains

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Enable Site
sudo ln -sf /etc/nginx/sites-available/inventory-app /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test and Restart Nginx
sudo nginx -t
sudo systemctl restart nginx

echo "✅ VPS tayyor! Endi loyihani 'git clone' qilib, 'deploy.sh' ni ishlating."
