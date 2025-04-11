const express = require("express");
const orderController = require('../controllers/orderController');
const {analyzeFeedback} = require('../services/feedbackAnalyzer');
const Order = require("../models/orderModel");
const FoodItem = require("../models/foodItem");


const router = express.Router();

// Place a new order
router.post("/", orderController.createOrder); 



// Get recent orders (for home screen)
router.get('/recent', orderController.getRecentOrders);

// Get all orders (for "ALL ORDERS" button)
router.get('/', orderController.getAllOrders);
 
 

//  chef orders endpoint
router.get('/chef', async (req, res) => {
    try {
      const { analyze } = req.query;
      const statusFilter = ['pending', 'preparing'];
  
      // Base query
      let orders = await Order.find({ status: { $in: statusFilter } })
        .sort({ createdAt: 1 })
        .populate('user', 'name email')
        .populate('items.foodItemId', 'name price')
        .lean(); // Using lean() for better performance
  
      // Add user feedback analysis if requested
      if (analyze === 'true') {
        orders = await enhanceOrdersWithUserAnalysis(orders);
      }
  
      res.status(200).json(orders);
    } catch (error) {
      console.error('Error fetching chef orders:', error);
      res.status(500).json({ message: 'Failed to fetch orders', error: error.message });
    }
  });
  
  // Helper function to add user analysis to orders
  async function enhanceOrdersWithUserAnalysis(orders) {
    return Promise.all(
      orders.map(async (order) => {
        try {
          const userAnalysis = await analyzeUserFeedbackHistory(order.user._id);
          
          // Add relevant items from current order to the analysis
          const currentOrderItems = order.items.map(item => ({
            name: item.name,
            foodItemId: item.foodItemId,
            quantity: item.quantity
          }));
          
          return {
            ...order,
            userAnalysis: {
              ...userAnalysis,
              currentOrderItems,
              // Flag if any disliked items are in current order
              hasDislikedItems: userAnalysis.dislikedItems?.some(disliked => 
                currentOrderItems.some(item => item.name.includes(disliked))
              ),
              // Flag if any preferred items are in current order
              hasPreferredItems: userAnalysis.preferredItems?.some(preferred => 
                currentOrderItems.some(item => item.name.includes(preferred))
              )
            }
          };
        } catch (error) {
          console.error(`Error analyzing user ${order.user._id}:`, error);
          return {
            ...order,
            userAnalysis: {
              summary: "Error analyzing customer history",
              recommendations: ["Prepare with standard care"],
              isError: true
            }
          };
        }
      })
    );
  }
  












  
// PATCH /orders/:id/status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'preparing', 'ready', 'completed'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status, updatedAt: new Date() },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.status(200).json(order);
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ message: 'Failed to update order', error: error.message });
  }
});

 


module.exports = router;
