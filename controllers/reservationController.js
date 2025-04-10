const asyncErrorHandler = require("../middleware/asyncErrorHandler");
const reservationService = require("../services/reservationService");
const { sendConfirmationEmail, sendCancellationEmail } = require("../services/emailService");


// request a reservation  
exports.requestReservationHandler = asyncErrorHandler(async (req, res) => {
  
    const reservation = await reservationService.requestReservation(req.body);
    res.status(201).json({ 
        success: true, 
        data: reservation 
    });
  });
  

//Get reservation  
exports.getAvailableReservationsHandler = asyncErrorHandler(async (req, res) => {
    const reservations = await reservationService.getAvailableReservations();
    res.status(201).json({ 
      success: true, 
      data: reservations 
  });
  });
  

//   confirmReservation
  exports.confirmReservationHandler = asyncErrorHandler(async (req, res) => {
    const { id } = req.params;
    const reservation = await reservationService.confirmReservation(id);
    res.status(200).json({ 
        message: "Reservation confirmed successfully.", 
        reservation 
    });
  });
  

  //cancel reservation
  exports.cancelReservationHandler = asyncErrorHandler(async (req, res) => {
    const { id } = req.params;
   
    const reservation  = await reservationService.cancelReservation(id);
  
    res.status(200).json({ 
        message: "Reservation cancelled successfully.", 
        data:reservation 
    });
  });
  
  
 

// Get Reservation Details
exports.getReservationDetails = asyncErrorHandler(async (req, res) => {
  const reservationId = req.params.id; 
  
  const reservation = await reservationService.getReservationDetails(reservationId);

  res.status(200).json({
    status: "success",
    data: reservation,
  });
});

// update Reservation Details
exports.updateReservationDetails = asyncErrorHandler(async (req, res) => {
  const reservationId = req.params.id; 
  const reservation = await reservationService.updateReservationDetails(reservationId,req.body);
  res.status(200).json({
    status: "success",
    data: reservation,
  });
});


// Delete Reservation
exports.deleteReservation = asyncErrorHandler(async (req, res) => {
  const reservationId = req.params.id; 
  
  const deletedReservation = await reservationService.deleteReservation(reservationId);

  res.status(200).json({
    status: "success",
    message: "Reservation successfully deleted",
  });
});
