#!/bin/bash
# LockIN Backend Deployment Script for EC2

set -e

echo "🚀 Starting LockIN Backend Deployment..."

# Update system packages
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Python 3.11 and pip
echo "🐍 Installing Python 3.11..."
sudo apt install -y python3.11 python3.11-venv python3.11-dev python3-pip

# Install PostgreSQL client
echo "🐘 Installing PostgreSQL client..."
sudo apt install -y postgresql-client

# Install AWS CLI
echo "☁️ Installing AWS CLI..."
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
rm -rf aws awscliv2.zip

# Create application directory
echo "📁 Setting up application directory..."
sudo mkdir -p /opt/lockin-backend
sudo chown $USER:$USER /opt/lockin-backend

# Copy application files
echo "📋 Copying application files..."
cp -r backend/* /opt/lockin-backend/

# Create virtual environment
echo "🔧 Creating virtual environment..."
cd /opt/lockin-backend
python3.11 -m venv venv
source venv/bin/activate

# Install dependencies
echo "📦 Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Create systemd service file
echo "⚙️ Creating systemd service..."
sudo tee /etc/systemd/system/lockin-backend.service > /dev/null <<EOF
[Unit]
Description=LockIN Backend API
After=network.target

[Service]
Type=exec
User=$USER
WorkingDirectory=/opt/lockin-backend
Environment=PATH=/opt/lockin-backend/venv/bin
ExecStart=/opt/lockin-backend/venv/bin/python run.py
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

# Create environment file template
echo "🔐 Creating environment file template..."
tee /opt/lockin-backend/.env.template > /dev/null <<EOF
# Database Configuration
DATABASE_URL=postgresql://username:password@your-rds-endpoint:5432/lockin_db

# AWS Cognito Configuration
COGNITO_REGION=us-east-1
COGNITO_USER_POOL_ID=your-user-pool-id
COGNITO_CLIENT_ID=your-client-id

# AWS S3 Configuration
S3_BUCKET_NAME=lockin-avatars
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1

# JWT Configuration
JWT_SECRET_KEY=your-secret-key-change-in-production
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30
EOF

# Create nginx configuration
echo "🌐 Creating nginx configuration..."
sudo tee /etc/nginx/sites-available/lockin-backend > /dev/null <<EOF
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location /health {
        proxy_pass http://127.0.0.1:8000/health;
        access_log off;
    }
}
EOF

# Install and configure nginx
echo "🌐 Installing nginx..."
sudo apt install -y nginx
sudo ln -sf /etc/nginx/sites-available/lockin-backend /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl enable nginx
sudo systemctl restart nginx

# Create log directory
echo "📝 Creating log directory..."
sudo mkdir -p /var/log/lockin-backend
sudo chown $USER:$USER /var/log/lockin-backend

# Create deployment script
echo "📜 Creating deployment script..."
tee /opt/lockin-backend/deploy.sh > /dev/null <<EOF
#!/bin/bash
set -e

echo "🔄 Deploying LockIN Backend..."

# Pull latest code (if using git)
# git pull origin main

# Activate virtual environment
source venv/bin/activate

# Install/update dependencies
pip install -r requirements.txt

# Restart service
sudo systemctl restart lockin-backend

echo "✅ Deployment complete!"
EOF

chmod +x /opt/lockin-backend/deploy.sh

# Create database initialization script
echo "🗄️ Creating database initialization script..."
tee /opt/lockin-backend/setup_db.sh > /dev/null <<EOF
#!/bin/bash
set -e

echo "🗄️ Setting up database..."

# Load environment variables
if [ -f .env ]; then
    export \$(cat .env | grep -v '^#' | xargs)
fi

# Run database initialization
python init_db.py

echo "✅ Database setup complete!"
EOF

chmod +x /opt/lockin-backend/setup_db.sh

# Enable and start the service
echo "🚀 Enabling and starting service..."
sudo systemctl daemon-reload
sudo systemctl enable lockin-backend

echo "✅ Deployment setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Copy your .env file to /opt/lockin-backend/.env"
echo "2. Run: cd /opt/lockin-backend && ./setup_db.sh"
echo "3. Start the service: sudo systemctl start lockin-backend"
echo "4. Check status: sudo systemctl status lockin-backend"
echo "5. View logs: sudo journalctl -u lockin-backend -f"
echo ""
echo "🌐 Your API will be available at: http://your-domain.com"
echo "📊 Health check: http://your-domain.com/health"
