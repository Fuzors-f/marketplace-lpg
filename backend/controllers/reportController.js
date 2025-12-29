import Order from '../models/Order.js';
import Item from '../models/Item.js';

// @desc    Test endpoint
// @route   GET /api/reports/test-simple
// @access  Public
export const testSimple = async (req, res) => {
  try {
    const orderCount = await Order.countDocuments();
    
    // Test simple aggregation
    const simpleAgg = await Order.aggregate([
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalValue: { $sum: '$total' }
        }
      }
    ]);
    
    res.json({
      success: true,
      message: 'Reports API working',
      orderCount,
      aggregation: simpleAgg[0] || { totalOrders: 0, totalValue: 0 }
    });
  } catch (error) {
    console.error('Test error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get best selling items report
// @route   GET /api/reports/best-sellers
// @access  Private (Admin only)
export const getBestSellers = async (req, res) => {
  try {
    console.log('=== BEST SELLERS API CALLED ===');
    console.log('Query params:', req.query);
    
    const { startDate, endDate, limit = 10 } = req.query;

    // Build date filter - include all orders except cancelled
    const dateFilter = {
      status: { $in: ['pending', 'confirmed', 'processing', 'shipped', 'delivered'] }
    };
    
    console.log('Best sellers date filter:', dateFilter);
    
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

    console.log('Final filter:', dateFilter);

    // Count total orders for debugging
    const totalOrders = await Order.countDocuments(dateFilter);
    console.log('Total orders found:', totalOrders);

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
    console.error('=== BEST SELLERS ERROR ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('===========================');
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get sales report by date range
// @route   GET /api/reports/sales
// @access  Private (Admin only)
export const getSalesReport = async (req, res) => {
  try {
    console.log('=== SALES REPORT API CALLED ===');
    console.log('Query params:', req.query);
    
    const { startDate, endDate, groupBy = 'day' } = req.query;

    // Build date filter - include all orders except cancelled
    const dateFilter = {
      status: { $in: ['pending', 'confirmed', 'processing', 'shipped', 'delivered'] }
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

    console.log('Sales report filter:', dateFilter);

    // Determine grouping format based on groupBy parameter
    let dateFormat;
    switch (groupBy) {
      case 'month':
        dateFormat = {
          $dateToString: { format: '%Y-%m', date: '$createdAt' }
        };
        break;
      case 'week':
        dateFormat = {
          $dateToString: { format: '%Y-%U', date: '$createdAt' }
        };
        break;
      case 'day':
      default:
        dateFormat = {
          $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
        };
    }

    console.log('Date format:', dateFormat);

    // Simple aggregation first - just get basic data
    const salesData = await Order.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: dateFormat,
          totalSales: { $sum: '$total' },
          transactionCount: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    console.log('Sales data result:', salesData);

    // Add itemsSold calculation separately if needed
    const salesWithItems = await Promise.all(
      salesData.map(async (sale) => {
        const orders = await Order.find({
          ...dateFilter,
          createdAt: {
            ...dateFilter.createdAt,
            $gte: new Date(sale._id + 'T00:00:00.000Z'),
            $lt: new Date(sale._id + 'T23:59:59.999Z')
          }
        });
        
        const itemsSold = orders.reduce((sum, order) => {
          return sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0);
        }, 0);

        return {
          date: sale._id,
          totalSales: sale.totalSales,
          transactionCount: sale.transactionCount,
          itemsSold
        };
      })
    );

    console.log('Final sales data:', salesWithItems);

    // Calculate totals
    const totals = salesWithItems.reduce((acc, curr) => {
      acc.totalSales += curr.totalSales;
      acc.transactionCount += curr.transactionCount;
      acc.itemsSold += curr.itemsSold;
      return acc;
    }, { totalSales: 0, transactionCount: 0, itemsSold: 0 });

    res.status(200).json({
      success: true,
      data: {
        salesByDate: salesWithItems,
        totals
      }
    });
  } catch (error) {
    console.error('=== SALES REPORT ERROR ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Query params:', req.query);
    console.error('===========================');
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get revenue by payment method
// @route   GET /api/reports/revenue-by-payment
// @access  Private (Admin only)
export const getRevenueByPaymentMethod = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Build date filter - include all orders except cancelled
    const dateFilter = {
      status: { $in: ['pending', 'confirmed', 'processing', 'shipped', 'delivered'] }
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
