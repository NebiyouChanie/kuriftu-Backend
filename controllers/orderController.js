const orderService = require("../services/orderServices");
const asyncErrorHandler = require("../middleware/asyncErrorHandler");

// Place a new order
exports.createOrder = asyncErrorHandler(async (req, res) => {
  const orderData = req.body;
  const order = await orderService.createOrder(orderData);
  res.status(201).json(order);
});

// Get All order
exports.getAllOrders = asyncErrorHandler(async (req, res) => {
  const orders = await orderService.getAllOrders();
  res.status(200).json({
    success:true,
    data:orders
  });
});

// Get order details by ID
exports.getOrderDetails = asyncErrorHandler(async (req, res) => {
  const orderId = req.params.id;
  const order = await orderService.getOrderDetails(orderId);
  res.status(200).json(
    {
      success:true,
      data:order
    });
});

// Delete order by ID
exports.deleteOrder = asyncErrorHandler(async (req, res) => {
  const orderId = req.params.id;
  const order = await orderService.deleteOrder(orderId);
  res.status(204).json();
});

// Get order history for a user
exports.getOrderHistory = asyncErrorHandler(async (req, res) => {
  const userId = req.params.userId;
  const history = await orderService.getOrderHistory(userId);
  res.status(200).json(history);
});

// Update order  
exports.updateOrder = asyncErrorHandler(async (req, res) => {
  const orderId = req.params.id;
  const updatedOrder = await orderService.updateOrder(orderId, req.body);
  res.status(200).json(updatedOrder);
});


//   confirmOrder
  exports.confirmOrder = asyncErrorHandler(async (req, res) => {
    const { id } = req.params;
    const order = await orderService.confirmOrder(id);
    res.status(200).json({ 
        message: "Order confirmed successfully.", 
        data:order 
    });
  });
  

  //cancel order
  exports.cancelOrder = asyncErrorHandler(async (req, res) => {
    const { id } = req.params;
   
    const order  = await orderService.cancelOrder(id);
  
    res.status(200).json({ 
        message: "Order cancelled successfully.", 
        data:order 
    });
  });
  
  




