const asyncErrorHandler = require("../middleware/asyncErrorHandler");
const foodItemService = require("../services/foodItemService");

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
