// @ts-nocheck
/**
 * Test data seeding utilities
 * Location: src/lib/test-utils/seed-data.ts
 * 
 * Purpose: Seed test database with sample data for integration tests
 * Used by: Integration test setup/teardown
 */

import { db } from '@/lib/db';
import {
  portalUsers,
  users,
  beneficiaries,
  agents,
  programmes,
  vouchers,
  wallets,
  roles,
  permissions,
  rolePermissions,
} from '@/db/schema';
import { TEST_USER_IDS, TEST_PERMISSIONS } from './index';
import bcrypt from 'bcryptjs';

/**
 * Seed test portal users with different roles
 */
export async function seedTestPortalUsers() {
  const hashedPassword = await bcrypt.hash('TestPassword123!', 10);

  const testUsers = [
    {
      id: TEST_USER_IDS.ketchup_ops,
      email: 'ketchup_ops@test.com',
      passwordHash: hashedPassword,
      fullName: 'Test Ketchup Ops',
      role: 'ketchup_ops',
      isActive: true,
      emailVerified: true,
    },
    {
      id: TEST_USER_IDS.ketchup_finance,
      email: 'ketchup_finance@test.com',
      passwordHash: hashedPassword,
      fullName: 'Test Ketchup Finance',
      role: 'ketchup_finance',
      isActive: true,
      emailVerified: true,
    },
    {
      id: TEST_USER_IDS.ketchup_compliance,
      email: 'ketchup_compliance@test.com',
      passwordHash: hashedPassword,
      fullName: 'Test Ketchup Compliance',
      role: 'ketchup_compliance',
      isActive: true,
      emailVerified: true,
    },
    {
      id: TEST_USER_IDS.ketchup_support,
      email: 'ketchup_support@test.com',
      passwordHash: hashedPassword,
      fullName: 'Test Ketchup Support',
      role: 'ketchup_support',
      isActive: true,
      emailVerified: true,
    },
    {
      id: TEST_USER_IDS.gov_manager,
      email: 'gov_manager@test.com',
      passwordHash: hashedPassword,
      fullName: 'Test Gov Manager',
      role: 'gov_manager',
      isActive: true,
      emailVerified: true,
    },
    {
      id: TEST_USER_IDS.gov_auditor,
      email: 'gov_auditor@test.com',
      passwordHash: hashedPassword,
      fullName: 'Test Gov Auditor',
      role: 'gov_auditor',
      isActive: true,
      emailVerified: true,
    },
    {
      id: TEST_USER_IDS.agent,
      email: 'agent@test.com',
      passwordHash: hashedPassword,
      fullName: 'Test Agent',
      role: 'agent',
      isActive: true,
      emailVerified: true,
    },
    {
      id: TEST_USER_IDS.field_tech,
      email: 'field_tech@test.com',
      passwordHash: hashedPassword,
      fullName: 'Test Field Tech',
      role: 'field_tech',
      isActive: true,
      emailVerified: true,
    },
    {
      id: TEST_USER_IDS.field_lead,
      email: 'field_lead@test.com',
      passwordHash: hashedPassword,
      fullName: 'Test Field Lead',
      role: 'field_lead',
      isActive: true,
      emailVerified: true,
    },
  ];

  try {
    // Insert portal users (use onConflictDoNothing to avoid duplicate key errors)
    for (const user of testUsers) {
      await db
        .insert(portalUsers)
        .values(user)
        .onConflictDoNothing();
    }

    console.log(`✅ Seeded ${testUsers.length} test portal users`);
  } catch (error) {
    console.error('❌ Failed to seed portal users:', error);
    throw error;
  }
}

/**
 * Seed test beneficiaries (users table)
 */
export async function seedTestBeneficiaries() {
  const testBeneficiaries = [
    {
      id: '10000000-0000-0000-0000-000000000001',
      phone: '+264811234501',
      fullName: 'Test Beneficiary 1',
      idNumber: 'TEST001',
      region: 'Khomas',
      walletStatus: 'active',
    },
    {
      id: '10000000-0000-0000-0000-000000000002',
      phone: '+264811234502',
      fullName: 'Test Beneficiary 2',
      idNumber: 'TEST002',
      region: 'Erongo',
      walletStatus: 'active',
    },
    {
      id: '10000000-0000-0000-0000-000000000003',
      phone: '+264811234503',
      fullName: 'Test Beneficiary 3',
      idNumber: 'TEST003',
      region: 'Otjozondjupa',
      walletStatus: 'active',
    },
    {
      id: '10000000-0000-0000-0000-000000000004',
      phone: '+264811234504',
      fullName: 'Test Beneficiary 4',
      idNumber: 'TEST004',
      region: 'Khomas',
      walletStatus: 'suspended',
    },
    {
      id: '10000000-0000-0000-0000-000000000005',
      phone: '+264811234505',
      fullName: 'Test Beneficiary 5',
      idNumber: 'TEST005',
      region: 'Oshana',
      walletStatus: 'active',
    },
  ];

  try {
    for (const beneficiary of testBeneficiaries) {
      await db
        .insert(users)
        .values(beneficiary)
        .onConflictDoNothing();
    }

    console.log(`✅ Seeded ${testBeneficiaries.length} test beneficiaries`);
  } catch (error) {
    console.error('❌ Failed to seed beneficiaries:', error);
    throw error;
  }
}

/**
 * Seed test agents
 */
export async function seedTestAgents() {
  const testAgents = [
    {
      id: '20000000-0000-0000-0000-000000000001',
      name: 'Test Agent 1',
      address: 'Windhoek, Khomas',
      contactPhone: '+264811111001',
      floatBalance: '50000.00',
      status: 'active',
    },
    {
      id: '20000000-0000-0000-0000-000000000002',
      name: 'Test Agent 2',
      address: 'Swakopmund, Erongo',
      contactPhone: '+264811111002',
      floatBalance: '75000.00',
      status: 'active',
    },
    {
      id: '20000000-0000-0000-0000-000000000003',
      name: 'Test Agent 3',
      address: 'Oshakati, Oshana',
      contactPhone: '+264811111003',
      floatBalance: '25000.00',
      status: 'active',
    },
  ];

  try {
    for (const agent of testAgents) {
      await db
        .insert(agents)
        .values(agent)
        .onConflictDoNothing();
    }

    console.log(`✅ Seeded ${testAgents.length} test agents`);
  } catch (error) {
    console.error('❌ Failed to seed agents:', error);
    throw error;
  }
}

/**
 * Seed test programmes
 */
export async function seedTestProgrammes() {
  const testProgrammes = [
    {
      id: '30000000-0000-0000-0000-000000000001',
      name: 'Test Programme 1 - Food Vouchers',
      description: 'Monthly food voucher programme',
      allocatedBudget: '1000000.00',
      spentToDate: '450000.00',
      startDate: '2026-01-01',
      endDate: '2026-12-31',
    },
    {
      id: '30000000-0000-0000-0000-000000000002',
      name: 'Test Programme 2 - Education Support',
      description: 'School supplies vouchers',
      allocatedBudget: '500000.00',
      spentToDate: '200000.00',
      startDate: '2026-03-01',
      endDate: '2026-11-30',
    },
  ];

  try {
    for (const programme of testProgrammes) {
      await db
        .insert(programmes)
        .values(programme)
        .onConflictDoNothing();
    }

    console.log(`✅ Seeded ${testProgrammes.length} test programmes`);
  } catch (error) {
    console.error('❌ Failed to seed programmes:', error);
    throw error;
  }
}

/**
 * Seed test vouchers
 */
export async function seedTestVouchers() {
  const testVouchers = [
    {
      id: '40000000-0000-0000-0000-000000000001',
      beneficiaryId: '10000000-0000-0000-0000-000000000001',
      programmeId: '30000000-0000-0000-0000-000000000001',
      amount: '1000.00',
      status: 'available',
      expiryDate: '2026-12-31',
    },
    {
      id: '40000000-0000-0000-0000-000000000002',
      beneficiaryId: '10000000-0000-0000-0000-000000000002',
      programmeId: '30000000-0000-0000-0000-000000000001',
      amount: '1000.00',
      status: 'redeemed',
      expiryDate: '2026-12-31',
      redeemedAt: new Date('2026-03-15T10:00:00Z'),
    },
    {
      id: '40000000-0000-0000-0000-000000000003',
      beneficiaryId: '10000000-0000-0000-0000-000000000003',
      programmeId: '30000000-0000-0000-0000-000000000002',
      amount: '500.00',
      status: 'available',
      expiryDate: '2026-11-30',
    },
  ];

  try {
    for (const voucher of testVouchers) {
      await db
        .insert(vouchers)
        .values(voucher)
        .onConflictDoNothing();
    }

    console.log(`✅ Seeded ${testVouchers.length} test vouchers`);
  } catch (error) {
    console.error('❌ Failed to seed vouchers:', error);
    throw error;
  }
}

/**
 * Seed all test data
 */
export async function seedAllTestData() {
  console.log('🌱 Starting test data seeding...');
  
  try {
    await seedTestPortalUsers();
    await seedTestBeneficiaries();
    await seedTestAgents();
    await seedTestProgrammes();
    await seedTestVouchers();
    
    console.log('✅ All test data seeded successfully');
  } catch (error) {
    console.error('❌ Failed to seed test data:', error);
    throw error;
  }
}

/**
 * Clean up test data (run after tests)
 */
export async function cleanupTestData() {
  console.log('🧹 Cleaning up test data...');
  
  try {
    // Delete in reverse order of dependencies
    await db.delete(vouchers).where(sql`id LIKE '40000000-%'`);
    await db.delete(programmes).where(sql`id LIKE '30000000-%'`);
    await db.delete(agents).where(sql`id LIKE '20000000-%'`);
    await db.delete(users).where(sql`id LIKE '10000000-%'`);
    await db.delete(portalUsers).where(sql`id LIKE '00000000-%'`);
    
    console.log('✅ Test data cleaned up successfully');
  } catch (error) {
    console.error('❌ Failed to clean up test data:', error);
    throw error;
  }
}

// Import sql function for cleanup
import { sql } from 'drizzle-orm';
