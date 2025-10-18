# 🎯 GoalTracker - Social Accountability App
## Lehigh 2025 Hackathon - Healthcare Innovation & AI Applications

🚀 **Live Demo**: [http://54.90.157.246](http://54.90.157.246)

### About
GoalTracker is a comprehensive social accountability app that combines goal tracking with AI-powered photo verification, group challenges, and competitive leaderboards. Built for the Lehigh 2025 Hackathon focusing on Healthcare Innovation & AI Applications.

### ✨ Key Features
- **📸 AI Photo Verification**: AWS Rekognition integration for automatic goal verification
- **👥 Social Accountability**: Groups, challenges, and accountability partners
- **🏆 Gamification**: Leaderboards, points system, and achievement badges
- **🎯 Smart Goal Management**: SMART framework with custom categories
- **📍 Location Integration**: GPS-based check-ins and local challenges
- **📱 Real-time Updates**: WebSocket integration for live progress sharing

### 🛠️ Technology Stack

#### Frontend
- **React 18** with React Router for navigation
- **Framer Motion** for smooth animations
- **React Query** for state management
- **Socket.io Client** for real-time features
- **Recharts** for data visualization

#### Backend
- **Node.js** with Express framework
- **MongoDB** with Mongoose ODM
- **Socket.io** for real-time communication
- **JWT** authentication with bcrypt
- **Multer** for file uploads

#### AWS Services
- **EC2** for hosting
- **S3** for photo storage
- **Rekognition** for AI image analysis
- **Lambda** for serverless processing
- **CloudFront** for CDN

### 🚀 Quick Start

#### Prerequisites
- Node.js 16+ and npm
- MongoDB (local or cloud)
- AWS account with S3 and Rekognition access

#### Installation
```bash
# Clone repository
git clone https://github.com/hamza1330/Lehigh-2025-Hackathon-HIAA.git
cd Lehigh-2025-Hackathon-HIAA

# Install dependencies
npm run install-all

# Setup environment variables
cp env.example .env
# Edit .env with your configuration

# Start development servers
npm run dev
```

#### Production Deployment
```bash
# Deploy to AWS
./deploy.sh
```

### 📁 Project Structure
```
Lehigh-2025-Hackathon-HIAA/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── contexts/      # React contexts
│   │   └── utils/         # Utility functions
├── server/                 # Node.js backend
│   ├── models/            # Database models
│   ├── routes/            # API routes
│   ├── services/          # AWS services
│   └── middleware/        # Custom middleware
├── deploy.sh              # Deployment script
└── README.md              # This file
```

### 🔧 Development

#### Local Development
- **Frontend**: `http://localhost:3000`
- **Backend**: `http://localhost:5000`
- **API Docs**: `http://localhost:5000/api/health`

#### Environment Variables
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/goal-setting-app

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key

# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_S3_BUCKET=goal-setting-app-photos
```

### 🎯 Core Features Implementation

#### 1. AI Photo Verification
- AWS Rekognition for image analysis
- Category-specific verification
- Fraud prevention mechanisms
- Confidence scoring

#### 2. Social Features
- Group creation and management
- Real-time progress sharing
- Challenge system
- Accountability partners

#### 3. Gamification
- Point-based scoring system
- Streak tracking
- Achievement badges
- Leaderboards (global/group)

#### 4. Goal Management
- SMART goal framework
- Custom categories and tags
- Progress tracking
- Calendar integration

### 🏆 Hackathon Highlights
- **Healthcare Focus**: AI-powered health goal verification
- **Social Impact**: Community-driven accountability
- **Innovation**: Advanced computer vision integration
- **Scalability**: Cloud-native AWS architecture

### 📊 API Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/goals` - Get user goals
- `POST /api/goals` - Create new goal
- `POST /api/goals/:id/verify` - Verify goal with photo
- `GET /api/leaderboard` - Get leaderboard data

### 🤝 Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

### 📄 License
MIT License - see LICENSE file for details

### 🏆 Hackathon Team
**Lehigh 2025 Hackathon - Healthcare Innovation & AI Applications**

**Live Demo**: [http://54.90.157.246](http://54.90.157.246)  
**GitHub**: [https://github.com/hamza1330/Lehigh-2025-Hackathon-HIAA](https://github.com/hamza1330/Lehigh-2025-Hackathon-HIAA)
