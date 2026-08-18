import asyncHandler from '../utils/asyncHandler.js';
import { success } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import News from '../models/News.js';

export const listNews = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, category } = req.query;
  const filter = { isPublished: true };
  if (category) filter.category = category;

  const total = await News.countDocuments(filter);
  const news = await News.find(filter)
    .sort({ publishedAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .select('-originalContentHash');

  return success(res, {
    message: 'News list',
    data: { news },
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
});

export const getNewsById = asyncHandler(async (req, res) => {
  const news = await News.findOne({ _id: req.params.id, isPublished: true }).select('-originalContentHash');
  if (!news) throw ApiError.notFound('News article not found');
  return success(res, { message: 'News detail', data: { news } });
});

export const getCategories = asyncHandler(async (_req, res) => {
  return success(res, {
    message: 'News categories',
    data: { categories: ['Football', 'Bodybuilding', 'Boxing & Combat'] },
  });
});