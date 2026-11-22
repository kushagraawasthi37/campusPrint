const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer = null;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (uri) {
    try {
      console.log(`[DB] Attempting connection to configured MONGODB_URI...`);
      const conn = await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 4000
      });
      console.log(`[DB] Connected to MongoDB at: ${conn.connection.host}`);
      return conn;
    } catch (err) {
      console.warn(`[DB] Failed to connect to MONGODB_URI (${err.message}). Falling back to in-memory instance.`);
    }
  }

  // Fallback or default for local zero-config testing: MongoMemoryServer
  try {
    console.log('[DB] Initializing embedded MongoDB memory server...');
    mongoServer = await MongoMemoryServer.create({
      instance: {
        dbName: 'campusprint'
      }
    });
    const memoryUri = mongoServer.getUri();
    const conn = await mongoose.connect(memoryUri);
    console.log(`[DB] Connected to In-Memory MongoDB at: ${memoryUri}`);
    return conn;
  } catch (error) {
    console.error(`[DB] Fatal error initializing MongoDB:`, error);
    throw error;
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    if (mongoServer) {
      await mongoServer.stop();
    }
  } catch (err) {
    console.error('[DB] Error during disconnect:', err);
  }
};

module.exports = { connectDB, disconnectDB };
