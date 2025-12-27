import Stock from '../models/Stock.js';
import Item from '../models/Item.js';

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
