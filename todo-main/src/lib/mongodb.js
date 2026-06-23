// CHANGED: Implemented connection caching/check using readyState to avoid multiple open connections.
// Changed the error handler to throw the error rather than executing process.exit(1), preventing
// database connection issues from crashing the entire Next.js server process. Added serverSelectionTimeoutMS.
import mongoose from "mongoose";

let isConnected = false;

const connectDB = async () => {
  if (isConnected || mongoose.connection.readyState >= 1) {
    return;
  }

  try {
    const connectionInstance = await mongoose.connect(process.env.MONGO_URL, {
      dbName: process.env.DB_NAME,
      serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds instead of default 30
    });

    isConnected = true;
    console.log(`[MongoDB] Connected successfully! Host: ${connectionInstance.connection.host}`);
  } catch (error) {
    console.error("[MongoDB] Connection Failed:", error.message);
    throw error; // Throw so caller can return a 500 instead of crashing the Next process
  }
}

export default connectDB;