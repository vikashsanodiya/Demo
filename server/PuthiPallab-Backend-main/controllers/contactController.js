import catchAsync from "../utils/catchAsync.js";
import sendEmail from "../utils/email.js";

export const sendMessage = catchAsync(async (req, res, next) => {
  const { name, email, subject, message } = req.body;

  try {
    await sendEmail({
      email: "itzparves@gmail.com",
      subject: "New Message from Puthi Pallab Library",
      message: `Name: ${name}\nEmail: ${email}\nSubject: ${subject}\nMessage: ${message}`,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Something went wrong, please try again later",
    });
  }

  res.status(201).json({
    status: "success",
    message: "Message sent successfully",
  });
});
