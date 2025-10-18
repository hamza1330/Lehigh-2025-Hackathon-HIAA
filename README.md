# 🎯 GoalQuest - Mobile Goal-Setting App
## Lehigh 2025 Hackathon - Beautiful React Native Productivity Platform

🚀 **Live Demo**: [http://54.90.157.246](http://54.90.157.246)  
📱 **React Native**: Ready for mobile development  
🔗 **API Health**: [http://54.90.157.246/api/health](http://54.90.157.246/api/health)

### 🌟 About GoalQuest

GoalQuest is a beautiful, modern mobile goal-setting app built with React Native and Node.js. It helps users achieve their goals through social accountability, photo verification, and friendly competition.

### ✨ Key Features

#### 📱 **Beautiful Mobile Interface**
- **React Native** with modern, intuitive design
- **Secure authentication** with JWT tokens
- **Responsive UI** optimized for all screen sizes
- **Smooth animations** and transitions

#### 🎯 **Goal Management**
- **Create and track personal goals** with multiple types
- **Photo verification** for goal completion accountability
- **Progress tracking** with visual indicators
- **Location-based goals** with GPS integration
- **Smart notifications** and reminders

#### 👥 **Social Features**
- **Group collaboration** and team challenges
- **Individual and group leaderboards**
- **Achievement system** with points and levels
- **Social sharing** and motivation

#### 🤖 **AI-Powered Features**
- **Photo verification** using computer vision
- **Smart goal suggestions** based on user behavior
- **Fraud detection** and prevention
- **Automated progress tracking**

### 🛠️ Tech Stack

#### **Frontend (React Native)**
- **React Native** - Cross-platform mobile development
- **Expo** - Development platform and tools
- **React Navigation** - Navigation library
- **Vector Icons** - Beautiful iconography
- **AsyncStorage** - Local data persistence

#### **Backend (Node.js)**
- **Express.js** - Web application framework
- **MySQL** - Relational database
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing
- **Multer** - File upload handling

#### **Database (AWS RDS)**
- **MySQL** - Primary database
- **AWS RDS** - Managed database service
- **Optimized indexes** for performance
- **Data relationships** and constraints

#### **Deployment (AWS)**
- **AWS EC2** - Cloud hosting
- **Nginx** - Reverse proxy and static serving
- **PM2** - Process management
- **SSL/HTTPS** - Secure connections

### 🚀 Quick Start

#### **1. Clone and Setup**
```bash
git clone https://github.com/hamza1330/Lehigh-2025-Hackathon-HIAA.git
cd Lehigh-2025-Hackathon-HIAA
npm install
```

#### **2. Environment Configuration**
```bash
cp env.example .env
# Edit .env with your database credentials
```

#### **3. Database Setup**
```bash
# Run the database schema
mysql -h database-1.cluster-cw18kkw8mg9c.us-east-1.rds.amazonaws.com -u admin -p < database_schema.sql
```

#### **4. Start Development**
```bash
# Start the backend server
npm start

# Start React Native development (in another terminal)
cd client
npm start
```

### 📱 Mobile Development

#### **React Native Setup**
```bash
cd client
npm install
npx expo start
```

#### **Available Commands**
- `npm run android` - Run on Android
- `npm run ios` - Run on iOS  
- `npm run web` - Run in web browser
- `npm run start` - Start Expo development server

### 🔧 API Endpoints

#### **Authentication**
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/user/profile` - Get user profile

#### **Goals**
- `GET /api/goals` - Get user goals
- `POST /api/goals` - Create new goal
- `POST /api/goals/:id/complete` - Complete goal with photo

#### **Groups**
- `GET /api/groups` - Get all groups
- `POST /api/groups` - Create new group
- `POST /api/groups/:id/join` - Join group

#### **Leaderboard**
- `GET /api/leaderboard` - Get leaderboard rankings

### 🎨 UI/UX Features

#### **Sign-In/Sign-Up Screens**
- **Beautiful gradient backgrounds**
- **Smooth form animations**
- **Input validation** and error handling
- **Secure password** with show/hide toggle
- **Social login** integration ready

#### **Main App Screens**
- **Tab-based navigation** with icons
- **Goal cards** with progress indicators
- **Leaderboard** with rankings and badges
- **Group management** with join/create
- **Profile management** with settings

#### **Interactive Elements**
- **Touch-friendly** buttons and inputs
- **Swipe gestures** for navigation
- **Pull-to-refresh** functionality
- **Loading states** and animations
- **Error handling** with user feedback

### 🗄️ Database Schema

#### **Core Tables**
- **users** - User accounts and profiles
- **groups** - Goal-oriented groups and teams
- **goals** - Individual and group goals
- **goal_completions** - Goal completion records
- **achievements** - User achievements and badges

#### **Relationships**
- Users can have multiple goals
- Goals can belong to groups
- Users can join multiple groups
- Completions track goal progress
- Achievements reward user milestones

### 🚀 Deployment

#### **AWS EC2 Deployment**
```bash
./deploy.sh
```

#### **Manual Deployment Steps**
1. **Install dependencies**: `npm install`
2. **Configure environment**: Set up `.env` file
3. **Setup database**: Run `database_schema.sql`
4. **Start server**: `node server/app.js`
5. **Configure Nginx**: Proxy API requests
6. **Test deployment**: Verify all endpoints

### 📊 Performance Features

#### **Optimization**
- **Database indexing** for fast queries
- **Image compression** for photo uploads
- **Lazy loading** for large lists
- **Caching** for frequently accessed data
- **Connection pooling** for database

#### **Scalability**
- **Horizontal scaling** ready
- **Load balancing** support
- **CDN integration** for static assets
- **Microservices** architecture ready

### 🔒 Security Features

#### **Authentication**
- **JWT tokens** for secure sessions
- **Password hashing** with bcrypt
- **Input validation** and sanitization
- **Rate limiting** for API endpoints

#### **Data Protection**
- **HTTPS encryption** for all traffic
- **SQL injection** prevention
- **XSS protection** in frontend
- **Secure file uploads** with validation

### 🎯 Use Cases

#### **Individual Users**
- **Personal productivity** and habit tracking
- **Goal achievement** with accountability
- **Progress visualization** and insights
- **Motivation** through gamification

#### **Teams & Groups**
- **Collaborative goal setting**
- **Team challenges** and competitions
- **Progress sharing** and updates
- **Group accountability** and support

#### **Organizations**
- **Employee engagement** programs
- **Team building** activities
- **Performance tracking** and analytics
- **Corporate wellness** initiatives

### 🔮 Future Enhancements

#### **Advanced Features**
- **Machine Learning** for goal recommendations
- **Wearable integration** (Apple Watch, Fitbit)
- **Social media** sharing and integration
- **Advanced analytics** and insights

#### **Platform Expansion**
- **Web application** version
- **Desktop app** with Electron
- **API marketplace** for integrations
- **White-label** solutions

### 📞 Support & Development

#### **Development Setup**
- **Hot reloading** for fast development
- **Debug tools** and logging
- **Testing framework** integration
- **Code quality** tools (ESLint, Prettier)

#### **Troubleshooting**
- **API documentation** at `/docs`
- **Health check** at `/api/health`
- **Error logging** and monitoring
- **Performance metrics** tracking

### 🏆 Hackathon Features

Built specifically for the Lehigh 2025 Hackathon with:
- **Innovation**: AI-powered goal verification
- **Social Impact**: Group collaboration and motivation
- **Technical Excellence**: Modern React Native architecture
- **User Experience**: Beautiful, intuitive mobile interface
- **Scalability**: Cloud-native deployment ready

---

**🎯 GoalQuest - Achieve Your Goals Together**  
*Built with ❤️ for the Lehigh 2025 Hackathon*