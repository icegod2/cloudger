import { prismaAuth, getPrismaApp } from '../lib/db';

async function main() {
  const userId = 1;
  const shardId = 0; // Force Demo User to Shard 0 for simplicity

  console.log("🌱 Seeding Auth DB...");

  // 1. Create default user in Auth DB
  const user = await prismaAuth.user.upsert({
    where: { id: userId },
    update: { shardId }, // Ensure shardId is set
    create: {
      id: userId,
      email: 'demo@example.com',
      name: 'Demo User',
      password: '$2a$10$abcdef...placeholder_hash', // In real app, use a valid bcrypt hash
      shardId, 
      emailVerified: new Date(),
    },
  });
  console.log('✅ User ensured:', user.email);

  // 2. Seed App DB (Shard 0)
  console.log(`🌱 Seeding App DB (Shard ${shardId})...`);
  const prismaApp = getPrismaApp(shardId);

  // Create default accounts if they don't exist
  const accounts = [
    { name: 'Cash', type: 'asset', userId },
    { name: 'Bank', type: 'asset', userId },
    { name: 'Credit Card', type: 'liability', userId },
  ];

  for (const account of accounts) {
    await prismaApp.account.upsert({
      where: {
        name_userId: {
          name: account.name,
          userId: account.userId,
        },
      },
      update: {
        type: account.type,
      },
      create: account,
    });
  }

  // Seed Categories (Traditional Chinese)
  const categories = [
    // Expenses
    { name: '飲食', type: 'expense', userId },
    { name: '交通', type: 'expense', userId },
    { name: '娛樂', type: 'expense', userId },
    { name: '購物', type: 'expense', userId },
    { name: '居住', type: 'expense', userId },
    { name: '醫療', type: 'expense', userId },
    // Income
    { name: '薪資', type: 'income', userId },
    { name: '獎金', type: 'income', userId },
    { name: '投資', type: 'income', userId },
    { name: '其他', type: 'income', userId },
  ];

  for (const category of categories) {
    await prismaApp.category.upsert({
      where: {
        name_type_userId: {
          name: category.name,
          type: category.type,
          userId: category.userId,
        },
      },
      update: {},
      create: category,
    });
  }

  // Fix Auto-increment Sequence is tricky with Sharding/Multiple DBs and Prisma.
  // We skip it here as upsert handles specific IDs fine, or we rely on default autoincrement.
  // Since we forced ID=1 for User, we might want to fix User sequence.
  
  try {
     await prismaAuth.$executeRaw`SELECT setval(pg_get_serial_sequence('"User"', 'id'), (SELECT MAX(id) FROM "User"));`;
  } catch (e) {
      console.warn("Could not reset sequence for User table (might be fine if not using pg_get_serial_sequence)");
  }

  console.log('✅ Seed completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prismaAuth.$disconnect();
    // App clients disconnect automatically or we can leave them
  });