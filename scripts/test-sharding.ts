import { prismaAuth, getPrismaApp } from '../lib/db';

async function main() {
  console.log('Testing Auth DB Connection...');
  try {
    const userCount = await prismaAuth.user.count();
    console.log(`✅ Auth DB Connected. User count: ${userCount}`);
  } catch (error) {
    console.error('❌ Auth DB Connection Failed:', error);
  }

  console.log('Testing App DB (Shard 0) Connection...');
  try {
    const prismaApp = getPrismaApp(0);
    const accountCount = await prismaApp.account.count();
    console.log(`✅ App DB (Shard 0) Connected. Account count: ${accountCount}`);
  } catch (error) {
    console.error('❌ App DB (Shard 0) Connection Failed:', error);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prismaAuth.$disconnect();
    // No explicit disconnect for app clients in this simple script, 
    // but in real app they persist.
  });
