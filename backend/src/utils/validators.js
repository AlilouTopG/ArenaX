import { body, query, param } from 'express-validator';

const ROLE_ENUM = ['Admin', 'Coach_ClubOwner', 'User'];
const SPORT_ENUM = ['Football', 'Bodybuilding', 'Boxing', 'Combat', 'Mixed'];
const EVENT_SPORT_ENUM = ['Football', 'Bodybuilding', 'Boxing', 'Combat', 'Mixed', 'Tennis', 'Basketball', 'Other'];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const PASSWORD_MIN = 8;
const PASSWORD_MAX = 128;

export const isStrongPassword = (value) => {
  if (!value || value.length < PASSWORD_MIN || value.length > PASSWORD_MAX) {
    throw new Error(`Password must be ${PASSWORD_MIN}-${PASSWORD_MAX} characters`);
  }
  if (!/[A-Z]/.test(value)) throw new Error('Password must contain an uppercase letter');
  if (!/[a-z]/.test(value)) throw new Error('Password must contain a lowercase letter');
  if (!/[0-9]/.test(value)) throw new Error('Password must contain a digit');
  if (!/[^A-Za-z0-9]/.test(value)) throw new Error('Password must contain a special character');
  return true;
};

export const registerValidator = [
  body('name').trim().isLength({ min: 2, max: 80 }).withMessage('Name must be 2-80 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('phone').optional().trim().matches(/^\+?[0-9\s\-]{8,20}$/).withMessage('Invalid phone'),
  body('password').custom(isStrongPassword),
  body('role').optional().isIn(ROLE_ENUM).withMessage(`Role must be one of ${ROLE_ENUM.join(', ')}`),
];

export const loginValidator = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isString().notEmpty().isLength({ min: 1, max: 128 }).withMessage('Password is required'),
];

export const refreshValidator = [
  body('refreshToken').isString().notEmpty().withMessage('refreshToken is required'),
];

export const createGymValidator = [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Gym name required'),
  body('description').optional().isLength({ max: 2000 }),
  body('sportTypes').optional().isArray().withMessage('sportTypes must be an array'),
  body('sportTypes.*').optional().isIn(SPORT_ENUM),
  body('subscriptionPrices.monthly').optional().isFloat({ min: 0 }),
  body('subscriptionPrices.quarterly').optional().isFloat({ min: 0 }),
  body('subscriptionPrices.yearly').optional().isFloat({ min: 0 }),
  body('location.coordinates').isArray({ min: 2, max: 2 }).withMessage('coordinates must be [lng, lat]'),
  body('location.coordinates.0').isFloat({ min: -180, max: 180 }),
  body('location.coordinates.1').isFloat({ min: -90, max: 90 }),
  body('address').optional().isLength({ max: 300 }),
  body('city').optional().trim().isLength({ max: 100 }),
  body('country').optional().matches(/^[A-Za-z]{2}$/).withMessage('country must be a 2-letter code'),
  body('contactPhone').optional().matches(/^\+?[0-9\s\-]{8,20}$/).withMessage('Invalid phone'),
];

export const createSubscriptionValidator = [
  body('gymId').isMongoId().withMessage('Valid gym id is required'),
  body('memberName').trim().isLength({ min: 2, max: 100 }).withMessage('Member name is required'),
  body('memberPhone').optional().matches(/^\+?[0-9\s\-]{8,20}$/).withMessage('Invalid phone'),
  body('sportType').isIn(SPORT_ENUM).withMessage('Valid sport type is required'),
  body('amountPaid').isFloat({ min: 0 }).withMessage('Amount must be >= 0'),
  body('paymentMethod').optional().isIn(['Cash', 'Card', 'Online', 'Other']),
  body('startDate').matches(DATE_RE).withMessage('startDate must be YYYY-MM-DD'),
  body('endDate').matches(DATE_RE).withMessage('endDate must be YYYY-MM-DD'),
  body('notes').optional().isLength({ max: 500 }),
];

export const listSubscriptionsValidator = [
  query('status').optional().isIn(['Active', 'ExpiringSoon', 'Expired']),
  query('sportType').optional().isIn(SPORT_ENUM),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
];

export const idParamValidator = [param('id').isMongoId().withMessage('Valid id is required')];

export const nearByValidator = [
  query('lat').exists().isFloat({ min: -90, max: 90 }).withMessage('lat is required'),
  query('lng').exists().isFloat({ min: -180, max: 180 }).withMessage('lng is required'),
  query('radius').optional().isFloat({ min: 0.5, max: 100 }),
  query('sportType').optional().isIn(SPORT_ENUM),
  query('maxMonthlyPrice').optional().isFloat({ min: 0 }),
];

export const coachSettingsValidator = [
  body('telegram.enabled').optional().isBoolean(),
  body('whatsapp.enabled').optional().isBoolean(),
  body('whatsapp.phone').optional().matches(/^\+?[0-9\s\-]{8,20}$/).withMessage('Invalid phone'),
  body('whatsapp.webhookUrl').optional().isURL().withMessage('Valid webhook url required'),
  body('notifications.onNewSubscription').optional().isBoolean(),
  body('notifications.onRenewal').optional().isBoolean(),
  body('notifications.expiryReminderDays').optional().isInt({ min: 1, max: 14 }),
];

export const createEventValidator = [
  body('title').trim().isLength({ min: 3, max: 150 }).withMessage('Event title is required'),
  body('sportType').isIn(EVENT_SPORT_ENUM).withMessage('Valid sport type is required'),
  body('location').trim().isLength({ min: 2, max: 200 }).withMessage('Event location is required'),
  body('gymId').optional().isMongoId().withMessage('Valid gym id is required'),
  body('eventDate').isISO8601().withMessage('eventDate must be a valid date').toDate(),
  body('entryFee').optional().isFloat({ min: 0 }).withMessage('entryFee must be >= 0'),
  body('registrationUrl').optional().isURL().withMessage('registrationUrl must be a valid URL'),
  body('description').optional().isLength({ max: 2000 }),
];

export const updateEventValidator = [
  body('title').optional().trim().isLength({ min: 3, max: 150 }),
  body('sportType').optional().isIn(EVENT_SPORT_ENUM),
  body('location').optional().trim().isLength({ min: 2, max: 200 }),
  body('gymId').optional().isMongoId(),
  body('eventDate').optional().isISO8601().toDate(),
  body('entryFee').optional().isFloat({ min: 0 }),
  body('registrationUrl').optional().isURL(),
  body('description').optional().isLength({ max: 2000 }),
];

export const listEventsValidator = [
  query('sportType').optional().isIn(EVENT_SPORT_ENUM),
  query('upcoming').optional().isIn(['true', 'false']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
];