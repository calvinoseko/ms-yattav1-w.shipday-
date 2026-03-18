
const User = require('../models/User');

class ProfileService {
  
  async getProfile(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  async updateProfile(userId, updateData) {
    const user = await User.findById(userId);
    
    if (!user) {
        throw new Error('User not found');
    }

    // Direct fields
    if (updateData.name) user.name = updateData.name;
    if (updateData.phone) user.phone = updateData.phone;
    if (updateData.avatar) user.avatar = updateData.avatar;

    // Handle Address Update
    if (updateData.address) {
        const { street, city, country, latitude, longitude } = updateData.address;
        
        // Prepare new address object
        const newAddressData = {
            street,
            city,
            country,
            latitude,
            longitude,
            label: 'Home',
            isDefault: true // Profile updates usually imply primary address
        };

        // If setting as default, unset others
        if (newAddressData.isDefault) {
            user.savedAddresses.forEach(a => a.isDefault = false);
        }

        // Check if we are updating an existing "Home" address or adding a new one
        const homeIndex = user.savedAddresses.findIndex(a => a.label === 'Home');

        if (homeIndex !== -1) {
            // Update existing Home address
            user.savedAddresses[homeIndex] = { 
                ...user.savedAddresses[homeIndex].toObject(), 
                ...newAddressData 
            };
        } else {
            // Add new address
            user.savedAddresses.push(newAddressData);
        }
    }

    await user.save();
    return user;
  }

  async changePassword(userId, currentPassword, newPassword) {
    const user = await User.findById(userId).select('+password');
    
    if (!(await user.matchPassword(currentPassword))) {
      throw new Error('Incorrect current password');
    }

    user.password = newPassword;
    await user.save();

    return user.getSignedJwtToken();
  }
}

module.exports = new ProfileService();
