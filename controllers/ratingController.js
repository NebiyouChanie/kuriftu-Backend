const FoodItem = require("../models/foodItem");

const User = require("../models/userModel");
// Get average rating and feedback for a single food item
exports.getFoodItemRating = async (req, res) => {
  try {
    const foodItemId = req.params.id;
    
    const foodItem = await FoodItem.findById(foodItemId)
      .select('name feedback rating')
      .populate('feedback.userId', 'name'); // populate user info if needed

    if (!foodItem) {
      return res.status(404).json({ message: "Food item not found" });
    }

    res.json({
      foodItemId: foodItem._id,
      name: foodItem.name,
      averageRating: foodItem.rating,
      totalReviews: foodItem.feedback.length,
      feedback: foodItem.feedback
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get overall service rating (average of all food items)
exports.getOverallServiceRating = async (req, res) => {
  try {
    const result = await FoodItem.aggregate([
      {
        $group: {
          _id: null,
          averageRating: { $avg: "$rating" },
          totalFoodItems: { $sum: 1 },
          totalReviews: { $sum: { $size: "$feedback" } }
        }
      }
    ]);

    if (result.length === 0) {
      return res.json({
        averageRating: 0,
        totalFoodItems: 0,
        totalReviews: 0
      });
    }

    res.json({
      averageRating: result[0].averageRating.toFixed(1),
      totalFoodItems: result[0].totalFoodItems,
      totalReviews: result[0].totalReviews
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};



// Get rating and feedback for a specific waiter
exports.getWaiterRating = async (req, res) => {
  try {
    const waiterId = req.params.id;
    
    const waiter = await User.findById(waiterId)
      .select('firstName lastName averageRating feedback role')
      .populate('feedback.fromUserId', 'firstName lastName');

    if (!waiter || waiter.role !== 'waiter') {
      return res.status(404).json({ message: "Waiter not found" });
    }

    res.json({
      waiterId: waiter._id,
      name: `${waiter.firstName} ${waiter.lastName}`,
      averageRating: waiter.averageRating,
      totalReviews: waiter.feedback.length,
      feedback: waiter.feedback
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get overall rating for all waiters
exports.getOverallWaitersRating = async (req, res) => {
  try {
    const result = await User.aggregate([
      { $match: { role: 'waiter' } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: "$averageRating" },
          totalWaiters: { $sum: 1 },
          totalReviews: { $sum: { $size: "$feedback" } }
        }
      }
    ]);

    if (result.length === 0) {
      return res.json({
        averageRating: 0,
        totalWaiters: 0,
        totalReviews: 0
      });
    }

    res.json({
      averageRating: result[0].averageRating.toFixed(1),
      totalWaiters: result[0].totalWaiters,
      totalReviews: result[0].totalReviews
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Helper function to update waiter's average rating (call this when adding new feedback)
exports.updateWaiterRating = async (waiterId) => {
  const waiter = await User.findById(waiterId);
  if (!waiter || waiter.feedback.length === 0) return;
  
  const totalRating = waiter.feedback.reduce((sum, feedback) => sum + feedback.rating, 0);
  waiter.averageRating = totalRating / waiter.feedback.length;
  await waiter.save();
};
