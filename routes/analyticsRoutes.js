const express = require("express");
const router = express.Router();
const analyticsController = require("../controllers/analysisController");

// Food Analysis by Category
router.get("/food-by-category", analyticsController.getFoodAnalysisByCategory);

// Monthly Order Analysis
router.get("/orders/monthly/:year/:month", analyticsController.getMonthlyOrderAnalysis);

// Waiter Rating Analysis
router.get("/waiters/ratings", analyticsController.getWaiterRatingAnalysis);

// Food Rating Analysis
router.get("/foods/ratings", analyticsController.getFoodRatingAnalysis);

// Combined Dashboard Analytics
router.get("/dashboard", analyticsController.getDashboardAnalytics);

module.exports = router;
