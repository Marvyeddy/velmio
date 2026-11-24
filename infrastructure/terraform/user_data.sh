#!/bin/bash

set -euxo pipefail

# ============================================================
# Logging
# ============================================================

exec > >(tee -a /var/log/velmio-setup.log) 2>&1

echo "Starting Velmio server initialization..."

# ============================================================
# Configure swap space
# ============================================================

echo "Configuring swap space..."

if [ ! -f /swapfile ]; then
    fallocate -l ${swap_size_gb}G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
fi

if ! swapon --show=NAME --noheadings | grep -qx /swapfile; then
    swapon /swapfile
fi

if ! grep -q '^/swapfile ' /etc/fstab; then
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

echo "vm.swappiness=10" > /etc/sysctl.d/99-velmio.conf

sysctl --system

# ============================================================
# Update operating system
# ============================================================

echo "Updating system packages..."

dnf update -y

# ============================================================
# Install required packages
# ============================================================

echo "Installing Docker, Git and Nginx..."

dnf install -y docker git nginx

# ============================================================
# Configure Docker
# ============================================================

echo "Configuring Docker..."

mkdir -p /etc/docker

cat > /etc/docker/daemon.json <<'EOF'
{
    "log-driver": "json-file",
    "log-opts": {
        "max-size": "10m",
        "max-file": "3"
    }
}
EOF

systemctl enable --now docker

usermod -aG docker ec2-user

# ============================================================
# Install Docker Compose
# ============================================================

echo "Installing Docker Compose..."

COMPOSE_VERSION="v5.5.1"

mkdir -p /usr/local/lib/docker/cli-plugins

curl -fSL --retry 3 \
    "https://github.com/docker/compose/releases/download/$COMPOSE_VERSION/docker-compose-linux-x86_64" \
    -o /usr/local/lib/docker/cli-plugins/docker-compose

chmod +x /usr/local/lib/docker/cli-plugins/docker-compose

ln -sf /usr/local/lib/docker/cli-plugins/docker-compose \
    /usr/local/bin/docker-compose

# ============================================================
# Prepare deployment directory
# ============================================================

echo "Creating Velmio deployment directory..."

mkdir -p /opt/velmio

chown ec2-user:ec2-user /opt/velmio

chmod 750 /opt/velmio

# ============================================================
# Configure Nginx
# ============================================================

echo "Configuring Nginx..."

nginx -t

systemctl enable --now nginx

# ============================================================
# Verify installation
# ============================================================

echo "Verifying installed services..."

docker --version
docker compose version
git --version
nginx -v

free -h
df -h

echo "Velmio server initialization completed successfully."