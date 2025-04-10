const Order = require("../models/orderModel");
const FoodItem = require("../models/foodItem");
const User = require("../models/userModel");
const customError = require("../utils/CustomErrorhandlerClass");
 

// Place a new order
exports.createOrder = async (orderData) => {
  const { 
    firstName, lastName, phoneNumber, email, 
    orderType, subcity: inputSubcity, area: inputArea, foodItems 
  } = orderData;


  // Set subcity & area for Dine-In orders
  const subcity = orderType === "DineIn" ? "N/A" : inputSubcity;
  const area = orderType === "DineIn" ? "N/A" : inputArea;

  // Validate that foodItems is provided and not empty
  if (!foodItems || !Array.isArray(foodItems) || foodItems.length === 0) {
    throw new Error("At least one food item must be provided.");
  }

  // Set order status based on type
  const orderStatus = orderType === "DineIn" ? "Confirmed" : "Pending";

  // Validate required fields for delivery orders
  if (orderType === "Delivery" && (!firstName || !phoneNumber || !subcity || !area)) {
    throw new Error("For Delivery orders, firstName, phoneNumber, subcity, and area are required.");
  }

  let user = null;

  // Check if a user already exists
  if (phoneNumber || email) {
    console.log("Checking for existing user...");

    const query = { $or: [{ phoneNumber }] };
    if (email) query.$or.push({ email });

    user = await User.findOne(query);

    if (!user) {

      user = new User({ firstName, lastName, phoneNumber, email, subcity, area });

      try {
        await user.save();
      } catch (error) {
        throw new Error("Failed to create user.");
      }
    } else {
      console.log(" User already exists:", user);
    }
  }

  // Prepare customerInfo for the order
  const customerInfo = {
    name: user?.firstName || firstName  || "Guest",
    lastName: user?.lastName || lastName || "Guest",
    phoneNumber: phoneNumber || user?.phoneNumber || "0000000000",
    subcity: subcity || user?.subcity || "N/A",
    area: area || user?.area || "N/A",
    email: email || user?.email || null
  };

  // Order creation logic
  const orderDataToSave = {
    customer: user ? user._id : null, // Null for guest orders
    items: foodItems,
    orderType,
    customerInfo,
    subcity,
    area,
    orderStatus
  };

  // Create and save the order
  return await Order.create(orderDataToSave);
};

 

exports.updateOrder = async (orderId, updatedData) => {
  const {
      firstName, lastName, phoneNumber, email, 
      subcity, orderType, area, foodItems 
  } = updatedData;

  // Validate order existence
  let order = await Order.findById(orderId).populate("customer");
  if (!order) {
      throw new Error("Order not found.");
  }

  let user = order.customer;

  // Check if phone or email update is required
  if (phoneNumber || email) {
      // Find another user with the same phone/email  
      const existingUser = await User.findOne({
        $or: [
            phoneNumber ? { phoneNumber } : null,
            email ? { email } : null
        ].filter(Boolean),
        _id: { $ne: user?._id }
    });
    
      console.log("Found existing user:", existingUser);

      if (existingUser) {
          // If found update order's customer reference
          user = existingUser;
      } else if (!user) {
          // If no existing user and order has no customer, create a new user
          user = new User({ firstName, lastName, phoneNumber, email, area, subcity });
          await user.save();
      } else {
          // Update current user details
          user.firstName = firstName || user.firstName;
          user.lastName = lastName || user.lastName;
          user.phoneNumber = phoneNumber || user.phoneNumber;  
          user.email = email || user.email;
          user.area = area || user.area;
          user.subcity = subcity || user.subcity;
          await user.save();
      }

      // Assign the updated user to the order
      order.customer = user._id;
  }

  // Update customerInfo (only if it was previously "Unknown")
  if (order.customerInfo.name === "Guest" && firstName) {
      order.customerInfo = {
          name: firstName,
          lastName: lastName || order.customerInfo.lastName,
          phoneNumber: phoneNumber || order.customerInfo.phoneNumber,
          email: email || order.customerInfo.email,
          subcity: subcity || order.customerInfo.subcity,
          area: area || order.customerInfo.area
      };
  }

  // Validate and update food items
  if (foodItems && Array.isArray(foodItems) && foodItems.length > 0) {
      order.items = foodItems;
  }

  // Handle order type changes
  if (orderType) {
      if (orderType === "Delivery") {
          if (!firstName || !phoneNumber || !subcity || !area) {
              throw new Error("For Delivery orders, firstName, phoneNumber, subcity, and area are required.");
          }
          order.orderType = orderType;
          order.subcity = subcity;
          order.area = area;
      } else if (orderType === "DineIn") {
          order.orderType = orderType;
      } else {
          throw new Error("Invalid order type. Must be 'DineIn' or 'Delivery'.");
      }
  }

  // Save updated order
  await order.save();
  return order;
};





// Get all order
exports.getAllOrders = async () => {
  const order = await Order.find().populate("customer").sort({ createdAt: -1 });
  if (!order) {
    throw new customError("Orders not found", 404);
  }
  return order;
};


// Get order details by ID
exports.getOrderDetails = async (orderId) => {
  const order = await Order.findById(orderId).populate("items.foodItem").populate("customer",);;
  if (!order) {
    throw new customError("Order not found", 404);
  }
  return order;
};


// Delete order by ID
exports.deleteOrder = async (orderId) => {
  const order = await Order.findByIdAndDelete(orderId);
  if (!order) {
    throw new customError("Order not found", 404);
  }
  return order;
};


// Get order history for a user
exports.getOrderHistory = async (userId) => {
  const history = await Order.find({customer: userId });
  if (!history) {
    throw new customError("No orders found for this user", 404);
  }
  return history;
};


// Confirm a order
exports.confirmOrder = async (orderId) => {
  const order = await Order.findById(orderId);
  if (!order) {
    throw new customError("Order not found.", 404);
  }
  
  order.orderStatus = "Confirmed";
  await order.save();


  return order;
};


// Cancel a order
exports.cancelOrder = async (orderId) => {
  const order = await Order.findById(orderId);
  if (!order) {
    throw new customError("Order not found.", 404);
  }

  order.orderStatus = "Cancelled";
  await order.save();
   
  return order;
};

 