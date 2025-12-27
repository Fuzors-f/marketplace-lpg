import Cart from '../models/Cart.js';
import Order from '../models/Order.js';
import Item from '../models/Item.js';
import Stock from '../models/Stock.js';
import PaymentMethod from '../models/PaymentMethod.js';
import mongoose from 'mongoose';

// @desc    Checkout cart and create order
// @route   POST /api/checkout
// @access  Private (User)
export const checkout = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { paymentMethodId, shippingAddress, notes } = req.body;

    // Validate input
    if (!paymentMethodId || !shippingAddress) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Please provide payment method and shipping address'
      });
    }

    // Check if payment method exists
    const paymentMethod = await PaymentMethod.findById(paymentMethodId);
    if (!paymentMethod) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'Payment method not found'
      });
    }

    // Get user's cart
    const cart = await Cart.findOne({ userId: req.user.id })
      .populate('items.itemId')
      .session(session);

    if (!cart || cart.items.length === 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Cart is empty'
      });
    }

    // Validate stock availability and calculate total
    let total = 0;
    const orderItems = [];

    for (const cartItem of cart.items) {
      const item = cartItem.itemId;
      
      if (!item) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({
          success: false,
          message: 'One or more items not found'
        });
      }

      // Check stock
      const stock = await Stock.findOne({ itemId: item._id }).session(session);
      
      if (!stock) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          success: false,
          message: `Stock not found for ${item.name}`
        });
      }

      if (stock.qty < cartItem.qty) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${item.name}. Available: ${stock.qty}, Requested: ${cartItem.qty}`
        });
      }

      // Reduce stock
      stock.qty -= cartItem.qty;
      await stock.save({ session });

      // Prepare order item
      orderItems.push({
        itemId: item._id,
        name: item.name,
        size: item.size,
        quantity: cartItem.qty,
        priceAtPurchase: item.price
      });

      total += item.price * cartItem.qty;
    }

    // Create order
    const order = await Order.create([{
      userId: req.user.id,
      items: orderItems,
      paymentMethodId,
      total,
      status: 'pending',
      shippingAddress,
      notes: notes || ''
    }], { session });

    // Clear cart
    cart.items = [];
    await cart.save({ session });

    await session.commitTransaction();
    session.endSession();

    // Populate order details
    const populatedOrder = await Order.findById(order[0]._id)
      .populate('items.itemId', 'name size price image')
      .populate('paymentMethodId', 'name accountNumber accountName')
      .populate('userId', 'name email phone');

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: populatedOrder
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
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

    // Build query
    let query = { userId: req.user.id };

    if (status) {
      query.status = status;
    }

    // Execute query with pagination
    const orders = await Order.find(query)
      .populate('items.itemId', 'name size price image')
      .populate('paymentMethodId', 'name accountNumber accountName')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Get total count
    const count = await Order.countDocuments(query);

    res.status(200).json({
      success: true,
      count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
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
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const order = await Order.findOne({
      _id: req.params.id,
      userId: req.user.id
    }).session(session);

    if (!order) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Can only cancel pending orders
    if (order.status !== 'pending') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: `Cannot cancel order with status: ${order.status}`
      });
    }

    // Restore stock
    for (const item of order.items) {
      const stock = await Stock.findOne({ itemId: item.itemId }).session(session);
      
      if (stock) {
        stock.qty += item.quantity;
        await stock.save({ session });
      }
    }

    // Update order status
    order.status = 'cancelled';
    await order.save({ session });

    await session.commitTransaction();
    session.endSession();

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
    await session.abortTransaction();
    session.endSession();
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
