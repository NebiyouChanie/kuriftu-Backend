const { analyzeUserFeedbackHistory } = require('../services/feedbackAnalyzer');
const FoodItem = require('../models/foodItem');

// Get comprehensive user feedback analysis
exports.getUserFeedbackAnalysis = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const analysis = await analyzeUserFeedbackHistory(userId);
    
    // Get all food items the user has rated
    const ratedFoodItems = await FoodItem.find({
      'feedback.userId': userId
    }).select('name price category dietaryTags feedback.$');
    
    res.status(200).json({
      ...analysis,
      ratedFoodItems: ratedFoodItems.map(item => ({
        _id: item._id,
        name: item.name,
        price: item.price,
        category: item.category,
        dietaryTags: item.dietaryTags,
        userRating: item.feedback[0].rating,
        userComment: item.feedback[0].comment,
        ratedAt: item.feedback[0].createdAt
      }))
    });
  } catch (error) {
    console.error('Error getting user feedback analysis:', error);
    res.status(500).json({ 
      message: 'Failed to analyze user feedback',
      error: error.message 
    });
  }
};