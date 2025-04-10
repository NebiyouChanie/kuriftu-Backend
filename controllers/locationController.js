const asyncErrorHandler = require('../middleware/asyncErrorHandler');
const locationService = require("../services/locationService");

// Create Location
exports.createLocation = asyncErrorHandler(async (req, res) => {
  const newLocation = await locationService.createLocation(req.body);
  res.status(201).json({
    success: true,
    data: { location: newLocation },
  });
});

// Get All Locations
exports.getLocations = asyncErrorHandler(async (req, res) => {
  const locations = await locationService.getAllLocations();
  res.status(200).json({
    success: true,
    data: locations,
  });
});

// Get Single Location by ID
exports.getLocation = asyncErrorHandler(async (req, res) => {
  const location = await locationService.getLocationById(req.params.id);
  res.status(200).json({
    success: true,
    data: location,
  });
});

// Update Location
exports.updateLocation = asyncErrorHandler(async (req, res) => {
  const updatedLocation = await locationService.updateLocation(req.params.id, req.body);
  res.status(200).json({
    success: true,
    data: { location: updatedLocation },
  });
});

// Delete Location
exports.deleteLocation = asyncErrorHandler(async (req, res) => {
  await locationService.deleteLocation(req.params.id);
  res.status(200).json({
    success: true,
    message: "Location deleted successfully",
  });
});
