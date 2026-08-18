import Parser from 'rss-parser';
import logger from '../utils/logger.js';

const parser = new Parser({
  timeout: 15000,
  headers: { 'User-Agent': 'ArenaX-NewsBot/1.0' },
});

export const fetchRssItems = async (feedUrl) => {
  try {
    const feed = await parser.parseURL(feedUrl);
    return feed.items.map((item) => ({
      title: item.title?.trim() || '',
      link: item.link || '',
      description: (item.contentSnippet || item.content || item.summary || '').trim(),
      pubDate: item.isoDate || item.pubDate || null,
    })).filter((i) => i.title);
  } catch (error) {
    logger.warn(`RSS fetch failed: ${feedUrl}`, { error: error.message });
    return [];
  }
};