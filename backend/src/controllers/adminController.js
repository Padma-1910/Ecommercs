const { Order } = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');

// @desc    Get dashboard statistics for admin
// @route   GET /api/admin/stats
// @access  Private/Admin
exports.getStats = async (req, res, next) => {
  try {
    const totalOrders = await Order.countDocuments();
    const totalCustomers = await User.countDocuments({ role: 'customer' });
    const totalProducts = await Product.countDocuments();

    const pendingOrders = await Order.countDocuments({
      status: { $in: ['Pending', 'Confirmed', 'Processing'] },
    });
    const deliveredOrders = await Order.countDocuments({ status: 'Delivered' });

    // Revenue calculation
    const revenueStats = await Order.aggregate([
      { $match: { isPaid: true } },
      { $group: { _id: null, totalRevenue: { $sum: '$totalPrice' } } },
    ]);
    const revenue = revenueStats.length > 0 ? Math.round(revenueStats[0].totalRevenue * 100) / 100 : 0;

    // Low stock items
    const lowStockProducts = await Product.find({ countInStock: { $lte: 10 } })
      .select('name brand countInStock price images')
      .limit(6);

    // Recent orders
    const recentOrders = await Order.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(6);

    // Sales by day (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const dailySales = await Order.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo }, isPaid: true } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          totalSales: { $sum: '$totalPrice' },
          orderCount: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Monthly sales (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlySales = await Order.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo }, isPaid: true } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          totalSales: { $sum: '$totalPrice' },
          orderCount: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Top selling products
    const bestSellers = await Product.find()
      .sort({ numReviews: -1, rating: -1 })
      .limit(5)
      .select('name brand price countInStock rating numReviews images');

    res.status(200).json({
      success: true,
      stats: {
        totalRevenue: revenue,
        totalOrders,
        totalCustomers,
        totalProducts,
        pendingOrders,
        deliveredOrders,
        lowStockCount: lowStockProducts.length,
      },
      lowStockProducts,
      recentOrders,
      dailySales,
      monthlySales,
      bestSellers,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all customers with order counts and spent summary
// @route   GET /api/admin/customers
// @access  Private/Admin
exports.getCustomers = async (req, res, next) => {
  try {
    const { search } = req.query;
    const query = { role: 'customer' };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const customers = await User.find(query).sort({ createdAt: -1 });

    // Enrich with order metrics
    const enriched = await Promise.all(
      customers.map(async (c) => {
        const orderCount = await Order.countDocuments({ user: c._id });
        const orders = await Order.find({ user: c._id, isPaid: true });
        const totalSpent = orders.reduce((sum, o) => sum + o.totalPrice, 0);

        return {
          _id: c._id,
          name: c.name,
          email: c.email,
          phone: c.phone,
          status: c.status,
          avatar: c.avatar,
          createdAt: c.createdAt,
          orderCount,
          totalSpent: Math.round(totalSpent * 100) / 100,
        };
      })
    );

    res.status(200).json({
      success: true,
      count: enriched.length,
      customers: enriched,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update customer status (Suspend / Activate)
// @route   PUT /api/admin/customers/:id/status
// @access  Private/Admin
exports.updateCustomerStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['active', 'suspended'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    user.status = status;
    await user.save();

    res.status(200).json({
      success: true,
      message: `Customer account has been ${status === 'suspended' ? 'suspended' : 'activated'}`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        status: user.status,
      },
    });
  } catch (err) {
    next(err);
  }
};
