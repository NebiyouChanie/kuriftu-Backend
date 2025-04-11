const asyncErrorHandler = require("../middleware/asyncErrorHandler");
const foodItemService = require("../services/foodItemService");
const FoodItem = require("../models/foodItem");

// GET ALL FOOD ITEMS
exports.getAllFoodItems = asyncErrorHandler(async (req, res) => {
  const foodItems = await foodItemService.queryAllFoodItems();
  res.status(200).json({
    success: true,
    data: foodItems,
  });
});

// GET SINGLE FOOD ITEM
exports.getSingleFoodItem = asyncErrorHandler(async (req, res, next) => {
  const foodItem = await foodItemService.querySingleFoodItem(req.params.id);
  res.status(200).json({
    success: true,
    data: foodItem,
  });
});

// ADD FOOD ITEM
exports.addFoodItem = asyncErrorHandler(async (req, res) => {
  const newFoodItem = await foodItemService.insertFoodItem(req.body);
  res.status(201).json({
    success: true,
    message: "Food item added successfully",
    data: newFoodItem,
  });
});

// DELETE FOOD ITEM
exports.deleteFoodItem = asyncErrorHandler(async (req, res) => {
  const deletedFoodItem = await foodItemService.deleteItem(req.params.id);
  res.status(204).json({
    success: true,
    message: "Food item deleted successfully",
  });
});

// UPDATE FOOD ITEM
exports.updateFoodItem = asyncErrorHandler(async (req, res) => {
  const updatedFoodItem = await foodItemService.updateItem(req.params.id, req.body);
  res.status(200).json({
    success: true,
    message: "Food item updated successfully",
    data: updatedFoodItem,
  });
});


//ADD Feedback


exports.addFeedback = async (req, res) => {
  try {
    const { userId, foodItemId, comment, rating, feedbacks } = req.body;

    // Determine if this is a single or multiple feedback request
    const isBulkRequest = Array.isArray(feedbacks);

    // Validate input
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'UserId is required'
      });
    }

    if (!isBulkRequest && !foodItemId) {
      return res.status(400).json({
        success: false,
        message: 'Either foodItemId or feedbacks array is required'
      });
    }

    // Process single feedback
    if (!isBulkRequest) {
      return await processSingleFeedback(res, userId, foodItemId, comment, rating);
    }

    // Process multiple feedbacks
    return await processMultipleFeedbacks(res, userId, feedbacks);

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Helper function for single feedback
async function processSingleFeedback(res, userId, foodItemId, comment, rating) {
  // Validate rating
  if (rating === undefined || rating < 0 || rating > 5) {
    return res.status(400).json({
      success: false,
      message: 'Valid rating (0-5) is required'
    });
  }

  try {
    const foodItem = await FoodItem.findById(foodItemId);
    if (!foodItem) {
      return res.status(404).json({
        success: false,
        message: 'Food item not found'
      });
    }

    const newFeedback = {
      userId,
      comment: comment || '',
      rating,
      createdAt: new Date()
    };

    foodItem.feedback.push(newFeedback);
    updateAverageRating(foodItem);
    await foodItem.save();

    return res.status(201).json({
      success: true,
      message: 'Feedback added successfully',
      data: newFeedback
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error processing feedback',
      error: error.message
    });
  }
}

// Helper function for multiple feedbacks
async function processMultipleFeedbacks(res, userId, feedbacks) {
  const results = [];
  const errors = [];

  for (const feedback of feedbacks) {
    try {
      const { foodItemId, comment, rating } = feedback;

      // Validate individual feedback
      if (!foodItemId || rating === undefined) {
        errors.push({
          foodItemId,
          error: 'foodItemId and rating are required for each feedback'
        });
        continue;
      }

      if (rating < 0 || rating > 5) {
        errors.push({
          foodItemId,
          error: 'Rating must be between 0 and 5'
        });
        continue;
      }

      const foodItem = await FoodItem.findById(foodItemId);
      if (!foodItem) {
        errors.push({
          foodItemId,
          error: 'Food item not found'
        });
        continue;
      }

      const newFeedback = {
        userId,
        comment: comment || '',
        rating,
        createdAt: new Date()
      };

      foodItem.feedback.push(newFeedback);
      updateAverageRating(foodItem);
      await foodItem.save();

      results.push({
        foodItemId,
        success: true,
        feedback: newFeedback
      });

    } catch (error) {
      errors.push({
        foodItemId: feedback?.foodItemId,
        error: error.message
      });
    }
  }

  return res.status(errors.length === 0 ? 200 : 207).json({
    success: errors.length === 0,
    message: errors.length === 0 
      ? 'All feedbacks added successfully' 
      : errors.length === feedbacks.length
        ? 'No feedbacks were added'
        : 'Some feedbacks could not be added',
    results,
    errors
  });
}

// Helper function to update average rating
function updateAverageRating(foodItem) {
  const totalRatings = foodItem.feedback.reduce((sum, fb) => sum + fb.rating, 0);
  foodItem.rating = totalRatings / foodItem.feedback.length;
}