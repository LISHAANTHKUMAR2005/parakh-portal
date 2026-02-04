const mongoose = require('mongoose');

const attemptSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assessmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assessment',
    required: true
  },
  questions: [{
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: true
    },
    userAnswer: {
      type: mongoose.Schema.Types.Mixed, // Can be string, array, or object depending on question type
      required: true
    },
    isCorrect: {
      type: Boolean,
      default: false
    },
    pointsAwarded: {
      type: Number,
      default: 0
    },
    timeSpent: {
      type: Number, // in seconds
      default: 0
    },
    explanationViewed: {
      type: Boolean,
      default: false
    }
  }],
  score: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  totalPoints: {
    type: Number,
    required: true
  },
  pointsAwarded: {
    type: Number,
    required: true
  },
  timeTaken: {
    type: Number, // in seconds
    required: true
  },
  status: {
    type: String,
    enum: ['IN_PROGRESS', 'COMPLETED', 'ABANDONED'],
    default: 'IN_PROGRESS'
  },
  metadata: {
    startedAt: {
      type: Date,
      default: Date.now
    },
    completedAt: {
      type: Date
    },
    attemptNumber: {
      type: Number,
      default: 1
    },
    isAdaptive: {
      type: Boolean,
      default: false
    },
    difficultyAdjustments: [{
      questionId: mongoose.Schema.Types.ObjectId,
      previousDifficulty: String,
      newDifficulty: String,
      reason: String
    }]
  },
  feedback: {
    overall: {
      type: String,
      maxlength: [1000, 'Feedback cannot be more than 1000 characters']
    },
    strengths: [{
      type: String,
      maxlength: [200, 'Strength cannot be more than 200 characters']
    }],
    areasForImprovement: [{
      type: String,
      maxlength: [200, 'Area for improvement cannot be more than 200 characters']
    }],
    recommendations: [{
      type: String,
      maxlength: [300, 'Recommendation cannot be more than 300 characters']
    }]
  },
  analytics: {
    accuracyByTopic: [{
      topic: String,
      accuracy: Number,
      questionsAttempted: Number,
      questionsCorrect: Number
    }],
    timeAnalysis: {
      averageTimePerQuestion: Number,
      timeDistribution: {
        quick: Number, // answered in < 30s
        medium: Number, // answered in 30-90s
        slow: Number // answered in > 90s
      }
    },
    difficultyAnalysis: {
      easy: { accuracy: Number, count: Number },
      medium: { accuracy: Number, count: Number },
      hard: { accuracy: Number, count: Number }
    }
  }
}, {
  timestamps: true
});

// Indexes
attemptSchema.index({ userId: 1, assessmentId: 1 });
attemptSchema.index({ userId: 1, 'metadata.startedAt': -1 });
attemptSchema.index({ assessmentId: 1, 'metadata.startedAt': -1 });
attemptSchema.index({ 'metadata.completedAt': -1 });

// Pre-save middleware
attemptSchema.pre('save', function(next) {
  // Calculate total points and points awarded
  if (this.questions && this.questions.length > 0) {
    this.totalPoints = this.questions.reduce((total, q) => total + 1, 0);
    this.pointsAwarded = this.questions.reduce((total, q) => total + (q.isCorrect ? 1 : 0), 0);
    this.score = Math.round((this.pointsAwarded / this.totalPoints) * 100);
  }
  
  // Set completedAt if status is COMPLETED
  if (this.status === 'COMPLETED' && !this.metadata.completedAt) {
    this.metadata.completedAt = new Date();
  }
  
  next();
});

// Static methods
attemptSchema.statics.getUserAttempts = function(userId, assessmentId) {
  return this.find({ userId, assessmentId }).sort({ 'metadata.startedAt': -1 });
};

attemptSchema.statics.getUserRecentAttempts = function(userId, limit = 10) {
  return this.find({ userId })
    .populate('assessmentId', 'title subject topic')
    .sort({ 'metadata.startedAt': -1 })
    .limit(limit);
};

attemptSchema.statics.getAssessmentAnalytics = function(assessmentId) {
  return this.aggregate([
    { $match: { assessmentId: assessmentId, status: 'COMPLETED' } },
    {
      $group: {
        _id: null,
        averageScore: { $avg: '$score' },
        totalAttempts: { $sum: 1 },
        passRate: {
          $avg: { $cond: [{ $gte: ['$score', 70] }, 1, 0] }
        },
        averageTime: { $avg: '$timeTaken' }
      }
    }
  ]);
};

attemptSchema.statics.getUserPerformance = function(userId) {
  return this.aggregate([
    { $match: { userId: userId, status: 'COMPLETED' } },
    {
      $group: {
        _id: '$assessmentId',
        averageScore: { $avg: '$score' },
        totalAttempts: { $sum: 1 },
        lastAttempt: { $max: '$metadata.completedAt' }
      }
    }
  ]);
};

attemptSchema.statics.getTopicAnalytics = function(userId, subject) {
  return this.aggregate([
    {
      $match: {
        userId: userId,
        status: 'COMPLETED',
        'analytics.accuracyByTopic': { $exists: true }
      }
    },
    { $unwind: '$analytics.accuracyByTopic' },
    {
      $group: {
        _id: '$analytics.accuracyByTopic.topic',
        averageAccuracy: { $avg: '$analytics.accuracyByTopic.accuracy' },
        totalQuestions: { $sum: '$analytics.accuracyByTopic.questionsAttempted' },
        correctAnswers: { $sum: '$analytics.accuracyByTopic.questionsCorrect' }
      }
    },
    { $sort: { averageAccuracy: 1 } } // Sort by accuracy ascending (weakest topics first)
  ]);
};

// Instance methods
attemptSchema.methods.markCompleted = function() {
  this.status = 'COMPLETED';
  this.metadata.completedAt = new Date();
  return this.save();
};

attemptSchema.methods.updateQuestionResult = function(questionIndex, result) {
  if (this.questions[questionIndex]) {
    this.questions[questionIndex] = {
      ...this.questions[questionIndex],
      ...result
    };
    return this.save();
  }
  return Promise.reject(new Error('Invalid question index'));
};

attemptSchema.methods.getProgress = function() {
  const totalQuestions = this.questions.length;
  const answeredQuestions = this.questions.filter(q => q.userAnswer !== undefined).length;
  return {
    total: totalQuestions,
    answered: answeredQuestions,
    percentage: totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0
  };
};

attemptSchema.methods.calculateAnalytics = function() {
  // Calculate topic-wise accuracy
  const topicAccuracy = {};
  
  this.questions.forEach(question => {
    // This would need the actual question data to get topic
    // For now, we'll use a placeholder
    const topic = 'General'; // Would be populated from question data
    
    if (!topicAccuracy[topic]) {
      topicAccuracy[topic] = {
        topic: topic,
        questionsAttempted: 0,
        questionsCorrect: 0,
        accuracy: 0
      };
    }
    
    topicAccuracy[topic].questionsAttempted++;
    if (question.isCorrect) {
      topicAccuracy[topic].questionsCorrect++;
    }
  });
  
  // Convert to array and calculate accuracy
  this.analytics.accuracyByTopic = Object.values(topicAccuracy).map(topic => ({
    ...topic,
    accuracy: Math.round((topic.questionsCorrect / topic.questionsAttempted) * 100)
  }));
  
  // Calculate time analysis
  const totalTime = this.questions.reduce((total, q) => total + q.timeSpent, 0);
  this.analytics.timeAnalysis = {
    averageTimePerQuestion: this.questions.length > 0 ? Math.round(totalTime / this.questions.length) : 0,
    timeDistribution: {
      quick: this.questions.filter(q => q.timeSpent < 30).length,
      medium: this.questions.filter(q => q.timeSpent >= 30 && q.timeSpent <= 90).length,
      slow: this.questions.filter(q => q.timeSpent > 90).length
    }
  };
  
  return this.save();
};

module.exports = mongoose.model('Attempt', attemptSchema);