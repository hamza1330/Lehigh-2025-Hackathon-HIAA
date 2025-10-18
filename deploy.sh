#!/bin/bash

# Lehigh 2025 Hackathon - Deployment Script
# This script helps deploy your project to AWS EC2

echo "🚀 Deploying Lehigh 2025 Hackathon Project..."

# Check if we're in the right directory
if [ ! -f "index.html" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Commit and push changes to GitHub
echo "📝 Committing changes to git..."
git add .
git commit -m "Update hackathon project - $(date)"
git push origin main

# Deploy to AWS EC2
echo "☁️ Deploying to AWS EC2..."
ssh -i ~/.ssh/BiggerBacks123.pem ec2-user@54.90.157.246 "cd Lehigh-2025-Hackathon-HIAA && git pull origin main"

# Copy files to nginx directory
echo "🌐 Updating web server..."
ssh -i ~/.ssh/BiggerBacks123.pem ec2-user@54.90.157.246 "sudo cp /home/ec2-user/Lehigh-2025-Hackathon-HIAA/*.html /usr/share/nginx/html/ 2>/dev/null || true"

echo "✅ Deployment complete!"
echo "🌐 Your website is live at: http://54.90.157.246"
echo "🔧 SSH access: ssh -i ~/.ssh/BiggerBacks123.pem ec2-user@54.90.157.246"
