const userServices = require('../services/UserServices');
const asyncErrorHandler = require('../middleware/asyncErrorHandler');


// Register User
exports.registerUser = asyncErrorHandler(async (req, res) => {  
     const newUser = await userServices.register(req.body);
    res.status(201).json({
        success: true,
        data: {
            user: newUser
        },
    });
});


// Register User
exports.getAllUsers = asyncErrorHandler(async (req, res) => {  
     const cusromers = await userServices.getAllUsers();
    res.status(200).json({
        success: true,
        data: cusromers
    });
});



//delete user

exports.deleteUser=asyncErrorHandler(async(req,res)=>{
    const result = await userServices.delete(req.params.id);

    res.status(204).json({
        success: true,
    });

})



// user detail
exports.getUserDetail=asyncErrorHandler(async(req,res)=>{
    const user = await userServices.getUserDetail(req.params.id);
    res.status(200).json({
        success: true,
        data: user
    });

})


// update user detail
exports.updateUserDetail=asyncErrorHandler(async(req,res)=>{
    const user = await userServices.updateUserDetail(req.params.id,req.body);
    res.status(200).json({
        success: true,
        data: user
    });

})
