const sendEmail = require('../utils/emailService')


exports.sendResetEmail = async (email,resetToken,req) => {
    const resetURL =`${req.protocol}://${req.get('host')}/api/users/resetPassword/${resetToken}`;
    const message = `Click the link to reset your password: ${resetURL}.`;
    await sendEmail(
       { email: email,
        subject: 'Password change request recived',
        message: message,
       }
    )
}

exports.sendConfirmationEmail = async (user, reservation) => {
    const firstName = user.firstName;
    const { numberOfGuests, date, time, specialRequests } = reservation;
  
    // Craft the plain text message content
    const message = `
      Dear ${firstName},

      Thank you for your reservation at our restaurant. We're pleased to confirm your booking!

      Reservation Details:
      - Number of Guests: ${numberOfGuests}
      - Date: ${new Date(date).toLocaleDateString()}
      - Time: ${time}
      - Special Requests: ${specialRequests || 'None'}

      We look forward to welcoming you!

      Best regards,
      Your Restaurant Name
    `;
    
    await sendEmail(
        { 
          email: user.email,
          subject: 'Reservation Confirmation', // Updated subject
          message: message,
        }
     );
};



exports.sendCancellationEmail = async (user, reservation) => {
    const firstName = user.firstName;
    const { numberOfGuests, date, time, specialRequests } = reservation;
  
    // Craft the plain text cancellation message content
    const message = `
      Dear ${firstName},

      We're sorry to inform you that your reservation at our restaurant has been canceled.

      Reservation Details:
      - Number of Guests: ${numberOfGuests}
      - Date: ${new Date(date).toLocaleDateString()}
      - Time: ${time}
      - Special Requests: ${specialRequests || 'None'}

      If you need to make a new reservation or have any questions, please don't hesitate to contact us.

      We apologize for any inconvenience caused, and we hope to serve you in the future!

      Best regards,
      Your Restaurant Name
    `;
    
    await sendEmail(
        { 
          email: user.email,
          subject: 'Reservation Cancellation',  
          message: message,
        }
     );
};
