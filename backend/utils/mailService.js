import nodemailer from 'nodemailer';

const getTransporter = () => {
  if (!process.env.EMAIL || !process.env.EMAIL_PASS) {
    throw new Error('Email credentials are not configured');
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL,
      pass: process.env.EMAIL_PASS,
    },
  });
};

export const sendEmail = async ({ to, subject, text, html }) => {
  try {
    const transporter = getTransporter();
    const mailOptions = {
      from: process.env.EMAIL,
      to,
      subject,
      text,
      html,
    };

    return await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Email send error:', error);
    throw error;
  }
};
