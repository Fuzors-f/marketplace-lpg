import Order from '../models/Order.js';
import Stock from '../models/Stock.js';
import Item from '../models/Item.js';
import User from '../models/User.js';
import PaymentMethod from '../models/PaymentMethod.js';

// Helper function to get current stock for an item
const getCurrentStock = async (itemId) => {
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

// Helper function to reduce stock when order is created
const reduceStock = async (items, orderId) => {
  for (const item of items) {
    await Stock.create({
      itemId: item.itemId,
      quantity: item.quantity,
      type: 'OUT',
      note: `Order: ${orderId}`
    });
  }
};

// @desc    Create order (Admin creates on behalf of user)
// @route   POST /api/admin/transactions
// @access  Private (Admin only)
export const createTransaction = async (req, res) => {
  try {
    const { userId, items, status = 'pending', paymentMethodId, shippingAddress, notes } = req.body;

    // Normalize status to lowercase
    const normalizedStatus = status.toLowerCase();

    // Validation
    if (!userId || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide userId and at least one item'
      });
    }

    if (!paymentMethodId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide payment method'
      });
    }

    // Validate user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Validate items and calculate totals
    let total = 0;
    const processedItems = [];

    for (const item of items) {
      if (!item.itemId || !item.qty || item.qty < 1) {
        return res.status(400).json({
          success: false,
          message: 'Each item must have itemId and qty (minimum 1)'
        });
      }

      // Check if item exists
      const itemData = await Item.findById(item.itemId);
      if (!itemData) {
        return res.status(404).json({
          success: false,
          message: `Item with ID ${item.itemId} not found`
        });
      }

      // Check stock availability
      const currentStock = await getCurrentStock(item.itemId);
      if (currentStock < item.qty) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for item ${itemData.name}. Available: ${currentStock}, Requested: ${item.qty}`
        });
      }

      // Calculate subtotal
      const price = itemData.price;
      const subtotal = price * item.qty;

      processedItems.push({
        itemId: item.itemId,
        name: itemData.name,
        size: itemData.size,
        quantity: item.qty,
        priceAtPurchase: price
      });

      total += subtotal;
    }

    // Create order
    const order = await Order.create({
      userId,
      items: processedItems,
      paymentMethodId,
      total,
      status: normalizedStatus,
      shippingAddress: shippingAddress || user.address || 'Not specified',
      notes: notes || ''
    });

    // Reduce stock
    await reduceStock(processedItems, order._id);

    // Populate and return
    const populatedOrder = await Order.findById(order._id)
      .populate('userId', 'name email phone')
      .populate('items.itemId', 'name size')
      .populate('paymentMethodId', 'name');

    res.status(201).json({
      success: true,
      data: populatedOrder
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Get all orders with filters
// @route   GET /api/admin/transactions
// @access  Private (Admin only)
export const getAllTransactions = async (req, res) => {
  try {
    const {
      userId,
      status,
      paymentMethodId,
      startDate,
      endDate,
      search,
      page = 1,
      limit = 10
    } = req.query;

    // Build query
    const query = {};

    if (userId) {
      query.userId = userId;
    }

    if (status) {
      // Map transaction status (PAID/UNPAID/PENDING) to order status
      const statusUpper = status.toUpperCase();
      if (statusUpper === 'PAID') {
        query.status = { $in: ['confirmed', 'processing', 'shipped', 'delivered'] };
      } else if (statusUpper === 'UNPAID' || statusUpper === 'PENDING') {
        query.status = 'pending';
      } else if (statusUpper === 'CANCELLED') {
        query.status = 'cancelled';
      } else {
        // Direct status match for order statuses
        query.status = status.toLowerCase();
      }
    }

    if (paymentMethodId) {
      query.paymentMethodId = paymentMethodId;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        query.createdAt.$lte = endDateTime;
      }
    }

    if (search) {
      query.$or = [
        { _id: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } }
      ];
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query
    const orders = await Order.find(query)
      .populate('userId', 'name email phone')
      .populate('items.itemId', 'name size')
      .populate('paymentMethodId', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Transform to match expected format
    const transactions = orders.map(order => ({
      _id: order._id,
      invoiceNumber: `ORD-${order._id.toString().slice(-8).toUpperCase()}`,
      userId: order.userId,
      items: order.items.map(item => ({
        itemId: item.itemId,
        name: item.name,
        size: item.size,
        qty: item.quantity,
        price: item.priceAtPurchase,
        subtotal: item.quantity * item.priceAtPurchase
      })),
      totalAmount: order.total,
      status: order.status.toUpperCase(),
      paymentMethodId: order.paymentMethodId,
      shippingAddress: order.shippingAddress,
      notes: order.notes,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt
    }));

    // Get total count
    const total = await Order.countDocuments(query);

    res.status(200).json({
      success: true,
      count: transactions.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: transactions
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Get single order by ID
// @route   GET /api/admin/transactions/:id
// @access  Private (Admin only)
export const getTransactionById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('userId', 'name email phone address')
      .populate('items.itemId', 'name size description')
      .populate('paymentMethodId', 'name type');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Transform to match expected format
    const transaction = {
      _id: order._id,
      invoiceNumber: `ORD-${order._id.toString().slice(-8).toUpperCase()}`,
      userId: order.userId,
      items: order.items.map(item => ({
        itemId: item.itemId,
        name: item.name,
        size: item.size,
        qty: item.quantity,
        price: item.priceAtPurchase,
        subtotal: item.quantity * item.priceAtPurchase
      })),
      totalAmount: order.total,
      status: order.status.toUpperCase(),
      paymentMethodId: order.paymentMethodId,
      shippingAddress: order.shippingAddress,
      notes: order.notes,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt
    };

    res.status(200).json({
      success: true,
      data: transaction
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Update order status and items
// @route   PUT /api/admin/transactions/:id
// @access  Private (Admin only)
export const updateTransaction = async (req, res) => {
  try {
    const { status, notes, items, userId, paymentMethodId } = req.body;

    // Find order
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // If updating items, validate and restore original stock first
    if (items && items.length > 0) {
      // Restore original stock
      for (const originalItem of order.items) {
        await Stock.create({
          itemId: originalItem.itemId,
          quantity: originalItem.quantity,
          type: 'IN',
          note: `Order updated - restore: ${order._id}`
        });
      }

      // Validate new items and calculate totals
      let total = 0;
      const processedItems = [];

      for (const item of items) {
        if (!item.itemId || !item.qty || item.qty < 1) {
          return res.status(400).json({
            success: false,
            message: 'Each item must have itemId and qty (minimum 1)'
          });
        }

        // Check if item exists
        const itemData = await Item.findById(item.itemId);
        if (!itemData) {
          return res.status(404).json({
            success: false,
            message: `Item with ID ${item.itemId} not found`
          });
        }

        // Check stock availability
        const currentStock = await getCurrentStock(item.itemId);
        if (currentStock < item.qty) {
          return res.status(400).json({
            success: false,
            message: `Insufficient stock for item ${itemData.name}. Available: ${currentStock}, Requested: ${item.qty}`
          });
        }

        // Calculate subtotal
        const price = itemData.price;
        const subtotal = price * item.qty;

        processedItems.push({
          itemId: item.itemId,
          name: itemData.name,
          size: itemData.size,
          quantity: item.qty,
          priceAtPurchase: price
        });

        total += subtotal;
      }

      // Update order with new items
      order.items = processedItems;
      order.total = total;

      // Reduce stock for new items
      await reduceStock(processedItems, order._id);
    }

    // Update other fields
    if (userId) {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      order.userId = userId;
    }

    if (paymentMethodId) {
      order.paymentMethodId = paymentMethodId;
    }

    // Update status if provided
    if (status) {
      const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
      const normalizedStatus = status.toLowerCase();
      
      if (!validStatuses.includes(normalizedStatus)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status'
        });
      }

      // If cancelling, restore stock (if not already restored above)
      if (normalizedStatus === 'cancelled' && order.status !== 'cancelled' && (!items || items.length === 0)) {
        for (const item of order.items) {
          await Stock.create({
            itemId: item.itemId,
            quantity: item.quantity,
            type: 'IN',
            note: `Order cancelled: ${order._id}`
          });
        }
      }

      order.status = normalizedStatus;
    }

    if (notes !== undefined) {
      order.notes = notes;
    }

    await order.save();

    // Populate and return
    const populatedOrder = await Order.findById(order._id)
      .populate('userId', 'name email phone')
      .populate('items.itemId', 'name size')
      .populate('paymentMethodId', 'name');

    // Transform to match expected format
    const transaction = {
      _id: populatedOrder._id,
      invoiceNumber: `ORD-${populatedOrder._id.toString().slice(-8).toUpperCase()}`,
      userId: populatedOrder.userId,
      items: populatedOrder.items.map(item => ({
        itemId: item.itemId,
        name: item.name,
        size: item.size,
        qty: item.quantity,
        price: item.priceAtPurchase,
        subtotal: item.quantity * item.priceAtPurchase
      })),
      totalAmount: populatedOrder.total,
      status: populatedOrder.status.toUpperCase(),
      paymentMethodId: populatedOrder.paymentMethodId,
      shippingAddress: populatedOrder.shippingAddress,
      notes: populatedOrder.notes,
      createdAt: populatedOrder.createdAt,
      updatedAt: populatedOrder.updatedAt
    };

    res.status(200).json({
      success: true,
      data: transaction
    });
  } catch (error) {
    console.error('Update order error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Delete order (only if pending/cancelled)
// @route   DELETE /api/admin/transactions/:id
// @access  Private (Admin only)
export const deleteTransaction = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Only allow deletion of pending or cancelled orders
    if (!['pending', 'cancelled'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: 'Can only delete pending or cancelled orders'
      });
    }

    // If pending (not cancelled), restore stock
    if (order.status === 'pending') {
      for (const item of order.items) {
        await Stock.create({
          itemId: item.itemId,
          quantity: item.quantity,
          type: 'IN',
          note: `Order deleted: ${order._id}`
        });
      }
    }

    await Order.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Order deleted successfully'
    });
  } catch (error) {
    console.error('Delete order error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Bulk update order status (mark as delivered/paid) and create payment record
// @route   POST /api/admin/transactions/bulk-pay
// @access  Private (Admin only)
export const bulkPayTransactions = async (req, res) => {
  try {
    const { orderIds, transactionIds, paymentMethodId, userId, status = 'delivered' } = req.body;
    
    // Support both orderIds and transactionIds for compatibility
    const ids = orderIds || transactionIds;

    if (!ids || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide order IDs'
      });
    }

    if (!paymentMethodId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide payment method'
      });
    }

    const validStatuses = ['confirmed', 'processing', 'shipped', 'delivered'];
    const normalizedStatus = status.toLowerCase();
    
    if (!validStatuses.includes(normalizedStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status for bulk update'
      });
    }

    // Find orders to be updated
    const orders = await Order.find({ 
      _id: { $in: ids }, 
      status: { $nin: ['cancelled', 'delivered'] } 
    }).populate('userId', 'name email');

    if (orders.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No eligible orders found for payment'
      });
    }

    // Calculate total amount
    const totalAmount = orders.reduce((sum, order) => sum + order.total, 0);

    // Update all orders status
    const result = await Order.updateMany(
      { _id: { $in: ids }, status: { $nin: ['cancelled', 'delivered'] } },
      { $set: { status: normalizedStatus, updatedAt: new Date() } }
    );

    // Generate receipt number
    const receiptNumber = `RCP-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    // Create payment record (using first order as template)
    const paymentData = {
      receiptNumber,
      userId: userId || orders[0].userId._id,
      orderIds: ids,
      totalAmount,
      paymentMethodId,
      status: 'completed',
      paidAt: new Date()
    };

    res.status(200).json({
      success: true,
      message: `${result.modifiedCount} orders marked as paid`,
      data: paymentData
    });
  } catch (error) {
    console.error('Bulk update error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Get all payments (from orders with delivered status)
// @route   GET /api/admin/payments
// @access  Private (Admin only)
export const getAllPayments = async (req, res) => {
  try {
    const {
      userId,
      startDate,
      endDate,
      page = 1,
      limit = 10
    } = req.query;

    // Build query for delivered orders (paid)
    const query = { status: { $in: ['delivered', 'confirmed', 'processing', 'shipped'] } };

    if (userId) {
      query.userId = userId;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        query.createdAt.$lte = endDateTime;
      }
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query
    const orders = await Order.find(query)
      .populate('userId', 'name email phone')
      .populate('paymentMethodId', 'name type')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Transform to payment format
    const payments = orders.map(order => ({
      _id: order._id,
      receiptNumber: `RCP-${order._id.toString().slice(-8).toUpperCase()}`,
      userId: order.userId,
      orderId: order._id,
      transactionIds: [order._id], // Single order as array for consistency
      totalAmount: order.total,
      totalPaid: order.total, // Alias for frontend compatibility
      paymentMethodId: order.paymentMethodId,
      status: order.status,
      paidAt: order.updatedAt,
      createdAt: order.createdAt
    }));

    // Get total count
    const total = await Order.countDocuments(query);

    res.status(200).json({
      success: true,
      count: payments.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: payments
    });
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Get single payment by ID
// @route   GET /api/admin/payments/:id
// @access  Private (Admin only)
export const getPaymentById = async (req, res) => {
  try {
    const order = await Order.findOne({ 
      _id: req.params.id, 
      status: { $in: ['delivered', 'confirmed', 'processing', 'shipped', 'pending', 'paid'] } 
    })
      .populate('userId', 'name email phone address')
      .populate('items.itemId', 'name size price')
      .populate('paymentMethodId', 'name type accountNumber accountName');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    // Debug log
    console.log('Order found:', order._id);
    console.log('Order items:', JSON.stringify(order.items, null, 2));

    // Transform to payment format
    const payment = {
      _id: order._id,
      receiptNumber: `RCP-${order._id.toString().slice(-8).toUpperCase()}`,
      userId: order.userId,
      orderId: order._id,
      transactionIds: [order._id], // Single order as array for consistency
      items: order.items.map(item => {
        // Get name from populated itemId or from stored name
        const itemName = item.itemId?.name || item.name || 'Item tidak ditemukan';
        const itemSize = item.itemId?.size || item.size || '';
        const itemPrice = item.priceAtPurchase || item.itemId?.price || 0;
        
        return {
          _id: item._id,
          itemId: item.itemId,
          name: itemName,
          size: itemSize,
          qty: item.quantity,
          quantity: item.quantity,
          price: itemPrice,
          priceAtPurchase: itemPrice,
          subtotal: item.quantity * itemPrice
        };
      }),
      totalAmount: order.total,
      totalPaid: order.total, // Alias for frontend compatibility
      paymentMethodId: order.paymentMethodId,
      shippingAddress: order.shippingAddress,
      status: order.status,
      paidAt: order.updatedAt,
      createdAt: order.createdAt
    };

    // Debug log
    console.log('Payment items:', JSON.stringify(payment.items, null, 2));

    res.status(200).json({
      success: true,
      data: payment
    });
  } catch (error) {
    console.error('Get payment error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};
