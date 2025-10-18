const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Database configuration
const dbConfig = {
  host: 'database-1.cluster-cw18kkw8mg9c.us-east-1.rds.amazonaws.com',
  user: process.env.DB_USER || 'admin',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'goalquest_db',
  port: 3306,
  ssl: {
    rejectUnauthorized: false
  }
};

// Create database connection pool
const pool = mysql.createPool(dbConfig);

// Test database connection
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Database connected successfully');
    connection.release();
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  }
}

// Configure multer for photo uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname))
  }
});
const upload = multer({ storage: storage });

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware to verify JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

// API Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'GoalQuest API is running',
    database: 'database-1.cluster-cw18kkw8mg9c.us-east-1.rds.amazonaws.com'
  });
});

// User registration
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password, full_name } = req.body;
    
    // Check if user already exists
    const [existingUsers] = await pool.execute(
      'SELECT * FROM users WHERE email = ? OR username = ?',
      [email, username]
    );
    
    if (existingUsers.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    const [result] = await pool.execute(
      'INSERT INTO users (username, email, password, full_name) VALUES (?, ?, ?, ?)',
      [username, email, hashedPassword, full_name]
    );
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: result.insertId, username, email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({
      message: 'User created successfully',
      token,
      user: { id: result.insertId, username, email, full_name }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// User login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user
    const [users] = await pool.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    
    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const user = users[0];
    
    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, username: user.username, email: user.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        total_points: user.total_points,
        level: user.level
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get user profile
app.get('/api/user/profile', authenticateToken, async (req, res) => {
  try {
    const [users] = await pool.execute(
      'SELECT id, username, email, full_name, total_points, level, created_at FROM users WHERE id = ?',
      [req.user.userId]
    );
    
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(users[0]);
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

// Get user goals
app.get('/api/goals', authenticateToken, async (req, res) => {
  try {
    const [goals] = await pool.execute(`
      SELECT g.*, u.username 
      FROM goals g 
      LEFT JOIN users u ON g.user_id = u.id 
      WHERE g.user_id = ?
      ORDER BY g.created_at DESC
    `, [req.user.userId]);
    
    res.json(goals);
  } catch (error) {
    console.error('Goals error:', error);
    res.status(500).json({ error: 'Failed to get goals' });
  }
});

// Create goal
app.post('/api/goals', authenticateToken, async (req, res) => {
  try {
    const { title, description, goal_type, duration, target_value, requires_photo, points_per_completion } = req.body;
    
    const [result] = await pool.execute(
      'INSERT INTO goals (user_id, title, description, goal_type, duration, target_value, requires_photo, points_per_completion) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [req.user.userId, title, description, goal_type, duration, target_value, requires_photo, points_per_completion]
    );
    
    res.json({
      message: 'Goal created successfully',
      goalId: result.insertId
    });
  } catch (error) {
    console.error('Create goal error:', error);
    res.status(500).json({ error: 'Failed to create goal' });
  }
});

// Complete goal
app.post('/api/goals/:id/complete', authenticateToken, upload.single('photo'), async (req, res) => {
  try {
    const goalId = req.params.id;
    const { notes, location_lat, location_lng } = req.body;
    const photo_url = req.file ? req.file.path : null;
    
    // Get goal details
    const [goalRows] = await pool.execute('SELECT * FROM goals WHERE id = ? AND user_id = ?', [goalId, req.user.userId]);
    
    if (goalRows.length === 0) {
      return res.status(404).json({ error: 'Goal not found' });
    }
    
    const goal = goalRows[0];
    const points_earned = goal.points_per_completion;
    
    // Create completion record
    const [result] = await pool.execute(
      'INSERT INTO goal_completions (goal_id, user_id, completion_date, photo_url, location_lat, location_lng, notes, points_earned) VALUES (?, ?, CURDATE(), ?, ?, ?, ?, ?)',
      [goalId, req.user.userId, photo_url, location_lat, location_lng, notes, points_earned]
    );
    
    // Update user's total points
    await pool.execute(
      'UPDATE users SET total_points = total_points + ? WHERE id = ?',
      [points_earned, req.user.userId]
    );
    
    // Update goal progress
    await pool.execute(
      'UPDATE goals SET current_value = current_value + 1 WHERE id = ?',
      [goalId]
    );
    
    res.json({
      message: 'Goal completed successfully',
      pointsEarned: points_earned,
      completionId: result.insertId
    });
  } catch (error) {
    console.error('Complete goal error:', error);
    res.status(500).json({ error: 'Failed to complete goal' });
  }
});

// Get leaderboard
app.get('/api/leaderboard', async (req, res) => {
  try {
    const [users] = await pool.execute(`
      SELECT id, username, full_name, total_points, level,
             ROW_NUMBER() OVER (ORDER BY total_points DESC) as rank
      FROM users 
      ORDER BY total_points DESC 
      LIMIT 50
    `);
    
    res.json(users);
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ error: 'Failed to get leaderboard' });
  }
});

// Get groups
app.get('/api/groups', async (req, res) => {
  try {
    const [groups] = await pool.execute(`
      SELECT g.*, u.username as created_by_name
      FROM groups g 
      LEFT JOIN users u ON g.created_by = u.id 
      ORDER BY g.total_points DESC
    `);
    
    res.json(groups);
  } catch (error) {
    console.error('Groups error:', error);
    res.status(500).json({ error: 'Failed to get groups' });
  }
});

// Create group
app.post('/api/groups', authenticateToken, async (req, res) => {
  try {
    const { name, description } = req.body;
    const group_code = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    const [result] = await pool.execute(
      'INSERT INTO groups (name, description, group_code, created_by) VALUES (?, ?, ?, ?)',
      [name, description, group_code, req.user.userId]
    );
    
    res.json({
      message: 'Group created successfully',
      groupId: result.insertId,
      groupCode: group_code
    });
  } catch (error) {
    console.error('Create group error:', error);
    res.status(500).json({ error: 'Failed to create group' });
  }
});

// Join group
app.post('/api/groups/:id/join', authenticateToken, async (req, res) => {
  try {
    const groupId = req.params.id;
    
    // Check if user is already in group
    const [existing] = await pool.execute(
      'SELECT * FROM group_members WHERE group_id = ? AND user_id = ?',
      [groupId, req.user.userId]
    );
    
    if (existing.length > 0) {
      return res.status(400).json({ error: 'User already in group' });
    }
    
    // Add user to group
    await pool.execute(
      'INSERT INTO group_members (group_id, user_id) VALUES (?, ?)',
      [groupId, req.user.userId]
    );
    
    // Update group member count
    await pool.execute(
      'UPDATE groups SET member_count = member_count + 1 WHERE id = ?',
      [groupId]
    );
    
    res.json({ message: 'Successfully joined group' });
  } catch (error) {
    console.error('Join group error:', error);
    res.status(500).json({ error: 'Failed to join group' });
  }
});

// Serve React Native app
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/public/index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`🎯 GoalQuest server running on port ${PORT}`);
  console.log(`📱 Mobile app: http://localhost:${PORT}`);
  console.log(`🔗 API health: http://localhost:${PORT}/api/health`);
  testConnection();
});
