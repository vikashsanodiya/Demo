import nodemailer from "nodemailer";
import smtpTransport from "nodemailer-smtp-transport";

const sendEmail = async (options) => {
  // 1) Create a transporter
  const transporter = nodemailer.createTransport(
    smtpTransport({
      host: process.env.MAIL_HOST,
      port: process.env.MAIL_PORT,
      secure: false,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
    })
  );

  // 2) Define the email options
  const mailOptions = {
    from: "Puthi Pallab Library <parveshossaintt@gmail.com>",
    to: options.email,
    subject: options.subject,
    text: options.message,
  };

  // 3) Actually send the email
  await transporter.sendMail(mailOptions, async (error, info) => {
    if (error) {
      console.log(error);
    } else {
      console.log("Email sent: " + info.response);
    }
  });
};

export default sendEmail;
