import asyncHandler from '../utils/asyncHandler.js';
import { success } from '../utils/ApiResponse.js';
import { registerUser, loginUser, refreshAccessToken, logoutUser } from '../services/authService.js';
import { penalizeFailedLogin } from '../middlewares/rateLimiter.js';

export const register = asyncHandler(async (req, res) => {
  const { name, email, phone, password, role } = req.body;
  const { user, accessToken, refreshToken } = await registerUser({ name, email, phone, password, role });
  return success(res, {
    statusCode: 201,
    message: 'Account created successfully',
    data: { user, accessToken, refreshToken },
  });
});

export const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;
  try {
    const { user, accessToken, refreshToken } = await loginUser({ email, password });
    return success(res, {
      message: 'Logged in successfully',
      data: { user, accessToken, refreshToken },
    });
  } catch (error) {
    await penalizeFailedLogin(req);
    return next(error);
  }
});

export const refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  const result = await refreshAccessToken(refreshToken);
  return success(res, { message: 'Token refreshed', data: result });
});

export const logout = asyncHandler(async (req, res) => {
  await logoutUser(req.user._id);
  return success(res, { message: 'Logged out, tokens revoked' });
});

export const me = asyncHandler(async (req, res) => {
  return success(res, { message: 'Profile', data: { user: req.user.toSafeObject() } });
});