const mongoose = require('mongoose');

const connectDB = async () => {
  const primaryUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/agrogebeya_ethiopia';
  try {
    const conn = await mongoose.connect(primaryUri, { serverSelectionTimeoutMS: 4000 });
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.warn(`Primary MongoDB connection failed (${error.message}). Trying local fallback...`);
    try {
      const localUri = 'mongodb://127.0.0.1:27017/agrogebeya_ethiopia';
      const conn = await mongoose.connect(localUri, { serverSelectionTimeoutMS: 4000 });
      console.log(`Local MongoDB connected: ${conn.connection.host}`);
    } catch (fallbackErr) {
      console.error(`MongoDB connection error: ${fallbackErr.message}`);
      process.exit(1);
    }
  }
};

module.exports = connectDB;

