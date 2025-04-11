const orderService = require("../services/orderServices");
const asyncErrorHandler = require("../middleware/asyncErrorHandler");
const Order = require("../models/orderModel");
const FoodItem = require("../models/foodItem");

exports.createOrder = async (req, res) => {
  try {
    const { userId, items } = req.body;

    // Validate input
    if (!userId || !items || !Array.isArray(items)) {
      return res.status(400).json({
        success: false,
        message: "userId and items array are required"
      });
    }

    // Verify items and calculate total
    let totalPrice = 0;
    const verifiedItems = [];
    
    for (const item of items) {
      const { foodItemId, quantity, removedIngredients, specialInstructions } = item;
      
      // Basic validation
      if (!foodItemId || !quantity) {
        return res.status(400).json({
          success: false,
          message: "Each item must have foodItemId and quantity"
        });
      }

      // Get food item details
      const foodItem = await FoodItem.findById(foodItemId);
      if (!foodItem) {
        return res.status(404).json({
          success: false,
          message: `Food item ${foodItemId} not found`
        });
      }

      // Check stock
      if (!foodItem.isInStock) {
        return res.status(400).json({
          success: false,
          message: `${foodItem.name} is out of stock`
        });
      }

      // Validate ingredients
      if (removedIngredients) {
        const invalidIngredients = removedIngredients.filter(
          ing => !foodItem.ingredients.includes(ing)
        );
        if (invalidIngredients.length > 0) {
          return res.status(400).json({
            success: false,
            message: `Invalid ingredients for ${foodItem.name}: ${invalidIngredients.join(", ")}`
          });
        }
      }

      // Add to verified items
      verifiedItems.push({
        foodItemId,
        name: foodItem.name,
        quantity,
        price: foodItem.price,
        removedIngredients: removedIngredients || [],
        specialInstructions: specialInstructions || ""
      });

      totalPrice += foodItem.price * quantity;
    }

    // Create order
    const order = new Order({
      user: userId,
      items: verifiedItems,
      totalPrice,
      status: "pending"
    });

    await order.save();

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: order
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

exports.getUserOrders = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const orders = await Order.find({ user: userId })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: orders
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};



// const Order = require('../models/Order');

exports.getRecentOrders = async (req, res) => {
  try {
    // Get last 5 orders, sorted by newest first
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('user', 'firstName lastName') // Populate user info
      .lean(); // Convert to plain JS object

    // Format the data for Flutter app
    const formattedOrders = recentOrders.map(order => ({
      id: order._id,
      userName: order.user 
        ? `${order.user.firstName} ${order.user.lastName}`
        : 'Guest',
      items: order.items.map(item => item.name).join(', '),
      time: formatTimeAgo(order.createdAt),
      status: order.status
    }));

    res.status(200).json({
      success: true,
      data: formattedOrders
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

exports.getAllOrders = async (req, res) => {
  try {
    // Get all orders, sorted by newest first
    const allOrders = await Order.find()
      .sort({ createdAt: -1 })
      .populate('user', 'firstName lastName')
      .lean();

    // Format the data
    const formattedOrders = allOrders.map(order => ({
      id: order._id,
      userName: order.user 
        ? `${order.user.firstName} ${order.user.lastName}`
        : 'Guest',
      items: order.items.map(item => item.name).join(', '),
      time: formatTimeAgo(order.createdAt),
      status: order.status,
      totalPrice: order.totalPrice
    }));

    res.status(200).json({
      success: true,
      data: formattedOrders
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Helper function to format time as "X Min Ago"
function formatTimeAgo(date) {
  const now = new Date();
  const diffInMinutes = Math.floor((now - date) / (1000 * 60));
  
  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes} Min Ago`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} Hour${diffInHours > 1 ? 's' : ''} Ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays} Day${diffInDays > 1 ? 's' : ''} Ago`;
}




 