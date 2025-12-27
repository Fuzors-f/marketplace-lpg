import Cart from '../models/Cart.js';
import Item from '../models/Item.js';
import Stock from '../models/Stock.js';

// @desc    Get user's cart
// @route   GET /api/cart
// @access  Private (User)
export const getCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ userId: req.user.id })
      .populate('items.itemId', 'name price image');

    if (!cart) {
      // Create empty cart if doesn't exist
      cart = await Cart.create({
        userId: req.user.id,
        items: []
      });
    }

    // Calculate total
    const total = cart.items.reduce((sum, item) => {
      return sum + (item.itemId ? item.itemId.price * item.qty : 0);
    }, 0);

    res.status(200).json({
      success: true,
      data: {
        ...cart.toObject(),
        total
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Add item to cart
// @route   POST /api/cart/add
// @access  Private (User)
export const addToCart = async (req, res) => {
  try {
    const { itemId, qty } = req.body;

    // Validate input
    if (!itemId || !qty) {
      return res.status(400).json({
        success: false,
        message: 'Please provide itemId and qty'
      });
    }

    if (qty < 1) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be at least 1'
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

    // Get or create cart
    let cart = await Cart.findOne({ userId: req.user.id });
    
    if (!cart) {
      cart = new Cart({
        userId: req.user.id,
        items: []
      });
    }

    // Check if item already in cart
    const existingItemIndex = cart.items.findIndex(
      (i) => i.itemId.toString() === itemId
    );

    if (existingItemIndex > -1) {
      // Update quantity
      cart.items[existingItemIndex].qty += qty;
    } else {
      // Add new item
      cart.items.push({
        itemId,
        qty
      });
    }

    await cart.save();

    // Populate and return
    cart = await Cart.findOne({ userId: req.user.id })
      .populate('items.itemId', 'name price image');

    // Calculate total
    const total = cart.items.reduce((sum, item) => {
      return sum + (item.itemId ? item.itemId.price * item.qty : 0);
    }, 0);

    res.status(200).json({
      success: true,
      message: 'Item added to cart',
      data: {
        ...cart.toObject(),
        total
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update cart item quantity
// @route   PUT /api/cart/update
// @access  Private (User)
export const updateCartItem = async (req, res) => {
  try {
    const { itemId, qty } = req.body;

    // Validate input
    if (!itemId || qty === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Please provide itemId and qty'
      });
    }

    if (qty < 0) {
      return res.status(400).json({
        success: false,
        message: 'Quantity cannot be negative'
      });
    }

    let cart = await Cart.findOne({ userId: req.user.id });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    // Find item in cart
    const itemIndex = cart.items.findIndex(
      (i) => i.itemId.toString() === itemId
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in cart'
      });
    }

    if (qty === 0) {
      // Remove item if qty is 0
      cart.items.splice(itemIndex, 1);
    } else {
      // Update quantity
      cart.items[itemIndex].qty = qty;
    }

    await cart.save();

    // Populate and return
    cart = await Cart.findOne({ userId: req.user.id })
      .populate('items.itemId', 'name price image');

    // Calculate total
    const total = cart.items.reduce((sum, item) => {
      return sum + (item.itemId ? item.itemId.price * item.qty : 0);
    }, 0);

    res.status(200).json({
      success: true,
      message: 'Cart updated',
      data: {
        ...cart.toObject(),
        total
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Remove item from cart
// @route   DELETE /api/cart/remove/:itemId
// @access  Private (User)
export const removeFromCart = async (req, res) => {
  try {
    const { itemId } = req.params;

    let cart = await Cart.findOne({ userId: req.user.id });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    // Find and remove item
    const itemIndex = cart.items.findIndex(
      (i) => i.itemId.toString() === itemId
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in cart'
      });
    }

    cart.items.splice(itemIndex, 1);
    await cart.save();

    // Populate and return
    cart = await Cart.findOne({ userId: req.user.id })
      .populate('items.itemId', 'name price image');

    // Calculate total
    const total = cart.items.reduce((sum, item) => {
      return sum + (item.itemId ? item.itemId.price * item.qty : 0);
    }, 0);

    res.status(200).json({
      success: true,
      message: 'Item removed from cart',
      data: {
        ...cart.toObject(),
        total
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Clear cart
// @route   DELETE /api/cart/clear
// @access  Private (User)
export const clearCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ userId: req.user.id });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    cart.items = [];
    await cart.save();

    res.status(200).json({
      success: true,
      message: 'Cart cleared',
      data: cart
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
