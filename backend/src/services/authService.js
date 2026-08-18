import crypto from 'crypto';
import User from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt.js';
import logger from '../utils/logger.js';

const buildTokens = (user) => {
  const payload = { sub: user._id.toString(), role: user.role, v: user.refreshTokenVersion };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);
  return { accessToken, refreshToken };
};

export const registerUser = async ({ name, email, phone, password, role }) => {
  const normalizedEmail = email.toLowerCase().trim();

  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) {
    throw ApiError.conflict('Email is already registered');
  }

  const user = await User.create({
    name,
    email: normalizedEmail,
    phone,
    password,
    role: role || 'User',
  });

  return { user: user.toSafeObject(), ...buildTokens(user) };
};

export const loginUser = async ({ email, password }) => {
  const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password +refreshTokenVersion');
  if (!user) {
    throw ApiError.unauthorized('Invalid email or password');
  }
  if (!user.isActive) {
    throw ApiError.forbidden('Account is disabled');
  }

  const valid = await user.comparePassword(password);
  if (!valid) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  user.lastLoginAt = new Date();
  await user.save({ validateBeforeSave: false });

  return { user: user.toSafeObject(), ...buildTokens(user) };
};

export const refreshAccessToken = async (refreshToken) => {
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch (error) {
    throw ApiError.unauthorized('Invalid or expired refresh token');
  }

  const user = await User.findById(payload.sub).select('+refreshTokenVersion');
  if (!user || !user.isActive) {
    throw ApiError.unauthorized('User not found or inactive');
  }
  if (payload.v !== user.refreshTokenVersion) {
    throw ApiError.unauthorized('Refresh token revoked');
  }

  const accessToken = signAccessToken({ sub: user._id.toString(), role: user.role, v: user.refreshTokenVersion });
  return { accessToken, user: user.toSafeObject() };
};

export const logoutUser = async (userId) => {
  await User.findByIdAndUpdate(userId, { $inc: { refreshTokenVersion: 1 } });
  logger.info(`User ${userId} logged out, tokens revoked`);
};

export const generateTelegramLinkCode = (userId) => {
  return crypto.randomBytes(24).toString('hex');
};
