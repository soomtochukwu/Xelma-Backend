
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting seed...');

    // Create or update a test user
    const user = await prisma.user.upsert({
        where: { walletAddress: 'G_TEST_WALLET_ADDRESS_123456789' },
        update: {},
        create: {
            walletAddress: 'G_TEST_WALLET_ADDRESS_123456789',
            publicKey: 'G_TEST_PUBLIC_KEY',
            wins: 5,
            streak: 2,
            virtualBalance: 2500.50,
            messages: {
                create: [
                    { content: 'Hello World! This is a test message.' },
                    { content: 'Xelma backend is looking great! 🚀' },
                ],
            },
        },
    });

    console.log(`✅ User seeded: ${user.walletAddress}`);
    console.log(`stats: wins=${user.wins}, streak=${user.streak}, balance=${user.virtualBalance}`);

    const messages = await prisma.message.findMany({ where: { userId: user.id } });
    console.log(`✅ Seeded ${messages.length} messages for user.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
