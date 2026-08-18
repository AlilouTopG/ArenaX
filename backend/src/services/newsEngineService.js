import crypto from 'crypto';
import env from '../config/env.js';
import logger from '../utils/logger.js';
import News from '../models/News.js';
import { fetchRssItems } from './newsService.js';
import { classifyAndRewrite } from './aiService.js';

const hashContent = (text) => crypto.createHash('sha256').update(text).digest('hex');

export const processRssItem = async (item, source) => {
  const hash = hashContent(`${item.title}|${item.link}`);
  const exists = await News.findOne({ originalContentHash: hash });
  if (exists) return null;

  const { category, title, summary, usedAi } = await classifyAndRewrite(item.title, item.description);

  const doc = await News.create({
    title,
    summary,
    content: item.description,
    category,
    source,
    sourceUrl: item.link,
    originalTitle: item.title,
    originalContentHash: hash,
    aiProcessed: usedAi,
    isPublished: true,
    publishedAt: new Date(item.pubDate || Date.now()),
  });

  return doc;
};

export const runNewsEngine = async () => {
  if (env.NEWS_SOURCES.length === 0) {
    logger.warn('No NEWS_SOURCES configured, skipping news fetch');
    return 0;
  }

  let stored = 0;
  for (const source of env.NEWS_SOURCES) {
    const items = await fetchRssItems(source);
    for (const item of items.slice(0, 10)) {
      try {
        const saved = await processRssItem(item, source);
        if (saved) stored += 1;
      } catch (error) {
        logger.warn('Failed to store news item', { error: error.message });
      }
    }
  }
  logger.info(`News engine stored ${stored} new articles`);
  return stored;
};