const analyticsService = require("../services/analyticsService");
const asyncErrorHandler = require("../middleware/asyncErrorHandler");

// top medicines
exports.getMostOrderedLocations = asyncErrorHandler(async (req, res) => {
    const locations = await analyticsService.getMostOrderedLocations();
    res.status(200).json({
        success: true,
        data: locations
    });
});


// top foods
exports.getTopOrderedFoods = asyncErrorHandler(async (req, res) => {
    const foods = await analyticsService.getTopOrderedFoods();
    res.status(200).json({
        success: true,
        data: foods
    });
});


// number of order per time
 
exports.getOrdersByTime = async (req, res) => {
  try {
    const { timePeriod, selectedMonth, selectedYear } = req.query;
    console.log(req.query)
    // Ensure selectedMonth and selectedYear are provided for month/year filter
    if (timePeriod === 'month' || timePeriod === 'year') {
      if (!selectedMonth || !selectedYear) {
        return res.status(400).json({ message: "Month and Year are required" });
      }
    }

    // Call the service to get filtered and grouped orders
    const ordersData = await analyticsService.getOrdersByTime(timePeriod, parseInt(selectedMonth), parseInt(selectedYear));

    return res.status(200).json(ordersData);
  } catch (error) {
    console.error("Error getting orders data: ", error);
    return res.status(500).json({ message: "An error occurred while fetching the data" });
  }
};

 



// loyal customeres
exports.getTopLoyalCustomers = asyncErrorHandler(async (req, res) => {
    const { topN } = req.query; // Get the 'topN' query parameter
    const topCustomers = await analyticsService.getTopLoyalCustomers(topN);
    res.status(200).json({
      success: true,
      data: topCustomers,
    });
  });



  // Get Dashboard Overview
exports.getDashboardData = asyncErrorHandler(async (req, res) => {
  console.log("first")  
  const data = await analyticsService.getDashboardStats();
    res.status(200).json({ success: true, data });
});