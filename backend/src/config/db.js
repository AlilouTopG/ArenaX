import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import env from './env.js';
import logger from '../utils/logger.js';

let memoryServer = null;
let dbMode = 'unknown';

export const getDbMode = () => dbMode;

export const isInMemory = () => memoryServer !== null;

const connect = async (uri, opts = {}) =>
  mongoose.connect(uri, {
    autoIndex: true,
    serverSelectionTimeoutMS: 5000,
    ...opts,
  });

/**
 * One-click database bootstrap:
 * 1. If MONGO_URI is set (e.g. MongoDB Atlas cloud), try to connect to it.
 * 2. If no MONGO_URI, or the connection fails (ECONNREFUSED etc.),
 *    automatically fall back to an in-memory MongoDB instance.
 *    No errors on startup - the server always boots.
 */
export const connectDB = async () => {
  mongoose.set('strictQuery', true);

  if (env.NODE_ENV === 'production' && !env.MONGO_URI) {
    throw new Error(
      'MONGO_URI is required in production. Create a free MongoDB Atlas cluster (https://www.mongodb.com/atlas) and set MONGO_URI.',
    );
  }

  if (env.MONGO_URI) {
    try {
      const conn = await connect(env.MONGO_URI, { autoIndex: env.NODE_ENV !== 'production' });
      dbMode = 'mongodb';
      logger.info(`MongoDB connected (cloud/external): ${conn.connection.host}`);
      return { conn, isInMemory: false };
    } catch (error) {
      logger.error(`MongoDB connection failed (${env.MONGO_URI}): ${error.message}`);
      if (env.NODE_ENV === 'production') {
        throw new Error(`MongoDB connection failed in production: ${error.message}`);
      }
      logger.warn('Falling back to in-memory MongoDB (development only)');
    }
  } else {
    logger.warn('MONGO_URI not set - using in-memory MongoDB (data resets on restart)');
  }

  try {
    memoryServer = await MongoMemoryServer.create();
    const uri = memoryServer.getUri();
    const conn = await connect(uri);
    dbMode = 'in-memory';
    logger.info(`In-memory MongoDB connected: ${conn.connection.host}`);
    return { conn, isInMemory: true };
  } catch (error) {
    logger.error('In-memory MongoDB failed to start', { error: error.message });
    process.exit(1);
  }
};

export const closeDB = async () => {
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = null;
  }
  logger.info('Database connection closed');
};