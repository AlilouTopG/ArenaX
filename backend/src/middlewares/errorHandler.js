import mongoose from 'mongoose';
import logger from '../utils/logger.js';
import env from '../config/env.js';

export const notFound = (req, _res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  error.statusCode = 404;
  return next(error);
};

const toSafeMessage = (err) => {
  if (err instanceof mongoose.Error.CastError) return 'Invalid id or value format';
  if (err instanceof mongoose.Error.ValidationError) return err.message;
  if (err.code === 11000) return 'Duplicate value violates a unique constraint';
  return null;
};

export const errorHandler = (err, _req, res, _next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let details = err.details;

  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  } else if (err instanceof mongoose.Error.ValidationError) {
    statusCode = 422;
    message = 'Validation error';
    details = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
  } else if (err.code === 11000) {
    statusCode = 409;
    message = 'Duplicate key error';
    details = Object.keys(err.keyValue || {}).map((f) => ({ field: f, message: `${f} already exists` }));
  } else if (err.code && err.code === 429) {
    statusCode = 429;
    message = 'Too many requests';
  }

  const safe = toSafeMessage(err);
  if (safe) message = safe;

  if (statusCode >= 500) {
    logger.error('Server error', { error: err.message, stack: err.stack });
  }

  if (env.NODE_ENV === 'production' && statusCode >= 500) {
    message = 'Internal server error';
    details = undefined;
  }

  return res.status(statusCode).json({
    success: false,
    message,
    ...(details ? { details } : {}),
    ...(env.NODE_ENV !== 'production' && err.stack ? { stack: err.stack } : {}),
  });
};
