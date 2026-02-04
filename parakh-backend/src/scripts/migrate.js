const mongoose = require('mongoose');

require('dotenv').config();

const migrateDatabase = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/parakh');
    console.log('Connected to MongoDB for migration');

    // Check if collections exist and have data
    const collections = await mongoose.connection.db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);

    console.log('Existing collections:', collectionNames);

    // Create indexes if they don't exist
    console.log('Creating database indexes...');

    // User indexes
    await mongoose.connection.db.collection('users').createIndex({ email: 1 }, { unique: true });
    await mongoose.connection.db.collection('users').createIndex({ role: 1 });
    await mongoose.connection.db.collection('users').createIndex({ 'academic.lastActivity': 1 });

    // Question indexes
    await mongoose.connection.db.collection('questions').createIndex({ subject: 1, topic: 1 });
    await mongoose.connection.db.collection('questions').createIndex({ difficulty: 1 });
    await mongoose.connection.db.collection('questions').createIndex({ 'metadata.createdBy': 1 });
    await mongoose.connection.db.collection('questions').createIndex({ status: 1 });
    await mongoose.connection.db.collection('questions').createIndex({ tags: 1 });

    // Assessment indexes
    await mongoose.connection.db.collection('assessments').createIndex({ subject: 1, topic: 1 });
    await mongoose.connection.db.collection('assessments').createIndex({ difficulty: 1 });
    await mongoose.connection.db.collection('assessments').createIndex({ 'metadata.createdBy': 1 });
    await mongoose.connection.db.collection('assessments').createIndex({ status: 1 });
    await mongoose.connection.db.collection('assessments').createIndex({ 'metadata.createdAt': -1 });

    // Attempt indexes
    await mongoose.connection.db.collection('attempts').createIndex({ userId: 1, assessmentId: 1 });
    await mongoose.connection.db.collection('attempts').createIndex({ userId: 1, 'metadata.startedAt': -1 });
    await mongoose.connection.db.collection('attempts').createIndex({ assessmentId: 1, 'metadata.startedAt': -1 });
    await mongoose.connection.db.collection('attempts').createIndex({ 'metadata.completedAt': -1 });

    console.log('✅ Database migration completed successfully!');
    console.log('📊 Database indexes created for optimal performance');

  } catch (error) {
    console.error('❌ Error during migration:', error);
  } finally {
    mongoose.connection.close();
    console.log('Database connection closed');
  }
};

// Run the migration function
if (require.main === module) {
  migrateDatabase();
}

module.exports = migrateDatabase;