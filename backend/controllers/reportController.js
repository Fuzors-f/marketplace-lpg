import Order from '../models/Order.js';
import Item from '../models/Item.js';

// @desc    Get best selling items report
// @route   GET /api/reports/best-sellers
// @access  Private (Admin only)
export const getBestSellers = async (req, res) => {
  try {
    const { startDate, endDate, limit = 10 } = req.query;

    // Build date filter
    const dateFilter = {
      status: { $nin: ['cancelled'] } // Exclude cancelled orders
    };
    
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) {
        dateFilter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        dateFilter.createdAt.$lte = endDateTime;
      }
    }

    // Aggregate from Order
    const bestSellers = await Order.aggregate([
      { $match: dateFilter },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.itemId',
          totalQuantitySold: { $sum: '$items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$items.quantity', '$items.priceAtPurchase'] } },
          transactionCount: { $sum: 1 }
        }
      },
      { $sort: { totalQuantitySold: -1 } },
      { $limit: parseInt(limit) },
      {
        $lookup: {
          from: 'items',
          localField: '_id',
          foreignField: '_id',
          as: 'itemDetails'
        }
      },
      { $unwind: { path: '$itemDetails', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          itemId: '$_id',
          name: { $ifNull: ['$itemDetails.name', 'Unknown'] },
          size: { $ifNull: ['$itemDetails.size', ''] },
          price: { $ifNull: ['$itemDetails.price', 0] },
          totalQuantitySold: 1,
          totalRevenue: 1,
          transactionCount: 1
        }
      }
    ]);

    res.status(200).json({
      success: true,
      count: bestSellers.length,
      data: bestSellers
    });
  } catch (error) {
    console.error('Get best sellers error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get sales report by date range
// @route   GET /api/reports/sales
// @access  Private (Admin only)
export const getSalesReport = async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'day' } = req.query;

    // Build date filter
    const dateFilter = {
      status: { $nin: ['cancelled'] }
    };
    
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) {
        dateFilter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        dateFilter.createdAt.$lte = endDateTime;
      }
    }

    // Determine grouping format based on groupBy parameter
    let dateFormat;
    switch (groupBy) {
      case 'month':
        dateFormat = { $dateToString: { format: '%Y-%m', date: '$createdAt' } };
        break;
      case 'week':
        dateFormat = { $dateToString: { format: '%Y-W%V', date: '$createdAt' } };
        break;
      case 'day':
      default:
        dateFormat = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
    }

    // Aggregate from Order
    const salesData = await Order.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: dateFormat,
          totalSales: { $sum: '$total' },
          transactionCount: { $sum: 1 },
          itemsSold: { $sum: { $sum: '$items.quantity' } }
        }
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          date: '$_id',
          totalSales: 1,
          transactionCount: 1,
          itemsSold: 1
        }
      }
    ]);

    // Calculate totals
    const totals = salesData.reduce((acc, curr) => {
      acc.totalSales += curr.totalSales;
      acc.transactionCount += curr.transactionCount;
      acc.itemsSold += curr.itemsSold;
      return acc;
    }, { totalSales: 0, transactionCount: 0, itemsSold: 0 });

    res.status(200).json({
      success: true,
      data: {
        salesByDate: salesData,
        totals
      }
    });
  } catch (error) {
    console.error('Get sales report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get revenue by payment method
// @route   GET /api/reports/revenue-by-payment
// @access  Private (Admin only)
export const getRevenueByPaymentMethod = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Build date filter
    const dateFilter = {
      status: { $nin: ['cancelled'] }
    };
    
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) {
        dateFilter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        dateFilter.createdAt.$lte = endDateTime;
      }
    }

    const revenueByPayment = await Order.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$paymentMethodId',
          totalRevenue: { $sum: '$total' },
          transactionCount: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'paymentmethods',
          localField: '_id',
          foreignField: '_id',
          as: 'paymentMethod'
        }
      },
      { $unwind: { path: '$paymentMethod', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          paymentMethodId: '$_id',
          name: { $ifNull: ['$paymentMethod.name', 'Unknown'] },
          type: { $ifNull: ['$paymentMethod.type', 'unknown'] },
          totalRevenue: 1,
          transactionCount: 1
        }
      },
      { $sort: { totalRevenue: -1 } }
    ]);

    res.status(200).json({
      success: true,
      data: revenueByPayment
    });
  } catch (error) {
    console.error('Get revenue by payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
