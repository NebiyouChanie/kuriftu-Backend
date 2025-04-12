const express = require('express');
const router = express.Router();
const foodRatingController = require('../controllers/ratingController');
const waiterRatingController = require('../controllers/ratingController');

// Get rating and feedback for a specific food item
router.get('/food-item/:id', foodRatingController.getFoodItemRating);

// Get overall service rating
router.get('/overall-rating', foodRatingController.getOverallServiceRating);



// Get rating and feedback for a specific waiter
router.get('/waiter/:id', waiterRatingController.getWaiterRating);

// Get overall rating for all waiters
router.get('/overall-waiters', waiterRatingController.getOverallWaitersRating);

module.exports = router;

module.exports = router;
