import type { Role } from '@prisma/client';

export const DEMO_PASSWORD = 'password123';

interface DemoAccountBase {
  email: string;
  name: string;
  role: Role;
}

export type DemoAccount =
  | (DemoAccountBase & { role: 'ADMIN' | 'MEMBER' })
  | (DemoAccountBase & {
      role: 'TRAINER';
      trainer: { bio: string; specialties: string[] };
    })
  | (DemoAccountBase & {
      role: 'SPONSOR';
      sponsor: { companyName: string; websiteUrl: string; tier: 'BRONZE' | 'SILVER' | 'GOLD' };
    });

// Demo deployments only: these credentials are public.
export const DEMO_ACCOUNTS: readonly DemoAccount[] = [
  { email: 'admin@ironpulse.test', name: 'Demo Admin', role: 'ADMIN' },
  { email: 'member@ironpulse.test', name: 'Demo Member', role: 'MEMBER' },
  {
    email: 'trainer@ironpulse.test',
    name: 'Demo Trainer',
    role: 'TRAINER',
    trainer: { bio: 'Demo trainer account.', specialties: ['Strength'] },
  },
  {
    email: 'sponsor@ironpulse.test',
    name: 'Demo Sponsor',
    role: 'SPONSOR',
    sponsor: {
      companyName: 'Demo Sponsor',
      websiteUrl: 'https://example.com/demo-sponsor',
      tier: 'BRONZE',
    },
  },
];
