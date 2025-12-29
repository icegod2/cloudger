import { NextResponse } from 'next/server';
import { sendVerificationEmail } from '@/lib/mail';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email') || 'test@example.com';
    
    console.log(`Testing email sending to: ${email}`);
    
    // Generate mock token and code
    const token = 'test-token-' + Date.now();
    const code = '123456';

    await sendVerificationEmail(email, token, code);

    return NextResponse.json({ success: true, message: `Email process initiated for ${email}` });
  } catch (error) {
    console.error('Test email failed:', error);
    return NextResponse.json({ success: false, error: 'Failed to send email' }, { status: 500 });
  }
}
