const mongoose = require('mongoose');

const assessmentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Assessment title is required'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  subject: {
    type: String,
    enum: ['MATHEMATICS', 'SCIENCE', 'ENGLISH', 'HISTORY', 'GEOGRAPHY', 'PHYSICS', 'CHEMISTRY', 'BIOLOGY'],
    required: [true, 'Subject is required']
  },
  topic: {
    type: String,
    required: [true, 'Topic is required'],
    trim: true
  },
  difficulty: {
    type: String,
    enum: ['EASY', 'MEDIUM', 'HARD', 'ADAPTIVE'],
    default: 'MEDIUM'
  },
  questions: [{
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: true
    },
    points: {
      type: Number,
      default: 1
    },
    order: {
      type: Number,
      required: true
    }
  }],
  settings: {
    timeLimit: {
      type: Number, // in minutes
      default: 60
    },
    shuffleQuestions: {
      type: Boolean,
      default: true
    },
    shuffleAnswers: {
      type: Boolean,
      default: true
    },
    allowBacktracking: {
      type: Boolean,
      default: true
    },
    showResultsImmediately: {
      type: Boolean,
      default: true
    },
    passingScore: {
      type: Number,
      default: 70 // percentage
    },
    maxAttempts: {
      type: Number,
      default: 3
    }
  },
  metadata: {
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    },
    lastUsed: {
      type: Date
    },
    usageCount: {
      type: Number,
      default: 0
    }
  },
  status: {
    type: String,
    enum: ['DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED'],
    default: 'DRAFT'
  },
  version: {
    type: String,
    default: '1.0'
  },
  tags: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true
});

// Indexes
assessmentSchema.index({ subject: 1, topic: 1 });
assessmentSchema.index({ difficulty: 1 });
assessmentSchema.index({ 'metadata.createdBy': 1 });
assessmentSchema.index({ status: 1 });
assessmentSchema.index({ 'metadata.createdAt': -1 });

// Pre-save middleware
assessmentSchema.pre('save', function(next) {
  // Update the updatedAt field
  this.metadata.updatedAt = Date.now();
  
  // Sort questions by order
  if (this.questions && this.questions.length > 0) {
    this.questions.sort((a, b) => a.order - b.order);
  }
  
  next();
});

// Static methods
assessmentSchema.statics.findBySubject = function(subject) {
  return this.find({ subject: subject, status: 'ACTIVE' });
};

assessmentSchema.statics.findByTopic = function(topic) {
  return this.find({ topic: topic, status: 'ACTIVE' });
};

assessmentSchema.statics.getAdaptiveAssessments = function() {
  return this.find({ difficulty: 'ADAPTIVE', status: 'ACTIVE' });
};

assessmentSchema.statics.getAssessmentStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: {
          subject: '$subject',
          difficulty: '$difficulty'
        },
        count: { $sum: 1 },
        avgUsage: { $avg: '$metadata.usageCount' },
        avgQuestions: { $avg: { $size: '$questions' } }
      }
    }
  ]);
};

// Instance methods
assessmentSchema.methods.markAsUsed = function() {
  return this.updateOne({
    $set: {
      'metadata.lastUsed': new Date(),
      'metadata.usageCount': this.metadata.usageCount + 1
    }
  });
};

assessmentSchema.methods.addQuestion = function(questionId, points = 1) {
  const order = this.questions.length + 1;
  this.questions.push({ questionId, points, order });
  return this.save();
};

assessmentSchema.methods.removeQuestion = function(questionId) {
  this.questions = this.questions.filter(q => q.questionId.toString() !== questionId.toString());
  
  // Reorder remaining questions
  this.questions.forEach((q, index) => {
    q.order = index + 1;
  });
  
  return this.save();
};

assessmentSchema.methods.getTotalPoints = function() {
  return this.questions.reduce((total, q) => total + q.points, 0);
};

assessmentSchema.methods.getQuestionCount = function() {
  return this.questions.length;
};

// Virtual for estimated duration
assessmentSchema.virtual('estimatedDuration').get(function() {
  const avgTimePerQuestion = 60; // seconds
  return this.questions.length * avgTimePerQuestion;
});

// Virtual for assessment complexity
assessmentSchema.virtual('complexity').get(function() {
  let totalComplexity = 0;
  
  this.questions.forEach(q => {
    // This would need to be calculated based on question complexity
    // For now, we'll use a simple calculation
    totalComplexity += 1;
  });
  
  return totalComplexity / this.questions.length;
});

module.exports = mongoose.model('Assessment', assessmentSchema);