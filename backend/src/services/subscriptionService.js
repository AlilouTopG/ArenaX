import Subscription from '../models/Subscription.js';
import CoachSettings from '../models/CoachSettings.js';
import User from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { notifyCoach } from './notificationService.js';
import logger from '../utils/logger.js';

const SUBSCRIPTION_DAYS = {
  monthly: 30,
  quarterly: 90,
  yearly: 365,
};

export const planDays = (plan) => SUBSCRIPTION_DAYS[plan] || 30;

const normalizeStatus = (endDate) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);

  if (end < today) return 'Expired';
  const diff = Math.ceil((end - today) / 86400000);
  if (diff <= 3) return 'ExpiringSoon';
  return 'Active';
};

export const createSubscription = async ({ coachId, payload }) => {
  const { gymId, member, memberName, memberPhone, sportType, amountPaid, paymentMethod, startDate, endDate, notes, renew } = payload;

  const coach = await User.findById(coachId);
  if (!coach) throw ApiError.notFound('Coach not found');

  const isRenewal = Boolean(renew);
  let created = await Subscription.create({
    gym: gymId,
    coach: coachId,
    member: member || null,
    memberName,
    memberPhone,
    sportType,
    amountPaid,
    paymentMethod,
    startDate,
    endDate,
    notes,
    status: normalizeStatus(endDate),
  });

  if (isRenewal && renew.subscriptionId) {
    created.renewedFrom = renew.subscriptionId;
    await created.save({ validateBeforeSave: false });
    await Subscription.findByIdAndUpdate(renew.subscriptionId, { status: 'Expired' });
  }

  created = await created.populate([{ path: 'gym', select: 'name' }]);

  try {
    const settings = await CoachSettings.findOne({ coach: coachId });
    await notifyCoach(settings, {
      event: isRenewal ? 'renewal' : 'newSubscription',
      payload: {
        memberName,
        sportType,
        amountPaid,
        startDate,
        endDate,
        gymName: created.gym?.name || 'Gym',
      },
    });
  } catch (error) {
    logger.warn('Notification dispatch failed', { error: error.message });
  }

  return created;
};

export const listCoachSubscriptions = async ({ coachId, query }) => {
  const { page = 1, limit = 20, status, sportType, search } = query;
  const filter = { coach: coachId };

  if (status) filter.status = status;
  if (sportType) filter.sportType = sportType;
  if (search) {
    filter.$or = [{ memberName: { $regex: search, $options: 'i' } }, { memberPhone: { $regex: search, $options: 'i' } }];
  }

  const total = await Subscription.countDocuments(filter);
  const docs = await Subscription.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('gym', 'name');

  return { docs, total, page, limit };
};

export const getSubscriptionById = async ({ coachId, subscriptionId }) => {
  const doc = await Subscription.findOne({ _id: subscriptionId, coach: coachId }).populate('gym', 'name');
  if (!doc) throw ApiError.notFound('Subscription not found');
  return doc;
};

export const updateSubscription = async ({ coachId, subscriptionId, payload }) => {
  const doc = await Subscription.findOne({ _id: subscriptionId, coach: coachId });
  if (!doc) throw ApiError.notFound('Subscription not found');

  const allowed = ['memberName', 'memberPhone', 'sportType', 'amountPaid', 'paymentMethod', 'startDate', 'endDate', 'notes'];
  for (const key of allowed) {
    if (payload[key] !== undefined) doc[key] = payload[key];
  }
  doc.status = normalizeStatus(doc.endDate);
  await doc.save();
  return doc;
};

export const deleteSubscription = async ({ coachId, subscriptionId }) => {
  const result = await Subscription.deleteOne({ _id: subscriptionId, coach: coachId });
  if (result.deletedCount === 0) throw ApiError.notFound('Subscription not found');
  return { deleted: true };
};

export { normalizeStatus };
