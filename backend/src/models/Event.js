import mongoose from 'mongoose';

const EVENT_SPORTS = ['Football', 'Bodybuilding', 'Boxing', 'Combat', 'Mixed', 'Tennis', 'Basketball', 'Other'];

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true,
      minlength: 3,
      maxlength: 150,
      index: true,
    },
    description: { type: String, trim: true, maxlength: 2000, default: '' },
    sportType: {
      type: String,
      enum: EVENT_SPORTS,
      required: [true, 'Sport type is required'],
      index: true,
    },
    location: {
      type: String,
      required: [true, 'Event location is required'],
      trim: true,
      maxlength: 200,
    },
    gym: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Gym',
      default: null,
      index: true,
    },
    eventDate: {
      type: Date,
      required: [true, 'Event date is required'],
      index: true,
    },
    entryFee: {
      type: Number,
      min: [0, 'Entry fee cannot be negative'],
      default: 0,
    },
    registrationUrl: {
      type: String,
      trim: true,
      maxlength: 500,
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    isPublished: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

eventSchema.index({ sportType: 1, eventDate: 1 });
eventSchema.index({ eventDate: -1 });

export default mongoose.model('Event', eventSchema);