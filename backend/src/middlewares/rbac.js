import { ApiError } from '../utils/ApiError.js';

export const requireRole = (...roles) => (req, _res, next) => {
  if (!req.user) {
    return next(ApiError.unauthorized('Not authenticated'));
  }
  if (!roles.includes(req.user.role)) {
    return next(ApiError.forbidden(`Requires one of roles: ${roles.join(', ')}`));
  }
  return next();
};

export const isCoach = requireRole('Admin', 'Coach_ClubOwner');
export const isAdmin = requireRole('Admin');
