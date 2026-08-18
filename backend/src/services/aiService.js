import axios from 'axios';
import env from '../config/env.js';
import logger from '../utils/logger.js';

const CATEGORIES = ['Football', 'Bodybuilding', 'Boxing & Combat'];

export const classifyAndRewrite = async (title, description) => {
  if (!env.OPENAI_API_KEY) {
    return {
      category: 'Football',
      title: `عاجل | ${title}`,
      summary: description.slice(0, 300),
      usedAi: false,
    };
  }

  try {
    const { data } = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: env.AI_MODEL,
        temperature: 0.6,
        messages: [
          {
            role: 'system',
            content:
              'أنت محرر أخبار رياضية باللغة العربية. أعد صياغة الخبر بأسلوب عربي احترافي ووضع عنوان جذاب وإنشاء ملخص عاجل من 1-2 جمل. صنّف الخبر في واحدة فقط من الفئات: Football أو Bodybuilding أو Boxing & Combat. أجب بتنسيق JSON فقط: {"category": "...", "title": "...", "summary": "..."}.',
          },
          { role: 'user', content: `العنوان الأصلي: ${title}\nالنص: ${description}` },
        ],
        response_format: { type: 'json_object' },
      },
      { timeout: 20000 },
    );

    const content = data?.choices?.[0]?.message?.content;
    if (!content) throw new Error('Empty AI response');

    const parsed = JSON.parse(content);
    return {
      category: CATEGORIES.includes(parsed.category) ? parsed.category : 'Football',
      title: (parsed.title || title).slice(0, 300),
      summary: (parsed.summary || description).slice(0, 1500),
      usedAi: true,
    };
  } catch (error) {
    logger.error('AI classification failed', { error: error.message });
    return { category: 'Football', title, summary: description.slice(0, 300), usedAi: false };
  }
};