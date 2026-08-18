import asyncHandler from '../utils/asyncHandler.js';
import { success, paginationMeta } from '../utils/ApiResponse.js';
import {
  createSubscription,
  listCoachSubscriptions,
  getSubscriptionById,
  updateSubscription,
  deleteSubscription,
} from '../services/subscriptionService.js';

export const create = asyncHandler(async (req, res) => {
  const subscription = await createSubscription({ coachId: req.user._id, payload: req.body });
  return success(res, {
    statusCode: 201,
    message: 'Subscription created',
    data: { subscription },
  });
});

export const list = asyncHandler(async (req, res) => {
  const result = await listCoachSubscriptions({ coachId: req.user._id, query: req.query });
  return success(res, {
    message: 'Subscriptions list',
    data: { subscriptions: result.docs },
    meta: paginationMeta(result.page, result.limit, result.total),
  });
});

export const getOne = asyncHandler(async (req, res) => {
  const subscription = await getSubscriptionById({ coachId: req.user._id, subscriptionId: req.params.id });
  return success(res, { message: 'Subscription detail', data: { subscription } });
});

export const update = asyncHandler(async (req, res) => {
  const subscription = await updateSubscription({
    coachId: req.user._id,
    subscriptionId: req.params.id,
    payload: req.body,
  });
  return success(res, { message: 'Subscription updated', data: { subscription } });
});

export const remove = asyncHandler(async (req, res) => {
  const result = await deleteSubscription({ coachId: req.user._id, subscriptionId: req.params.id });
  return success(res, { message: 'Subscription deleted', data: result });
});