import mongoose from 'mongoose';

const SUBSCRIPTION_STATUSES = ['Active', 'ExpiringSoon', 'Expired'];
const PAYMENT_METHODS = ['Cash', 'Card', 'Online', 'Other'];

const subscriptionSchema = new mongoose.Schema(
  {
    gym: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Gym',
      required: true,
      index: true,
    },
    coach: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    member: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    memberName: {
      type: String,
      required: [true, 'Member name is required'],
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    memberPhone: {
      type: String,
      match: [/^\+?[0-9\s\-]{8,20}$/, 'Invalid phone format'],
    },
    sportType: {
      type: String,
      enum: ['Football', 'Bodybuilding', 'Boxing', 'Combat', 'Mixed'],
      required: [true, 'Sport type is required'],
      index: true,
    },
    amountPaid: {
      type: Number,
      required: [true, 'Paid amount is required'],
      min: [0, 'Amount cannot be negative'],
    },
    paymentMethod: {
      type: String,
      enum: PAYMENT_METHODS,
      default: 'Cash',
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true, index: true },
    status: {
      type: String,
      enum: SUBSCRIPTION_STATUSES,
      default: 'Active',
      index: true,
    },
    notes: { type: String, trim: true, maxlength: 500 },
    lastExpiryAlertSentAt: { type: Date, default: null },
    renewedFrom: { type: mongoose.Schema.Types.ObjectId, ref: 'Subscription', default: null },
  },
  { timestamps: true },
);

subscriptionSchema.index({ coach: 1, endDate: 1, status: 1 });
subscriptionSchema.index({ gym: 1, createdAt: -1 });

subscriptionSchema.pre('validate', function preValidate(next) {
  if (this.startDate && this.endDate && this.endDate <= this.startDate) {
    return next(new Error('endDate must be after startDate'));
  }
  return next();
});

export default mongoose.model('Subscription', subscriptionSchema);
