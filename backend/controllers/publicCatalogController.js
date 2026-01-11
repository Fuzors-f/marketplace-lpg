import Catalog from '../models/Catalog.js';
import Item from '../models/Item.js';
import Stock from '../models/Stock.js';

// @desc    Get public catalog (user view)
// @route   GET /api/public/catalog
// @access  Public
export const getPublicCatalog = async (req, res) => {
  try {
    const { search, minPrice, maxPrice, size, inStock, page = 1, limit = 12 } = req.query;

    // First, get all listed items from catalog
    const listedItems = await Catalog.find({ isListed: true })
      .populate('itemId')
      .select('itemId');

    // Extract item IDs that are listed
    const listedItemIds = listedItems
      .filter(cat => cat.itemId && cat.itemId.status === 'active')
      .map(cat => cat.itemId._id);

    // Build query to only include items from the catalog
    let query = {
      _id: { $in: listedItemIds }
    };

    // Search by name
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    // Filter by price range
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    // Filter by size
    if (size) {
      query.size = size;
    }

    // Get items
    let items = await Item.find(query)
      .sort({ name: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // If filtering by stock, get stock info and filter
    if (inStock === 'true') {
      const itemsWithStock = [];
      
      for (const item of items) {
        // Calculate total stock for this item
        const stockRecords = await Stock.find({ itemId: item._id });
        const totalStock = stockRecords.reduce((sum, record) => {
          return record.type === 'IN' ? sum + record.quantity : sum - record.quantity;
        }, 0);
        
        if (totalStock > 0) {
          itemsWithStock.push({
            ...item.toObject(),
            stock: totalStock
          });
        }
      }
      
      items = itemsWithStock;
    } else {
      // Add stock info to all items
      const itemsWithStock = await Promise.all(
        items.map(async (item) => {
          // Calculate total stock for this item
          const stockRecords = await Stock.find({ itemId: item._id });
          const totalStock = stockRecords.reduce((sum, record) => {
            return record.type === 'IN' ? sum + record.quantity : sum - record.quantity;
          }, 0);
          
          return {
            ...item.toObject(),
            stock: totalStock
          };
        })
      );
      
      items = itemsWithStock;
    }

    // Get total count
    const count = await Item.countDocuments(query);

    res.status(200).json({
      success: true,
      count: items.length,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      data: items
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get single item (user view)
// @route   GET /api/public/catalog/:id
// @access  Public
export const getPublicItem = async (req, res) => {
  try {
    // Check if item is listed in catalog
    const catalogEntry = await Catalog.findOne({ 
      itemId: req.params.id,
      isListed: true
    });

    if (!catalogEntry) {
      return res.status(404).json({
        success: false,
        message: 'Item not found or is not available'
      });
    }

    const item = await Item.findById(req.params.id);

    if (!item || item.status !== 'active') {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    // Get stock info
    const stockRecords = await Stock.find({ itemId: item._id });
    const totalStock = stockRecords.reduce((sum, record) => {
      return record.type === 'IN' ? sum + record.quantity : sum - record.quantity;
    }, 0);

    res.status(200).json({
      success: true,
      data: {
        ...item.toObject(),
        stock: totalStock
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

// @desc    Get catalog grouped by category (for display)
// @route   GET /api/public/catalog/grouped
// @access  Public
export const getGroupedCatalog = async (req, res) => {
  try {
    // Get all items with stock
    const items = await Item.find().sort({ name: 1 });

    // Group by size (which acts as category)
    const grouped = {};

    for (const item of items) {
      const stock = await Stock.findOne({ itemId: item._id });
      const itemWithStock = {
        ...item.toObject(),
        stock: stock ? stock.qty : 0
      };

      if (!grouped[item.size]) {
        grouped[item.size] = [];
      }
      
      grouped[item.size].push(itemWithStock);
    }

    res.status(200).json({
      success: true,
      data: grouped
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get available sizes
// @route   GET /api/public/catalog/sizes
// @access  Public
export const getAvailableSizes = async (req, res) => {
  try {
    const sizes = await Item.distinct('size');

    res.status(200).json({
      success: true,
      data: sizes.sort()
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get price range
// @route   GET /api/public/catalog/price-range
// @access  Public
export const getPriceRange = async (req, res) => {
  try {
    const minPriceItem = await Item.findOne().sort({ price: 1 }).limit(1);
    const maxPriceItem = await Item.findOne().sort({ price: -1 }).limit(1);

    res.status(200).json({
      success: true,
      data: {
        min: minPriceItem ? minPriceItem.price : 0,
        max: maxPriceItem ? maxPriceItem.price : 0
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
