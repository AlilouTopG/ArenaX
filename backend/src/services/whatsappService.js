import axios from 'axios';
import logger from '../utils/logger.js';

export const sendWhatsAppMessage = async (webhookUrl, text) => {
  if (!webhookUrl) return false;

  try {
    const { data } = await axios.post(
      webhookUrl,
      { text, source: 'ArenaX' },
      { timeout: 10000, headers: { 'Content-Type': 'application/json' } },
    );
    return data?.status === 'ok' || data?.success === true || true;
  } catch (error) {
    logger.error('WhatsApp send failed', { webhookUrl, error: error.message });
    return false;
  }
};