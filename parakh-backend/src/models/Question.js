const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  questionText: {
    type: String,
    required: [true, 'Question text is required'],
    trim: true
  },
  questionType: {
    type: String,
    enum: ['MULTIPLE_CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER', 'MATCHING', 'ESSAY'],
    default: 'MULTIPLE_CHOICE'
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
    enum: ['EASY', 'MEDIUM', 'HARD'],
    required: [true, 'Difficulty level is required']
  },
  options: [{
    text: {
      type: String,
      required: function() {
        return this.questionType === 'MULTIPLE_CHOICE' || this.questionType === 'TRUE_FALSE';
      }
    },
    isCorrect: {
      type: Boolean,
      default: false
    },
    explanation: {
      type: String,
      default: ''
    }
  }],
  correctAnswer: {
    type: String,
    required: function() {
      return this.questionType === 'SHORT_ANSWER' || this.questionType === 'ESSAY';
    }
  },
  explanation: {
    type: String,
    required: [true, 'Explanation is required']
  },
  tags: [{
    type: String,
    trim: true
  }],
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
    },
    averageDifficulty: {
      type: Number,
      default: 0 // Calculated based on student performance
    },
    discriminationIndex: {
      type: Number,
      default: 0 // How well the question distinguishes between high and low performers
    }
  },
  status: {
    type: String,
    enum: ['DRAFT', 'ACTIVE', 'INACTIVE', 'REVIEW'],
    default: 'DRAFT'
  },
  version: {
    type: String,
    default: '1.0'
  },
  estimatedTime: {
    type: Number, // in seconds
    default: 60
  },
  bloomTaxonomy: {
    type: String,
    enum: ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE'],
    default: 'REMEMBER'
  }
}, {
  timestamps: true
});

// Indexes
questionSchema.index({ subject: 1, topic: 1 });
questionSchema.index({ difficulty: 1 });
questionSchema.index({ 'metadata.createdBy': 1 });
questionSchema.index({ status: 1 });
questionSchema.index({ tags: 1 });

// Pre-save middleware
questionSchema.pre('save', function(next) {
  // Update the updatedAt field
  this.metadata.updatedAt = Date.now();
  
  // Increment usage count if question is being used
  if (this.isModified('metadata.lastUsed')) {
    this.metadata.usageCount += 1;
  }
  
  next();
});

// Static methods
questionSchema.statics.findBySubject = function(subject) {
  return this.find({ subject: subject, status: 'ACTIVE' });
};

questionSchema.statics.findByTopic = function(topic) {
  return this.find({ topic: topic, status: 'ACTIVE' });
};

questionSchema.statics.getQuestionsByDifficulty = function(subject, difficulty) {
  return this.find({ 
    subject: subject, 
    difficulty: difficulty, 
    status: 'ACTIVE' 
  });
};

questionSchema.statics.getRandomQuestions = function(filters, limit = 10) {
  const query = { status: 'ACTIVE' };
  
  if (filters.subject) query.subject = filters.subject;
  if (filters.topic) query.topic = filters.topic;
  if (filters.difficulty) query.difficulty = filters.difficulty;
  if (filters.tags && filters.tags.length > 0) {
    query.tags = { $in: filters.tags };
  }
  
  return this.aggregate([
    { $match: query },
    { $sample: { size: limit } }
  ]);
};

questionSchema.statics.getQuestionStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: {
          subject: '$subject',
          difficulty: '$difficulty'
        },
        count: { $sum: 1 },
        avgUsage: { $avg: '$metadata.usageCount' },
        avgDifficulty: { $avg: '$metadata.averageDifficulty' }
      }
    }
  ]);
};

// Instance methods
questionSchema.methods.markAsUsed = function() {
  return this.updateOne({
    $set: {
      'metadata.lastUsed': new Date(),
      'metadata.usageCount': this.metadata.usageCount + 1
    }
  });
};

questionSchema.methods.updateStats = function(newStats) {
  return this.updateOne({
    $set: {
      'metadata.averageDifficulty': newStats.averageDifficulty,
      'metadata.discriminationIndex': newStats.discriminationIndex,
      'metadata.updatedAt': new Date()
    }
  });
};

// Virtual for correct options (for multiple choice)
questionSchema.virtual('correctOptions').get(function() {
  return this.options.filter(option => option.isCorrect);
});

// Virtual for question complexity score
questionSchema.virtual('complexityScore').get(function() {
  let score = 0;
  
  // Base score by difficulty
  switch(this.difficulty) {
    case 'EASY': score += 1; break;
    case 'MEDIUM': score += 2; break;
    case 'HARD': score += 3; break;
  }
  
  // Add complexity for question type
  switch(this.questionType) {
    case 'ESSAY': score += 3; break;
    case 'MATCHING': score += 2; break;
    case 'SHORT_ANSWER': score += 1; break;
  }
  
  // Add complexity for bloom taxonomy level
  switch(this.bloomTaxonomy) {
    case 'ANALYZE': score += 1; break;
    case 'EVALUATE': score += 2; break;
    case 'CREATE': score += 3; break;
  }
  
  return score;
});

module.exports = mongoose.model('Question', questionSchema);