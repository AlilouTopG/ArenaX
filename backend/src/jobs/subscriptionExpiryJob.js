import cron from 'node-cron';
import Subscription from '../models/Subscription.js';
import CoachSettings from '../models/CoachSettings.js';
import { notifyCoach } from '../services/notificationService.js';
import { normalizeStatus } from '../services/subscriptionService.js';
import logger from '../utils/logger.js';

const DAY_MS = 86400000;

const startOfDay = (d) => {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

const daysUntil = (date) => Math.ceil((startOfDay(date) - startOfDay(new Date())) / DAY_MS);

const remindForCoach = async (settings) => {
  const threshold = settings.notifications.expiryReminderDays ?? 3;
  let notifiedCount = 0;

  const subscriptions = await Subscription.find({
    coach: settings.coach,
    status: { $in: ['Active', 'ExpiringSoon'] },
  }).populate('gym', 'name');

  for (const sub of subscriptions) {
    const daysLeft = daysUntil(sub.endDate);
    if (daysLeft < 0 || daysLeft > threshold) continue;

    const lastAlert = sub.lastExpiryAlertSentAt ? startOfDay(sub.lastExpiryAlertSentAt) : null;
    const today = startOfDay(new Date());
    if (lastAlert && lastAlert.getTime() === today.getTime()) continue;

    const { delivered } = await notifyCoach(settings, {
      event: 'expiryReminder',
      payload: {
        memberName: sub.memberName,
        sportType: sub.sportType,
        endDate: sub.endDate,
        daysLeft,
      },
    });

    if (delivered.length > 0) {
      sub.status = normalizeStatus(sub.endDate);
      sub.lastExpiryAlertSentAt = new Date();
      await sub.save({ validateBeforeSave: false });
      notifiedCount += 1;
    }
  }

  return notifiedCount;
};

export const runExpiryReminderJob = async () => {
  const settingsList = await CoachSettings.find({
    $or: [{ 'telegram.enabled': true }, { 'whatsapp.enabled': true }],
  });

  let notified = 0;
  for (const settings of settingsList) {
    try {
      notified += await remindForCoach(settings);
    } catch (error) {
      logger.error('Expiry reminder failed for coach', { coach: settings.coach, error: error.message });
    }
  }
  logger.info(`Expiry reminder job finished for ${settingsList.length} coaches (${notified} alerts)`);
  return notified;
};

export const startExpiryReminderCron = () => {
  const job = cron.schedule('0 8 * * *', async () => {
    logger.info('Running daily subscription expiry reminder job');
    await runExpiryReminderJob();
  });
  logger.info('Expiry reminder cron scheduled (daily 08:00)');
  return job;
};