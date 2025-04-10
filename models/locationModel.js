const mongoose = require("mongoose");

const LocationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },  
    description: { type: String, required: true },  
    address: { type: String, required: true },  
    images: [{ type: String, required: true }], // Array of Image URLs
    googleMapsLink: { type: String, required: true }, // Google Maps URL
    parkingAvailable: { type: Boolean, default: false }, // Parking Availability
    phoneNumber :{ 
        type: String, 
        required: [true, 'Phone number is required'],
        match: [/^\+?[1-9]\d{1,14}$/, 'Please enter a valid phone number.']
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Location", LocationSchema);
