import mongoose from 'mongoose';

const coachSettingsSchema = new mongoose.Schema(
  {
    coach: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    telegram: {
      enabled: { type: Boolean, default: false },
      chatId: { type: String, trim: true, maxlength: 64 },
      verifiedAt: { type: Date, default: null },
    },
    whatsapp: {
      enabled: { type: Boolean, default: false },
      phone: {
        type: String,
        match: [/^\+?[0-9\s\-]{8,20}$/, 'Invalid phone format'],
      },
      webhookUrl: { type: String, trim: true, maxlength: 500 },
      verifiedAt: { type: Date, default: null },
    },
    notifications: {
      onNewSubscription: { type: Boolean, default: true },
      onRenewal: { type: Boolean, default: true },
      expiryReminderDays: { type: Number, default: 3, min: 1, max: 14 },
    },
  },
  { timestamps: true },
);

export default mongoose.model('CoachSettings', coachSettingsSchema);
