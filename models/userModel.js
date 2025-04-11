const { default: mongoose } = require("mongoose");
 
const UserSchema = new mongoose.Schema({
    firstName: { 
        type: String, 
        trim: true,
    },
    lastName: { 
        type: String, 
        trim: true, 
    },
    password: { 
        type: String, 
        required: [true, 'Password is required'],
        minlength: 8, 
    },
    role: {
        type: String,
        required: true,
        enum: ['guest', "chef", 'waiter', 'admin', 'receptionist'],
        default: 'guest'
    },  
    email: {
        type: String,
        trim: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"],  
        default: undefined,  
        sparse: true, 
        unique: true,  
    },  
    phoneNumber: { 
        type: String, 
        required: [true, 'Phone number is required'],
        match: [/^\+?[1-9]\d{1,14}$/, 'Please enter a valid phone number.']
    },
    feedback: [{
        fromUserId: {
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
            min: 1,
            max: 5,
            required: true
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    averageRating: {
        type: Number,
        min: 0,
        max: 5,
        default: 0
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    },
});

const User = mongoose.model('User', UserSchema);

module.exports = User;