import 'dotenv/config';
import * as argon2 from 'argon2';
import { Prisma, PrismaClient } from '@prisma/client';
import { envSchema } from '../config/env';
import { DEMO_ACCOUNTS, DEMO_PASSWORD, type DemoAccount } from './demo-accounts';

const seedEnvSchema = envSchema.pick({ DATABASE_URL: true, AUTO_SEED_DEMO_USERS: true });

type SeedResult = 'created' | 'exists';

async function seedAccount(prisma: PrismaClient, account: DemoAccount): Promise<SeedResult> {
  const existing = await prisma.user.findUnique({
    where: { email: account.email },
    select: { id: true },
  });
  if (existing) return 'exists';

  const passwordHash = await argon2.hash(DEMO_PASSWORD);
  try {
    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: account.email,
          passwordHash,
          role: account.role,
          status: 'ACTIVE',
          emailVerifiedAt: new Date(),
          profile: { create: { name: account.name } },
        },
        select: { id: true },
      });
      if (account.role === 'TRAINER') {
        await tx.trainerProfile.create({
          data: { userId: user.id, ...account.trainer },
        });
      }
      if (account.role === 'SPONSOR') {
        await tx.sponsor.create({ data: { userId: user.id, ...account.sponsor } });
      }
    });
    return 'created';
  } catch (error) {
    // A concurrent run created the user first; the transaction rolled back.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return 'exists';
    }
    throw error;
  }
}

async function main(): Promise<void> {
  const parsed = seedEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const names = parsed.error.issues.map((issue) => issue.path.join('.')).join(', ');
    throw new Error(`Invalid environment for demo seed: ${names}`);
  }
  if (!parsed.data.AUTO_SEED_DEMO_USERS) {
    console.log('[demo-seed] AUTO_SEED_DEMO_USERS is not "true"; skipping.');
    return;
  }

  const prisma = new PrismaClient();
  try {
    let created = 0;
    for (const account of DEMO_ACCOUNTS) {
      const result = await seedAccount(prisma, account);
      if (result === 'created') created += 1;
      console.log(`[demo-seed] ${account.email} (${account.role}): ${result}`);
    }
    console.log(`[demo-seed] done: ${created} created, ${DEMO_ACCOUNTS.length - created} already existed.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error('[demo-seed] FAILED:', error instanceof Error ? error.message : 'unknown error');
  process.exit(1);
});
