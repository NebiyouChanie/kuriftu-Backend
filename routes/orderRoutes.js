const express = require("express");
const orderController = require('../controllers/orderController');
// const { authMiddleware } = require('../middleware/authMiddleware');
// const validateRequest = require('../middleware/validateRequest');
// const orderSchema = require('../validation/orderValidator');
// const { adminAuth } = require('../middleware/adminAuth');

const router = express.Router();

// Place a new order
router.post("/", orderController.createOrder); 

// Get all orders
router.get("/", orderController.getAllOrders); 

// Get order details by ID
router.get("/:id", orderController.getOrderDetails); 

// Delete order by ID
router.delete("/:id", orderController.deleteOrder); 

// Get order history for a user
router.get("/history/:userId", orderController.getOrderHistory); 

// Update order 
router.patch("/:id", orderController.updateOrder); 

//confirm OrderStatus
router.patch("/confirm/:id",orderController.confirmOrder);

//cancel OrderStatus
router.patch("/cancel/:id",orderController.cancelOrder);


module.exports = router;
