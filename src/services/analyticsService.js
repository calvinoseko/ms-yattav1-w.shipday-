
const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Event = require('../models/Event');

class AnalyticsService {
  
  // Helper: Format data for Frontend Graphs (Chart.js / Recharts style)
  formatForGraph(labels, datasetLabel, dataPoints) {
    return {
      labels,
      datasets: [
        {
          label: datasetLabel,
          data: dataPoints,
          // Add default styling hooks here if needed
        }
      ]
    };
  }

  // 1. Dashboard Overview
  async getDashboardOverview() {
    const totalUsers = await User.countDocuments({ role: 'customer' });
    const totalOrders = await Order.countDocuments();
    const totalProducts = await Product.countDocuments({ status: 'active' });
    const totalCategories = await Category.countDocuments({ isActive: true });

    // Revenue Aggregation
    const revenueAgg = await Order.aggregate([
      { $match: { status: { $in: ['paid', 'shipped', 'delivered'] } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    const totalRevenue = revenueAgg.length > 0 ? revenueAgg[0].total : 0;

    // Today's metrics
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    
    const todayAgg = await Order.aggregate([
      { 
        $match: { 
          createdAt: { $gte: startOfDay },
          status: { $in: ['paid', 'shipped', 'delivered'] } 
        } 
      },
      { 
        $group: { 
          _id: null, 
          revenue: { $sum: '$totalAmount' },
          count: { $sum: 1 }
        } 
      }
    ]);

    return {
      totalUsers,
      totalOrders,
      totalRevenue,
      totalProducts,
      totalCategories,
      todayRevenue: todayAgg.length > 0 ? todayAgg[0].revenue : 0,
      todayOrders: todayAgg.length > 0 ? todayAgg[0].count : 0
    };
  }

  // 2. Real-Time Analytics (New)
  async getRealTimeAnalytics() {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

    // Active Users (based on events in last 5 mins)
    const activeUsers = await Event.distinct('userId', {
      createdAt: { $gte: fiveMinutesAgo },
      userId: { $ne: null }
    });

    // Live Orders (Pending orders created in last 30 mins)
    const liveOrdersCount = await Order.countDocuments({
      createdAt: { $gte: thirtyMinutesAgo },
      status: 'pending'
    });

    // Top Viewed Products (Last 30 mins)
    const topViews = await Event.aggregate([
      { 
        $match: { 
          eventType: 'view_product', 
          createdAt: { $gte: thirtyMinutesAgo } 
        } 
      },
      { $group: { _id: '$entityId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      { $project: { name: '$product.name', views: '$count' } }
    ]);

    return {
      activeUsersCount: activeUsers.length,
      liveOrdersCount,
      topViewedProducts: this.formatForGraph(
        topViews.map(t => t.name),
        'Real-time Views',
        topViews.map(t => t.views)
      )
    };
  }

  // 3. Sales Analytics (Updated with Graph Format)
  async getSalesAnalytics({ startDate, endDate, groupBy }) {
    const matchStage = {
      status: { $in: ['paid', 'shipped', 'delivered'] }
    };

    if (startDate && endDate) {
      matchStage.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Determine date format based on groupBy
    let format = '%Y-%m-%d';
    if (groupBy === 'month') format = '%Y-%m';
    if (groupBy === 'week') format = '%Y-W%V';

    const results = await Order.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: { $dateToString: { format, date: '$createdAt' } },
          revenue: { $sum: '$totalAmount' },
          ordersCount: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    return this.formatForGraph(
      results.map(r => r._id),
      'Revenue',
      results.map(r => r.revenue)
    );
  }

  // 4. Product Performance (Updated to be cleaner)
  async getProductPerformance() {
    // Top Selling
    const topSelling = await Product.find()
      .sort({ soldCount: -1 })
      .limit(10)
      .select('name price soldCount stock images');

    // Low Stock
    const lowStock = await Product.find({ 
      stock: { $lte: 5, $gt: 0 }, 
      status: 'active' 
    }).select('name stock');

    // Out of Stock
    const outOfStock = await Product.find({ 
      stock: 0, 
      status: { $ne: 'archived' } 
    }).countDocuments();

    return {
      topSelling: this.formatForGraph(
        topSelling.map(p => p.name),
        'Units Sold',
        topSelling.map(p => p.soldCount)
      ),
      lowStock,
      outOfStockCount: outOfStock
    };
  }

  // 5. Category Performance (Updated with Graph Format)
  async getCategoryPerformance() {
    const results = await Product.aggregate([
      { $unwind: '$categories' },
      {
        $lookup: {
          from: 'categories',
          localField: 'categories',
          foreignField: '_id',
          as: 'categoryInfo'
        }
      },
      { $unwind: '$categoryInfo' },
      {
        $group: {
          _id: '$categoryInfo.name',
          productCount: { $sum: 1 },
          totalSold: { $sum: '$soldCount' }
        }
      },
      { $sort: { totalSold: -1 } }
    ]);

    return this.formatForGraph(
      results.map(c => c._id),
      'Total Sold',
      results.map(c => c.totalSold)
    );
  }

  // 6. User Analytics
  async getUserAnalytics() {
    // New users over last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const newUsers = await User.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo }, role: 'customer' } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    return {
      userGrowth: this.formatForGraph(
        newUsers.map(u => u._id),
        'New Users',
        newUsers.map(u => u.count)
      )
    };
  }
}

module.exports = new AnalyticsService();
