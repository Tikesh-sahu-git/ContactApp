// Import nodemailer for sending emails
const nodemailer = require("nodemailer");
const ENV = require("../config/env");

/**
 * Send an email using nodemailer
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} html - HTML content of the email
 */
const sendEmail = async (to, subject, html) => {
  try {
    // ✅ Create a transporter object using SMTP or service provider
    const transporter = nodemailer.createTransport({
      service: "gmail", // can be "gmail", "outlook", "yahoo", or custom SMTP
      auth: {
        user: ENV.EMAIL_USER, // Sender email (from .env)
        pass: ENV.EMAIL_PASS, // App password, NOT your main email password
      },
    });

    // ✅ Send the email
    await transporter.sendMail({
      from: `"My Contact App" <${ENV.EMAIL_USER}>`, // sender info
      to,       // recipient email
      subject,  // email subject
      html,     // email body in HTML format
    });

    // Log success
    console.log("✅ Email sent successfully");
  } catch (error) {
    // Log any error occurred during sending
    console.error("❌ Email error:", error);
  }
};

// Export the function to be used in other modules
module.exports = sendEmail;