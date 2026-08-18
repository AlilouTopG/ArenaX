import asyncHandler from '../utils/asyncHandler.js';
import { success } from '../utils/ApiResponse.js';
import CoachSettings from '../models/CoachSettings.js';
import { notifyCoach } from '../services/notificationService.js';
import { ApiError } from '../utils/ApiError.js';
import { getTelegramChatId } from '../services/telegramService.js';

export const getSettings = asyncHandler(async (req, res) => {
  let settings = await CoachSettings.findOne({ coach: req.user._id });
  if (!settings) {
    settings = await CoachSettings.create({ coach: req.user._id });
  }
  return success(res, { message: 'Coach settings', data: { settings } });
});

export const updateSettings = asyncHandler(async (req, res) => {
  const settings = await CoachSettings.findOneAndUpdate(
    { coach: req.user._id },
    { $set: req.body },
    { new: true, upsert: true, runValidators: true },
  );
  return success(res, { message: 'Settings updated', data: { settings } });
});

export const linkTelegram = asyncHandler(async (req, res) => {
  const { authToken } = req.body;
  if (!authToken) throw ApiError.badRequest('authToken is required');

  const chatId = await getTelegramChatId(authToken);
  if (!chatId) throw ApiError.badRequest('Could not resolve chat id, start the bot first');

  const settings = await CoachSettings.findOneAndUpdate(
    { coach: req.user._id },
    { $set: { telegram: { enabled: true, chatId: String(chatId), verifiedAt: new Date() } } },
    { new: true, upsert: true },
  );

  return success(res, { message: 'Telegram linked', data: { settings } });
});

export const testNotification = asyncHandler(async (req, res) => {
  const settings = await CoachSettings.findOne({ coach: req.user._id });
  const result = await notifyCoach(settings, {
    event: 'newSubscription',
    payload: {
      memberName: 'اختبار',
      gymName: 'ArenaX',
      sportType: 'Bodybuilding',
      amountPaid: 0,
      startDate: new Date(),
      endDate: new Date(Date.now() + 86400000),
    },
  });
  return success(res, { message: 'Test notification', data: { delivered: result.delivered } });
});