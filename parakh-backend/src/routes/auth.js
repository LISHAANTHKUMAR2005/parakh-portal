const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');

const User = require('../models/User');
const { 
  generateToken, 
  hashPassword, 
  comparePassword, 
  validateEmail, 
  validatePassword,
  validateJWT,
  formatUserResponse
} = require('../utils/auth');
const { asyncHandler, formatValidationError } = require('../middleware/errorHandler');

const router = express.Router();

// Rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// @route   POST api/auth/register
// @desc    Register user
// @access  Public
router.post('/register', 
  authLimiter,
  [
    body('name', 'Name is required').not().isEmpty().trim(),
    body('email', 'Please include a valid email').isEmail().normalizeEmail(),
    body('password', 'Password must be 6 or more characters').isLength({ min: 6 }),
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

    const { name, email, password, role } = req.body;

    // Check if user exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({
        success: false,
        message: 'User already exists'
      });
    }

    // Validate password strength
    const passwordErrors = validatePassword(password);
    if (passwordErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Password validation failed',
        errors: passwordErrors
      });
    }

    // Create new user
    user = new User({
      name,
      email,
      password,
      role
    });

    await user.save();

    // Generate JWT token
    const payload = {
      user: {
        id: user._id,
        role: user.role
      }
    };

    const token = generateToken(payload);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      ...formatUserResponse(user, token)
    });
  })
);

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login',
  authLimiter,
  [
    body('email', 'Please include a valid email').isEmail().normalizeEmail(),
    body('password', 'Password is required').exists()
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

    const { email, password } = req.body;

    try {
      // Check if user exists
      let user = await User.findByEmail(email);
      
      if (!user) {
        return res.status(400).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Check if account is locked
      if (user.isLocked) {
        return res.status(423).json({
          success: false,
          message: 'Account is temporarily locked due to too many failed login attempts. Please try again later.'
        });
      }

      // Check password
      const isMatch = await comparePassword(password, user.password);

      if (!isMatch) {
        await user.incLoginAttempts();
        return res.status(400).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Reset login attempts on successful login
      if (user.security.loginAttempts > 0) {
        await user.resetLoginAttempts();
      }

      // Update last login
      user.security.lastLogin = new Date();
      await user.save();

      // Generate JWT token
      const payload = {
        user: {
          id: user._id,
          role: user.role
        }
      };

      const token = generateToken(payload);

      res.json({
        success: true,
        message: 'Login successful',
        ...formatUserResponse(user, token)
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  })
);

// @route   POST api/auth/refresh
// @desc    Refresh JWT token
// @access  Private
router.post('/refresh', 
  validateJWT,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const payload = {
      user: {
        id: user._id,
        role: user.role
      }
    };

    const token = generateToken(payload);

    res.json({
      success: true,
      token
    });
  })
);

// @route   POST api/auth/forgot-password
// @desc    Send password reset email
// @access  Public
router.post('/forgot-password',
  [
    body('email', 'Please include a valid email').isEmail().normalizeEmail()
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

    const { email } = req.body;

    const user = await User.findByEmail(email);
    
    if (!user) {
      // Don't reveal if user exists or not for security
      return res.status(200).json({
        success: true,
        message: 'If this email is registered, a password reset link has been sent.'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Hash token and save to database
    user.security.passwordResetToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    
    user.security.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    await user.save();

    // In a real application, you would send an email here
    // For now, we'll return the token (this should be removed in production)
    res.json({
      success: true,
      message: 'Password reset instructions sent to your email',
      resetToken: resetToken // Remove this in production
    });
  })
);

// @route   POST api/auth/reset-password
// @desc    Reset password with token
// @access  Public
router.post('/reset-password',
  [
    body('token', 'Reset token is required').not().isEmpty(),
    body('password', 'Password must be 6 or more characters').isLength({ min: 6 })
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

    const { token, password } = req.body;

    // Validate password strength
    const passwordErrors = validatePassword(password);
    if (passwordErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Password validation failed',
        errors: passwordErrors
      });
    }

    // Hash the token to compare with stored hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      'security.passwordResetToken': hashedToken,
      'security.passwordResetExpires': { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    // Update password and clear reset token
    user.password = password;
    user.security.passwordResetToken = undefined;
    user.security.passwordResetExpires = undefined;

    await user.save();

    res.json({
      success: true,
      message: 'Password has been reset successfully'
    });
  })
);

// @route   POST api/auth/change-password
// @desc    Change password (requires current password)
// @access  Private
router.post('/change-password',
  validateJWT,
  [
    body('currentPassword', 'Current password is required').exists(),
    body('newPassword', 'New password must be 6 or more characters').isLength({ min: 6 })
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

    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check current password
    const isMatch = await comparePassword(currentPassword, user.password);
    
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Validate new password strength
    const passwordErrors = validatePassword(newPassword);
    if (passwordErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Password validation failed',
        errors: passwordErrors
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  })
);

// @route   GET api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', 
  validateJWT,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id).select('-password -security.passwordResetToken');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user: formatUserResponse(user).user
    });
  })
);

// @route   POST api/auth/logout
// @desc    Logout user (client-side token removal)
// @access  Private
router.post('/logout', 
  validateJWT,
  asyncHandler(async (req, res) => {
    // In a stateless JWT system, logout is handled client-side
    // by removing the token from storage
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  })
);

module.exports = router;