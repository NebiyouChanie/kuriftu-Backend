const Location = require("../models/locationModel");
const customError = require('../utils/CustomErrorhandlerClass');

// Create Location
exports.createLocation = async (locationData) => {
  const { name, address, images, googleMapsLink } = locationData;

  // Validate required fields
  if (!name || !address || !images || !googleMapsLink) {
    throw new customError("All required fields must be provided.", 400);
  }

  // Check if a location with the same name exists
  const existingLocation = await Location.findOne({ name });
  if (existingLocation) {
    throw new customError("Location with this name already exists.", 400);
  }

  // Create and save new location
  const location = new Location(locationData);
  await location.save();
  return location;
};

// Get All Locations
exports.getAllLocations = async () => {
  return await Location.find();
};

// Get Single Location by ID
exports.getLocationById = async (id) => {
  const location = await Location.findById(id);
  if (!location) {
    throw new customError("Location not found.", 404);
  }
  return location;
};

// Update Location
exports.updateLocation = async (id, locationData) => {
  console.log("🚀 ~ exports.updateLocation= ~ locationData:", locationData)
  const updatedLocation = await Location.findByIdAndUpdate(id, locationData, { new: true });
  if (!updatedLocation) {
    throw new customError("Location not found.", 404);
  }
  return updatedLocation;
};

// Delete Location
exports.deleteLocation = async (id) => {
  const deletedLocation = await Location.findByIdAndDelete(id);
  if (!deletedLocation) {
    throw new customError("Location not found.", 404);
  }
  return deletedLocation;
};
