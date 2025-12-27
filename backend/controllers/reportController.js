import Transaction from '../models/Transaction.js';
import Item from '../models/Item.js';

// @desc    Get best selling items report
// @route   GET /api/reports/best-sellers
// @access  Private (Admin only)
export const getBestSellers = async (req, res) => {
  try {
    const { startDate, endDate, limit = 10 } = req.query;

    // Build date filter
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) {
        dateFilter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        dateFilter.createdAt.$lte = new Date(endDate);
      }
    }

    // Aggregate to get best selling items
    const bestSellers = await Transaction.aggregate([
      // Filter by date and paid status
      { 
        $match: { 
          status: 'PAID',
          ...dateFilter 
        } 
      },
      // Unwind items array
      { $unwind: '$items' },
      // Group by itemId and sum quantities
      {
        $group: {
          _id: '$items.itemId',
          totalQuantitySold: { $sum: '$items.qty' },
          totalRevenue: { $sum: '$items.subtotal' },
          transactionCount: { $sum: 1 }
        }
      },
      // Sort by quantity sold descending
      { $sort: { totalQuantitySold: -1 } },
      // Limit results
      { $limit: parseInt(limit) },
      // Lookup item details
      {
        $lookup: {
          from: 'items',
          localField: '_id',
          foreignField: '_id',
          as: 'itemDetails'
        }
      },
      // Unwind item details
      { $unwind: '$itemDetails' },
      // Project final shape
      {
        $project: {
          _id: 1,
          itemId: '$_id',
          name: '$itemDetails.name',
          size: '$itemDetails.size',
          price: '$itemDetails.price',
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
    const dateFilter = { status: 'PAID' };
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

    // Aggregate sales by date
    const salesData = await Transaction.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: dateFormat,
          totalSales: { $sum: '$totalAmount' },
          transactionCount: { $sum: 1 },
          itemsSold: { $sum: { $sum: '$items.qty' } }
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
    const dateFilter = { status: 'PAID' };
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

    const revenueByPayment = await Transaction.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$paymentMethodId',
          totalRevenue: { $sum: '$totalAmount' },
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
