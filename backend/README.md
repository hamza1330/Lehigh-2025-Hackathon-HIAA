# LockIN Backend API

A FastAPI-based backend for the LockIN focus group application, designed to work with PostgreSQL on AWS RDS and hosted on EC2.

## Features

- **Authentication**: AWS Cognito JWT integration
- **Groups Management**: Create, join, and manage focus groups
- **Session Tracking**: Time logging and session management
- **Progress Monitoring**: Real-time progress tracking using database views
- **Notifications**: Inbox system for group invitations and updates
- **Avatar Uploads**: S3 presigned URLs for profile pictures
- **Database**: PostgreSQL with advanced features (views, triggers, functions)

## Architecture

```
backend/
├── app/
│   ├── api/
│   │   └── routes/          # API route handlers
│   ├── core/               # Core configuration and database
│   ├── models.py           # SQLAlchemy models
│   ├── schemas.py          # Pydantic schemas
│   └── main.py            # FastAPI application
├── schema.sql              # PostgreSQL schema
├── requirements.txt        # Python dependencies
├── run.py                 # Development server
├── init_db.py            # Database initialization
└── deploy.sh             # EC2 deployment script
```

## Quick Start

### 1. Local Development

```bash
# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Initialize database
python init_db.py

# Run development server
python run.py
```

### 2. Production Deployment (EC2)

```bash
# Run deployment script
chmod +x deploy.sh
./deploy.sh

# Configure environment
cp .env.template /opt/lockin-backend/.env
# Edit /opt/lockin-backend/.env with your production values

# Initialize database
cd /opt/lockin-backend
./setup_db.sh

# Start service
sudo systemctl start lockin-backend
```

## API Endpoints

### Authentication & Profiles
- `GET /api/me` - Get current user profile
- `PATCH /api/me` - Update user profile
- `POST /api/profiles/avatar/upload-url` - Get S3 presigned URL for avatar upload

### Groups
- `POST /api/groups` - Create a new group
- `GET /api/groups` - List user's groups
- `GET /api/groups/{id}` - Get group details
- `POST /api/groups/{id}:clone` - Clone existing group
- `GET /api/groups/{id}/members` - List group members
- `POST /api/groups/{id}/members` - Add member to group
- `PATCH /api/groups/{id}/members/{user_id}` - Update member settings
- `DELETE /api/groups/{id}/members/{user_id}` - Remove member from group
- `POST /api/groups/{id}:invite` - Send group invitation

### Sessions & Time Logging
- `POST /api/sessions` - Create a new session
- `POST /api/sessions/{id}:start` - Start session
- `POST /api/sessions/{id}:pause` - Pause session
- `POST /api/sessions/{id}:resume` - Resume session
- `POST /api/sessions/{id}:stop` - Stop session
- `POST /api/sessions/{id}/logs` - Log time for session
- `GET /api/sessions/{id}` - Get session details
- `GET /api/sessions/{id}/participants` - List session participants

### Progress Tracking
- `GET /api/groups/{id}/progress/current` - Get current period progress

### Notifications
- `GET /api/notifications` - List user notifications
- `POST /api/notifications/{id}:read` - Mark notification as read
- `POST /api/invites/{id}:accept` - Accept group invitation
- `POST /api/invites/{id}:decline` - Decline group invitation

### Maintenance
- `POST /api/maintenance/archive-expired-groups` - Archive expired groups

## Database Schema

The application uses PostgreSQL with the following key features:

- **Extensions**: `pgcrypto`, `citext`
- **Enums**: Group status, member roles, session status, etc.
- **Views**: `group_member_period_progress` for real-time progress tracking
- **Functions**: `clone_group()`, `archive_expired_groups()`
- **Triggers**: Prevent operations on archived groups, enforce time log constraints

## Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:password@host:port/database

# AWS Cognito
COGNITO_REGION=us-east-1
COGNITO_USER_POOL_ID=your-user-pool-id
COGNITO_CLIENT_ID=your-client-id

# AWS S3
S3_BUCKET_NAME=lockin-avatars
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1

# JWT
JWT_SECRET_KEY=your-secret-key
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30
```

## Frontend Integration

The API is designed to work seamlessly with the React Native frontend:

- **Groups**: Maps to the frontend's group management screens
- **Sessions**: Supports the clock-in/clock-out functionality
- **Progress**: Provides real-time progress data for leaderboards
- **Notifications**: Powers the inbox system
- **Avatars**: Handles profile picture uploads

## Security

- JWT token validation with AWS Cognito
- CORS configuration for frontend access
- Database-level constraints and triggers
- S3 presigned URLs for secure file uploads

## Monitoring

- Health check endpoint: `/health`
- Structured logging with systemd
- Service management with systemd
- Nginx reverse proxy with access logs

## Development

```bash
# Install development dependencies
pip install -r requirements.txt

# Run with auto-reload
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Run tests (when implemented)
pytest
```

## Production Considerations

1. **Database**: Use AWS RDS PostgreSQL with proper backup configuration
2. **Security**: Configure proper CORS origins, use HTTPS
3. **Monitoring**: Set up CloudWatch logs and metrics
4. **Scaling**: Consider using Application Load Balancer for multiple instances
5. **Secrets**: Use AWS Secrets Manager for sensitive configuration

## Troubleshooting

### Common Issues

1. **Database Connection**: Check DATABASE_URL format and network connectivity
2. **Cognito Integration**: Verify JWT token format and user pool configuration
3. **S3 Uploads**: Ensure bucket permissions and AWS credentials
4. **Service Status**: Check `sudo systemctl status lockin-backend`

### Logs

```bash
# Application logs
sudo journalctl -u lockin-backend -f

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```
