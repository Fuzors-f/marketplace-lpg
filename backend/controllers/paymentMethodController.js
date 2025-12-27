import PaymentMethod from '../models/PaymentMethod.js';

// @desc    Get all payment methods
// @route   GET /api/payment-methods
// @access  Public
export const getPaymentMethods = async (req, res) => {
  try {
    const filter = req.query.active === 'true' ? { active: true } : {};
    const paymentMethods = await PaymentMethod.find(filter).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: paymentMethods.length,
      data: paymentMethods
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get single payment method
// @route   GET /api/payment-methods/:id
// @access  Public
export const getPaymentMethod = async (req, res) => {
  try {
    const paymentMethod = await PaymentMethod.findById(req.params.id);

    if (!paymentMethod) {
      return res.status(404).json({
        success: false,
        message: 'Payment method not found'
      });
    }

    res.status(200).json({
      success: true,
      data: paymentMethod
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Create payment method
// @route   POST /api/payment-methods
// @access  Private
export const createPaymentMethod = async (req, res) => {
  try {
    const { name, type, accountNumber, accountName, qrCode, instructions, active } = req.body;

    if (!name || !type) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name and type'
      });
    }

    const paymentMethod = await PaymentMethod.create({
      name,
      type,
      accountNumber: accountNumber || '',
      accountName: accountName || '',
      qrCode: qrCode || '',
      instructions: instructions || '',
      active: active !== undefined ? active : true
    });

    res.status(201).json({
      success: true,
      data: paymentMethod
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update payment method
// @route   PUT /api/payment-methods/:id
// @access  Private
export const updatePaymentMethod = async (req, res) => {
  try {
    let paymentMethod = await PaymentMethod.findById(req.params.id);

    if (!paymentMethod) {
      return res.status(404).json({
        success: false,
        message: 'Payment method not found'
      });
    }

    paymentMethod = await PaymentMethod.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      success: true,
      data: paymentMethod
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Delete payment method
// @route   DELETE /api/payment-methods/:id
// @access  Private
export const deletePaymentMethod = async (req, res) => {
  try {
    const paymentMethod = await PaymentMethod.findById(req.params.id);

    if (!paymentMethod) {
      return res.status(404).json({
        success: false,
        message: 'Payment method not found'
      });
    }

    await paymentMethod.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Payment method deleted successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
