import Cart from '../models/Cart.js';
import Order from '../models/Order.js';
import Item from '../models/Item.js';
import Stock from '../models/Stock.js';
import PaymentMethod from '../models/PaymentMethod.js';
import StockHistory from '../models/StockHistory.js';

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
