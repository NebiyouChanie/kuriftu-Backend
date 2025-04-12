const Order = require("../models/orderModel");
const FoodItem = require("../models/foodItem");
const User = require("../models/userModel");
const Category = require("../models/categoryModel");

// Food Analysis by Category
exports.getFoodAnalysisByCategory = async (req, res) => {
  try {
    const result = await FoodItem.aggregate([
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "categoryInfo"
        }
      },
      { $unwind: "$categoryInfo" },
      {
        $group: {
          _id: "$categoryInfo.name",
          averageRating: { $avg: "$rating" },
          totalItems: { $sum: 1 },
          totalFeedback: { $sum: { $size: "$feedback" } },
          topRatedItem: { 
            $max: {
              name: "$name",
              rating: "$rating",
              imageUrl: "$imageUrl"
            }
          }
        }
      },
      { $sort: { averageRating: -1 } }
    ]);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

// Monthly Order Analysis
exports.getMonthlyOrderAnalysis = async (req, res) => {
  try {
    const { year, month } = req.params;
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const orders = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: "$totalPrice" },
          averageOrderValue: { $avg: "$totalPrice" }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const statusCounts = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        dailyStats: orders,
        statusDistribution: statusCounts,
        month: startDate.toLocaleString('default', { month: 'long' }),
        year
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

// Waiter Rating Analysis
exports.getWaiterRatingAnalysis = async (req, res) => {
  try {
    const waiters = await User.aggregate([
      { $match: { role: "waiter" } },
      {
        $project: {
          name: { $concat: ["$firstName", " ", "$lastName"] },
          averageRating: 1,
          totalFeedback: { $size: "$feedback" },
          feedback: 1
        }
      },
      { $sort: { averageRating: -1 } }
    ]);

    const overallStats = await User.aggregate([
      { $match: { role: "waiter" } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: "$averageRating" },
          totalWaiters: { $sum: 1 },
          totalFeedback: { $sum: { $size: "$feedback" } }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        waiters,
        overallStats: overallStats[0] || {
          averageRating: 0,
          totalWaiters: 0,
          totalFeedback: 0
        }
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

// Food Rating Analysis
exports.getFoodRatingAnalysis = async (req, res) => {
  try {
    const foods = await FoodItem.aggregate([
      {
        $project: {
          name: 1,
          imageUrl: 1,
          rating: 1,
          totalFeedback: { $size: "$feedback" },
          category: 1
        }
      },
      { $sort: { rating: -1 } }
    ]);


    const overallStats = await FoodItem.aggregate([
        {
          $group: {
            _id: null,
            averageRating: { $avg: "$rating" },
            totalItems: { $sum: 1 },
            totalFeedback: { $sum: { $size: "$feedback" } }
          }
        }
      ]);
  
      const ratingDistribution = await FoodItem.aggregate([
        {
          $bucket: {
            groupBy: "$rating",
            boundaries: [0, 1, 2, 3, 4, 5],
            default: "other",
            output: {
              count: { $sum: 1 }
            }
          }
        }
      ]);
  
      res.json({
        success: true,
        data: {
          foods,
          overallStats: overallStats[0] || {
            averageRating: 0,
            totalItems: 0,
            totalFeedback: 0
          },
          ratingDistribution
        }
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, error: "Server error" });
    }
  };
  
  // Combined Dashboard Analytics
  exports.getDashboardAnalytics = async (req, res) => {
    try {
      const currentDate = new Date();
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      
      // Get all analytics in parallel
      const [
        foodCategoryAnalysis,
        monthlyOrderAnalysis,
        waiterRatingAnalysis,
        foodRatingAnalysis
      ] = await Promise.all([
        this.getFoodAnalysisByCategory({}, { json: () => {} }), // Mock response object
        this.getMonthlyOrderAnalysis(
          { params: { year: currentDate.getFullYear(), month: currentDate.getMonth() + 1 } }, 
          { json: () => {} }
        ),
        this.getWaiterRatingAnalysis({}, { json: () => {} }),
        this.getFoodRatingAnalysis({}, { json: () => {} })
      ]);
  
      res.json({
        success: true,
        data: {
          foodCategoryAnalysis,
          monthlyOrderAnalysis,
          waiterRatingAnalysis,
          foodRatingAnalysis
        }
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, error: "Server error" });
    }
  };
  