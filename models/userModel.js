
const { default: mongoose } = require("mongoose");
 
const UserSchema = new mongoose.Schema({

    firstName :{ 
        type: String, 
        trim: true,
    },

    lastName :{ 
        type: String, 
        trim: true, 
    },
    
    subcity :{ 
        type: String, 
        required:false,
        enum: ['Addis Ketema', 'Akaki Kaliti','Arada','Lemi Kura','Bole','Gullele','Kirkos','Kolfe Keranio','Ledeta','Nifas Silk Lafto','Yeka','N/A'],
        default: "N/A" 
    },
    
    area :{ 
        type: String, 
        trim: true, 
    },

    email: {
        type: String,
        trim: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"], // Validate email format
        default: undefined, // Default to null if not provided
        sparse: true, // Only index non-null values
        unique: true, // Enforce uniqueness for non-null emails
      },
      
    phoneNumber :{ 
        type: String, 
        required: [true, 'Phone number is required'],
        match: [/^\+?[1-9]\d{1,14}$/, 'Please enter a valid phone number.']
    },
    
    createdAt :{ 
        type: Date, 
        default :  Date.now 
    },
});


const User = mongoose.model('User', UserSchema);

module.exports = User;