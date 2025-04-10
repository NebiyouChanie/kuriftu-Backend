const express = require('express');
const router = express.Router()
const categoryController = require('../controllers/categoryController');

// add category
router.post('/',categoryController.addCategory);

// delete category
router.delete('/',categoryController.deleteCategory);

//get categories
router.get('/',categoryController.getAllCategories);


module.exports = router