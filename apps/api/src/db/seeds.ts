/**
 * VORTEX API - Database Seeds
 * Creates initial test data for development
 * 
 * Run with: bun run src/db/seeds.ts
 */

import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { eq } from 'drizzle-orm';

import {
  users,
  quests,
  xpTransactions,
  type NewUser,
} from './schema';

// Load env manually for seed script
const DATABASE_URL = process.env['DATABASE_URL'];
if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL is not set');
  process.exit(1);
}

const sql = neon(DATABASE_URL);
const db = drizzle(sql);

// ============================================
// SEED DATA
// ============================================

const seedUsers: NewUser[] = [
  {
    wallet: '0x1234567890123456789012345678901234567890',
    farcasterId: 12345,
  },
  {
    wallet: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
    farcasterId: 67890,
  },
  {
    wallet: '0x0000000000000000000000000000000000000001',
    farcasterId: null,
  },
];

interface QuestCondition {
  type: 'scan_count' | 'consolidate_count' | 'share_count' | 'streak_days';
  target: number;
  period?: 'daily' | 'weekly';
}

interface SeedQuest {
  questKey: string;
  title: string;
  description: string;
  type: 'daily' | 'weekly' | 'event';
  rewardXp: number;
  condition: QuestCondition;
}

const seedQuests: SeedQuest[] = [
  // Daily Quests
  {
    questKey: 'daily_scan_1',
    title: 'Daily Scanner',
    description: 'Scan your portfolio once today',
    type: 'daily',
    rewardXp: 50,
    condition: { type: 'scan_count', target: 1, period: 'daily' },
  },
  {
    questKey: 'daily_consolidate_1',
    title: 'Dust Buster',
    description: 'Complete 1 consolidation today',
    type: 'daily',
    rewardXp: 150,
    condition: { type: 'consolidate_count', target: 1, period: 'daily' },
  },
  {
    questKey: 'daily_share_1',
    title: 'Share the Vortex',
    description: 'Share your scan results on Farcaster',
    type: 'daily',
    rewardXp: 75,
    condition: { type: 'share_count', target: 1, period: 'daily' },
  },
  // Weekly Challenges
  {
    questKey: 'weekly_dust_hunter',
    title: 'Dust Hunter',
    description: 'Complete 3 or more consolidations this week',
    type: 'weekly',
    rewardXp: 500,
    condition: { type: 'consolidate_count', target: 3, period: 'weekly' },
  },
  {
    questKey: 'weekly_risk_manager',
    title: 'Risk Manager',
    description: 'Scan 5 different wallets this week',
    type: 'weekly',
    rewardXp: 400,
    condition: { type: 'scan_count', target: 5, period: 'weekly' },
  },
  {
    questKey: 'weekly_streak_master',
    title: 'Streak Master',
    description: 'Maintain a 7-day scan streak',
    type: 'weekly',
    rewardXp: 250,
    condition: { type: 'streak_days', target: 7 },
  },
];

// ============================================
// SEED FUNCTIONS
// ============================================

async function seedDatabase() {
  console.log('🌱 Starting database seeding...\n');

  try {
    // Seed Users
    console.log('👤 Seeding users...');
    const insertedUsers = [];
    for (const userData of seedUsers) {
      // Check if user already exists
      const existing = await db
        .select()
        .from(users)
        .where(eq(users.wallet, userData.wallet))
        .limit(1);

      if (existing.length === 0) {
        const [user] = await db.insert(users).values(userData).returning();
        insertedUsers.push(user);
        console.log(`  ✓ Created user: ${userData.wallet.slice(0, 10)}...`);
      } else {
        console.log(`  ⏭ User exists: ${userData.wallet.slice(0, 10)}...`);
        insertedUsers.push(existing[0]);
      }
    }
    console.log(`  → ${insertedUsers.length} users processed\n`);

    // Seed Quests
    console.log('🎯 Seeding quests...');
    for (const questData of seedQuests) {
      // Check if quest already exists
      const existing = await db
        .select()
        .from(quests)
        .where(eq(quests.questKey, questData.questKey))
        .limit(1);

      if (existing.length === 0) {
        await db.insert(quests).values(questData);
        console.log(`  ✓ Created quest: ${questData.title}`);
      } else {
        console.log(`  ⏭ Quest exists: ${questData.title}`);
      }
    }
    console.log(`  → ${seedQuests.length} quests processed\n`);

    // Seed XP Transactions for test users
    console.log('⭐ Seeding XP transactions...');
    const xpReasons: Array<'scan' | 'consolidate' | 'quest_claim' | 'referral'> = [
      'scan',
      'consolidate',
      'quest_claim',
    ];
    
    for (const user of insertedUsers) {
      // Add some random XP for each user
      const randomXp = Math.floor(Math.random() * 500) + 100;
      const randomReason = xpReasons[Math.floor(Math.random() * xpReasons.length)];

      await db.insert(xpTransactions).values({
        userId: user.id,
        xpAmount: randomXp,
        reason: randomReason,
        referenceId: `seed-${Date.now()}`,
      });
      console.log(`  ✓ Added ${randomXp} XP to ${user.wallet.slice(0, 10)}...`);
    }
    console.log(`  → XP transactions created\n`);

    console.log('✅ Database seeding completed successfully!\n');
    console.log('📊 Summary:');
    console.log(`   - Users: ${seedUsers.length}`);
    console.log(`   - Quests: ${seedQuests.length}`);
    console.log(`   - XP Transactions: ${insertedUsers.length}`);

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

// Run the seed
seedDatabase()
  .then(() => {
    console.log('\n🎉 Done!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
