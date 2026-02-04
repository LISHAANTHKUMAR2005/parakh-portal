const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// JWT token generation
const generateToken = (payload, expiresIn = process.env.JWT_EXPIRES_IN || '7d') => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
};

// JWT token verification
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

// Generate refresh token
const generateRefreshToken = () => {
  return crypto.randomBytes(64).toString('hex');
};

// Hash password
const hashPassword = async (password) => {
  const bcrypt = require('bcryptjs');
  const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
  return await bcrypt.hash(password, saltRounds);
};

// Compare password
const comparePassword = async (password, hashedPassword) => {
  const bcrypt = require('bcryptjs');
  return await bcrypt.compare(password, hashedPassword);
};

// Generate password reset token
const generatePasswordResetToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Generate 2FA secret
const generateTwoFactorSecret = () => {
  return crypto.randomBytes(32).toString('base64');
};

// Validate email format
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate password strength
const validatePassword = (password) => {
  const errors = [];
  
  if (password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }
  
  if (!/(?=.*[a-z])/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/(?=.*[A-Z])/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/(?=.*\d)/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  return errors;
};

// Generate API key
const generateApiKey = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Validate JWT middleware helper
const validateJWT = (req, res, next) => {
  const authHeader = req.header('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No token provided.'
    });
  }
  
  const token = authHeader.substring(7); // Remove 'Bearer ' prefix
  
  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token.'
    });
  }
};

// Check user role middleware helper
const checkRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions.'
      });
    }
    
    next();
  };
};

// Check if user owns resource or is admin
const checkOwnershipOrAdmin = (resourceUserIdField = 'userId') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }
    
    const resourceUserId = req.params.userId || req.body[resourceUserIdField] || req.user._id;
    const isOwner = resourceUserId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'ADMIN';
    
    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only access your own resources.'
      });
    }
    
    next();
  };
};

// Sanitize user data for response
const sanitizeUser = (user) => {
  const { password, security, ...userWithoutSensitive } = user.toObject ? user.toObject() : user;
  return userWithoutSensitive;
};

// Format user response
const formatUserResponse = (user, token = null) => {
  const response = {
    user: sanitizeUser(user),
    token
  };
  
  if (user.role === 'STUDENT') {
    response.user.academic = {
      totalAssessments: user.academic.totalAssessments,
      averageScore: user.academic.averageScore,
      weakTopics: user.academic.weakTopics.slice(0, 5), // Limit to top 5 weak topics
      recentActivity: user.academic.lastActivity
    };
  }
  
  return response;
};

module.exports = {
  generateToken,
  verifyToken,
  generateRefreshToken,
  hashPassword,
  comparePassword,
  generatePasswordResetToken,
  generateTwoFactorSecret,
  validateEmail,
  validatePassword,
  generateApiKey,
  validateJWT,
  checkRole,
  checkOwnershipOrAdmin,
  sanitizeUser,
  formatUserResponse
};