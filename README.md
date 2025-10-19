# 🎯 GoalQuest - Complete Goal Achievement Platform

A comprehensive goal-setting and achievement platform built with React Native and AWS services.

## 🚀 Quick Start

### Start All Services
```bash
# Start the complete development environment
./start-dev.sh
```

### Access the Applications
- **React Native App**: http://localhost:3001
- **Website**: http://localhost:8085
- **Feature Testing**: http://localhost:8086/test-complete-features.html
- **Groups Demo**: http://localhost:8083/test-groups.html

## 📱 Features

### 🎯 Goal Management
- Create and track goals with categories
- Photo verification using AI
- Location-based goal tracking
- Real-time progress updates
- Achievement system

### 👥 Group Collaboration
- Join and create groups
- Real-time group chat
- Group leaderboards
- Team challenges
- Group achievements

### 📸 Photo Verification
- AI-powered photo analysis
- Goal completion verification
- Screenshot capture
- Photo storage in AWS S3

### 📍 Location Services
- GPS-based goal creation
- Location verification
- Geofenced challenges
- Location history tracking

### 📅 Calendar Integration
- Event creation and scheduling
- Goal progress visualization
- Reminder notifications
- Calendar export

### 🏆 Leaderboards & Achievements
- Global and group leaderboards
- Achievement system
- Badge collection
- Progress streaks

## 🛠️ Technology Stack

### Frontend
- **React Native** - Mobile app
- **HTML5/CSS3/JavaScript** - Website
- **Expo** - Development platform

### Backend
- **Node.js/Express** - API server
- **AWS Services** - Cloud infrastructure
- **DynamoDB** - Database
- **S3** - File storage
- **Rekognition** - AI photo analysis

## 📁 Project Structure

```
GoalQuest/
├── client/                 # React Native mobile app
│   ├── src/
│   │   ├── screens/        # App screens
│   │   ├── services/      # AWS services
│   │   └── context/       # Authentication context
│   └── package.json
├── website/               # Website
│   └── index.html
├── aws-infrastructure/    # AWS CloudFormation templates
├── mock_auth.js          # Mock API server
└── README.md
```

## 🚀 Development

### Prerequisites
- Node.js 18+
- npm or yarn
- Expo CLI
- AWS CLI (for deployment)

### Install Dependencies
```bash
# Install React Native dependencies
cd client
npm install

# Install additional dependencies for enhanced features
npm install expo-location expo-image-picker expo-camera expo-calendar
```

### Start Development
```bash
# Start all services
./start-dev.sh

# Or start individually:
# React Native app
cd client && npx expo start --web --port 3001

# Mock API server
node mock_auth.js

# Website server
cd website && python3 -m http.server 8085
```

## ☁️ AWS Deployment

### Deploy Complete Infrastructure
```bash
# Configure AWS credentials first
aws configure

# Deploy all AWS services
./deploy-complete-aws.sh
```

### AWS Services Included
- **Cognito** - User authentication
- **DynamoDB** - Database
- **S3** - File storage
- **Lambda** - Serverless functions
- **API Gateway** - REST API
- **Rekognition** - AI photo analysis
- **Location Service** - GPS functionality
- **EventBridge** - Calendar integration

## 🎯 Usage

### Mobile App (React Native)
1. Open http://localhost:3001
2. Sign up for a new account
3. Create goals with photo verification
4. Join groups and chat with members
5. Track progress and earn achievements

### Website
1. Open http://localhost:8085
2. Explore all features
3. Test AWS integrations
4. View the complete platform

### Testing
1. Open http://localhost:8086/test-complete-features.html
2. Test all features in real-time
3. Verify AWS services
4. Check performance

## 📱 Mobile Features

- **Beautiful React Native Interface** - Modern, responsive design
- **Photo Verification** - AI-powered goal completion verification
- **Location Tracking** - GPS-based goal creation and tracking
- **Group Collaboration** - Real-time chat and team challenges
- **Calendar Integration** - Schedule goals and track progress
- **Achievement System** - Badges, leaderboards, and progress tracking

## 🌐 Website Features

- **Complete Platform** - All mobile features in web format
- **Interactive Demos** - Test all functionality
- **AWS Integration** - Full cloud services integration
- **Responsive Design** - Works on all devices

## 🚀 Production Ready

The platform is production-ready with:
- Complete AWS infrastructure
- Scalable serverless architecture
- Real-time features
- AI-powered verification
- Mobile and web support

## 📞 Support

- **Documentation**: See individual service files
- **AWS Docs**: https://docs.aws.amazon.com/
- **React Native Docs**: https://reactnative.dev/
- **Expo Docs**: https://docs.expo.dev/

---

**🎯 GoalQuest - Achieve Your Goals Together!**

**Ready for the Lehigh 2025 Hackathon! 🏆**

