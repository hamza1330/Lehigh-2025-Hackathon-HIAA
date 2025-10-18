const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
  name: {
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
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['admin', 'moderator', 'member'],
      default: 'member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    points: {
      type: Number,
      default: 0
    }
  }],
  isPrivate: {
    type: Boolean,
    default: false
  },
  inviteCode: {
    type: String,
    unique: true,
    sparse: true
  },
  category: {
    type: String,
    enum: ['fitness', 'education', 'career', 'personal', 'financial', 'health', 'social', 'creative', 'mixed'],
    default: 'mixed'
  },
  rules: {
    maxMembers: {
      type: Number,
      default: 50
    },
    allowInvites: {
      type: Boolean,
      default: true
    },
    requireApproval: {
      type: Boolean,
      default: false
    }
  },
  challenges: [{
    title: String,
    description: String,
    startDate: Date,
    endDate: Date,
    reward: Number,
    isActive: { type: Boolean, default: true }
  }],
  stats: {
    totalGoals: { type: Number, default: 0 },
    completedGoals: { type: Number, default: 0 },
    totalPoints: { type: Number, default: 0 },
    averageStreak: { type: Number, default: 0 }
  },
  settings: {
    allowChat: { type: Boolean, default: true },
    allowPhotos: { type: Boolean, default: true },
    allowLocation: { type: Boolean, default: false },
    notifications: {
      goalUpdates: { type: Boolean, default: true },
      newMembers: { type: Boolean, default: true },
      challenges: { type: Boolean, default: true }
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes
groupSchema.index({ admin: 1 });
groupSchema.index({ 'members.user': 1 });
groupSchema.index({ category: 1 });
groupSchema.index({ isPrivate: 1 });
groupSchema.index({ inviteCode: 1 });

// Virtual for member count
groupSchema.virtual('memberCount').get(function() {
  return this.members.length;
});

// Virtual for completion rate
groupSchema.virtual('completionRate').get(function() {
  if (this.stats.totalGoals === 0) return 0;
  return Math.round((this.stats.completedGoals / this.stats.totalGoals) * 100);
});

// Method to add member
groupSchema.methods.addMember = function(userId, role = 'member') {
  // Check if user is already a member
  const existingMember = this.members.find(member => 
    member.user.toString() === userId.toString()
  );
  
  if (existingMember) {
    throw new Error('User is already a member of this group');
  }
  
  // Check member limit
  if (this.members.length >= this.rules.maxMembers) {
    throw new Error('Group has reached maximum member limit');
  }
  
  this.members.push({
    user: userId,
    role: role,
    joinedAt: new Date(),
    points: 0
  });
  
  return this.save();
};

// Method to remove member
groupSchema.methods.removeMember = function(userId) {
  this.members = this.members.filter(member => 
    member.user.toString() !== userId.toString()
  );
  return this.save();
};

// Method to update member role
groupSchema.methods.updateMemberRole = function(userId, newRole) {
  const member = this.members.find(member => 
    member.user.toString() === userId.toString()
  );
  
  if (!member) {
    throw new Error('User is not a member of this group');
  }
  
  member.role = newRole;
  return this.save();
};

// Method to generate invite code
groupSchema.methods.generateInviteCode = function() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  this.inviteCode = result;
  return this.save();
};

// Method to update group stats
groupSchema.methods.updateStats = function() {
  // This would be called when goals are completed
  // Implementation would depend on how you want to calculate stats
  return this.save();
};

// Pre-save middleware to generate invite code for private groups
groupSchema.pre('save', function(next) {
  if (this.isPrivate && !this.inviteCode) {
    this.generateInviteCode();
  }
  next();
});

module.exports = mongoose.model('Group', groupSchema);
