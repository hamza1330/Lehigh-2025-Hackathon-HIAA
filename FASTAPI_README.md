# 🎯 GoalTracker FastAPI Application

A modern FastAPI application with PostgreSQL on AWS RDS for goal tracking with social accountability.

## 🚀 Quick Start

### 1️⃣ Prerequisites
- Python 3.8+
- AWS RDS PostgreSQL instance
- pip package manager

### 2️⃣ Installation

```bash
# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp env.example .env
```

### 3️⃣ Configure Database

Edit `.env` file with your AWS RDS credentials:

```env
DATABASE_URL=postgresql://username:password@your-rds-endpoint.us-east-1.rds.amazonaws.com:5432/your_database
```

**Example:**
```env
DATABASE_URL=postgresql://admin:mypassword@database-1.cluster-cw18kkw8mg9c.us-east-1.rds.amazonaws.com:5432/goaltracker
```

### 4️⃣ Run the Application

```bash
# Method 1: Using run.py
python run.py

# Method 2: Using uvicorn directly
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 5️⃣ Access the API

- **API**: http://localhost:8000
- **Interactive Docs**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 📊 API Endpoints

### Health & Info
- `GET /` - Root endpoint with connection status
- `GET /health` - Health check
- `GET /database/info` - Database information

### Users
- `POST /users/` - Create new user
- `GET /users/me` - Get current user

### Goals
- `POST /goals/` - Create new goal
- `GET /goals/` - List user goals
- `GET /goals/{goal_id}` - Get specific goal
- `PUT /goals/{goal_id}` - Update goal
- `DELETE /goals/{goal_id}` - Delete goal

### Verifications
- `POST /verifications/` - Create verification
- `GET /goals/{goal_id}/verifications` - Get goal verifications

## 🗄️ Database Schema

### Users Table
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### Goals Table
```sql
CREATE TABLE goals (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    priority VARCHAR(10) DEFAULT 'medium',
    target_date TIMESTAMP,
    user_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### Verifications Table
```sql
CREATE TABLE verifications (
    id SERIAL PRIMARY KEY,
    photo_url VARCHAR(500),
    verified_at TIMESTAMP DEFAULT NOW(),
    ai_confidence INTEGER,
    is_verified BOOLEAN DEFAULT FALSE,
    notes TEXT,
    goal_id INTEGER REFERENCES goals(id)
);
```

## 🔧 Development

### Project Structure
```
├── main.py              # FastAPI application
├── database.py          # Database connection
├── models.py            # SQLAlchemy models
├── schemas.py           # Pydantic schemas
├── crud.py              # Database operations
├── run.py               # Application runner
├── requirements.txt     # Dependencies
├── env.example          # Environment template
└── FASTAPI_README.md    # This file
```

### Environment Variables
```env
# Database
DATABASE_URL=postgresql://user:pass@host:port/db

# Server
HOST=0.0.0.0
PORT=8000
DEBUG=True

# Security
SECRET_KEY=your-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

## 🧪 Testing the API

### 1. Test Connection
```bash
curl http://localhost:8000/
```

### 2. Create a User
```bash
curl -X POST "http://localhost:8000/users/" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "securepassword"
  }'
```

### 3. Create a Goal
```bash
curl -X POST "http://localhost:8000/goals/" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-token" \
  -d '{
    "title": "Run 5K",
    "description": "Complete a 5K run",
    "category": "fitness",
    "priority": "high",
    "target_date": "2024-12-31T23:59:59"
  }'
```

## 🚀 Deployment

### AWS EC2 Deployment
1. **Install dependencies on EC2:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Configure environment:**
   ```bash
   cp env.example .env
   # Edit .env with your RDS credentials
   ```

3. **Run with PM2 or systemd:**
   ```bash
   # Using PM2
   pm2 start run.py --name goaltracker
   
   # Or using systemd
   sudo systemctl start goaltracker
   ```

### Docker Deployment
```dockerfile
FROM python:3.9-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
EXPOSE 8000

CMD ["python", "run.py"]
```

## 🔒 Security Features

- Password hashing with bcrypt
- JWT token authentication (ready for implementation)
- Input validation with Pydantic
- SQL injection protection with SQLAlchemy ORM
- CORS configuration for frontend integration

## 📈 Performance Features

- Database connection pooling
- Async/await support
- Automatic API documentation
- Request/response validation
- Database indexing for optimal queries

## 🎯 Next Steps

1. **Add Authentication**: Implement JWT token authentication
2. **Add AWS S3**: For photo storage
3. **Add AWS Rekognition**: For AI photo verification
4. **Add Real-time**: WebSocket support for live updates
5. **Add Frontend**: React/Vue.js frontend integration

## 🏆 Hackathon Features

This FastAPI application provides:
- ✅ **Modern API**: FastAPI with automatic documentation
- ✅ **Database**: PostgreSQL on AWS RDS
- ✅ **Security**: Password hashing and validation
- ✅ **Scalability**: Production-ready architecture
- ✅ **Healthcare Focus**: Goal tracking for health and wellness
- ✅ **Social Features**: User management and goal sharing
- ✅ **AI Ready**: Structure for photo verification integration

Perfect for your Lehigh 2025 Hackathon project! 🎉
