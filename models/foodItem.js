const mongoose = require("mongoose");

const foodItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  preparationTime: {  
    type: Number,
    required: true
  },
  ingredients: [String],
  imageUrl: String,
  category: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Category", 
    required: true,
  },
  isInStock: {
    type: Boolean,
    default: true,
  },
  dietaryTags: [{
    type: String,
    enum: [
      'vegetarian', 'vegan', 'gluten-free',
      'halal', 'kosher', 'dairy-free',
      'nut-free', 'organic'
    ]
  }],
  // Added rating field
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0,
  },
  // Added feedback field as an array of objects
  feedback: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    comment: {
      type: String,
      trim: true
    },
    rating: {
      type: Number,
      min: 0,
      max: 5,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

foodItemSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

const foodItem = mongoose.model("FoodItem", foodItemSchema);

module.exports = foodItem;