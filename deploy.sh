#!/bin/bash

# Deploy GoalQuest Mobile App to AWS EC2
echo "🎯 Deploying GoalQuest Mobile App..."

# Commit and push to GitHub
git add .
git commit -m "Deploy GoalQuest mobile app - $(date)"
git push origin main

# Deploy to AWS EC2
echo "📦 Installing dependencies and starting server..."

ssh -i ~/.ssh/BiggerBacks123.pem ec2-user@54.90.157.246 << 'EOF'
cd Lehigh-2025-Hackathon-HIAA

# Pull latest changes
git pull origin main

# Install Node.js dependencies
npm install

# Create uploads directory
mkdir -p uploads

# Kill existing processes
pkill -f "node.*app.js" || true

# Start the server
nohup node server/app.js > app.log 2>&1 &

# Wait for server to start
sleep 5

# Test the API
curl -s http://localhost:3000/api/health || echo "API not responding yet"
EOF

# Configure Nginx
echo "🔧 Configuring Nginx..."

ssh -i ~/.ssh/BiggerBacks123.pem ec2-user@54.90.157.246 "sudo tee /etc/nginx/conf.d/goalquest.conf > /dev/null << 'EOF'
server {
    listen 80;
    server_name 54.90.157.246;
    
    location / {
        root /home/ec2-user/Lehigh-2025-Hackathon-HIAA/client/public;
        index index.html;
        try_files \$uri \$uri/ /index.html;
    }
    
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
    
    location /uploads/ {
        alias /home/ec2-user/Lehigh-2025-Hackathon-HIAA/uploads/;
    }
}
EOF"

# Restart Nginx
ssh -i ~/.ssh/BiggerBacks123.pem ec2-user@54.90.157.246 "sudo systemctl restart nginx"

# Test the deployment
echo "🔍 Testing deployment..."
ssh -i ~/.ssh/BiggerBacks123.pem ec2-user@54.90.157.246 "curl -s http://localhost:3000/api/health || echo 'API not responding yet'"

echo "✅ GoalQuest Mobile App Deployed!"
echo "🎯 Mobile App: http://54.90.157.246"
echo "📱 React Native: Ready for development"
echo "🔗 API Health: http://54.90.157.246/api/health"
echo "📊 Database: database-1.cluster-cw18kkw8mg9c.us-east-1.rds.amazonaws.com"
echo ""
echo "🎉 Mobile Features Available:"
echo "• 📱 Beautiful React Native interface"
echo "• 🔐 Secure sign-in and sign-up"
echo "• 🎯 Goal setting and tracking"
echo "• 👥 Group collaboration"
echo "• 🏆 Leaderboards and achievements"
echo "• 📸 Photo verification for goals"
echo "• 🗺️ Location-based goal tracking"
echo "• 📅 Calendar integration"
echo ""
echo "💡 Next steps:"
echo "1. Set up your database credentials in environment variables"
echo "2. Run the database schema: mysql -h database-1.cluster-cw18kkw8mg9c.us-east-1.rds.amazonaws.com -u admin -p < database_schema.sql"
echo "3. Test the mobile app at http://54.90.157.246"
echo "4. Start React Native development: cd client && npm start"