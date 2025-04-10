const express = require("express");
const reservationController = require('../controllers/reservationController');
// const { requestReservationSchema } = require("../validation/reservationValidation");
// const validateRequest = require('../middleware/validateRequest');
// const { authMiddleware } = require("../middleware/authMiddleware");
// const { adminAuth } = require('../middleware/adminAuth');

 

const router = express.Router();

// make a reservation
router.post("/request", reservationController.requestReservationHandler);

//get all reservations
router.get("/", reservationController.getAvailableReservationsHandler);

//confirm reservation
router.patch("/confirm/:id",reservationController.confirmReservationHandler);

//cancel reservation
router.patch("/cancel/:id",reservationController.cancelReservationHandler);

// view reservation details
router.get("/:id", reservationController.getReservationDetails);

// update reservation details
router.patch("/:id", reservationController.updateReservationDetails);

//  delete a reservation
router.delete("/:id", reservationController.deleteReservation);

module.exports = router;
