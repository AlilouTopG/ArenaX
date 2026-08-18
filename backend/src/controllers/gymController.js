import asyncHandler from '../utils/asyncHandler.js';
import { success } from '../utils/ApiResponse.js';
import Gym from '../models/Gym.js';
import { ApiError } from '../utils/ApiError.js';

export const createGym = asyncHandler(async (req, res) => {
  const { name, description, sportTypes, subscriptionPrices, location, address, city, country, contactPhone } = req.body;

  const existing = await Gym.findOne({ owner: req.user._id });
  if (existing && req.user.role !== 'Admin') {
    throw ApiError.conflict('Coach already owns a gym');
  }

  const gym = await Gym.create({
    owner: req.user._id,
    name,
    description,
    sportTypes,
    subscriptionPrices,
    location,
    address,
    city,
    country,
    contactPhone,
  });

  return success(res, { statusCode: 201, message: 'Gym created', data: { gym } });
});

export const getMyGym = asyncHandler(async (req, res) => {
  const gym = await Gym.findOne({ owner: req.user._id });
  if (!gym) throw ApiError.notFound('No gym found for this coach');
  return success(res, { message: 'My gym', data: { gym } });
});

export const updateGym = asyncHandler(async (req, res) => {
  const gym = await Gym.findOne({ owner: req.user._id });
  if (!gym) throw ApiError.notFound('Gym not found');

  const allowed = ['name', 'description', 'sportTypes', 'subscriptionPrices', 'location', 'address', 'city', 'country', 'contactPhone', 'coverImage'];
  for (const key of allowed) {
    if (req.body[key] !== undefined) gym[key] = req.body[key];
  }
  await gym.save();

  return success(res, { message: 'Gym updated', data: { gym } });
});

export const listGyms = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, city, sportType } = req.query;
  const filter = { isActive: true };
  if (city) filter.city = city;
  if (sportType) filter.sportTypes = sportType;

  const total = await Gym.countDocuments(filter);
  const gyms = await Gym.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  return success(res, {
    message: 'Gyms list',
    data: { gyms },
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
});

export const getGymById = asyncHandler(async (req, res) => {
  const gym = await Gym.findById(req.params.id);
  if (!gym) throw ApiError.notFound('Gym not found');
  return success(res, { message: 'Gym detail', data: { gym } });
});

export const verifyGym = asyncHandler(async (req, res) => {
  const gym = await Gym.findByIdAndUpdate(req.params.id, { isVerified: true }, { new: true });
  if (!gym) throw ApiError.notFound('Gym not found');
  return success(res, { message: 'Gym verified', data: { gym } });
});