#!/bin/bash
# ============================================
# 校园跑腿小程序后端 — 一键部署脚本
# 服务器: Ubuntu 22.04
# 域名: xaioshualan.asia
# IP: 49.232.157.193
# ============================================

set -e

DOMAIN="xaioshualan.asia"
APP_DIR="/opt/paotui-server"

echo "========================================="
echo "  校园跑腿后端一键部署 v1.0"
echo "  域名: $DOMAIN"
echo "========================================="

# 1. 更新系统
echo "[1/8] 更新系统..."
apt update && apt upgrade -y

# 2. 安装 Node.js 18.x
echo "[2/8] 安装 Node.js 18.x..."
if ! command -v node &>/dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
  apt install -y nodejs
fi
echo "Node.js: $(node -v)"
echo "npm: $(npm -v)"

# 3. 安装 MongoDB 7.0
echo "[3/8] 安装 MongoDB..."
if ! command -v mongod &>/dev/null; then
  curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | gpg --dearmor -o /usr/share/keyrings/mongodb-server-7.0.gpg
  echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-7.0.list
  apt update
  apt install -y mongodb-org
  systemctl start mongod
  systemctl enable mongod
fi
echo "MongoDB: $(mongod --version | head -1)"

# 4. 安装 PM2
echo "[4/8] 安装 PM2..."
npm install -g pm2

# 5. 安装 Nginx
echo "[5/8] 安装 Nginx..."
apt install -y nginx

# 6. 配置 Nginx（先 HTTP，SSL 后面再加）
echo "[6/8] 配置 Nginx..."
cat > /etc/nginx/sites-available/$DOMAIN << 'NGINX'
server {
    listen 80;
    server_name xaioshualan.asia www.xaioshualan.asia;

    # Let's Encrypt 验证
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        client_max_body_size 20M;
    }
}
NGINX

ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

# 7. 安装 SSL 证书（Let's Encrypt）
echo "[7/8] 安装 SSL 证书..."
apt install -y certbot python3-certbot-nginx
# 注意: 需要域名已解析到此服务器才能成功
certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN || echo "SSL 证书安装失败，请确保域名已解析到 49.232.157.193"

# 8. 部署应用
echo "[8/8] 部署应用..."
if [ ! -d "$APP_DIR" ]; then
  echo "请先将 server/ 目录上传到 $APP_DIR"
  echo "例如: scp -r server/ root@49.232.157.193:$APP_DIR"
  exit 1
fi

cd $APP_DIR
npm install --production
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# 设置自动确认定时任务（每小时执行）
echo "0 * * * * cd $APP_DIR && node scripts/autoConfirm.js >> /var/log/paotui-autoconfirm.log 2>&1" | crontab -

echo ""
echo "========================================="
echo "  部署完成！"
echo "  HTTP:  http://$DOMAIN"
echo "  HTTPS: https://$DOMAIN"
echo ""
echo "  管理命令:"
echo "    pm2 status       - 查看应用状态"
echo "    pm2 logs         - 查看日志"
echo "    pm2 restart all  - 重启应用"
echo ""
echo "  初始化测试数据:"
echo "    cd $APP_DIR && node scripts/seed.js"
echo "========================================="
