import Catalog from '../models/Catalog.js';
import Item from '../models/Item.js';

// @desc    Get all catalog items
// @route   GET /api/catalog
// @access  Public
export const getCatalog = async (req, res) => {
  try {
    const catalog = await Catalog.find({ isListed: true })
      .populate('itemId')
      .sort({ order: 1 });

    // Filter out items that don't exist or are inactive
    const activeCatalog = catalog.filter(cat => 
      cat.itemId && cat.itemId.status === 'active'
    );

    res.status(200).json({
      success: true,
      count: activeCatalog.length,
      data: activeCatalog
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get all catalog items (admin view)
// @route   GET /api/catalog/admin
// @access  Private
export const getAdminCatalog = async (req, res) => {
  try {
    const catalog = await Catalog.find()
      .populate('itemId')
      .sort({ order: 1 });

    res.status(200).json({
      success: true,
      count: catalog.length,
      data: catalog
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Add item to catalog
// @route   POST /api/catalog
// @access  Private
export const addToCatalog = async (req, res) => {
  try {
    const { itemId, isListed, order } = req.body;

    if (!itemId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide itemId'
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

    // Check if already in catalog
    const existingCatalog = await Catalog.findOne({ itemId });
    if (existingCatalog) {
      return res.status(400).json({
        success: false,
        message: 'Item already in catalog'
      });
    }

    const catalog = await Catalog.create({
      itemId,
      isListed: isListed !== undefined ? isListed : true,
      order: order || 0
    });

    const populatedCatalog = await Catalog.findById(catalog._id).populate('itemId');

    res.status(201).json({
      success: true,
      data: populatedCatalog
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update catalog item
// @route   PUT /api/catalog/:id
// @access  Private
export const updateCatalog = async (req, res) => {
  try {
    let catalog = await Catalog.findById(req.params.id);

    if (!catalog) {
      return res.status(404).json({
        success: false,
        message: 'Catalog item not found'
      });
    }

    catalog = await Catalog.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    ).populate('itemId');

    res.status(200).json({
      success: true,
      data: catalog
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Remove item from catalog
// @route   DELETE /api/catalog/:id
// @access  Private
export const removeFromCatalog = async (req, res) => {
  try {
    const catalog = await Catalog.findById(req.params.id);

    if (!catalog) {
      return res.status(404).json({
        success: false,
        message: 'Catalog item not found'
      });
    }

    await catalog.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Item removed from catalog'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
