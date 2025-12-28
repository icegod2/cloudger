import { prismaAuth } from './db';

// Re-export the Auth Client as the default 'prisma' for backward compatibility
// with files that only interact with the Auth DB (User, VerificationToken).
export default prismaAuth;
