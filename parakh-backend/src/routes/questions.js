const express = require('express');
const { body, validationResult } = require('express-validator');

const Question = require('../models/Question');
const User = require('../models/User');
const { validateJWT, checkRole } = require('../utils/auth');
const { asyncHandler, formatValidationError } = require('../middleware/errorHandler');

const router = express.Router();

// Apply auth middleware to all routes
router.use(validateJWT);

// @route   GET api/questions
// @desc    Get all questions (Teacher and Admin only)
// @access  Private - Teacher, Admin
router.get('/', 
  checkRole('TEACHER', 'ADMIN'),
  asyncHandler(async (req, res) => {
    const { 
      page = 1, 
      limit = 10, 
      subject, 
      topic, 
      difficulty, 
      status, 
      createdBy, 
      search 
    } = req.query;
    
    // Build query
    const query = {};
    if (subject) query.subject = subject;
    if (topic) query.topic = topic;
    if (difficulty) query.difficulty = difficulty;
    if (status) query.status = status;
    if (createdBy) query['metadata.createdBy'] = createdBy;
    if (search) {
      query.$or = [
        { questionText: { $regex: search, $options: 'i' } },
        { topic: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // For teachers, only show their questions unless they're admin
    if (req.user.role !== 'ADMIN') {
      query['metadata.createdBy'] = req.user._id;
    }

    // Get questions with pagination
    const questions = await Question.find(query)
      .populate('metadata.createdBy', 'name email')
      .sort({ 'metadata.createdAt': -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Get total count
    const total = await Question.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: {
        questions,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalQuestions: total,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });
  })
);

// @route   GET api/questions/stats
// @desc    Get question statistics (Teacher and Admin only)
// @access  Private - Teacher, Admin
router.get('/stats', 
  checkRole('TEACHER', 'ADMIN'),
  asyncHandler(async (req, res) => {
    const stats = await Question.getQuestionStats();
    
    // Get additional stats
    const totalQuestions = await Question.countDocuments();
    const activeQuestions = await Question.countDocuments({ status: 'ACTIVE' });
    const myQuestions = await Question.countDocuments({ 'metadata.createdBy': req.user._id });

    res.json({
      success: true,
      data: {
        totalQuestions,
        activeQuestions,
        myQuestions,
        bySubjectAndDifficulty: stats
      }
    });
  })
);

// @route   GET api/questions/:id
// @desc    Get question by ID
// @access  Private
router.get('/:id', 
  asyncHandler(async (req, res) => {
    const question = await Question.findById(req.params.id)
      .populate('metadata.createdBy', 'name email');
    
    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    // Check if user can access this question
    if (req.user.role !== 'ADMIN' && question.metadata.createdBy._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: question
    });
  })
);

// @route   POST api/questions
// @desc    Create new question (Teacher and Admin only)
// @access  Private - Teacher, Admin
router.post('/', 
  checkRole('TEACHER', 'ADMIN'),
  [
    body('questionText', 'Question text is required').not().isEmpty().trim(),
    body('questionType', 'Question type is required').isIn(['MULTIPLE_CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER', 'MATCHING', 'ESSAY']),
    body('subject', 'Subject is required').isIn(['MATHEMATICS', 'SCIENCE', 'ENGLISH', 'HISTORY', 'GEOGRAPHY', 'PHYSICS', 'CHEMISTRY', 'BIOLOGY']),
    body('topic', 'Topic is required').not().isEmpty().trim(),
    body('difficulty', 'Difficulty is required').isIn(['EASY', 'MEDIUM', 'HARD']),
    body('explanation', 'Explanation is required').not().isEmpty().trim(),
    body('options').optional().isArray(),
    body('options.*.text').optional().if(body('questionType').equals('MULTIPLE_CHOICE').or(body('questionType').equals('TRUE_FALSE'))).notEmpty(),
    body('options.*.isCorrect').optional().isBoolean(),
    body('correctAnswer').optional().if(body('questionType').equals('SHORT_ANSWER').or(body('questionType').equals('ESSAY'))).notEmpty(),
    body('tags').optional().isArray(),
    body('estimatedTime').optional().isInt({ min: 1, max: 3600 }),
    body('bloomTaxonomy').optional().isIn(['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE'])
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

    const {
      questionText, questionType, subject, topic, difficulty,
      options, correctAnswer, explanation, tags, estimatedTime, bloomTaxonomy
    } = req.body;

    // Validate question-specific requirements
    if (questionType === 'MULTIPLE_CHOICE' || questionType === 'TRUE_FALSE') {
      if (!options || options.length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Multiple choice and true/false questions must have at least 2 options'
        });
      }
      
      const correctOptions = options.filter(opt => opt.isCorrect);
      if (correctOptions.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'At least one option must be marked as correct'
        });
      }
    }

    const question = new Question({
      questionText,
      questionType,
      subject,
      topic,
      difficulty,
      options,
      correctAnswer,
      explanation,
      tags,
      estimatedTime,
      bloomTaxonomy,
      metadata: {
        createdBy: req.user._id
      }
    });

    await question.save();

    // Populate the createdBy field for response
    await question.populate('metadata.createdBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Question created successfully',
      data: question
    });
  })
);

// @route   PUT api/questions/:id
// @desc    Update question (Teacher and Admin only)
// @access  Private - Teacher, Admin
router.put('/:id', 
  checkRole('TEACHER', 'ADMIN'),
  [
    body('questionText', 'Question text is required').optional().not().isEmpty().trim(),
    body('questionType', 'Invalid question type').optional().isIn(['MULTIPLE_CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER', 'MATCHING', 'ESSAY']),
    body('subject', 'Invalid subject').optional().isIn(['MATHEMATICS', 'SCIENCE', 'ENGLISH', 'HISTORY', 'GEOGRAPHY', 'PHYSICS', 'CHEMISTRY', 'BIOLOGY']),
    body('topic', 'Topic is required').optional().not().isEmpty().trim(),
    body('difficulty', 'Invalid difficulty').optional().isIn(['EASY', 'MEDIUM', 'HARD']),
    body('explanation', 'Explanation is required').optional().not().isEmpty().trim(),
    body('status', 'Invalid status').optional().isIn(['DRAFT', 'ACTIVE', 'INACTIVE', 'REVIEW'])
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

    const question = await Question.findById(req.params.id);
    
    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    // Check if user can edit this question
    if (req.user.role !== 'ADMIN' && question.metadata.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Update fields
    const updateFields = ['questionText', 'questionType', 'subject', 'topic', 'difficulty', 'explanation', 'status'];
    updateFields.forEach(field => {
      if (req.body[field] !== undefined) {
        question[field] = req.body[field];
      }
    });

    if (req.body.options) question.options = req.body.options;
    if (req.body.correctAnswer) question.correctAnswer = req.body.correctAnswer;
    if (req.body.tags) question.tags = req.body.tags;
    if (req.body.estimatedTime) question.estimatedTime = req.body.estimatedTime;
    if (req.body.bloomTaxonomy) question.bloomTaxonomy = req.body.bloomTaxonomy;

    await question.save();

    res.json({
      success: true,
      message: 'Question updated successfully',
      data: question
    });
  })
);

// @route   DELETE api/questions/:id
// @desc    Delete question (Teacher and Admin only)
// @access  Private - Teacher, Admin
router.delete('/:id', 
  checkRole('TEACHER', 'ADMIN'),
  asyncHandler(async (req, res) => {
    const question = await Question.findById(req.params.id);
    
    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    // Check if user can delete this question
    if (req.user.role !== 'ADMIN' && question.metadata.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    await Question.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Question deleted successfully'
    });
  })
);

// @route   PUT api/questions/:id/status
// @desc    Update question status (Teacher and Admin only)
// @access  Private - Teacher, Admin
router.put('/:id/status', 
  checkRole('TEACHER', 'ADMIN'),
  [
    body('status', 'Status is required').isIn(['DRAFT', 'ACTIVE', 'INACTIVE', 'REVIEW'])
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

    const question = await Question.findById(req.params.id);
    
    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    // Check if user can update this question
    if (req.user.role !== 'ADMIN' && question.metadata.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    question.status = status;
    await question.save();

    res.json({
      success: true,
      message: `Question status updated to ${status}`,
      data: { status: question.status }
    });
  })
);

// @route   GET api/questions/random
// @desc    Get random questions for assessment
// @access  Private
router.get('/random/:count', 
  asyncHandler(async (req, res) => {
    const count = parseInt(req.params.count) || 10;
    const { subject, difficulty, tags } = req.query;

    if (count > 50) {
      return res.status(400).json({
        success: false,
        message: 'Cannot request more than 50 questions at once'
      });
    }

    const filters = {};
    if (subject) filters.subject = subject;
    if (difficulty) filters.difficulty = difficulty;
    if (tags && tags.length > 0) filters.tags = { $in: tags.split(',') };

    const questions = await Question.getRandomQuestions(filters, count);

    res.json({
      success: true,
      data: { questions }
    });
  })
);

module.exports = router;