import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: NextRequest) {
  try {
    const {
      smtp_host,
      smtp_port,
      smtp_user,
      smtp_password,
      from_email,
      from_name,
    } = await request.json();

    if (!smtp_host || !smtp_user || !smtp_password || !from_email) {
      return NextResponse.json(
        { error: 'SMTP configuration is incomplete' },
        { status: 400 }
      );
    }

    // Create a transporter
    const transporter = nodemailer.createTransporter({
      host: smtp_host,
      port: parseInt(smtp_port) || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: smtp_user,
        pass: smtp_password,
      },
    });

    // Verify the connection
    await transporter.verify();

    // Send test email
    const info = await transporter.sendMail({
      from: `"${from_name || 'Test Sender'}" <${from_email}>`,
      to: smtp_user, // Send to the configured email address
      subject: 'Test Email from Akusara Admin',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #10b981;">✅ Test Email Successful</h2>
          <p>This is a test email from your Akusara Digital Agency admin dashboard.</p>
          <p>Your SMTP configuration is working correctly!</p>
          <hr style="border: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="font-size: 12px; color: #6b7280;">
            Sent at: ${new Date().toLocaleString()}
          </p>
        </div>
      `,
    });

    console.log('Test email sent:', info.messageId);

    return NextResponse.json({
      success: true,
      message: 'Test email sent successfully',
      messageId: info.messageId,
    });
  } catch (error) {
    console.error('Error sending test email:', error);

    let errorMessage = 'Failed to send test email';
    if (error instanceof Error) {
      if (error.message.includes('ECONNREFUSED')) {
        errorMessage = 'Connection refused. Check SMTP host and port.';
      } else if (error.message.includes('ETIMEDOUT')) {
        errorMessage = 'Connection timeout. Check SMTP host and network.';
      } else if (error.message.includes('auth')) {
        errorMessage = 'Authentication failed. Check username and password.';
      } else {
        errorMessage = error.message;
      }
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}