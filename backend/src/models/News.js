import mongoose from 'mongoose';

const NEWS_CATEGORIES = ['Football', 'Bodybuilding', 'Boxing & Combat'];

const newsSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: 300,
      index: true,
    },
    summary: { type: String, trim: true, maxlength: 1500, default: '' },
    content: { type: String, trim: true, maxlength: 20000, default: '' },
    category: {
      type: String,
      enum: NEWS_CATEGORIES,
      required: true,
      index: true,
    },
    imageUrl: { type: String, default: null },
    source: { type: String, trim: true, maxlength: 150, default: '' },
    sourceUrl: { type: String, trim: true, maxlength: 500 },
    originalTitle: { type: String, trim: true, maxlength: 500, default: '' },
    originalContentHash: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    language: { type: String, default: 'ar', enum: ['ar', 'en'] },
    aiProcessed: { type: Boolean, default: false },
    isPublished: { type: Boolean, default: false, index: true },
    publishedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true },
);

newsSchema.index({ category: 1, publishedAt: -1 });

export default mongoose.model('News', newsSchema);
