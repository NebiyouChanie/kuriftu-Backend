const mongoose = require("mongoose");
const FoodItem = require("./foodItem");  

const orderSchema = new mongoose.Schema({
    items: [
        {
            foodItem: { type: mongoose.Schema.Types.ObjectId, ref: "FoodItem", required: true },
            quantity: { type: Number, required: true, min: 1 },
            price: { type: Number, required: true, min: 0 }, // Will be set dynamically
        }
    ],

    customer: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

    customerInfo: {
        name: { type: String, default: "Guest", trim: true },
        lastName: { type: String, default: "Guest", trim: true },
        phoneNumber: { type: String, default: "N/A", trim: true },
        subcity: { 
            type: String, 
            enum: ['Addis Ketema', 'Akaki Kaliti', 'Arada', 'Lemi Kura', 'Bole', 'Gullele', 'Kirkos', 'Kolfe Keranio', 'Ledeta', 'Nifas Silk Lafto', 'Yeka', "N/A"], 
            default: "N/A"
        },
        area: { type: String, default: "N/A", trim: true },
    },

    orderStatus: { 
        type: String, 
        enum: ["Pending", "Cancelled", "Confirmed"], 
        default: "Pending" 
    },
    
    orderType: { 
        type: String, 
        enum: ["DineIn", "Delivery"], 
        default: "Delivery" 
    },
    
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
}, {
    timestamps: true
});

// Pre-save hook to set price from FoodItem model
orderSchema.pre("save", async function (next) {
    try {
        for (let item of this.items) {
            if (item.foodItem) {
                const food = await FoodItem.findById(item.foodItem);
                if (food) {
                    item.price = food.price;  
                }
            }
        }
        this.updatedAt = Date.now();
        next();
    } catch (error) {
        next(error);
    }
});

const Order = mongoose.model("Order", orderSchema);
module.exports = Order;
