const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['fitness', 'education', 'career', 'personal', 'financial', 'health', 'social', 'creative', 'other']
  },
  type: {
    type: String,
    required: true,
    enum: ['habit', 'milestone', 'challenge'],
    default: 'habit'
  },
  frequency: {
    type: String,
    required: true,
    enum: ['daily', 'weekly', 'monthly', 'custom'],
    default: 'daily'
  },
  targetDate: {
    type: Date,
    required: true
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'paused', 'cancelled'],
    default: 'active'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    default: null
  },
  verification: {
    required: {
      type: Boolean,
      default: true
    },
    method: {
      type: String,
      enum: ['photo', 'text', 'location', 'none'],
      default: 'photo'
    },
    aiVerification: {
      type: Boolean,
      default: true
    }
  },
  reminders: [{
    time: String, // "09:00"
    days: [String], // ["monday", "tuesday"]
    enabled: { type: Boolean, default: true }
  }],
  progress: {
    current: { type: Number, default: 0 },
    target: { type: Number, default: 1 },
    unit: { type: String, default: 'times' }
  },
  streak: {
    current: { type: Number, default: 0 },
    longest: { type: Number, default: 0 }
  },
  tags: [String],
  difficulty: {
    type: Number,
    min: 1,
    max: 10,
    default: 5
  },
  points: {
    base: { type: Number, default: 10 },
    bonus: { type: Number, default: 0 }
  },
  metadata: {
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: [Number] // [longitude, latitude]
    },
    timezone: String,
    customFields: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Indexes for better performance
goalSchema.index({ user: 1, status: 1 });
goalSchema.index({ category: 1 });
goalSchema.index({ group: 1 });
goalSchema.index({ targetDate: 1 });
goalSchema.index({ 'metadata.location': '2dsphere' });

// Virtual for days remaining
goalSchema.virtual('daysRemaining').get(function() {
  const now = new Date();
  const target = new Date(this.targetDate);
  const diffTime = target - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
});

// Virtual for progress percentage
goalSchema.virtual('progressPercentage').get(function() {
  if (this.progress.target === 0) return 0;
  return Math.min(100, Math.round((this.progress.current / this.progress.target) * 100));
});

// Method to update progress
goalSchema.methods.updateProgress = function(increment = 1) {
  this.progress.current += increment;
  
  // Update streak
  if (increment > 0) {
    this.streak.current += 1;
    if (this.streak.current > this.streak.longest) {
      this.streak.longest = this.streak.current;
    }
  } else {
    this.streak.current = 0;
  }
  
  // Check if goal is completed
  if (this.progress.current >= this.progress.target) {
    this.status = 'completed';
  }
  
  return this.save();
};

// Method to calculate points
goalSchema.methods.calculatePoints = function() {
  let points = this.points.base;
  
  // Difficulty multiplier
  points *= (this.difficulty / 5);
  
  // Streak bonus
  points += (this.streak.current * 2);
  
  // Group bonus
  if (this.group) {
    points *= 1.2;
  }
  
  // Time bonus (early completion)
  const daysRemaining = this.daysRemaining;
  if (daysRemaining > 0) {
    points *= 1.1;
  }
  
  return Math.round(points);
};

// Pre-save middleware
goalSchema.pre('save', function(next) {
  // Update target date if it's in the past
  if (this.targetDate < new Date() && this.status === 'active') {
    this.status = 'cancelled';
  }
  next();
});

module.exports = mongoose.model('Goal', goalSchema);
