import Cart from '../models/Cart.js';
import Order from '../models/Order.js';
import Item from '../models/Item.js';
import Stock from '../models/Stock.js';
import PaymentMethod from '../models/PaymentMethod.js';
import StockHistory from '../models/StockHistory.js';
import Payment from '../models/Payment.js';
import Transaction from '../models/Transaction.js';

// Helper function to calculate current stock for an item
const calculateCurrentStock = async (itemId) => {
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

// @desc    Checkout cart and create order
// @route   POST /api/checkout
// @access  Private (User)
export const checkout = async (req, res) => {
  try {
    const { paymentMethodId, shippingAddress, notes } = req.body;

    // Validate input
    if (!paymentMethodId || !shippingAddress) {
      return res.status(400).json({
        success: false,
        message: 'Please provide payment method and shipping address'
      });
    }

    // Check if payment method exists
    const paymentMethod = await PaymentMethod.findById(paymentMethodId);
    if (!paymentMethod) {
      return res.status(404).json({
        success: false,
        message: 'Payment method not found'
      });
    }

    // Get user's cart
    const cart = await Cart.findOne({ userId: req.user.id })
      .populate('items.itemId', 'name size price image description');

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cart is empty'
      });
    }

    // Debug: Log cart items
    console.log('Cart items:', JSON.stringify(cart.items, null, 2));

    // Validate stock availability and calculate total
    let total = 0;
    const orderItems = [];
    const stockUpdates = []; // Track stock updates for history

    for (const cartItem of cart.items) {
      const item = cartItem.itemId;
      
      // Debug: Log each item
      console.log('Processing item:', item);
      
      if (!item || !item._id) {
        return res.status(404).json({
          success: false,
          message: 'One or more items not found or have been removed'
        });
      }

      // Ensure price is valid - fetch directly from Item if needed
      let itemPrice = Number(item.price);
      
      // If price is still invalid, try to fetch item directly
      if (!itemPrice || itemPrice <= 0) {
        console.log('Price invalid, fetching item directly:', item._id);
        const freshItem = await Item.findById(item._id);
        if (freshItem) {
          itemPrice = Number(freshItem.price) || 0;
          console.log('Fresh item price:', itemPrice);
        }
      }
      
      if (!itemPrice || itemPrice <= 0) {
        return res.status(400).json({
          success: false,
          message: `Invalid price for ${item.name || 'Unknown item'}`
        });
      }

      // Calculate current stock from all stock entries
      const currentStock = await calculateCurrentStock(item._id);

      if (currentStock < cartItem.qty) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${item.name}. Available: ${currentStock}, Requested: ${cartItem.qty}`
        });
      }

      // Track for stock update
      stockUpdates.push({
        itemId: item._id,
        previousStock: currentStock,
        newStock: currentStock - cartItem.qty,
        quantity: cartItem.qty
      });

      // Prepare order item
      orderItems.push({
        itemId: item._id,
        name: item.name,
        size: item.size,
        quantity: cartItem.qty,
        priceAtPurchase: itemPrice
      });

      total += itemPrice * cartItem.qty;
    }

    // Create order
    const order = await Order.create({
      userId: req.user.id,
      items: orderItems,
      paymentMethodId,
      total,
      status: 'pending',
      shippingAddress,
      notes: notes || ''
    });

    // Create stock OUT entries and stock history records
    for (const update of stockUpdates) {
      // Create Stock OUT entry (this is how stock is reduced)
      await Stock.create({
        itemId: update.itemId,
        quantity: update.quantity,
        type: 'OUT',
        note: `Order #${order._id}`
      });

      // Create StockHistory record for tracking
      await StockHistory.create({
        itemId: update.itemId,
        type: 'OUT',
        quantity: update.quantity,
        reason: 'sold',
        note: `Order #${order._id}`,
        previousStock: update.previousStock,
        newStock: update.newStock,
        performedBy: {
          userId: req.user.id,
          userType: 'User',
          name: req.user.name || 'User'
        },
        referenceId: String(order._id),
        referenceType: 'order'
      });
    }

    // Clear cart
    cart.items = [];
    await cart.save();

    // Populate order details
    const populatedOrder = await Order.findById(order._id)
      .populate('items.itemId', 'name size price image')
      .populate('paymentMethodId', 'name accountNumber accountName')
      .populate('userId', 'name email phone');

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: populatedOrder
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get user's orders
// @route   GET /api/checkout/orders
// @access  Private (User)
export const getOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    // Build query
    let query = { userId: req.user.id };

    if (status) {
      query.status = status;
    }

    // Get total count first
    const count = await Order.countDocuments(query);
    const totalPages = Math.ceil(count / limitNum);

    // Execute query with pagination
    const orders = await Order.find(query)
      .populate('items.itemId', 'name size price image')
      .populate('paymentMethodId', 'name accountNumber accountName')
      .sort({ createdAt: -1 })
      .limit(limitNum)
      .skip((pageNum - 1) * limitNum);

    res.status(200).json({
      success: true,
      count,
      totalPages,
      currentPage: pageNum,
      data: orders
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get single order
// @route   GET /api/checkout/orders/:id
// @access  Private (User)
export const getOrder = async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      userId: req.user.id
    })
      .populate('items.itemId', 'name size price image')
      .populate('paymentMethodId', 'name accountNumber accountName')
      .populate('userId', 'name email phone');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Cancel order
// @route   PUT /api/checkout/orders/:id/cancel
// @access  Private (User)
export const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Can only cancel pending orders
    if (order.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel order with status: ${order.status}`
      });
    }

    // Restore stock and create stock history
    for (const item of order.items) {
      // Calculate current stock
      const currentStock = await calculateCurrentStock(item.itemId);
      const newStock = currentStock + item.quantity;

      // Create Stock IN entry to restore stock
      await Stock.create({
        itemId: item.itemId,
        quantity: item.quantity,
        type: 'IN',
        note: `Order cancelled #${order._id}`
      });

      // Create stock history record
      await StockHistory.create({
        itemId: item.itemId,
        type: 'IN',
        quantity: item.quantity,
        reason: 'return',
        note: `Order cancelled #${order._id}`,
        previousStock: currentStock,
        newStock: newStock,
        performedBy: {
          userId: req.user.id,
          userType: 'User',
          name: req.user.name || 'User'
        },
        referenceId: String(order._id),
        referenceType: 'order'
      });
    }

    // Update order status
    order.status = 'cancelled';
    await order.save();

    // Populate and return
    const populatedOrder = await Order.findById(order._id)
      .populate('items.itemId', 'name size price image')
      .populate('paymentMethodId', 'name accountNumber accountName');

    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully',
      data: populatedOrder
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get user's transaction history (payments)
// @route   GET /api/checkout/transactions
// @access  Private (User)
export const getUserTransactions = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;

    // Get user's completed transactions (delivered orders)
    let query = { 
      userId: req.user.id,
      status: { $in: ['delivered', 'paid'] }
    };

    const transactions = await Order.find(query)
      .populate('paymentMethodId', 'name accountNumber accountName')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Order.countDocuments(query);

    // Format as transaction history
    const formattedTransactions = transactions.map(order => ({
      _id: order._id,
      receiptNumber: order.invoiceNumber || `TXN-${order._id.toString().slice(-8).toUpperCase()}`,
      paymentMethodId: order.paymentMethodId,
      status: order.status,
      totalPaid: order.total,
      createdAt: order.updatedAt || order.createdAt
    }));

    res.status(200).json({
      success: true,
      count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      data: formattedTransactions
    });
  } catch (error) {
    console.error('Get user transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get user's payments list
// @route   GET /api/checkout/payments
// @access  Private (User)
export const getUserPayments = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const { status, startDate, endDate } = req.query;

    // Build query - only show orders (payments) belonging to current user
    // Only show confirmed/paid orders
    let query = { 
      userId: req.user.id,
      status: { $in: ['delivered', 'confirmed', 'processing', 'shipped', 'paid'] }
    };

    // Filter by status if provided
    if (status && status !== 'all') {
      query.status = status;
    }

    // Filter by date range if provided
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    // Get orders (payments) with populated data
    const orders = await Order.find(query)
      .populate('paymentMethodId', 'name accountNumber accountName type')
      .populate('items.itemId', 'name price unit')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit);

    const count = await Order.countDocuments(query);

    // Format as payments
    const formattedPayments = orders.map(order => {
      const items = order.items?.map(item => ({
        _id: item._id,
        itemName: item.itemId?.name || item.name || 'Item tidak ditemukan',
        quantity: item.quantity || 0,
        price: item.priceAtPurchase || item.itemId?.price || 0,
        unit: item.itemId?.unit || 'unit',
        total: (item.quantity || 0) * (item.priceAtPurchase || 0)
      })) || [];

      return {
        _id: order._id,
        receiptNumber: `RCP-${order._id.toString().slice(-8).toUpperCase()}`,
        paymentMethod: order.paymentMethodId,
        totalPaid: order.total || 0,
        items: items,
        itemCount: items.length,
        status: order.status,
        createdAt: order.createdAt
      };
    });

    res.status(200).json({
      success: true,
      count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      data: formattedPayments
    });
  } catch (error) {
    console.error('Get user payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get user's single payment detail
// @route   GET /api/checkout/payments/:id
// @access  Private (User)
export const getUserPaymentById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('userId', 'name email phone address')
      .populate('paymentMethodId', 'name accountNumber accountName type')
      .populate('items.itemId', 'name price unit');

    console.log('Order found:', order?._id);
    console.log('PaymentMethodId populated:', order?.paymentMethodId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    // Verify that this order belongs to the current user
    if (order.userId._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this payment'
      });
    }

    // Format items from order
    const items = order.items?.map(item => ({
      _id: item._id,
      itemId: item.itemId,
      name: item.itemId?.name || item.name || 'Item tidak ditemukan',
      size: item.itemId?.size || item.size || '',
      qty: item.quantity,
      quantity: item.quantity,
      price: item.priceAtPurchase,
      priceAtPurchase: item.priceAtPurchase,
      subtotal: item.quantity * item.priceAtPurchase
    })) || [];

    const formattedPayment = {
      _id: order._id,
      receiptNumber: `RCP-${order._id.toString().slice(-8).toUpperCase()}`,
      user: order.userId,
      paymentMethod: order.paymentMethodId,
      totalPaid: order.total || 0,
      items: items,
      itemCount: items.length,
      status: order.status,
      shippingAddress: order.shippingAddress,
      createdAt: order.createdAt
    };

    res.status(200).json({
      success: true,
      data: formattedPayment
    });
  } catch (error) {
    console.error('Get user payment by id error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};