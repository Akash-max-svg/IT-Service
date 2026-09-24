const mongoose = require('mongoose');

let mongodInstance = null;

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;

    if (mongoUri) {
      console.log('Connecting to provided MONGODB_URI...');
      await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 5000,
      });
      console.log(`MongoDB Connected successfully: ${mongoose.connection.host}`);
      return;
    }

    console.log('No MONGODB_URI found in environment. Starting embedded in-memory MongoDB...');
    const { MongoMemoryServer } = require('mongodb-memory-server');
    mongodInstance = await MongoMemoryServer.create();
    const uri = mongodInstance.getUri();
    await mongoose.connect(uri);
    console.log(`Connected to In-Memory MongoDB at ${uri}`);
  } catch (error) {
    console.warn(`Primary connection failed: ${error.message}. Attempting in-memory MongoDB fallback...`);
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongodInstance = await MongoMemoryServer.create();
      const uri = mongodInstance.getUri();
      await mongoose.connect(uri);
      console.log(`Connected to fallback In-Memory MongoDB at ${uri}`);
    } catch (fallbackError) {
      console.error(`MongoDB connection error: ${fallbackError.message}`);
      process.exit(1);
    }
  }
};

module.exports = connectDB;
