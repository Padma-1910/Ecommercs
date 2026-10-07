const Address = require('../models/Address');

// @desc    Get all user addresses
// @route   GET /api/addresses
// @access  Private
exports.getAddresses = async (req, res, next) => {
  try {
    const addresses = await Address.find({ user: req.user.id }).sort({ isDefault: -1, createdAt: -1 });
    res.status(200).json({
      success: true,
      count: addresses.length,
      addresses,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Add address
// @route   POST /api/addresses
// @access  Private
exports.addAddress = async (req, res, next) => {
  try {
    const count = await Address.countDocuments({ user: req.user.id });
    const isFirst = count === 0;

    const address = await Address.create({
      user: req.user.id,
      fullName: req.body.fullName,
      phone: req.body.phone,
      addressLine1: req.body.addressLine1,
      addressLine2: req.body.addressLine2 || '',
      city: req.body.city,
      state: req.body.state,
      postalCode: req.body.postalCode,
      country: req.body.country || 'United States',
      isDefault: req.body.isDefault !== undefined ? req.body.isDefault : isFirst,
    });

    res.status(201).json({
      success: true,
      message: 'Address added successfully',
      address,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update address
// @route   PUT /api/addresses/:id
// @access  Private
exports.updateAddress = async (req, res, next) => {
  try {
    let address = await Address.findById(req.params.id);

    if (!address) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }

    if (address.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (req.body.isDefault) {
      await Address.updateMany(
        { user: req.user.id, _id: { $ne: req.params.id } },
        { isDefault: false }
      );
    }

    address = await Address.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: 'Address updated successfully',
      address,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete address
// @route   DELETE /api/addresses/:id
// @access  Private
exports.deleteAddress = async (req, res, next) => {
  try {
    const address = await Address.findById(req.params.id);

    if (!address) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }

    if (address.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await address.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Address deleted successfully',
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Set address as default
// @route   PUT /api/addresses/:id/default
// @access  Private
exports.setDefaultAddress = async (req, res, next) => {
  try {
    const address = await Address.findById(req.params.id);

    if (!address) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }

    if (address.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await Address.updateMany({ user: req.user.id }, { isDefault: false });
    address.isDefault = true;
    await address.save();

    res.status(200).json({
      success: true,
      message: 'Default address updated',
      address,
    });
  } catch (err) {
    next(err);
  }
};
