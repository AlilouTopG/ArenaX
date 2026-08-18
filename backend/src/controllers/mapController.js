import asyncHandler from '../utils/asyncHandler.js';
import { success } from '../utils/ApiResponse.js';
import Gym from '../models/Gym.js';
import { haversineDistanceKm, kmToMeters } from '../services/geoService.js';

export const nearByGyms = asyncHandler(async (req, res) => {
  const { lat, lng, radius = 10, sportType, maxMonthlyPrice, country, page = 1, limit = 20 } = req.query;

  const latitude = parseFloat(lat);
  const longitude = parseFloat(lng);

  const pipeline = [{ $geoNear: { near: { type: 'Point', coordinates: [longitude, latitude] }, distanceField: 'distanceMeters', maxDistance: kmToMeters(radius), spherical: true } }];

  const match = { isActive: true, isVerified: true };
  if (sportType) match.sportTypes = sportType;
  if (country) match.country = String(country).toUpperCase();
  if (maxMonthlyPrice) match['subscriptionPrices.monthly'] = { $lte: parseFloat(maxMonthlyPrice) };
  pipeline.push({ $match: match });

  const totalResult = await Gym.aggregate([...pipeline, { $count: 'total' }]).catch((error) => {
    if (error?.codeName === 'IndexNotFound' || /geo index/i.test(error?.message || '')) return [];
    throw error;
  });
  const total = totalResult[0]?.total || 0;

  pipeline.push({ $skip: (page - 1) * limit }, { $limit: limit });

  const gyms = await Gym.aggregate(pipeline).catch((error) => {
    if (error?.codeName === 'IndexNotFound' || /geo index/i.test(error?.message || '')) return [];
    throw error;
  });

  const mapped = gyms.map((g) => ({
    ...g,
    distanceKm: +(haversineDistanceKm(latitude, longitude, g.location.coordinates[1], g.location.coordinates[0])).toFixed(2),
    distanceMeters: Math.round(g.distanceMeters),
  }));

  return success(res, {
    message: 'Nearby gyms',
    data: { gyms: mapped },
    meta: { page, limit, total, totalPages: Math.ceil(total / limit), center: { lat: latitude, lng: longitude } },
  });
});

export const gymMapMarkers = asyncHandler(async (req, res) => {
  const { country, city } = req.query;
  const filter = { isActive: true, isVerified: true };
  if (country) filter.country = String(country).toUpperCase();
  if (city) filter.city = city;

  const gyms = await Gym.find(filter)
    .select('name sportTypes subscriptionPrices location city country coverImage');
  return success(res, { message: 'Map markers', data: { gyms } });
});