import Settings from '../models/Settings.js';

// @desc    Get company settings
// @route   GET /api/settings
// @access  Public
export const getSettings = async (req, res) => {
  try {
    // Get the first (and should be only) settings document
    let settings = await Settings.findOne();
    
    // If no settings exist, create default settings
    if (!settings) {
      settings = await Settings.create({
        companyName: 'PT. Unggul Migas Sejati',
        address: 'Jl. Karang Bayan, Sigerongan, Kec. Lingsar, Kabupaten Lombok Barat, Nusa Tenggara Bar. 83237',
        contactPerson: 'Budi Pekerti',
        phone: '+628117584566',
        email: 'budi@gmail.com',
        location: 'Jl. Karang Bayan, Sigerongan, Kec. Lingsar, Kabupaten Lombok Barat, Nusa Tenggara Bar. 83237'
      });
    }

    res.status(200).json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching settings'
    });
  }
};

// @desc    Update company settings (Admin only)
// @route   PUT /api/admin/settings
// @access  Private/Admin
export const updateSettings = async (req, res) => {
  try {
    const { companyName, address, contactPerson, phone, email, location, footerLogo } = req.body;

    // Validate required fields
    if (!companyName || !address || !contactPerson || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Please provide company name, address, contact person, and phone'
      });
    }

    // Validate email format if provided
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid email address'
        });
      }
    }

    // Get the first settings document or create if doesn't exist
    let settings = await Settings.findOne();
    
    if (!settings) {
      // Create new settings
      settings = await Settings.create({
        companyName,
        address,
        contactPerson,
        phone,
        email: email || 'budi@gmail.com',
        location: location || address,
        footerLogo: footerLogo || null
      });
    } else {
      // Update existing settings
      settings.companyName = companyName;
      settings.address = address;
      settings.contactPerson = contactPerson;
      settings.phone = phone;
      settings.email = email || settings.email;
      settings.location = location || address;
      if (footerLogo !== undefined) {
        settings.footerLogo = footerLogo;
      }
      
      await settings.save();
    }

    res.status(200).json({
      success: true,
      message: 'Settings updated successfully',
      data: settings
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating settings'
    });
  }
};
