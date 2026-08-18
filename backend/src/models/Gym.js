import mongoose from 'mongoose';

const SPORT_TYPES = ['Football', 'Bodybuilding', 'Boxing', 'Combat', 'Mixed'];

const gymSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Gym name is required'],
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    description: { type: String, trim: true, maxlength: 2000, default: '' },
    sportTypes: {
      type: [String],
      enum: SPORT_TYPES,
      default: [],
      index: true,
    },
    subscriptionPrices: {
      monthly: { type: Number, min: 0, default: 0 },
      quarterly: { type: Number, min: 0, default: 0 },
      yearly: { type: Number, min: 0, default: 0 },
    },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point', required: true },
      coordinates: {
        type: [Number],
        required: true,
        validate: {
          validator(v) {
            return v.length === 2 && v[0] >= -180 && v[0] <= 180 && v[1] >= -90 && v[1] <= 90;
          },
          message: 'Coordinates must be [longitude, latitude]',
        },
      },
    },
    address: { type: String, trim: true, maxlength: 300, default: '' },
    city: { type: String, trim: true, maxlength: 100, index: true },
    country: { type: String, trim: true, uppercase: true, maxlength: 2, default: 'DZ', index: true },
    contactPhone: {
      type: String,
      match: [/^\+?[0-9\s\-]{8,20}$/, 'Invalid phone format'],
    },
    coverImage: { type: String, default: null },
    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true, index: true },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  },
);

gymSchema.index({ location: '2dsphere' });
gymSchema.index({ city: 1, sportTypes: 1 });

export default mongoose.model('Gym', gymSchema);
