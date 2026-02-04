const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const User = require('../models/User');
const Question = require('../models/Question');
const Assessment = require('../models/Assessment');

require('dotenv').config();

const seedDatabase = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/parakh');
    console.log('Connected to MongoDB');

    // Clear existing data
    console.log('Clearing existing data...');
    await User.deleteMany({});
    await Question.deleteMany({});
    await Assessment.deleteMany({});

    // Create default users
    console.log('Creating default users...');

    const adminUser = new User({
      name: 'Lishaanth Kumar',
      email: 'lishaanthkumar05@gmail.com',
      password: 'Lishaanth@2005',
      role: 'ADMIN',
      status: 'ACTIVE',
      profile: {
        bio: 'System Administrator',
        grade: 'UNDERGRAD'
      }
    });

    const teacherUser = new User({
      name: 'Teacher User',
      email: 'teacher@gmail.com',
      password: 'teacher@123',
      role: 'TEACHER',
      status: 'ACTIVE',
      profile: {
        bio: 'Mathematics Teacher',
        grade: 'UNDERGRAD'
      }
    });

    const studentUser = new User({
      name: 'Student User',
      email: 'user@gmail.com',
      password: 'user@123',
      role: 'STUDENT',
      status: 'ACTIVE',
      profile: {
        bio: 'Dedicated student',
        grade: '10'
      }
    });

    // Save users
    await adminUser.save();
    await teacherUser.save();
    await studentUser.save();

    console.log('Users created successfully');

    // Create sample questions
    console.log('Creating sample questions...');

    const questions = [
      {
        questionText: 'What is the capital of France?',
        questionType: 'MULTIPLE_CHOICE',
        subject: 'GEOGRAPHY',
        topic: 'World Capitals',
        difficulty: 'EASY',
        options: [
          { text: 'London', isCorrect: false },
          { text: 'Paris', isCorrect: true },
          { text: 'Berlin', isCorrect: false },
          { text: 'Madrid', isCorrect: false }
        ],
        explanation: 'Paris is the capital and largest city of France.',
        tags: ['capital', 'france', 'europe'],
        status: 'ACTIVE',
        metadata: {
          createdBy: teacherUser._id,
          usageCount: 10
        }
      },
      {
        questionText: 'Solve for x: 2x + 5 = 15',
        questionType: 'MULTIPLE_CHOICE',
        subject: 'MATHEMATICS',
        topic: 'Algebra',
        difficulty: 'MEDIUM',
        options: [
          { text: '5', isCorrect: true },
          { text: '7.5', isCorrect: false },
          { text: '10', isCorrect: false },
          { text: '2.5', isCorrect: false }
        ],
        explanation: '2x + 5 = 15 → 2x = 10 → x = 5',
        tags: ['algebra', 'equation', 'solve'],
        status: 'ACTIVE',
        metadata: {
          createdBy: teacherUser._id,
          usageCount: 8
        }
      },
      {
        questionText: 'What is the chemical symbol for water?',
        questionType: 'MULTIPLE_CHOICE',
        subject: 'SCIENCE',
        topic: 'Chemistry',
        difficulty: 'EASY',
        options: [
          { text: 'H2O', isCorrect: true },
          { text: 'CO2', isCorrect: false },
          { text: 'O2', isCorrect: false },
          { text: 'NaCl', isCorrect: false }
        ],
        explanation: 'Water is composed of two hydrogen atoms and one oxygen atom.',
        tags: ['chemistry', 'water', 'formula'],
        status: 'ACTIVE',
        metadata: {
          createdBy: teacherUser._id,
          usageCount: 15
        }
      },
      {
        questionText: 'Who wrote "Romeo and Juliet"?',
        questionType: 'MULTIPLE_CHOICE',
        subject: 'ENGLISH',
        topic: 'Literature',
        difficulty: 'EASY',
        options: [
          { text: 'Charles Dickens', isCorrect: false },
          { text: 'William Shakespeare', isCorrect: true },
          { text: 'Jane Austen', isCorrect: false },
          { text: 'Mark Twain', isCorrect: false }
        ],
        explanation: 'William Shakespeare wrote the famous tragedy "Romeo and Juliet".',
        tags: ['literature', 'shakespeare', 'romeo'],
        status: 'ACTIVE',
        metadata: {
          createdBy: teacherUser._id,
          usageCount: 12
        }
      },
      {
        questionText: 'What is 15% of 200?',
        questionType: 'MULTIPLE_CHOICE',
        subject: 'MATHEMATICS',
        topic: 'Percentages',
        difficulty: 'EASY',
        options: [
          { text: '15', isCorrect: false },
          { text: '25', isCorrect: false },
          { text: '30', isCorrect: true },
          { text: '35', isCorrect: false }
        ],
        explanation: '15% of 200 = 0.15 × 200 = 30',
        tags: ['percentages', 'math', 'calculation'],
        status: 'ACTIVE',
        metadata: {
          createdBy: teacherUser._id,
          usageCount: 6
        }
      },
      {
        questionText: 'Which planet is known as the Red Planet?',
        questionType: 'MULTIPLE_CHOICE',
        subject: 'SCIENCE',
        topic: 'Astronomy',
        difficulty: 'EASY',
        options: [
          { text: 'Earth', isCorrect: false },
          { text: 'Mars', isCorrect: true },
          { text: 'Jupiter', isCorrect: false },
          { text: 'Venus', isCorrect: false }
        ],
        explanation: 'Mars is known as the Red Planet due to its reddish appearance.',
        tags: ['astronomy', 'mars', 'planet'],
        status: 'ACTIVE',
        metadata: {
          createdBy: teacherUser._id,
          usageCount: 9
        }
      },
      {
        questionText: 'What is the square root of 144?',
        questionType: 'MULTIPLE_CHOICE',
        subject: 'MATHEMATICS',
        topic: 'Arithmetic',
        difficulty: 'EASY',
        options: [
          { text: '10', isCorrect: false },
          { text: '12', isCorrect: true },
          { text: '14', isCorrect: false },
          { text: '16', isCorrect: false }
        ],
        explanation: '12 × 12 = 144, so √144 = 12',
        tags: ['arithmetic', 'square root', 'math'],
        status: 'ACTIVE',
        metadata: {
          createdBy: teacherUser._id,
          usageCount: 11
        }
      },
      {
        questionText: 'In which year did World War II end?',
        questionType: 'MULTIPLE_CHOICE',
        subject: 'HISTORY',
        topic: 'World War II',
        difficulty: 'MEDIUM',
        options: [
          { text: '1943', isCorrect: false },
          { text: '1945', isCorrect: true },
          { text: '1947', isCorrect: false },
          { text: '1950', isCorrect: false }
        ],
        explanation: 'World War II ended in 1945 with the surrender of Germany and Japan.',
        tags: ['history', 'ww2', '1945'],
        status: 'ACTIVE',
        metadata: {
          createdBy: teacherUser._id,
          usageCount: 7
        }
      },
      {
        questionText: 'What is the largest organ in the human body?',
        questionType: 'MULTIPLE_CHOICE',
        subject: 'SCIENCE',
        topic: 'Biology',
        difficulty: 'EASY',
        options: [
          { text: 'Heart', isCorrect: false },
          { text: 'Liver', isCorrect: false },
          { text: 'Skin', isCorrect: true },
          { text: 'Brain', isCorrect: false }
        ],
        explanation: 'The skin is the largest organ in the human body.',
        tags: ['biology', 'human body', 'skin'],
        status: 'ACTIVE',
        metadata: {
          createdBy: teacherUser._id,
          usageCount: 14
        }
      },
      {
        questionText: 'What is the past tense of "go"?',
        questionType: 'MULTIPLE_CHOICE',
        subject: 'ENGLISH',
        topic: 'Grammar',
        difficulty: 'EASY',
        options: [
          { text: 'goed', isCorrect: false },
          { text: 'went', isCorrect: true },
          { text: 'gone', isCorrect: false },
          { text: 'going', isCorrect: false }
        ],
        explanation: 'The past tense of "go" is "went".',
        tags: ['grammar', 'english', 'past tense'],
        status: 'ACTIVE',
        metadata: {
          createdBy: teacherUser._id,
          usageCount: 8
        }
      }
    ];

    await Question.insertMany(questions);
    console.log('Questions created successfully');

    // Create sample assessments
    console.log('Creating sample assessments...');

    const mathAssessment = new Assessment({
      title: 'Basic Mathematics Test',
      description: 'Test your basic mathematics skills including algebra, percentages, and arithmetic.',
      subject: 'MATHEMATICS',
      topic: 'General Mathematics',
      difficulty: 'MEDIUM',
      questions: [
        { questionId: questions[1]._id, points: 1, order: 1 },
        { questionId: questions[4]._id, points: 1, order: 2 },
        { questionId: questions[6]._id, points: 1, order: 3 }
      ],
      settings: {
        timeLimit: 30,
        shuffleQuestions: true,
        shuffleAnswers: true,
        allowBacktracking: true,
        showResultsImmediately: true,
        passingScore: 70,
        maxAttempts: 3
      },
      status: 'ACTIVE',
      metadata: {
        createdBy: teacherUser._id,
        usageCount: 5
      }
    });

    const scienceAssessment = new Assessment({
      title: 'General Science Quiz',
      description: 'Test your knowledge of basic science concepts.',
      subject: 'SCIENCE',
      topic: 'General Science',
      difficulty: 'EASY',
      questions: [
        { questionId: questions[2]._id, points: 1, order: 1 },
        { questionId: questions[5]._id, points: 1, order: 2 },
        { questionId: questions[8]._id, points: 1, order: 3 }
      ],
      settings: {
        timeLimit: 20,
        shuffleQuestions: true,
        shuffleAnswers: true,
        allowBacktracking: true,
        showResultsImmediately: true,
        passingScore: 60,
        maxAttempts: 5
      },
      status: 'ACTIVE',
      metadata: {
        createdBy: teacherUser._id,
        usageCount: 8
      }
    });

    const englishAssessment = new Assessment({
      title: 'English Literature and Grammar',
      description: 'Test your knowledge of English literature and grammar.',
      subject: 'ENGLISH',
      topic: 'Literature and Grammar',
      difficulty: 'MEDIUM',
      questions: [
        { questionId: questions[3]._id, points: 1, order: 1 },
        { questionId: questions[9]._id, points: 1, order: 2 }
      ],
      settings: {
        timeLimit: 15,
        shuffleQuestions: true,
        shuffleAnswers: true,
        allowBacktracking: false,
        showResultsImmediately: true,
        passingScore: 80,
        maxAttempts: 2
      },
      status: 'ACTIVE',
      metadata: {
        createdBy: teacherUser._id,
        usageCount: 3
      }
    });

    await mathAssessment.save();
    await scienceAssessment.save();
    await englishAssessment.save();

    console.log('Assessments created successfully');

    console.log('\n✅ Database seeding completed successfully!');
    console.log('\nDefault Users:');
    console.log('Admin: lishaanthkumar05@gmail.com / Lishaanth@2005');
    console.log('Teacher: teacher@gmail.com / teacher@123');
    console.log('Student: user@gmail.com / user@123');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    mongoose.connection.close();
    console.log('Database connection closed');
  }
};

// Run the seed function
if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;