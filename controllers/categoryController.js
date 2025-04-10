const categoryServices = require('../services/categoryService');
const asyncErrorHandler = require('../middleware/asyncErrorHandler');


// add category
exports.addCategory = asyncErrorHandler(async (req, res) => {    
    const newUser = await categoryServices.addCategory(req.body);
    res.status(201).json({
        success: true,
        data: {
            user: newUser
        },
    });
});


//get all categories
exports.getAllCategories=asyncErrorHandler(async(req,res)=>{
    const categories = await categoryServices.getAllCategories(req.body);
    res.status(200).json({
        success: true,
        data: categories
    });
})


//delete category
exports.deleteCategory=asyncErrorHandler(async(req,res)=>{
    const result = await categoryServices.delete(req.body);
    res.status(204).json({
        success: true,
    });

})
