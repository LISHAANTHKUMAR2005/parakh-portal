const express = require('express');
const { body, validationResult } = require('express-validator');

const User = require('../models/User');
const Attempt = require('../models/Attempt');
const Assessment = require('../models/Assessment');
const Question = require('../models/Question');
const { validateJWT, checkRole } = require('../utils/auth');
const { asyncHandler, formatValidationError } = require('../middleware/errorHandler');

const router = express.Router();

// Apply auth middleware to all routes
router.use(validateJWT);

// @route   GET api/reports/user/:userId
// @desc    Get user performance report
// @access  Private - Admin, Teacher (for their students), User (own data)
router.get('/user/:userId', 
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check permissions
    if (req.user.role !== 'ADMIN' && 
        req.user.role !== 'TEACHER' && 
        req.user._id.toString() !== req.params.userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // For teachers, check if they created the user
    if (req.user.role === 'TEACHER' && user.metadata.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Get user attempts
    const attempts = await Attempt.find({ userId: user._id, status: 'COMPLETED' })
      .populate('assessmentId', 'title subject topic')
      .sort({ 'metadata.completedAt': -1 });

    // Calculate performance metrics
    const totalAttempts = attempts.length;
    const totalScore = attempts.reduce((sum, attempt) => sum + attempt.score, 0);
    const averageScore = totalAttempts > 0 ? Math.round(totalScore / totalAttempts) : 0;
    const passRate = totalAttempts > 0 ? 
      Math.round(attempts.filter(a => a.score >= 70).length / totalAttempts * 100) : 0;

    // Get subject-wise performance
    const subjectPerformance = {};
    attempts.forEach(attempt => {
      const subject = attempt.assessmentId.subject;
      if (!subjectPerformance[subject]) {
        subjectPerformance[subject] = {
          attempts: 0,
          totalScore: 0,
          averageScore: 0,
          bestScore: 0
        };
      }
      subjectPerformance[subject].attempts++;
      subjectPerformance[subject].totalScore += attempt.score;
      subjectPerformance[subject].bestScore = Math.max(subjectPerformance[subject].bestScore, attempt.score);
    });

    Object.keys(subjectPerformance).forEach(subject => {
      subjectPerformance[subject].averageScore = Math.round(
        subjectPerformance[subject].totalScore / subjectPerformance[subject].attempts
      );
    });

    // Get recent activity
    const recentActivity = attempts.slice(0, 5).map(attempt => ({
      assessment: attempt.assessmentId.title,
      subject: attempt.assessmentId.subject,
      score: attempt.score,
      date: attempt.metadata.completedAt
    }));

    res.json({
      success: true,
      data: {
        user: {
          name: user.name,
          email: user.email,
          role: user.role,
          grade: user.profile.grade
        },
        performance: {
          totalAttempts,
          averageScore,
          passRate,
          bestScore: attempts.length > 0 ? Math.max(...attempts.map(a => a.score)) : 0,
          weakestSubject: Object.keys(subjectPerformance).reduce((weakest, current) => 
            subjectPerformance[current].averageScore < subjectPerformance[weakest].averageScore ? current : weakest, 
            Object.keys(subjectPerformance)[0]
          )
        },
        subjectPerformance,
        recentActivity,
        weakTopics: user.academic.weakTopics,
        learningPath: user.academic.learningPath
      }
    });
  })
);

// @route   GET api/reports/class/:teacherId
// @desc    Get class performance report (Teacher and Admin only)
// @access  Private - Teacher, Admin
router.get('/class/:teacherId', 
  checkRole('TEACHER', 'ADMIN'),
  asyncHandler(async (req, res) => {
    const teacherId = req.params.teacherId;
    
    // Get all students for this teacher
    const students = await User.find({ 
      'metadata.createdBy': teacherId,
      role: 'STUDENT'
    }).select('name email profile.grade academic');

    if (students.length === 0) {
      return res.json({
        success: true,
        data: {
          students: [],
          summary: {
            totalStudents: 0,
            averageClassScore: 0,
            passRate: 0,
            topPerformer: null
          }
        }
      });
    }

    // Get attempts for all students
    const studentIds = students.map(s => s._id);
    const attempts = await Attempt.find({ 
      userId: { $in: studentIds },
      status: 'COMPLETED'
    }).populate('assessmentId', 'title subject topic');

    // Calculate class metrics
    const studentPerformance = {};
    students.forEach(student => {
      studentPerformance[student._id] = {
        name: student.name,
        email: student.email,
        grade: student.profile.grade,
        totalAttempts: 0,
        totalScore: 0,
        averageScore: 0,
        assessments: []
      };
    });

    attempts.forEach(attempt => {
      const studentId = attempt.userId.toString();
      if (studentPerformance[studentId]) {
        studentPerformance[studentId].totalAttempts++;
        studentPerformance[studentId].totalScore += attempt.score;
        studentPerformance[studentId].assessments.push({
          assessment: attempt.assessmentId.title,
          subject: attempt.assessmentId.subject,
          score: attempt.score,
          date: attempt.metadata.completedAt
        });
      }
    });

    // Calculate averages and find top performer
    let totalClassScore = 0;
    let totalClassAttempts = 0;
    let topPerformer = null;
    let highestAverage = 0;

    Object.values(studentPerformance).forEach(student => {
      if (student.totalAttempts > 0) {
        student.averageScore = Math.round(student.totalScore / student.totalAttempts);
        totalClassScore += student.averageScore;
        totalClassAttempts++;
        
        if (student.averageScore > highestAverage) {
          highestAverage = student.averageScore;
          topPerformer = {
            name: student.name,
            averageScore: student.averageScore,
            totalAttempts: student.totalAttempts
          };
        }
      }
    });

    const averageClassScore = totalClassAttempts > 0 ? Math.round(totalClassScore / totalClassAttempts) : 0;

    // Calculate pass rate
    const passingStudents = Object.values(studentPerformance).filter(s => s.averageScore >= 70).length;
    const passRate = students.length > 0 ? Math.round((passingStudents / students.length) * 100) : 0;

    res.json({
      success: true,
      data: {
        students: Object.values(studentPerformance),
        summary: {
          totalStudents: students.length,
          averageClassScore,
          passRate,
          topPerformer,
          subjectDistribution: attempts.reduce((acc, attempt) => {
            acc[attempt.assessmentId.subject] = (acc[attempt.assessmentId.subject] || 0) + 1;
            return acc;
          }, {})
        }
      }
    });
  })
);

// @route   GET api/reports/assessment/:assessmentId
// @desc    Get assessment analytics
// @access  Private
router.get('/assessment/:assessmentId', 
  asyncHandler(async (req, res) => {
    const assessment = await Assessment.findById(req.params.assessmentId);
    
    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: 'Assessment not found'
      });
    }

    // Check permissions
    if (req.user.role !== 'ADMIN' && 
        req.user.role !== 'TEACHER' && 
        assessment.metadata.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Get all attempts for this assessment
    const attempts = await Attempt.find({ 
      assessmentId: assessment._id,
      status: 'COMPLETED'
    }).populate('userId', 'name email');

    if (attempts.length === 0) {
      return res.json({
        success: true,
        data: {
          assessment: {
            title: assessment.title,
            subject: assessment.subject,
            topic: assessment.topic,
            difficulty: assessment.difficulty
          },
          analytics: {
            totalAttempts: 0,
            averageScore: 0,
            passRate: 0,
            highestScore: 0,
            lowestScore: 0,
            timeAnalysis: {
              averageTime: 0,
              minTime: 0,
              maxTime: 0
            }
          },
          questionAnalytics: [],
          studentPerformance: []
        }
      });
    }

    // Calculate assessment analytics
    const totalAttempts = attempts.length;
    const totalScore = attempts.reduce((sum, attempt) => sum + attempt.score, 0);
    const averageScore = Math.round(totalScore / totalAttempts);
    const passRate = Math.round(attempts.filter(a => a.score >= 70).length / totalAttempts * 100);
    const highestScore = Math.max(...attempts.map(a => a.score));
    const lowestScore = Math.min(...attempts.map(a => a.score));
    const totalTime = attempts.reduce((sum, attempt) => sum + attempt.timeTaken, 0);
    const averageTime = Math.round(totalTime / totalAttempts);
    const minTime = Math.min(...attempts.map(a => a.timeTaken));
    const maxTime = Math.max(...attempts.map(a => a.timeTaken));

    // Calculate question analytics
    const questionAnalytics = [];
    for (const q of assessment.questions) {
      const questionAttempts = attempts.map(attempt => {
        const questionResult = attempt.questions.find(aq => aq.questionId.toString() === q.questionId.toString());
        return questionResult;
      }).filter(Boolean);

      if (questionAttempts.length > 0) {
        const correctCount = questionAttempts.filter(qa => qa.isCorrect).length;
        const accuracy = Math.round((correctCount / questionAttempts.length) * 100);
        const avgTime = Math.round(questionAttempts.reduce((sum, qa) => sum + qa.timeSpent, 0) / questionAttempts.length);

        questionAnalytics.push({
          questionId: q.questionId,
          questionText: q.questionText,
          accuracy,
          averageTime: avgTime,
          totalAttempts: questionAttempts.length,
          correctCount
        });
      }
    }

    // Get student performance
    const studentPerformance = attempts.map(attempt => ({
      student: {
        name: attempt.userId.name,
        email: attempt.userId.email
      },
      score: attempt.score,
      timeTaken: attempt.timeTaken,
      completedAt: attempt.metadata.completedAt
    })).sort((a, b) => b.score - a.score);

    res.json({
      success: true,
      data: {
        assessment: {
          title: assessment.title,
          subject: assessment.subject,
          topic: assessment.topic,
          difficulty: assessment.difficulty,
          totalQuestions: assessment.questions.length
        },
        analytics: {
          totalAttempts,
          averageScore,
          passRate,
          highestScore,
          lowestScore,
          timeAnalysis: {
            averageTime,
            minTime,
            maxTime
          }
        },
        questionAnalytics,
        studentPerformance
      }
    });
  })
);

// @route   GET api/reports/subject/:subject
// @desc    Get subject performance report
// @access  Private
router.get('/subject/:subject', 
  asyncHandler(async (req, res) => {
    const subject = req.params.subject;
    
    // Get all assessments for this subject
    const assessments = await Assessment.find({ subject, status: 'ACTIVE' });
    const assessmentIds = assessments.map(a => a._id);

    // Get all attempts for these assessments
    const attempts = await Attempt.find({ 
      assessmentId: { $in: assessmentIds },
      status: 'COMPLETED'
    }).populate('userId', 'name email').populate('assessmentId', 'title topic');

    if (attempts.length === 0) {
      return res.json({
        success: true,
        data: {
          subject,
          summary: {
            totalAssessments: assessments.length,
            totalAttempts: 0,
            averageScore: 0,
            passRate: 0
          },
          topicPerformance: {},
          studentPerformance: []
        }
      });
    }

    // Calculate topic performance
    const topicPerformance = {};
    attempts.forEach(attempt => {
      const topic = attempt.assessmentId.topic;
      if (!topicPerformance[topic]) {
        topicPerformance[topic] = {
          attempts: 0,
          totalScore: 0,
          averageScore: 0,
          assessments: []
        };
      }
      topicPerformance[topic].attempts++;
      topicPerformance[topic].totalScore += attempt.score;
      topicPerformance[topic].assessments.push(attempt.assessmentId.title);
    });

    Object.keys(topicPerformance).forEach(topic => {
      topicPerformance[topic].averageScore = Math.round(
        topicPerformance[topic].totalScore / topicPerformance[topic].attempts
      );
    });

    // Calculate overall subject metrics
    const totalAttempts = attempts.length;
    const totalScore = attempts.reduce((sum, attempt) => sum + attempt.score, 0);
    const averageScore = Math.round(totalScore / totalAttempts);
    const passRate = Math.round(attempts.filter(a => a.score >= 70).length / totalAttempts * 100);

    // Get top performing students
    const studentScores = {};
    attempts.forEach(attempt => {
      const studentId = attempt.userId._id.toString();
      if (!studentScores[studentId]) {
        studentScores[studentId] = {
          name: attempt.userId.name,
          email: attempt.userId.email,
          totalScore: 0,
          attempts: 0,
          averageScore: 0
        };
      }
      studentScores[studentId].totalScore += attempt.score;
      studentScores[studentId].attempts++;
    });

    Object.values(studentScores).forEach(student => {
      student.averageScore = Math.round(student.totalScore / student.attempts);
    });

    const studentPerformance = Object.values(studentScores)
      .sort((a, b) => b.averageScore - a.averageScore)
      .slice(0, 10);

    res.json({
      success: true,
      data: {
        subject,
        summary: {
          totalAssessments: assessments.length,
          totalAttempts,
          averageScore,
          passRate
        },
        topicPerformance,
        studentPerformance
      }
    });
  })
);

// @route   GET api/reports/system
// @desc    Get system-wide analytics (Admin only)
// @access  Private - Admin
router.get('/system', 
  checkRole('ADMIN'),
  asyncHandler(async (req, res) => {
    // Get user statistics
    const userStats = await User.getStatsByRole();
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ status: 'ACTIVE' });

    // Get question statistics
    const questionStats = await Question.getQuestionStats();
    const totalQuestions = await Question.countDocuments();
    const activeQuestions = await Question.countDocuments({ status: 'ACTIVE' });

    // Get assessment statistics
    const assessmentStats = await Assessment.getAssessmentStats();
    const totalAssessments = await Assessment.countDocuments();
    const activeAssessments = await Assessment.countDocuments({ status: 'ACTIVE' });

    // Get attempt statistics
    const totalAttempts = await Attempt.countDocuments({ status: 'COMPLETED' });
    const todayAttempts = await Attempt.countDocuments({
      status: 'COMPLETED',
      'metadata.completedAt': { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
    });

    // Calculate average scores
    const avgUserScore = await Attempt.aggregate([
      { $group: { _id: null, avgScore: { $avg: '$score' } } }
    ]);

    const avgScore = avgUserScore.length > 0 ? Math.round(avgUserScore[0].avgScore) : 0;

    // Get recent activity
    const recentActivity = await Attempt.find({ status: 'COMPLETED' })
      .populate('userId', 'name')
      .populate('assessmentId', 'title')
      .sort({ 'metadata.completedAt': -1 })
      .limit(10);

    res.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          active: activeUsers,
          byRole: userStats
        },
        questions: {
          total: totalQuestions,
          active: activeQuestions,
          bySubjectAndDifficulty: questionStats
        },
        assessments: {
          total: totalAssessments,
          active: activeAssessments,
          bySubjectAndDifficulty: assessmentStats
        },
        attempts: {
          total: totalAttempts,
          today: todayAttempts,
          averageScore: avgScore
        },
        recentActivity: recentActivity.map(attempt => ({
          student: attempt.userId.name,
          assessment: attempt.assessmentId.title,
          score: attempt.score,
          completedAt: attempt.metadata.completedAt
        }))
      }
    });
  })
);

// @route   GET api/reports/export/:userId
// @desc    Export user report as JSON
// @access  Private - Admin, Teacher (for their students), User (own data)
router.get('/export/:userId', 
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check permissions (same logic as user report)
    if (req.user.role !== 'ADMIN' && 
        req.user.role !== 'TEACHER' && 
        req.user._id.toString() !== req.params.userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    if (req.user.role === 'TEACHER' && user.metadata.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Get comprehensive user data
    const attempts = await Attempt.find({ userId: user._id, status: 'COMPLETED' })
      .populate('assessmentId', 'title subject topic')
      .sort({ 'metadata.completedAt': -1 });

    const reportData = {
      metadata: {
        exportedAt: new Date().toISOString(),
        exportedBy: req.user.name,
        formatVersion: '1.0'
      },
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        grade: user.profile.grade,
        createdAt: user.metadata.createdAt
      },
      academic: user.academic,
      settings: user.settings,
      attempts: attempts.map(attempt => ({
        id: attempt._id,
        assessment: {
          title: attempt.assessmentId.title,
          subject: attempt.assessmentId.subject,
          topic: attempt.assessmentId.topic
        },
        score: attempt.score,
        totalPoints: attempt.totalPoints,
        pointsAwarded: attempt.pointsAwarded,
        timeTaken: attempt.timeTaken,
        completedAt: attempt.metadata.completedAt,
        attemptNumber: attempt.metadata.attemptNumber,
        questions: attempt.questions.map(q => ({
          questionId: q.questionId,
          isCorrect: q.isCorrect,
          timeSpent: q.timeSpent,
          explanationViewed: q.explanationViewed
        }))
      })),
      analytics: {
        totalAttempts: attempts.length,
        averageScore: attempts.length > 0 ? Math.round(attempts.reduce((sum, a) => sum + a.score, 0) / attempts.length) : 0,
        passRate: attempts.length > 0 ? Math.round(attempts.filter(a => a.score >= 70).length / attempts.length * 100) : 0,
        bestScore: attempts.length > 0 ? Math.max(...attempts.map(a => a.score)) : 0
      }
    };

    // Set headers for file download
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="user-report-${user.name}-${Date.now()}.json"`);

    res.json(reportData);
  })
);

module.exports = router;