const mongoose = require('mongoose');

const AddressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    fullName: {
      type: String,
      required: [true, 'Please provide full name'],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Please provide contact phone'],
      trim: true,
    },
    addressLine1: {
      type: String,
      required: [true, 'Please provide street address'],
      trim: true,
    },
    addressLine2: {
      type: String,
      default: '',
      trim: true,
    },
    city: {
      type: String,
      required: [true, 'Please provide city'],
      trim: true,
    },
    state: {
      type: String,
      required: [true, 'Please provide state / province'],
      trim: true,
    },
    postalCode: {
      type: String,
      required: [true, 'Please provide postal / ZIP code'],
      trim: true,
    },
    country: {
      type: String,
      required: true,
      default: 'United States',
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// If isDefault set to true, unset isDefault on other addresses of the user
AddressSchema.pre('save', async function (next) {
  if (this.isDefault) {
    await this.constructor.updateMany(
      { user: this.user, _id: { $ne: this._id } },
      { isDefault: false }
    );
  }
  next();
});

module.exports = mongoose.model('Address', AddressSchema);
