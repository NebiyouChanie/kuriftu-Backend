const Reservation = require("../models/reservation");
const User = require("../models/userModel");
const customError = require("../utils/CustomErrorhandlerClass");


exports.requestReservation = async (reservationData) => {
  const { firstName, lastName, phoneNumber, date, time, numberOfGuests, message} = reservationData;

  let user = await User.findOne({ phoneNumber });
  
  if (!user) {
    user = new User({ firstName, lastName, phoneNumber});
    await user.save();  
  }
  
  const reservation = await Reservation.create({
    customer: user._id,
    date,
    time,
    numberOfGuests,
    message,
  });

  return reservation;
};


// Get all available reservations
exports.getAvailableReservations = async () => {
  const reservations = await Reservation.find().populate('customer').sort({ createdAt: -1 }); ;
  if (!reservations || reservations.length === 0) {
    throw new customError("No available reservations found.", 404);
  }
  return reservations;
};


// Confirm a reservation
exports.confirmReservation = async (reservationId) => {
  const reservation = await Reservation.findById(reservationId);
  if (!reservation) {
    throw new customError("Reservation not found.", 404);
  }
  
  reservation.status = "Confirmed";
  await reservation.save();


  return reservation;
};


// Cancel a reservation
exports.cancelReservation = async (reservationId) => {
  const reservation = await Reservation.findById(reservationId);
  if (!reservation) {
    throw new customError("Reservation not found.", 404);
  }

  reservation.status = "Cancelled";
  await reservation.save();
   
  return reservation;
};

 


 
// Get reservation details by ID
exports.getReservationDetails = async (reservationId) => {
 
    const reservation = await Reservation.findById(reservationId).populate("customer"); 

    if (!reservation) {
      throw new customError("Reservation not found.", 404);
    }

    return reservation;

};


// update reservation details by ID
exports.updateReservationDetails = async (reservationId,reservationData) => {
 
    const reservation = await Reservation.findByIdAndUpdate(reservationId,reservationData,{new:true});  

    if (!reservation) {
      throw new customError("Reservation not found.", 404);
    }

    return reservation;

};


// Delete a reservation by ID
exports.deleteReservation = async (reservationId) => {
  const deletedReservation = await Reservation.findByIdAndDelete(reservationId);
  if (!deletedReservation) {
    throw new customError("Reservation not found.", 404);
  }

};

