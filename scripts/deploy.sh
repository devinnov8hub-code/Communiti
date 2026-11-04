#!/bin/bash
# Run by CodeDeploy on the EC2 instance (see appspec.yml): installs nginx if needed,
# copies the new build into place, points nginx at it and checks the site responds.
set -euo pipefail

SITE_DIR=/var/www/communiti
# This script sits in scripts/ inside the deployment bundle, next to dist/.
BUNDLE_DIR="$(cd "$(dirname "$0")/.." && pwd)"

# 1. Install nginx (Amazon Linux or Ubuntu).
if ! command -v nginx >/dev/null 2>&1; then
  if command -v dnf >/dev/null 2>&1; then
    dnf install -y nginx
  elif command -v yum >/dev/null 2>&1; then
    yum install -y nginx
  else
    apt-get update -y
    apt-get install -y nginx
  fi
fi

# 2. Replace the previous build so files deleted from the app don't linger.
rm -rf "$SITE_DIR"
mkdir -p "$SITE_DIR"
cp -r "$BUNDLE_DIR/dist/." "$SITE_DIR/"
chmod -R a+rX "$SITE_DIR"

# 3. nginx site config.
cat > /etc/nginx/conf.d/communiti.conf <<'NGINX'
server {
    listen 80;
    server_name mycommuniti.org www.mycommuniti.org;

    root /var/www/communiti;
    index index.html;

    # Vite fingerprints these, so they can be cached for good.
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }

    # Client-side routes (createBrowserRouter) all fall back to index.html.
    location / {
        add_header Cache-Control "no-cache";
        try_files $uri $uri/ /index.html;
    }
}
NGINX

# Ubuntu ships a default site that also claims port 80.
rm -f /etc/nginx/sites-enabled/default

nginx -t
systemctl enable nginx
systemctl reload nginx || systemctl restart nginx

# 4. Fail the deployment if nginx isn't serving the app.
for _ in 1 2 3 4 5; do
  if curl -fsS -H 'Host: mycommuniti.org' http://127.0.0.1/ >/dev/null; then
    exit 0
  fi
  sleep 2
done

echo "nginx is not serving the app on port 80" >&2
exit 1
