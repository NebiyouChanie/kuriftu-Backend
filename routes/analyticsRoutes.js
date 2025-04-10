const express = require("express");
const router = express.Router();
const analyticsController = require("../controllers/analyticsController");

// top location
router.get("/most-ordered-locations", analyticsController.getMostOrderedLocations);

// top foods
router.get("/top-ordered-foods", analyticsController.getTopOrderedFoods);

//number of orders per time
router.get("/orders-by-time", analyticsController.getOrdersByTime);

// Get top N loyal customers
router.get('/top-loyal-customers', analyticsController.getTopLoyalCustomers);

// Get dashboard overview data
router.get("/", analyticsController.getDashboardData);

module.exports = router;
