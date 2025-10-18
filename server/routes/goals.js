const express = require('express');
const { body, validationResult } = require('express-validator');
const Goal = require('../models/Goal');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { uploadPhoto, verifyPhoto } = require('../services/aws');

const router = express.Router();

// @route   GET /api/goals
// @desc    Get user's goals
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { status, category, type, page = 1, limit = 10 } = req.query;
    
    const filter = { user: req.user.id };
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (type) filter.type = type;

    const goals = await Goal.find(filter)
      .populate('group', 'name')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Goal.countDocuments(filter);

    res.json({
      success: true,
      goals,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get goals error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/goals
// @desc    Create a new goal
// @access  Private
router.post('/', auth, [
  body('title').notEmpty().withMessage('Title is required'),
  body('category').isIn(['fitness', 'education', 'career', 'personal', 'financial', 'health', 'social', 'creative', 'other']).withMessage('Invalid category'),
  body('targetDate').isISO8601().withMessage('Valid target date is required'),
  body('frequency').isIn(['daily', 'weekly', 'monthly', 'custom']).withMessage('Invalid frequency')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const goalData = {
      ...req.body,
      user: req.user.id
    };

    const goal = new Goal(goalData);
    await goal.save();

    // Update user stats
    await User.findByIdAndUpdate(req.user.id, {
      $inc: { 'stats.totalGoals': 1 }
    });

    res.status(201).json({
      success: true,
      message: 'Goal created successfully',
      goal
    });
  } catch (error) {
    console.error('Create goal error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/goals/:id
// @desc    Get a specific goal
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const goal = await Goal.findOne({
      _id: req.params.id,
      user: req.user.id
    }).populate('group', 'name');

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Goal not found'
      });
    }

    res.json({
      success: true,
      goal
    });
  } catch (error) {
    console.error('Get goal error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/goals/:id
// @desc    Update a goal
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const goal = await Goal.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Goal not found'
      });
    }

    res.json({
      success: true,
      message: 'Goal updated successfully',
      goal
    });
  } catch (error) {
    console.error('Update goal error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/goals/:id
// @desc    Delete a goal
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const goal = await Goal.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id
    });

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Goal not found'
      });
    }

    res.json({
      success: true,
      message: 'Goal deleted successfully'
    });
  } catch (error) {
    console.error('Delete goal error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/goals/:id/verify
// @desc    Verify goal completion with photo
// @access  Private
router.post('/:id/verify', auth, uploadPhoto, async (req, res) => {
  try {
    const goal = await Goal.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Goal not found'
      });
    }

    if (goal.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Goal is not active'
      });
    }

    // Verify photo with AWS Rekognition
    const verification = await verifyPhoto(req.photoUrl, goal.category);

    // Update goal progress
    const updatedGoal = await goal.updateProgress(1);
    
    // Calculate points
    const points = updatedGoal.calculatePoints();
    
    // Update user points and stats
    const user = await User.findById(req.user.id);
    await user.addPoints(points);
    await user.updateStreak(true);

    // Update user stats
    if (updatedGoal.status === 'completed') {
      await User.findByIdAndUpdate(req.user.id, {
        $inc: { 'stats.completedGoals': 1 }
      });
    }

    res.json({
      success: true,
      message: 'Goal verified successfully',
      goal: updatedGoal,
      verification,
      pointsEarned: points
    });
  } catch (error) {
    console.error('Verify goal error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/goals/stats/overview
// @desc    Get user's goal statistics
// @access  Private
router.get('/stats/overview', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const stats = await Goal.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: null,
          totalGoals: { $sum: 1 },
          completedGoals: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          activeGoals: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
          averageStreak: { $avg: '$streak.current' },
          totalPoints: { $sum: '$points.base' }
        }
      }
    ]);

    const categoryStats = await Goal.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } }
        }
      }
    ]);

    res.json({
      success: true,
      stats: stats[0] || {
        totalGoals: 0,
        completedGoals: 0,
        activeGoals: 0,
        averageStreak: 0,
        totalPoints: 0
      },
      categoryStats
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
