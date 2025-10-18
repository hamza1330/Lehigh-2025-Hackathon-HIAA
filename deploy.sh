#!/bin/bash

# Deploy to AWS EC2
echo "🚀 Deploying to AWS..."

# Commit and push to GitHub
git add .
git commit -m "Update project - $(date)"
git push origin main

# Deploy to server
ssh -i ~/.ssh/BiggerBacks123.pem ec2-user@54.90.157.246 "cd Lehigh-2025-Hackathon-HIAA && git pull"
ssh -i ~/.ssh/BiggerBacks123.pem ec2-user@54.90.157.246 "sudo cp /home/ec2-user/Lehigh-2025-Hackathon-HIAA/*.html /usr/share/nginx/html/"

echo "✅ Deployed! Visit: http://54.90.157.246"
