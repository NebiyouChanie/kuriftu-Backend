const nodemailer = require('nodemailer');

const sendEmail = (option) => {
    //Creat a transporter
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port :process.env.EMAIL_PORT,
        auth: {
            user : process.env.EMAIL_USER,
            pass : process.env.EMAIL_PASSWORD
        }

    })

    const emailOptions = {
        from : 'Nebiyou.com',
        to: option.email,
        subject: option.subject,
        text: option.message
    }
    transporter.sendMail(emailOptions)
}


module.exports = sendEmail