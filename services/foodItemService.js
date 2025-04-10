const FoodItem = require("../models/foodItem");
const Category = require("../models/categoryModel");
const customError = require("../utils/CustomErrorhandlerClass");

// GET ALL FOOD ITEMS
exports.queryAllFoodItems = async () => {
  return await FoodItem.find().populate("category");
};

// GET SINGLE FOOD ITEM
exports.querySingleFoodItem = async (id) => {
  const foodItem = await FoodItem.findById(id).populate("category");
  if (!foodItem) {
    throw new customError("Food item not found", 404);
  }
  return foodItem;
};

// ADD FOOD ITEM
exports.insertFoodItem = async (foodData) => {
  const foodItem = await FoodItem.findOne({name:foodData.name});
  if (foodItem) {
    throw new customError("Food item Already exist", 400);
  }
  const category = await Category.findById(foodData.category ); // Find category by name
    if (!category) {
      throw new customError("Category not found!", 400);
    }
  return await new FoodItem(foodData).save();
};

// DELETE FOOD ITEM
exports.deleteItem = async (id) => {
  const foodItem = await FoodItem.findById(id);
  if (!foodItem) {
    throw new customError("Food item not found", 404);
  }
  return await FoodItem.findByIdAndDelete(id);
};

// UPDATE FOOD ITEM
exports.updateItem = async (id, data) => {
  const updatedFoodItem = await FoodItem.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });
  if (!updatedFoodItem) {
    throw new customError("Food item not found", 404);
  }
  return updatedFoodItem;
};
