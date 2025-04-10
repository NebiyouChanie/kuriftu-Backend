const express = require("express");
const router = express.Router();
const locationController = require("../controllers/locationController");

router.get("/", locationController.getLocations); // Get all locations
router.get("/:id", locationController.getLocation); // Get one location
router.post("/", locationController.createLocation); // Create a new location
router.patch("/:id", locationController.updateLocation); // Update location
router.delete("/:id", locationController.deleteLocation); // Delete location

module.exports = router;
