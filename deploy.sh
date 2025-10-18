#!/bin/bash

# Deploy LockIn to AWS EC2
echo "🔒 Deploying LockIn to AWS..."

# Commit and push to GitHub
git add .
git commit -m "Deploy LockIn - Social Scheduling + Focus Lock - $(date)"
git push origin main

# Deploy to server
echo "📡 Updating server..."
ssh -i ~/.ssh/BiggerBacks123.pem ec2-user@54.90.157.246 "cd Lehigh-2025-Hackathon-HIAA && git pull"

echo "🌐 Deploying website..."
ssh -i ~/.ssh/BiggerBacks123.pem ec2-user@54.90.157.246 "sudo cp /home/ec2-user/Lehigh-2025-Hackathon-HIAA/index.html /usr/share/nginx/html/"

echo "🐍 Setting up Python environment..."
ssh -i ~/.ssh/BiggerBacks123.pem ec2-user@54.90.157.246 "cd Lehigh-2025-Hackathon-HIAA && python3 -m pip install fastapi uvicorn --user"

echo "🚀 Starting LockIn API on server..."
ssh -i ~/.ssh/BiggerBacks123.pem ec2-user@54.90.157.246 "cd Lehigh-2025-Hackathon-HIAA && nohup python3 lockin_main.py > lockin.log 2>&1 &"

echo "✅ LockIn Deployed Successfully!"
echo "🌐 Website: http://54.90.157.246"
echo "🔒 API: http://54.90.157.246:8000"
echo "📚 API Docs: http://54.90.157.246:8000/docs"
