const nodemailer = require('nodemailer');


const sendEmail = async (options) => {
    // *Create a transporter (Service which will actually send the email)
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
    // *Define email options
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: options.email,
        subject: options.subject,
        text: options.message,
    }
    // *Actually send the email
    await transporter.sendMail(mailOptions);
};


module.exports = sendEmail;
