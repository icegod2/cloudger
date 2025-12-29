import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY 
  ? new Resend(process.env.RESEND_API_KEY) 
  : null;

const domain = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';

export const sendVerificationEmail = async (email: string, token: string, code: string) => {
  const confirmLink = `${domain}/new-verification?token=${token}`;

  // Use Resend to send real emails
  // Note: On the free tier without a custom domain, you can only send to the email address you registered with on Resend.
  try {
      if (!resend) {
        throw new Error("Resend API Key not found");
      }

      const { data, error } = await resend.emails.send({
        from: 'Cloudger <onboarding@resend.dev>', // If you verified a domain, change this (e.g., 'noreply@cloudger.com')
        to: email,
        subject: 'Verify your Cloudger account',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Verify your email address</h2>
            <p>Your verification code is: <strong style="font-size: 24px; letter-spacing: 2px;">${code}</strong></p>
            <p>Or click the link below to verify automatically:</p>
            <a href="${confirmLink}" style="display: inline-block; padding: 12px 24px; background-color: #000; color: #fff; text-decoration: none; border-radius: 5px;">Verify Email</a>
            <p style="margin-top: 20px; color: #666; font-size: 14px;">If you didn't request this, please ignore this email.</p>
          </div>
        `
      });

      if (error) {
          console.error("Resend Error:", error);
          throw new Error("Failed to send verification email");
      }
      
      console.log(`Email sent to ${email}`);

  } catch (error) {
      console.error("Failed to send email:", error);
      // Fallback for development if no API key is set
      if (process.env.NODE_ENV !== 'production') {
        console.log("================ MOCK FALLBACK ================");
        console.log(`📧 TO: ${email}`);
        console.log(`🔢 Code: ${code}`);
        console.log(`🔗 Link: ${confirmLink}`);
        console.log("===============================================");
      }
  }
};
