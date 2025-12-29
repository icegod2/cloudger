'use server';

import { signIn, signOut } from '@/auth';
import { AuthError } from 'next-auth';
import { prismaAuth, getPrismaApp } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { generateVerificationToken } from '@/lib/tokens';
import { sendVerificationEmail } from '@/lib/mail';

const UserFields = {
  email: z.string().email({
    message: 'Please enter a valid email address.',
  }),
  password: z.string().min(6, {
    message: 'Password must be at least 6 characters.',
  }),
  confirmPassword: z.string().min(6, {
      message: 'Password must be at least 6 characters.',
  }),
};

const FormSchema = z.object(UserFields).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

const CreateUser = z.object({
  ...UserFields,
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

export async function authenticate(
  prevState: string | undefined,
  formData: FormData,
) {
  try {
    await signIn('credentials', Object.fromEntries(formData));
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return 'Invalid credentials.';
        default:
          return 'Something went wrong.';
      }
    }
    throw error;
  }
}

export async function register(prevState: any, formData: FormData) {
    const validatedFields = CreateUser.safeParse(Object.fromEntries(formData));

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Missing Fields. Failed to Create User.',
        };
    }

    const { email, password, name } = validatedFields.data;
    const hashedPassword = await bcrypt.hash(password, 10);

    // Check if user already exists
    const existingUser = await prismaAuth.user.findUnique({
        where: { email }
    });

    if (existingUser) {
        // Case 1: User exists and is verified -> Error
        if (existingUser.emailVerified) {
             return {
                message: 'User already exists!',
            };
        }

        // Case 2: User exists but NOT verified -> Update and Resend
        try {
            // Update user with new details (in case they changed password/name)
            await prismaAuth.user.update({
                where: { id: existingUser.id },
                data: {
                    password: hashedPassword,
                    name: name,
                }
            });

            // Note: We don't need to re-create App DB data (Accounts/Categories) 
            // because they should have been created on the first attempt.
            // Even if the first attempt partially failed, handling that consistency is complex.
            // For now, we assume App DB data exists or will be lazy-created later if missing.

            // Send Verification Token
            const verificationToken = await generateVerificationToken(email);
            await sendVerificationEmail(verificationToken.email, verificationToken.token, verificationToken.code);

            return { success: true, message: "Confirmation email resent!" };
        } catch (error) {
             console.error('Registration update error:', error);
             return { message: 'Database Error: Failed to update user.' };
        }
    }

    // Case 3: New User -> Create everything
    // 1. Assign Shard (Simple Round-Robin or Random)
    const shardId = Math.floor(Math.random() * 3);
    let userId: number | null = null;

    try {
        // 2. Create User in Auth DB
        const user = await prismaAuth.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                shardId,
            },
        });
        userId = user.id;

        // 3. Create Default Data in App DB
        const prismaApp = getPrismaApp(shardId);
        
        await prismaApp.$transaction(async (tx) => {
             // Create Default Accounts
             await tx.account.createMany({
                 data: [
                     { name: 'Cash', type: 'asset', userId: user.id, order: 0 },
                     { name: 'Bank', type: 'asset', userId: user.id, order: 1 },
                     { name: 'Credit Card', type: 'liability', userId: user.id, order: 0 },
                 ]
             });

             // Create Default Categories
             await tx.category.createMany({
                 data: [
                     // Income
                     { name: 'Salary', type: 'income', userId: user.id, order: 0 },
                     { name: 'Bonus', type: 'income', userId: user.id, order: 1 },
                     { name: 'Investment', type: 'income', userId: user.id, order: 2 },
                     { name: 'Other', type: 'income', userId: user.id, order: 3 },
                     // Expense
                     { name: 'Food', type: 'expense', userId: user.id, order: 0 },
                     { name: 'Transport', type: 'expense', userId: user.id, order: 1 },
                     { name: 'Entertainment', type: 'expense', userId: user.id, order: 2 },
                     { name: 'Shopping', type: 'expense', userId: user.id, order: 3 },
                     { name: 'Housing', type: 'expense', userId: user.id, order: 4 },
                     { name: 'Medical', type: 'expense', userId: user.id, order: 5 },
                 ]
             });
        });

        // 4. Send Verification Token
        const verificationToken = await generateVerificationToken(email);
        await sendVerificationEmail(verificationToken.email, verificationToken.token, verificationToken.code);

        return { success: true, message: "Confirmation email sent!" };

    } catch (error) {
        console.error('Registration error:', error);
        
        // COMPENSATION: If User created but App Data failed, we should delete the user
        if (userId) {
            try {
                await prismaAuth.user.delete({ where: { id: userId } });
                console.log(`Compensating: Deleted user ${userId} due to app data creation failure.`);
            } catch (cleanupError) {
                console.error('CRITICAL: Failed to cleanup user after partial failure:', cleanupError);
            }
        }

        // Check if it's a Prisma unique constraint error (code P2002)
        if ((error as any).code === 'P2002') {
             return { message: 'This email is already registered.' };
        }

        return {
            message: 'Database Error: Failed to Create User. Please try again.',
        };
    }
}

export async function newVerification(token: string) {
    try {
        const existingToken = await prismaAuth.verificationToken.findUnique({
            where: { token }
        });

        if (!existingToken) {
            console.error('Verification Error: Token not found', token);
            // Graceful handling: If token is missing, check if it was just consumed.
            // We can't know for sure WHICH user it was, but for security we just return error.
            // HOWEVER, common UX issue is double-click. 
            // If we assume the token is invalid, we return error.
            return { error: "Token does not exist!" };
        }

        const hasExpired = new Date(existingToken.expires) < new Date();

        if (hasExpired) {
            console.error('Verification Error: Token expired', existingToken.expires);
            return { error: "Token has expired!" };
        }

        const existingUser = await prismaAuth.user.findUnique({
            where: { email: existingToken.email }
        });

        if (!existingUser) {
            console.error('Verification Error: User not found for email', existingToken.email);
            return { error: "Email does not exist!" };
        }

        await prismaAuth.user.update({
            where: { id: existingUser.id },
            data: { 
                emailVerified: new Date(),
                email: existingToken.email // Useful if implementing email change logic
            }
        });

        await prismaAuth.verificationToken.delete({
            where: { id: existingToken.id }
        });

        return { success: "Email verified!" };
    } catch (error) {
        console.error('CRITICAL: newVerification failed', error);
        return { error: "An internal error occurred during verification." };
    }
}

export async function verifyCode(email: string, code: string) {
    const existingToken = await prismaAuth.verificationToken.findFirst({
        where: { email, code }
    });

    if (!existingToken) {
        return { error: "Invalid verification code!" };
    }

    const hasExpired = new Date(existingToken.expires) < new Date();

    if (hasExpired) {
        return { error: "Code has expired!" };
    }

    const existingUser = await prismaAuth.user.findUnique({
        where: { email: existingToken.email }
    });

    if (!existingUser) {
        return { error: "Email does not exist!" };
    }

    await prismaAuth.user.update({
        where: { id: existingUser.id },
        data: { 
            emailVerified: new Date(),
            email: existingToken.email 
        }
    });

    await prismaAuth.verificationToken.delete({
        where: { id: existingToken.id }
    });

    return { success: "Email verified!" };
}

export async function loginWithCredentials(email: string, password: string) {
    try {
        await signIn('credentials', {
            email,
            password,
            redirectTo: '/',
        });
    } catch (error) {
        if ((error as any).digest?.startsWith('NEXT_REDIRECT')) {
            throw error;
        }
        if (error instanceof AuthError) {
             return { error: 'Login failed after verification.' };
        }
        throw error;
    }
}

export async function signOutAction() {
  await signOut();
}
