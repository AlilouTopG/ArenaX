import logger from '../utils/logger.js';
import { sendTelegramMessage } from './telegramService.js';
import { sendWhatsAppMessage } from './whatsappService.js';

const buildMessage = (event, payload) => {
  const fmtDate = (d) => new Date(d).toLocaleDateString('ar-EG');
  if (event === 'newSubscription') {
    return [
      'ArenaX | اشتراك جديد',
      `العضو: ${payload.memberName}`,
      `الصالة: ${payload.gymName || '-'}`,
      `الرياضة: ${payload.sportType}`,
      `المبلغ: ${payload.amountPaid}`,
      `البداية: ${fmtDate(payload.startDate)}`,
      `الانتهاء: ${fmtDate(payload.endDate)}`,
    ].join('\n');
  }
  if (event === 'renewal') {
    return [
      'ArenaX | تجديد اشتراك',
      `العضو: ${payload.memberName}`,
      `الصالة: ${payload.gymName || '-'}`,
      `الرياضة: ${payload.sportType}`,
      `المبلغ: ${payload.amountPaid}`,
      `انتهاء جديد: ${fmtDate(payload.endDate)}`,
    ].join('\n');
  }
  if (event === 'expiryReminder') {
    return [
      'ArenaX | تنبيه انتهاء اشتراك',
      `العضو: ${payload.memberName}`,
      `الرياضة: ${payload.sportType}`,
      `ينتهي الاشتراك بعد ${payload.daysLeft} يوم/أيام (${fmtDate(payload.endDate)})`,
    ].join('\n');
  }
  return `ArenaX notification: ${event}`;
};

export const notifyCoach = async (settings, { event, payload }) => {
  if (!settings) {
    logger.debug('No coach settings, skipping notification');
    return { delivered: [] };
  }

  const delivered = [];

  if (settings.telegram?.enabled && settings.telegram.chatId) {
    const ok = await sendTelegramMessage(settings.telegram.chatId, buildMessage(event, payload));
    if (ok) delivered.push('telegram');
  }

  if (settings.whatsapp?.enabled && settings.whatsapp.webhookUrl) {
    const ok = await sendWhatsAppMessage(settings.whatsapp.webhookUrl, buildMessage(event, payload));
    if (ok) delivered.push('whatsapp');
  }

  return { delivered };
};