const nodemailer = require('nodemailer');


const sendEmail = async (options) => {
    const transporter = nodemailer.createTransport({
        service: 'Gmail',
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD,
        }
    });
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: options.email,
        subject: options.subject,
        text: options.message,
    }
    await transporter.sendMail(mailOptions);
};


module.exports = sendEmail;
