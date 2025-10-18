const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  avatar: {
    type: String,
    default: null
  },
  points: {
    type: Number,
    default: 0
  },
  streakDays: {
    type: Number,
    default: 0
  },
  level: {
    type: Number,
    default: 1
  },
  achievements: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Achievement'
  }],
  preferences: {
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      reminders: { type: Boolean, default: true }
    },
    privacy: {
      profileVisibility: { type: String, enum: ['public', 'friends', 'private'], default: 'friends' },
      showLocation: { type: Boolean, default: false }
    }
  },
  stats: {
    totalGoals: { type: Number, default: 0 },
    completedGoals: { type: Number, default: 0 },
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    joinDate: { type: Date, default: Date.now }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Calculate user level based on points
userSchema.methods.calculateLevel = function() {
  return Math.floor(this.points / 1000) + 1;
};

// Add points and update level
userSchema.methods.addPoints = function(points) {
  this.points += points;
  this.level = this.calculateLevel();
  return this.save();
};

// Update streak
userSchema.methods.updateStreak = function(completed) {
  if (completed) {
    this.streakDays += 1;
    if (this.streakDays > this.stats.longestStreak) {
      this.stats.longestStreak = this.streakDays;
    }
  } else {
    this.streakDays = 0;
  }
  this.stats.currentStreak = this.streakDays;
  return this.save();
};

// Virtual for completion rate
userSchema.virtual('completionRate').get(function() {
  if (this.stats.totalGoals === 0) return 0;
  return Math.round((this.stats.completedGoals / this.stats.totalGoals) * 100);
});

// Remove password from JSON output
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  return user;
};

module.exports = mongoose.model('User', userSchema);
