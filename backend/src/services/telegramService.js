import axios from 'axios';
import env from '../config/env.js';
import logger from '../utils/logger.js';

export const sendTelegramMessage = async (chatId, text) => {
  const token = env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    logger.debug('TELEGRAM_BOT_TOKEN not set, skipping');
    return false;
  }

  try {
    const { data } = await axios.post(
      `https://api.telegram.org/bot${token}/sendMessage`,
      { chat_id: chatId, text, parse_mode: 'HTML' },
      { timeout: 10000 },
    );
    return data?.ok === true;
  } catch (error) {
    logger.error('Telegram send failed', { chatId, error: error.message });
    return false;
  }
};

export const getTelegramChatId = async (authToken) => {
  try {
    const { data } = await axios.get(`https://api.telegram.org/bot${authToken}/getUpdates`, { timeout: 10000 });
    return data?.result?.[0]?.message?.chat?.id ?? null;
  } catch (error) {
    logger.error('Telegram getUpdates failed', { error: error.message });
    return null;
  }
};