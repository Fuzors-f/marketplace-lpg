import Stock from '../models/Stock.js';
import StockHistory from '../models/StockHistory.js';
import Item from '../models/Item.js';

// Helper function to get current stock for an item
const getCurrentStockForItem = async (itemId) => {
  const stocks = await Stock.find({ itemId });
  let currentStock = 0;
  stocks.forEach(stock => {
    if (stock.type === 'IN') {
      currentStock += stock.quantity;
    } else {
      currentStock -= stock.quantity;
    }
  });
  return currentStock;
};

// @desc    Get all stock records
// @route   GET /api/stock
// @access  Private
export const getAllStock = async (req, res) => {
  try {
    const stocks = await Stock.find()
      .populate('itemId', 'name size')
      .sort({ date: -1 });

    res.status(200).json({
      success: true,
      count: stocks.length,
      data: stocks
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get stock for specific item
// @route   GET /api/stock/item/:itemId
// @access  Private
export const getItemStock = async (req, res) => {
  try {
    const stocks = await Stock.find({ itemId: req.params.itemId })
      .sort({ date: -1 });

    // Calculate current stock
    let currentStock = 0;
    stocks.forEach(stock => {
      if (stock.type === 'IN') {
        currentStock += stock.quantity;
      } else {
        currentStock -= stock.quantity;
      }
    });

    res.status(200).json({
      success: true,
      currentStock,
      history: stocks
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Add stock record
// @route   POST /api/stock
// @access  Private
export const addStock = async (req, res) => {
  try {
    const { itemId, quantity, type, note } = req.body;

    // Validate
    if (!itemId || !quantity || !type) {
      return res.status(400).json({
        success: false,
        message: 'Please provide itemId, quantity, and type'
      });
    }

    // Check if item exists
    const item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    const stock = await Stock.create({
      itemId,
      quantity,
      type,
      note: note || ''
    });

    // Create stock history record
    const previousStock = await getCurrentStockForItem(itemId) - (type === 'IN' ? quantity : -quantity);
    const newStock = await getCurrentStockForItem(itemId);
    
    await StockHistory.create({
      itemId,
      type,
      quantity,
      reason: req.body.reason || (type === 'IN' ? 'restock' : 'sold'),
      note: note || '',
      previousStock: previousStock,
      newStock: newStock,
      performedBy: {
        userId: req.admin?._id || req.user?._id,
        userType: req.admin ? 'Admin' : 'User',
        name: req.admin?.username || req.user?.name || 'System'
      },
      referenceType: 'manual'
    });

    res.status(201).json({
      success: true,
      data: stock
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get current stock summary for all items
// @route   GET /api/stock/summary
// @access  Private
export const getStockSummary = async (req, res) => {
  try {
    const items = await Item.find();
    const summary = [];

    for (const item of items) {
      const stocks = await Stock.find({ itemId: item._id });
      
      let currentStock = 0;
      stocks.forEach(stock => {
        if (stock.type === 'IN') {
          currentStock += stock.quantity;
        } else {
          currentStock -= stock.quantity;
        }
      });

      summary.push({
        itemId: item._id,
        name: item.name,
        size: item.size,
        currentStock
      });
    }

    res.status(200).json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get dashboard statistics
// @route   GET /api/stock/dashboard-stats
// @access  Private (Admin only)
export const getDashboardStats = async (req, res) => {
  try {
    const Order = (await import('../models/Order.js')).default;
    const User = (await import('../models/User.js')).default;

    // Get items statistics
    const items = await Item.find();
    const totalItems = items.length;
    const activeItems = items.filter(item => item.status === 'active').length;

    // Get stock statistics
    const stockSummary = [];
    for (const item of items) {
      const stocks = await Stock.find({ itemId: item._id });
      let currentStock = 0;
      stocks.forEach(stock => {
        if (stock.type === 'IN') {
          currentStock += stock.quantity;
        } else {
          currentStock -= stock.quantity;
        }
      });
      stockSummary.push({ itemId: item._id, currentStock });
    }
    const totalStock = stockSummary.reduce((sum, item) => sum + item.currentStock, 0);
    const lowStock = stockSummary.filter(item => item.currentStock < 10).length;

    // Get user statistics
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ status: 'active' });

    // Get order statistics
    const totalOrders = await Order.countDocuments();
    const pendingOrders = await Order.countDocuments({ status: 'pending' });
    const confirmedOrders = await Order.countDocuments({ status: 'confirmed' });
    const processingOrders = await Order.countDocuments({ status: 'processing' });
    const shippedOrders = await Order.countDocuments({ status: 'shipped' });
    const deliveredOrders = await Order.countDocuments({ status: 'delivered' });
    const cancelledOrders = await Order.countDocuments({ status: 'cancelled' });

    // Get revenue from non-cancelled orders
    const revenueResult = await Order.aggregate([
      { $match: { status: { $nin: ['cancelled'] } } },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]);
    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

    // Get today's statistics
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayOrders = await Order.countDocuments({
      createdAt: { $gte: today }
    });

    const todayRevenueResult = await Order.aggregate([
      { $match: { status: { $nin: ['cancelled'] }, createdAt: { $gte: today } } },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]);
    const todayRevenue = todayRevenueResult.length > 0 ? todayRevenueResult[0].total : 0;

    // Get this month's statistics
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthlyRevenueResult = await Order.aggregate([
      { $match: { status: { $nin: ['cancelled'] }, createdAt: { $gte: firstDayOfMonth } } },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]);
    const monthlyRevenue = monthlyRevenueResult.length > 0 ? monthlyRevenueResult[0].total : 0;

    res.status(200).json({
      success: true,
      data: {
        items: {
          total: totalItems,
          active: activeItems
        },
        stock: {
          total: totalStock,
          lowStock: lowStock
        },
        users: {
          total: totalUsers,
          active: activeUsers
        },
        transactions: {
          total: totalOrders,
          paid: deliveredOrders + confirmedOrders + processingOrders + shippedOrders,
          unpaid: 0,
          pending: pendingOrders
        },
        orders: {
          total: totalOrders,
          pending: pendingOrders,
          confirmed: confirmedOrders,
          processing: processingOrders,
          shipped: shippedOrders,
          delivered: deliveredOrders,
          cancelled: cancelledOrders
        },
        revenue: {
          total: totalRevenue,
          today: todayRevenue,
          monthly: monthlyRevenue
        },
        today: {
          transactions: todayOrders,
          revenue: todayRevenue
        }
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get stock history for specific item
// @route   GET /api/stock/history/:itemId
// @access  Private
export const getStockHistory = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    // Check if item exists
    const item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    // Get current stock
    const currentStock = await getCurrentStockForItem(itemId);

    // Get stock history with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const history = await StockHistory.find({ itemId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await StockHistory.countDocuments({ itemId });

    // Get statistics
    const stats = await StockHistory.aggregate([
      { $match: { itemId: item._id } },
      {
        $group: {
          _id: '$reason',
          totalQuantity: { $sum: '$quantity' },
          count: { $sum: 1 }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        item: {
          _id: item._id,
          name: item.name,
          size: item.size,
          price: item.price,
          status: item.status
        },
        currentStock,
        history,
        stats,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get stock history error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Add stock with detailed reason
// @route   POST /api/stock/add-with-history
// @access  Private
export const addStockWithHistory = async (req, res) => {
  try {
    const { itemId, quantity, type, reason, note } = req.body;

    // Validate
    if (!itemId || !quantity || !type || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Please provide itemId, quantity, type, and reason'
      });
    }

    // Check if item exists
    const item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    // Get current stock before change
    const previousStock = await getCurrentStockForItem(itemId);

    // Validate OUT doesn't exceed current stock
    if (type === 'OUT' && quantity > previousStock) {
      return res.status(400).json({
        success: false,
        message: `Insufficient stock. Current: ${previousStock}, Requested: ${quantity}`
      });
    }

    // Create stock record
    const stock = await Stock.create({
      itemId,
      quantity,
      type,
      note: note || ''
    });

    // Calculate new stock
    const newStock = type === 'IN' ? previousStock + quantity : previousStock - quantity;

    // Create stock history record
    await StockHistory.create({
      itemId,
      type,
      quantity,
      reason,
      note: note || '',
      previousStock,
      newStock,
      performedBy: {
        userId: req.admin?._id || req.user?._id,
        userType: req.admin ? 'Admin' : 'User',
        name: req.admin?.username || req.user?.name || 'System'
      },
      referenceType: 'manual'
    });

    res.status(201).json({
      success: true,
      data: {
        stock,
        previousStock,
        newStock
      }
    });
  } catch (error) {
    console.error('Add stock with history error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
