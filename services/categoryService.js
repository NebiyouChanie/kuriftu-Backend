const Category = require('../models/categoryModel');
const customError = require('../utils/CustomErrorhandlerClass');

// add  category
exports.addCategory = async (category) => {

    const existingCategory = await Category.findOne({ name: category.name});
    if (existingCategory) {
        throw new customError("Category already exist.", 400);
    }
     
    const newCategory = new Category({ name: category.name });      
    await newCategory.save();  

    return newCategory;  
};


// get all categories
exports.getAllCategories = async () => {    
    const categories = await Category.find();
    return categories
};



// delete category
exports.delete = async (category) => {
    
    const existingCategory = await Category.findOne({ name: category.name});
    if (!existingCategory) {
        throw new customError("Category doesn't exist.", 404);
    }
    
    await existingCategory.deleteOne()

};