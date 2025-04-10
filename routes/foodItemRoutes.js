const express = require('express');
const router = express.Router();
// const { authMiddleware } = require('../middleware/authMiddleware');
// const validateRequest = require('../middleware/validateRequest');
// const {foodItemSchema,updateFoodSchema} = require('../validation/fooItemValidator');
const foodItemController = require('../controllers/foodItemController');
// const { adminAuth } = require('../middleware/adminAuth');


// get all food item
router.get("/",foodItemController.getAllFoodItems)


// get a single food item
router.get("/:id",foodItemController.getSingleFoodItem)


// add food item  
router.post("/addFoodItem",foodItemController.addFoodItem)


// delete food item by id
router.delete("/:id",foodItemController.deleteFoodItem)


// update food item by id
router.patch("/:id",foodItemController.updateFoodItem)

 

module.exports = router