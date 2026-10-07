const mongoose = require('mongoose');

let mongoServerInstance = null;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ecommerce';
  
  try {
    // Attempt standard connection with 2.5s timeout for quick fallback if local mongod is not running
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2500,
    });
    console.log(`[MongoDB] Connected to database: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (err) {
    console.warn(`[MongoDB] External MongoDB connection failed (${err.message}). Starting embedded MongoDB Memory Server...`);
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongoServerInstance = await MongoMemoryServer.create();
      const inMemoryUri = mongoServerInstance.getUri();
      const conn = await mongoose.connect(inMemoryUri);
      console.log(`[MongoDB] Connected to in-memory instance: ${inMemoryUri}`);
      return conn;
    } catch (fallbackError) {
      console.error('[MongoDB] Fatal error starting database:', fallbackError);
      process.exit(1);
    }
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    if (mongoServerInstance) {
      await mongoServerInstance.stop();
    }
  } catch (error) {
    console.error('[MongoDB] Error disconnecting:', error);
  }
};

module.exports = { connectDB, disconnectDB };
