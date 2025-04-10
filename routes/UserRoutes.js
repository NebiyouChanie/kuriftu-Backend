const express = require('express');
const router = express.Router()
const userController = require('../controllers/UserController');

// Registration
router.post('/register',userController.registerUser);

// delete user
router.delete('/:id',userController.deleteUser);

// get all user
router.get('/',userController.getAllUsers);

//get user profile
router.get('/:id',userController.getUserDetail);

//update user profile
router.patch('/:id',userController.updateUserDetail);


module.exports = router