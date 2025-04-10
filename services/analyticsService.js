const moment = require("moment");
const Order = require("../models/orderModel");
const User = require('../models/userModel');  
const CustomError = require("../utils/CustomErrorhandlerClass");



exports.getMostOrderedLocations = async () => {
    // Aggregate by subcity + area for the table
    const locations = await Order.aggregate([
        { $match: { orderType: "Delivery" } },
        {
            $group: {
                _id: { subcity: "$customerInfo.subcity", area: "$customerInfo.area" },
                totalOrders: { $sum: 1 }
            }
        },
        { $sort: { totalOrders: -1 } },
        { $limit: 5 }
    ]);

    // Aggregate by subcity only for the bar chart
    const subcityOrders = await Order.aggregate([
        { $match: { orderType: "Delivery" } },
        {
            $group: {
                _id: "$customerInfo.subcity",
                totalOrders: { $sum: 1 }
            }
        },
        { $sort: { totalOrders: -1 } },
        { $limit: 5 }
    ]);

    if (!locations.length && !subcityOrders.length) {
        throw new CustomError("No delivery order data available.", 404);
    }

    return {
        tableData: locations.map(loc => ({
            subcity: loc._id.subcity,
            area: loc._id.area,
            totalOrders: loc.totalOrders
        })),
        chartData: subcityOrders.map(loc => ({
            subcity: loc._id,
            totalOrders: loc.totalOrders
        }))
    };
};


// top foods
exports.getTopOrderedFoods = async () => {
    const topFoods = await Order.aggregate([
        { $unwind: "$items" }, // Flatten items array
        {
            $group: {
                _id: "$items.foodItem",
                totalOrdered: { $sum: "$items.quantity" }
            }
        },
        { $sort: { totalOrdered: -1 } },
        { $limit: 5 },
        {
            $lookup: {
                from: "fooditems", // Match the FoodItem collection name
                localField: "_id",
                foreignField: "_id",
                as: "foodDetails"
            }
        },
        { $unwind: "$foodDetails" },
        {
            $project: {
                _id: 0,
                name: "$foodDetails.name",
                totalOrdered: 1
            }
        }
    ]);

    if (!topFoods.length) {
        throw new CustomError("No food order data available.", 404);
    }

    return topFoods;
};



 
const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Service to get order count by time (week, month, year)
exports.getOrdersByTime = async (timePeriod, selectedMonth, selectedYear) => {
  const now = new Date();
  let filteredOrders = [];

  switch (timePeriod) {
    case "week":
      // Get orders from the past 7 days
      filteredOrders = await Order.find({
        createdAt: { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) },
      });
      break;
    case "month":
      // Filter orders by selected month and year
      filteredOrders = await Order.find({
        createdAt: {
          $gte: new Date(selectedYear, selectedMonth - 1, 1),  // Adjust for 0-based index
          $lt: new Date(selectedYear, selectedMonth, 1),
        },
      });
      break;
    case "year":
      // Filter orders by selected year
      filteredOrders = await Order.find({
        createdAt: {
          $gte: new Date(selectedYear, 0, 1),
          $lt: new Date(selectedYear + 1, 0, 1),
        },
      });
      break;
    default:
      filteredOrders = await Order.find();
  }

  // Group orders by date or month
  const groupedData = filteredOrders.reduce((acc, order) => {
    const orderDate = new Date(order.createdAt);
    let key;

    if (timePeriod === "week") {
      key = orderDate.toLocaleDateString("en-US", { weekday: "long" });
    } else if (timePeriod === "month") {
      key = `${monthNames[orderDate.getMonth()]} ${orderDate.getDate()}`;
    } else if (timePeriod === "year") {
      key = monthNames[orderDate.getMonth()];
    }

    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  // Convert grouped data into chart-friendly format
  return Object.keys(groupedData).map((key) => ({
    name: key,
    orders: groupedData[key],
  }));
};

 





exports.getTopLoyalCustomers = async (topN = 5) => {
    const topCustomers = await Order.aggregate([
        { 
            $match: { customer: { $ne: null } } // Exclude orders with no customer ID
        },
        { 
            $group: {
                _id: "$customer",  
                totalOrders: { $sum: 1 }  
            }
        },
        { $sort: { totalOrders: -1 } },   
        { $limit: parseInt(topN) },  
        { 
            $lookup: {
                from: "users",   
                localField: "_id",   // _id here is the customer ID from orders
                foreignField: "_id",
                as: "customerDetails"  
            }
        },
        { 
            $unwind: "$customerDetails"  // Flatten customerDetails array
        },
        { 
            $project: {
                _id: 0,
                customerId: "$_id",
                firstName: "$customerDetails.firstName",
                lastName: "$customerDetails.lastName",
                phoneNumber: "$customerDetails.phoneNumber",
                totalOrders: 1
            }
        }
    ]);

    return topCustomers;
};






// dashboard
const aggregateSales = async (start, end, orderType) => {
    const result = await Order.aggregate([
        { $match: { createdAt: { $gte: start, $lt: end }, orderType } },
        { $unwind: "$items" }, // Flatten items array
        { 
            $group: { 
                _id: null, 
                totalSales: { 
                    $sum: { $multiply: ["$items.price", "$items.quantity"] } 
                }, 
                orderCount: { $sum: 1 } 
            } 
        }
    ]);
    return result.length > 0 ? result[0] : { totalSales: 0, orderCount: 0 };
};

const calculatePercentage = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous * 100).toFixed(1);
};

exports.getDashboardStats = async () => {
    const currentMonthStart = new Date();
    currentMonthStart.setDate(1);
    currentMonthStart.setHours(0, 0, 0, 0);

    const previousMonthStart = new Date(currentMonthStart);
    previousMonthStart.setMonth(previousMonthStart.getMonth() - 1);

    const previousMonthEnd = new Date(currentMonthStart - 1); // Cleaner way to get last day of previous month

    const currentDineIn = await aggregateSales(currentMonthStart, new Date(), "DineIn");
    const currentDelivery = await aggregateSales(currentMonthStart, new Date(), "Delivery");
    const prevDineIn = await aggregateSales(previousMonthStart, previousMonthEnd, "DineIn");
    const prevDelivery = await aggregateSales(previousMonthStart, previousMonthEnd, "Delivery");

    const recentOrders = await Order.find({orderType:"Delivery"})
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("items.foodItem");

    return {
        totalDineInSales: currentDineIn.totalSales,
        totalDeliverySales: currentDelivery.totalSales,
        dineInOrders: currentDineIn.orderCount,
        deliveryOrders: currentDelivery.orderCount,
        dineInSalesChange: calculatePercentage(currentDineIn.totalSales, prevDineIn.totalSales),
        deliverySalesChange: calculatePercentage(currentDelivery.totalSales, prevDelivery.totalSales),
        dineInOrdersChange: calculatePercentage(currentDineIn.orderCount, prevDineIn.orderCount),
        deliveryOrdersChange: calculatePercentage(currentDelivery.orderCount, prevDelivery.orderCount),
        recentOrders
    };
}