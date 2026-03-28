import { createTransport } from 'nodemailer';

// Create transporter
const createTransporter = () => {
  return createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

/**
 * Send email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML content
 * @param {string} options.text - Plain text content (optional)
 */
const sendEmail = async (options) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"CampusHealth" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, '')
    };

    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email sending failed:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send welcome email to new user
 * @param {Object} user - User object
 * @param {string} user.email - User email
 * @param {string} user.name - User name
 */
const sendWelcomeEmail = async (user) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
      <div style="background-color: #5856D6; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">Welcome to CampusHealth!</h1>
      </div>
      <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #333;">Hello ${user.name},</h2>
        <p style="color: #666; line-height: 1.6;">Welcome to CampusHealth! We're excited to have you on board. Your account has been successfully created.</p>
        <p style="color: #666; line-height: 1.6;">You can now:</p>
        <ul style="color: #666; line-height: 1.6;">
          <li>Book appointments with campus doctors</li>
          <li>Access mental health resources</li>
          <li>Order medicines from the campus pharmacy</li>
          <li>Track your health metrics</li>
        </ul>
        <div style="text-align: center; margin-top: 30px;">
          <a href="${process.env.FRONTEND_URL}/dashboard" style="background-color: #5856D6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; display: inline-block;">Get Started</a>
        </div>
      </div>
      <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
        <p>© 2026 CampusHealth. All rights reserved.</p>
      </div>
    </div>
  `;

  return sendEmail({
    to: user.email,
    subject: 'Welcome to CampusHealth!',
    html
  });
};

/**
 * Send appointment confirmation email
 * @param {Object} appointment - Appointment object
 * @param {Object} student - Student user
 * @param {Object} doctor - Doctor user
 */
const sendAppointmentConfirmation = async (appointment, student, doctor) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
      <div style="background-color: #5856D6; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">Appointment Confirmed</h1>
      </div>
      <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #333;">Hello ${student.name},</h2>
        <p style="color: #666; line-height: 1.6;">Your appointment has been confirmed with:</p>
        <div style="background-color: #f5f5f7; padding: 20px; border-radius: 10px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Doctor:</strong> ${doctor.name}</p>
          <p style="margin: 5px 0;"><strong>Specialty:</strong> ${doctor.specialty}</p>
          <p style="margin: 5px 0;"><strong>Date:</strong> ${new Date(appointment.date).toLocaleDateString()}</p>
          <p style="margin: 5px 0;"><strong>Time:</strong> ${appointment.time}</p>
          <p style="margin: 5px 0;"><strong>Type:</strong> ${appointment.type}</p>
        </div>
        ${appointment.type === 'Video Call' ? `
          <div style="text-align: center; margin-top: 20px;">
            <a href="${appointment.meetingLink}" style="background-color: #5856D6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; display: inline-block;">Join Video Call</a>
          </div>
        ` : `
          <p style="color: #666;">Location: ${appointment.location || 'Campus Health Center'}</p>
        `}
      </div>
    </div>
  `;

  return sendEmail({
    to: student.email,
    subject: 'Appointment Confirmed - CampusHealth',
    html
  });
};

/**
 * Send prescription ready email
 * @param {Object} prescription - Prescription object
 * @param {Object} student - Student user
 */
const sendPrescriptionReady = async (prescription, student) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
      <div style="background-color: #2ECC71; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">Prescription Ready</h1>
      </div>
      <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #333;">Hello ${student.name},</h2>
        <p style="color: #666; line-height: 1.6;">Your prescription has been verified and is ready for pickup or delivery.</p>
        <div style="background-color: #f5f5f7; padding: 20px; border-radius: 10px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0;">Medicines:</h3>
          ${prescription.medicines.map(med => `
            <p style="margin: 5px 0;"><strong>${med.name}</strong> - ${med.dosage} (${med.duration})</p>
          `).join('')}
        </div>
        <div style="text-align: center; margin-top: 20px;">
          <a href="${process.env.FRONTEND_URL}/student/pharmacy/orders" style="background-color: #2ECC71; color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; display: inline-block;">Track Order</a>
        </div>
      </div>
    </div>
  `;

  return sendEmail({
    to: student.email,
    subject: 'Your Prescription is Ready - CampusHealth',
    html
  });
};

/**
 * Send password reset email
 * @param {string} email - User email
 * @param {string} resetToken - Password reset token
 * @param {string} name - User name
 */
const sendPasswordResetEmail = async (email, resetToken, name) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
      <div style="background-color: #FF9F0A; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">Password Reset Request</h1>
      </div>
      <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #333;">Hello ${name},</h2>
        <p style="color: #666; line-height: 1.6;">You requested to reset your password. Click the button below to set a new password. This link expires in 1 hour.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #FF9F0A; color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; display: inline-block;">Reset Password</a>
        </div>
        <p style="color: #999; font-size: 12px;">If you didn't request this, please ignore this email.</p>
      </div>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: 'Password Reset Request - CampusHealth',
    html
  });
};

/**
 * Send order confirmation email
 * @param {Object} order - Order object
 * @param {Object} student - Student user
 */
const sendOrderConfirmation = async (order, student) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
      <div style="background-color: #5856D6; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">Order Confirmed</h1>
      </div>
      <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #333;">Hello ${student.name},</h2>
        <p style="color: #666; line-height: 1.6;">Your order #${order.orderId} has been confirmed and is being processed.</p>
        <div style="background-color: #f5f5f7; padding: 20px; border-radius: 10px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0;">Order Summary:</h3>
          ${order.items.map(item => `
            <p style="margin: 5px 0;"><strong>${item.name}</strong> x${item.quantity} - $${(item.price * item.quantity).toFixed(2)}</p>
          `).join('')}
          <hr style="margin: 15px 0; border-color: #ddd;">
          <p style="margin: 5px 0;"><strong>Total:</strong> $${order.total.toFixed(2)}</p>
        </div>
        <div style="text-align: center; margin-top: 20px;">
          <a href="${process.env.FRONTEND_URL}/student/pharmacy/order/${order._id}" style="background-color: #5856D6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; display: inline-block;">Track Order</a>
        </div>
      </div>
    </div>
  `;

  return sendEmail({
    to: student.email,
    subject: `Order Confirmed #${order.orderId} - CampusHealth`,
    html
  });
};

export default {
  sendEmail,
  sendWelcomeEmail,
  sendAppointmentConfirmation,
  sendPrescriptionReady,
  sendPasswordResetEmail,
  sendOrderConfirmation
};