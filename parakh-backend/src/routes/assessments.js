const express = require('express');
const { body, validationResult } = require('express-validator');

const Assessment = require('../models/Assessment');
const Question = require('../models/Question');
const Attempt = require('../models/Attempt');
const { validateJWT, checkRole } = require('../utils/auth');
const { asyncHandler, formatValidationError } = require('../middleware/errorHandler');

const router = express.Router();

// Apply auth middleware to all routes
router.use(validateJWT);

// @route   GET api/assessments
// @desc    Get all assessments
// @access  Private
router.get('/', 
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
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { topic: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // For non-admin users, only show their assessments
    if (req.user.role !== 'ADMIN') {
      query['metadata.createdBy'] = req.user._id;
    }

    // Get assessments with pagination
    const assessments = await Assessment.find(query)
      .populate('metadata.createdBy', 'name email')
      .sort({ 'metadata.createdAt': -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Get total count
    const total = await Assessment.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: {
        assessments,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalAssessments: total,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });
  })
);

// @route   GET api/assessments/stats
// @desc    Get assessment statistics
// @access  Private
router.get('/stats', 
  asyncHandler(async (req, res) => {
    const stats = await Assessment.getAssessmentStats();
    
    // Get additional stats
    const totalAssessments = await Assessment.countDocuments();
    const activeAssessments = await Assessment.countDocuments({ status: 'ACTIVE' });
    const myAssessments = await Assessment.countDocuments({ 'metadata.createdBy': req.user._id });

    res.json({
      success: true,
      data: {
        totalAssessments,
        activeAssessments,
        myAssessments,
        bySubjectAndDifficulty: stats
      }
    });
  })
);

// @route   GET api/assessments/:id
// @desc    Get assessment by ID
// @access  Private
router.get('/:id', 
  asyncHandler(async (req, res) => {
    const assessment = await Assessment.findById(req.params.id)
      .populate('metadata.createdBy', 'name email')
      .populate('questions.questionId', 'questionText questionType options correctAnswer explanation');
    
    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: 'Assessment not found'
      });
    }

    // Check if user can access this assessment
    if (req.user.role !== 'ADMIN' && assessment.metadata.createdBy._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: assessment
    });
  })
);

// @route   POST api/assessments
// @desc    Create new assessment
// @access  Private
router.post('/', 
  checkRole('TEACHER', 'ADMIN'),
  [
    body('title', 'Title is required').not().isEmpty().trim(),
    body('description', 'Description is required').optional().trim(),
    body('subject', 'Subject is required').isIn(['MATHEMATICS', 'SCIENCE', 'ENGLISH', 'HISTORY', 'GEOGRAPHY', 'PHYSICS', 'CHEMISTRY', 'BIOLOGY']),
    body('topic', 'Topic is required').not().isEmpty().trim(),
    body('difficulty', 'Difficulty is required').isIn(['EASY', 'MEDIUM', 'HARD', 'ADAPTIVE']),
    body('questions').optional().isArray(),
    body('settings.timeLimit').optional().isInt({ min: 1, max: 360 }),
    body('settings.passingScore').optional().isInt({ min: 0, max: 100 }),
    body('settings.maxAttempts').optional().isInt({ min: 1, max: 10 })
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
      title, description, subject, topic, difficulty,
      questions, settings
    } = req.body;

    const assessment = new Assessment({
      title,
      description,
      subject,
      topic,
      difficulty,
      questions: questions || [],
      settings: {
        ...assessment.defaults.settings,
        ...settings
      },
      metadata: {
        createdBy: req.user._id
      }
    });

    await assessment.save();

    // Populate the createdBy field for response
    await assessment.populate('metadata.createdBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Assessment created successfully',
      data: assessment
    });
  })
);

// @route   PUT api/assessments/:id
// @desc    Update assessment
// @access  Private
router.put('/:id', 
  checkRole('TEACHER', 'ADMIN'),
  [
    body('title', 'Title is required').optional().not().isEmpty().trim(),
    body('description', 'Description is required').optional().trim(),
    body('subject', 'Invalid subject').optional().isIn(['MATHEMATICS', 'SCIENCE', 'ENGLISH', 'HISTORY', 'GEOGRAPHY', 'PHYSICS', 'CHEMISTRY', 'BIOLOGY']),
    body('topic', 'Topic is required').optional().not().isEmpty().trim(),
    body('difficulty', 'Invalid difficulty').optional().isIn(['EASY', 'MEDIUM', 'HARD', 'ADAPTIVE']),
    body('status', 'Invalid status').optional().isIn(['DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED'])
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

    const assessment = await Assessment.findById(req.params.id);
    
    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: 'Assessment not found'
      });
    }

    // Check if user can edit this assessment
    if (req.user.role !== 'ADMIN' && assessment.metadata.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Update fields
    const updateFields = ['title', 'description', 'subject', 'topic', 'difficulty', 'status'];
    updateFields.forEach(field => {
      if (req.body[field] !== undefined) {
        assessment[field] = req.body[field];
      }
    });

    if (req.body.settings) {
      assessment.settings = { ...assessment.settings, ...req.body.settings };
    }

    await assessment.save();

    res.json({
      success: true,
      message: 'Assessment updated successfully',
      data: assessment
    });
  })
);

// @route   DELETE api/assessments/:id
// @desc    Delete assessment
// @access  Private
router.delete('/:id', 
  checkRole('TEACHER', 'ADMIN'),
  asyncHandler(async (req, res) => {
    const assessment = await Assessment.findById(req.params.id);
    
    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: 'Assessment not found'
      });
    }

    // Check if user can delete this assessment
    if (req.user.role !== 'ADMIN' && assessment.metadata.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    await Assessment.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Assessment deleted successfully'
    });
  })
);

// @route   PUT api/assessments/:id/status
// @desc    Update assessment status
// @access  Private
router.put('/:id/status', 
  checkRole('TEACHER', 'ADMIN'),
  [
    body('status', 'Status is required').isIn(['DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED'])
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

    const assessment = await Assessment.findById(req.params.id);
    
    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: 'Assessment not found'
      });
    }

    // Check if user can update this assessment
    if (req.user.role !== 'ADMIN' && assessment.metadata.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    assessment.status = status;
    await assessment.save();

    res.json({
      success: true,
      message: `Assessment status updated to ${status}`,
      data: { status: assessment.status }
    });
  })
);

// @route   POST api/assessments/:id/questions
// @desc    Add question to assessment
// @access  Private
router.post('/:id/questions', 
  checkRole('TEACHER', 'ADMIN'),
  [
    body('questionId', 'Question ID is required').notEmpty(),
    body('points', 'Points must be a positive number').optional().isInt({ min: 1 })
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

    const { questionId, points = 1 } = req.body;

    const assessment = await Assessment.findById(req.params.id);
    
    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: 'Assessment not found'
      });
    }

    // Check if user can edit this assessment
    if (req.user.role !== 'ADMIN' && assessment.metadata.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Check if question exists and is active
    const question = await Question.findById(questionId);
    if (!question || question.status !== 'ACTIVE') {
      return res.status(400).json({
        success: false,
        message: 'Question not found or not active'
      });
    }

    // Check if question already exists in assessment
    const existingQuestion = assessment.questions.find(q => q.questionId.toString() === questionId);
    if (existingQuestion) {
      return res.status(400).json({
        success: false,
        message: 'Question already exists in assessment'
      });
    }

    await assessment.addQuestion(questionId, points);

    res.json({
      success: true,
      message: 'Question added to assessment successfully',
      data: { assessment }
    });
  })
);

// @route   DELETE api/assessments/:id/questions/:questionId
// @desc    Remove question from assessment
// @access  Private
router.delete('/:id/questions/:questionId', 
  checkRole('TEACHER', 'ADMIN'),
  asyncHandler(async (req, res) => {
    const assessment = await Assessment.findById(req.params.id);
    
    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: 'Assessment not found'
      });
    }

    // Check if user can edit this assessment
    if (req.user.role !== 'ADMIN' && assessment.metadata.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    await assessment.removeQuestion(req.params.questionId);

    res.json({
      success: true,
      message: 'Question removed from assessment successfully',
      data: { assessment }
    });
  })
);

// @route   POST api/assessments/:id/start
// @desc    Start an assessment
// @access  Private
router.post('/:id/start', 
  asyncHandler(async (req, res) => {
    const assessment = await Assessment.findById(req.params.id);
    
    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: 'Assessment not found'
      });
    }

    if (assessment.status !== 'ACTIVE') {
      return res.status(400).json({
        success: false,
        message: 'Assessment is not available'
      });
    }

    // Check if user has exceeded max attempts
    const userAttempts = await Attempt.countDocuments({
      userId: req.user._id,
      assessmentId: assessment._id,
      status: 'COMPLETED'
    });

    if (userAttempts >= assessment.settings.maxAttempts) {
      return res.status(400).json({
        success: false,
        message: `Maximum attempts (${assessment.settings.maxAttempts}) exceeded`
      });
    }

    // Create new attempt
    const attempt = new Attempt({
      userId: req.user._id,
      assessmentId: assessment._id,
      questions: assessment.questions.map(q => ({
        questionId: q.questionId,
        userAnswer: null,
        isCorrect: false,
        pointsAwarded: 0,
        timeSpent: 0
      })),
      status: 'IN_PROGRESS',
      metadata: {
        attemptNumber: userAttempts + 1,
        isAdaptive: assessment.difficulty === 'ADAPTIVE'
      }
    });

    await attempt.save();
    await attempt.populate('assessmentId', 'title subject topic');

    res.json({
      success: true,
      message: 'Assessment started successfully',
      data: {
        attempt,
        questions: assessment.questions.map(q => ({
          questionId: q.questionId,
          order: q.order,
          points: q.points
        }))
      }
    });
  })
);

// @route   GET api/assessments/:id/attempt
// @desc    Get current attempt for assessment
// @access  Private
router.get('/:id/attempt', 
  asyncHandler(async (req, res) => {
    const attempt = await Attempt.findOne({
      userId: req.user._id,
      assessmentId: req.params.id,
      status: 'IN_PROGRESS'
    }).populate('assessmentId', 'title subject topic');

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: 'No active attempt found'
      });
    }

    res.json({
      success: true,
      data: attempt
    });
  })
);

// @route   PUT api/assessments/:id/attempt
// @desc    Update attempt progress
// @access  Private
router.put('/:id/attempt', 
  asyncHandler(async (req, res) => {
    const { questionIndex, userAnswer, timeSpent } = req.body;

    const attempt = await Attempt.findOne({
      userId: req.user._id,
      assessmentId: req.params.id,
      status: 'IN_PROGRESS'
    });

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: 'No active attempt found'
      });
    }

    // Get the question to check the answer
    const question = await Question.findById(attempt.questions[questionIndex].questionId);
    
    let isCorrect = false;
    let pointsAwarded = 0;

    // Check answer based on question type
    if (question.questionType === 'MULTIPLE_CHOICE' || question.questionType === 'TRUE_FALSE') {
      const correctOptions = question.options.filter(opt => opt.isCorrect);
      const userOptions = Array.isArray(userAnswer) ? userAnswer : [userAnswer];
      
      isCorrect = correctOptions.length === userOptions.length && 
                  correctOptions.every(opt => userOptions.includes(opt.text));
    } else if (question.questionType === 'SHORT_ANSWER') {
      // Simple string comparison (could be enhanced with fuzzy matching)
      isCorrect = question.correctAnswer.toLowerCase() === userAnswer.toLowerCase();
    } else if (question.questionType === 'ESSAY') {
      // Essay questions require manual grading
      isCorrect = false;
    }

    if (isCorrect) {
      pointsAwarded = 1; // Simplified scoring
    }

    // Update question result
    await attempt.updateQuestionResult(questionIndex, {
      userAnswer,
      isCorrect,
      pointsAwarded,
      timeSpent,
      explanationViewed: false
    });

    res.json({
      success: true,
      message: 'Answer submitted successfully',
      data: {
        isCorrect,
        pointsAwarded,
        progress: attempt.getProgress()
      }
    });
  })
);

// @route   POST api/assessments/:id/complete
// @desc    Complete assessment attempt
// @access  Private
router.post('/:id/complete', 
  asyncHandler(async (req, res) => {
    const attempt = await Attempt.findOne({
      userId: req.user._id,
      assessmentId: req.params.id,
      status: 'IN_PROGRESS'
    });

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: 'No active attempt found'
      });
    }

    // Calculate final score and update attempt
    await attempt.markCompleted();
    await attempt.calculateAnalytics();

    // Update user's academic data
    const user = await User.findById(req.user._id);
    user.academic.totalAssessments += 1;
    user.academic.totalScore += attempt.score;
    user.academic.lastActivity = new Date();
    await user.save();

    res.json({
      success: true,
      message: 'Assessment completed successfully',
      data: {
        attempt,
        userScore: {
          score: attempt.score,
          totalPoints: attempt.totalPoints,
          pointsAwarded: attempt.pointsAwarded
        }
      }
    });
  })
);

module.exports = router;