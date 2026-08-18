import asyncHandler from '../utils/asyncHandler.js';
import { success } from '../utils/ApiResponse.js';
import Event from '../models/Event.js';
import { ApiError } from '../utils/ApiError.js';

export const listEvents = asyncHandler(async (req, res) => {
  const { page = 1, limit = 12, sportType, upcoming } = req.query;

  const filter = { isPublished: true };
  if (sportType) filter.sportType = sportType;
  if (upcoming === 'true') filter.eventDate = { $gte: new Date() };

  const total = await Event.countDocuments(filter);
  const events = await Event.find(filter)
    .sort({ eventDate: 1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('gym', 'name city');

  return success(res, {
    message: 'Events list',
    data: { events },
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
});

export const getEventById = asyncHandler(async (req, res) => {
  const event = await Event.findOne({ _id: req.params.id, isPublished: true }).populate('gym', 'name city');
  if (!event) throw ApiError.notFound('Event not found');
  return success(res, { message: 'Event detail', data: { event } });
});

export const createEvent = asyncHandler(async (req, res) => {
  const event = await Event.create({
    ...req.body,
    createdBy: req.user._id,
  });
  return success(res, { statusCode: 201, message: 'Event created', data: { event } });
});

export const updateEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) throw ApiError.notFound('Event not found');
  if (req.user.role !== 'Admin' && String(event.createdBy) !== String(req.user._id)) {
    throw ApiError.forbidden('Only the creator or an admin can edit this event');
  }

  const allowed = ['title', 'description', 'sportType', 'location', 'gym', 'eventDate', 'entryFee', 'registrationUrl', 'isPublished'];
  for (const key of allowed) {
    if (req.body[key] !== undefined) event[key] = req.body[key];
  }
  await event.save();
  return success(res, { message: 'Event updated', data: { event } });
});

export const deleteEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) throw ApiError.notFound('Event not found');
  if (req.user.role !== 'Admin' && String(event.createdBy) !== String(req.user._id)) {
    throw ApiError.forbidden('Only the creator or an admin can delete this event');
  }
  await event.deleteOne();
  return success(res, { message: 'Event deleted', data: { deleted: true } });
});