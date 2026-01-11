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
        locationInfo: 'Jl. Karang Bayan, Sigerongan, Kec. Lingsar, Kabupaten Lombok Barat, Nusa Tenggara Bar. 83237',
        contactPersons: [
          {
            name: 'Heru Atmojo',
            email: 'atmojohero69@gmail.com',
            phone: '+628123522860'
          },
          {
            name: 'Mawardi',
            email: 'mawardi2455@gmail.com',
            phone: '+6281237332540'
          },
          {
            name: 'Diah',
            email: 'diahkurniyaty3@gmail.com',
            phone: '+6287730221343'
          }
        ]
      });
    }

    // Set cache-busting headers to ensure fresh data
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');

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
    const { companyName, address, locationInfo, contactPersons, footerLogo } = req.body;

    // Validate required fields
    if (!companyName || !address) {
      return res.status(400).json({
        success: false,
        message: 'Please provide company name and address'
      });
    }

    // Validate contact persons
    if (!Array.isArray(contactPersons) || contactPersons.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide at least one contact person'
      });
    }

    // Validate each contact person
    for (const contact of contactPersons) {
      if (!contact.name || !contact.email || !contact.phone) {
        return res.status(400).json({
          success: false,
          message: 'Each contact person must have name, email, and phone'
        });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(contact.email)) {
        return res.status(400).json({
          success: false,
          message: `Invalid email format for contact person: ${contact.name}`
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
        locationInfo: locationInfo || address,
        contactPersons,
        footerLogo: footerLogo || null
      });
    } else {
      // Update existing settings
      settings.companyName = companyName;
      settings.address = address;
      settings.locationInfo = locationInfo || address;
      settings.contactPersons = contactPersons;
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
