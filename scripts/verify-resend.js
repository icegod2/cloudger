const { Resend } = require('resend');
const dotenv = require('dotenv');
dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

async function testResend() {
  console.log("Using API Key:", process.env.RESEND_API_KEY?.substring(0, 7) + "...");
  try {
    const { data, error } = await resend.emails.send({
      from: 'Cloudger <onboarding@resend.dev>',
      to: 'delivered@resend.dev', // Resend's test email that always succeeds
      subject: 'Test Connection',
      html: '<p>Connection test</p>'
    });

    if (error) {
      console.error("Resend Error Detail:", JSON.stringify(error, null, 2));
      process.exit(1);
    }

    console.log("Resend Success! Data:", JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Runtime Error:", err);
    process.exit(1);
  }
}

testResend();
