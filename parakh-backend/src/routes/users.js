const express = require('express');
const { body, validationResult } = require('express-validator');

const User = require('../models/User');
const { 
  validateJWT, 
  checkRole, 
  checkOwnershipOrAdmin, 
  formatUserResponse 
} = require('../utils/auth');
const { asyncHandler, formatValidationError } = require('../middleware/errorHandler');

const router = express.Router();

// Apply auth middleware to all routes
router.use(validateJWT);

// @route   GET api/users
// @desc    Get all users (Admin only)
// @access  Private - Admin
router.get('/', 
  checkRole('ADMIN'),
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, role, status, search } = req.query;
    
    // Build query
    const query = {};
    if (role) query.role = role;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Get users with pagination
    const users = await User.find(query)
      .select('-password -security.passwordResetToken')
      .sort({ 'metadata.createdAt': -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Get total count
    const total = await User.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalUsers: total,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });
  })
);

// @route   GET api/users/stats
// @desc    Get user statistics (Admin only)
// @access  Private - Admin
router.get('/stats', 
  checkRole('ADMIN'),
  asyncHandler(async (req, res) => {
    const stats = await User.getStatsByRole();
    
    // Get additional stats
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ status: 'ACTIVE' });
    const recentUsers = await User.countDocuments({
      'metadata.createdAt': { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    });

    res.json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        recentUsers,
        byRole: stats
      }
    });
  })
);

// @route   GET api/users/:id
// @desc    Get user by ID
// @access  Private
router.get('/:id', 
  checkOwnershipOrAdmin(),
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id)
      .select('-password -security.passwordResetToken');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: formatUserResponse(user).user
    });
  })
);

// @route   PUT api/users/:id
// @desc    Update user
// @access  Private
router.put('/:id', 
  checkOwnershipOrAdmin(),
  [
    body('name', 'Name must be at least 2 characters').optional().isLength({ min: 2 }).trim(),
    body('email', 'Please include a valid email').optional().isEmail().normalizeEmail(),
    body('role', 'Invalid role').optional().isIn(['STUDENT', 'TEACHER', 'ADMIN']),
    body('status', 'Invalid status').optional().isIn(['ACTIVE', 'INACTIVE', 'SUSPENDED']),
    body('profile.bio', 'Bio cannot exceed 500 characters').optional().isLength({ max: 500 }),
    body('profile.grade', 'Invalid grade').optional().isIn(['6', '7', '8', '9', '10', '11', '12', 'UNDERGRAD', 'GRAD'])
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: formatValidationError(errors)
      });
    }

    const { name, email, role, status, profile } = req.body;

    // Check if email is already taken by another user
    if (email) {
      const existingUser = await User.findOne({ 
        email, 
        _id: { $ne: req.params.id } 
      });
      
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email is already in use'
        });
      }
    }

    let user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (role && req.user.role === 'ADMIN') user.role = role;
    if (status && req.user.role === 'ADMIN') user.status = status;
    if (profile) {
      user.profile = { ...user.profile, ...profile };
    }

    await user.save();

    res.json({
      success: true,
      message: 'User updated successfully',
      data: formatUserResponse(user).user
    });
  })
);

// @route   DELETE api/users/:id
// @desc    Delete user (Admin only)
// @access  Private - Admin
router.delete('/:id', 
  checkRole('ADMIN'),
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent admin from deleting themselves
    if (user._id.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account'
      });
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  })
);

// @route   PUT api/users/:id/role
// @desc    Update user role (Admin only)
// @access  Private - Admin
router.put('/:id/role', 
  checkRole('ADMIN'),
  [
    body('role', 'Role is required').isIn(['STUDENT', 'TEACHER', 'ADMIN'])
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: formatValidationError(errors)
      });
    }

    const { role } = req.body;

    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent admin from changing their own role
    if (user._id.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot change your own role'
      });
    }

    user.role = role;
    await user.save();

    res.json({
      success: true,
      message: `User role updated to ${role}`,
      data: { role: user.role }
    });
  })
);

// @route   PUT api/users/:id/status
// @desc    Update user status (Admin only)
// @access  Private - Admin
router.put('/:id/status', 
  checkRole('ADMIN'),
  [
    body('status', 'Status is required').isIn(['ACTIVE', 'INACTIVE', 'SUSPENDED'])
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: formatValidationError(errors)
      });
    }

    const { status } = req.body;

    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.status = status;
    await user.save();

    res.json({
      success: true,
      message: `User status updated to ${status}`,
      data: { status: user.status }
    });
  })
);

// @route   GET api/users/:id/academic
// @desc    Get user academic data
// @access  Private
router.get('/:id/academic', 
  checkOwnershipOrAdmin(),
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        academic: user.academic,
        settings: user.settings
      }
    });
  })
);

// @route   PUT api/users/:id/academic
// @desc    Update user academic data
// @access  Private
router.put('/:id/academic', 
  checkOwnershipOrAdmin(),
  asyncHandler(async (req, res) => {
    const { weakTopics, learningPath } = req.body;

    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (weakTopics) user.academic.weakTopics = weakTopics;
    if (learningPath) user.academic.learningPath = learningPath;

    await user.save();

    res.json({
      success: true,
      message: 'Academic data updated successfully',
      data: { academic: user.academic }
    });
  })
);

// @route   GET api/users/:id/settings
// @desc    Get user settings
// @access  Private
router.get('/:id/settings', 
  checkOwnershipOrAdmin(),
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: { settings: user.settings }
    });
  })
);

// @route   PUT api/users/:id/settings
// @desc    Update user settings
// @access  Private
router.put('/:id/settings', 
  checkOwnershipOrAdmin(),
  asyncHandler(async (req, res) => {
    const { notifications, privacy, theme } = req.body;

    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (notifications) user.settings.notifications = { ...user.settings.notifications, ...notifications };
    if (privacy) user.settings.privacy = { ...user.settings.privacy, ...privacy };
    if (theme) user.settings.theme = { ...user.settings.theme, ...theme };

    await user.save();

    res.json({
      success: true,
      message: 'Settings updated successfully',
      data: { settings: user.settings }
    });
  })
);

module.exports = router;
