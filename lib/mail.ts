export const sendVerificationEmail = async (email: string, token: string, code: string) => {
  const confirmLink = `http://localhost:3000/new-verification?token=${token}`;

  // In a real application, you would use a service like Resend, SendGrid, or Nodemailer here.
  // For now, we will log the link to the console for development.
  
  console.log("========================================");
  console.log(`📧 MOCK EMAIL TO: ${email}`);
  console.log(`🔢 Verification Code: ${code}`);
  console.log(`🔗 Click to confirm: ${confirmLink}`);
  console.log("========================================");
};
