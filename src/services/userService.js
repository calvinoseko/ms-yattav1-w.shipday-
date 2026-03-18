
const User = require('../models/User');

class UserService {
  
  async getAllUsers(query) {
    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;

    // Filtering
    const filter = {};
    if (query.role) filter.role = query.role;
    if (query.isActive !== undefined) filter.isActive = query.isActive === 'true';

    const users = await User.find(filter)
      .skip(startIndex)
      .limit(limit)
      .sort('-createdAt');

    const total = await User.countDocuments(filter);

    return {
      data: users,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async updateUserStatus(userId, isActive) {
    const user = await User.findByIdAndUpdate(
      userId, 
      { isActive }, 
      { new: true, runValidators: true }
    );
    
    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }
}

module.exports = new UserService();
