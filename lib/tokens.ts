import { v4 as uuidv4 } from 'uuid';
import prisma from '@/lib/prisma';

export const generateVerificationToken = async (email: string) => {
  const token = uuidv4();
  // Generate a 6-digit code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Token expires in 1 hour
  const expires = new Date(new Date().getTime() + 3600 * 1000);

  // Check if a token already exists for this email
  const existingToken = await prisma.verificationToken.findFirst({
    where: { email }
  });

  if (existingToken) {
    await prisma.verificationToken.delete({
      where: {
        id: existingToken.id,
      },
    });
  }

  const verificationToken = await prisma.verificationToken.create({
    data: {
      email,
      token,
      code,
      expires,
    }
  });

  return verificationToken;
};
