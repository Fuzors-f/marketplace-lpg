import Transaction from '../models/Transaction.js';
import Payment from '../models/Payment.js';
import Stock from '../models/Stock.js';
import Item from '../models/Item.js';
import User from '../models/User.js';
import PaymentMethod from '../models/PaymentMethod.js';
import { generateInvoiceNumber, generateReceiptNumber } from '../utils/numberGenerator.js';

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

// Helper function to reduce stock when transaction is created
const reduceStock = async (items, transactionId) => {
  for (const item of items) {
    await Stock.create({
      itemId: item.itemId,
      quantity: item.qty,
      type: 'OUT',
      note: `Transaction: ${transactionId}`
    });
  }
};

// @desc    Create manual transaction (Admin creates on behalf of user)
// @route   POST /api/admin/transactions
// @access  Private (Admin only)
export const createTransaction = async (req, res) => {
  try {
    const { userId, items, status = 'UNPAID' } = req.body;

    // Validation
    if (!userId || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide userId and at least one item'
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
    let totalAmount = 0;
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
        qty: item.qty,
        price,
        subtotal
      });

      totalAmount += subtotal;
    }

    // Generate unique invoice number
    const invoiceNumber = await generateInvoiceNumber();

    // Create transaction
    const transaction = await Transaction.create({
      userId,
      invoiceNumber,
      items: processedItems,
      totalAmount,
      status
    });

    // Reduce stock
    await reduceStock(processedItems, transaction._id);

    // Populate and return
    const populatedTransaction = await Transaction.findById(transaction._id)
      .populate('userId', 'name email phone')
      .populate('items.itemId', 'name size');

    res.status(201).json({
      success: true,
      data: populatedTransaction
    });
  } catch (error) {
    console.error('Create transaction error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Get all transactions with filters
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
      query.status = status.toUpperCase();
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
        query.createdAt.$lte = new Date(endDate);
      }
    }

    if (search) {
      query.invoiceNumber = { $regex: search, $options: 'i' };
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query
    const transactions = await Transaction.find(query)
      .populate('userId', 'name email phone')
      .populate('items.itemId', 'name size')
      .populate('paymentMethodId', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const total = await Transaction.countDocuments(query);

    res.status(200).json({
      success: true,
      count: transactions.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: transactions
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Get single transaction by ID
// @route   GET /api/admin/transactions/:id
// @access  Private (Admin only)
export const getTransactionById = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate('userId', 'name email phone address')
      .populate('items.itemId', 'name size description')
      .populate('paymentMethodId', 'name type')
      .populate('paymentId');

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    res.status(200).json({
      success: true,
      data: transaction
    });
  } catch (error) {
    console.error('Get transaction error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Update transaction (only if unpaid)
// @route   PUT /api/admin/transactions/:id
// @access  Private (Admin only)
export const updateTransaction = async (req, res) => {
  try {
    const { items, status } = req.body;

    // Find transaction
    const transaction = await Transaction.findById(req.params.id);
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    // Only allow updates for unpaid transactions
    if (transaction.status === 'PAID') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update paid transactions'
      });
    }

    // If updating items, need to revert old stock and validate new stock
    if (items && items.length > 0) {
      // Revert old stock
      for (const oldItem of transaction.items) {
        await Stock.create({
          itemId: oldItem.itemId,
          quantity: oldItem.qty,
          type: 'IN',
          note: `Transaction update revert: ${transaction._id}`
        });
      }

      // Validate new items and calculate totals
      let totalAmount = 0;
      const processedItems = [];

      for (const item of items) {
        if (!item.itemId || !item.qty || item.qty < 1) {
          return res.status(400).json({
            success: false,
            message: 'Each item must have itemId and qty (minimum 1)'
          });
        }

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

        const price = itemData.price;
        const subtotal = price * item.qty;

        processedItems.push({
          itemId: item.itemId,
          qty: item.qty,
          price,
          subtotal
        });

        totalAmount += subtotal;
      }

      // Update transaction
      transaction.items = processedItems;
      transaction.totalAmount = totalAmount;

      // Reduce new stock
      await reduceStock(processedItems, transaction._id);
    }

    // Update status if provided
    if (status) {
      transaction.status = status.toUpperCase();
    }

    await transaction.save();

    // Populate and return
    const updatedTransaction = await Transaction.findById(transaction._id)
      .populate('userId', 'name email phone')
      .populate('items.itemId', 'name size');

    res.status(200).json({
      success: true,
      data: updatedTransaction
    });
  } catch (error) {
    console.error('Update transaction error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Delete transaction (only if unpaid)
// @route   DELETE /api/admin/transactions/:id
// @access  Private (Admin only)
export const deleteTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    // Only allow deletion for unpaid transactions
    if (transaction.status === 'PAID') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete paid transactions'
      });
    }

    // Revert stock
    for (const item of transaction.items) {
      await Stock.create({
        itemId: item.itemId,
        quantity: item.qty,
        type: 'IN',
        note: `Transaction deleted: ${transaction._id}`
      });
    }

    // Delete transaction
    await Transaction.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Transaction deleted successfully'
    });
  } catch (error) {
    console.error('Delete transaction error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Bulk pay transactions
// @route   POST /api/admin/transactions/bulk-pay
// @access  Private (Admin only)
export const bulkPayTransactions = async (req, res) => {
  try {
    const { userId, transactionIds, paymentMethodId } = req.body;

    // Validation
    if (!userId || !transactionIds || transactionIds.length === 0 || !paymentMethodId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide userId, transactionIds, and paymentMethodId'
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

    // Validate payment method exists
    const paymentMethod = await PaymentMethod.findById(paymentMethodId);
    if (!paymentMethod) {
      return res.status(404).json({
        success: false,
        message: 'Payment method not found'
      });
    }

    // Validate all transactions exist and belong to the user
    const transactions = await Transaction.find({
      _id: { $in: transactionIds },
      userId
    });

    if (transactions.length !== transactionIds.length) {
      return res.status(400).json({
        success: false,
        message: 'Some transactions not found or do not belong to the specified user'
      });
    }

    // Check if all transactions are unpaid
    const paidTransactions = transactions.filter(t => t.status === 'PAID');
    if (paidTransactions.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot pay already paid transactions'
      });
    }

    // Calculate total amount
    const totalPaid = transactions.reduce((sum, t) => sum + t.totalAmount, 0);

    // Generate receipt number
    const receiptNumber = await generateReceiptNumber();

    // Create payment record
    const payment = await Payment.create({
      userId,
      receiptNumber,
      transactionIds,
      paymentMethodId,
      totalPaid
    });

    // Update all transactions to PAID status
    await Transaction.updateMany(
      { _id: { $in: transactionIds } },
      {
        $set: {
          status: 'PAID',
          paymentId: payment._id,
          paymentMethodId
        }
      }
    );

    // Populate and return payment
    const populatedPayment = await Payment.findById(payment._id)
      .populate('userId', 'name email phone')
      .populate('paymentMethodId', 'name type')
      .populate({
        path: 'transactionIds',
        populate: {
          path: 'items.itemId',
          select: 'name size'
        }
      });

    res.status(201).json({
      success: true,
      data: populatedPayment
    });
  } catch (error) {
    console.error('Bulk pay error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Get all payments
// @route   GET /api/admin/payments
// @access  Private (Admin only)
export const getAllPayments = async (req, res) => {
  try {
    const {
      userId,
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

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }

    if (search) {
      query.receiptNumber = { $regex: search, $options: 'i' };
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query
    const payments = await Payment.find(query)
      .populate('userId', 'name email phone')
      .populate('paymentMethodId', 'name type')
      .populate('transactionIds', 'invoiceNumber totalAmount')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const total = await Payment.countDocuments(query);

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
    const payment = await Payment.findById(req.params.id)
      .populate('userId', 'name email phone address')
      .populate('paymentMethodId', 'name type')
      .populate({
        path: 'transactionIds',
        populate: {
          path: 'items.itemId',
          select: 'name size price'
        }
      });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

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
