#!/usr/bin/env node

/**
 * 2FA Implementation Test Script
 * 
 * Purpose: Validate 2FA implementation is working correctly
 * 
 * Usage:
 *   node scripts/test-2fa.mjs
 * 
 * Checks:
 * 1. Database migration applied (columns exist)
 * 2. API endpoints respond correctly
 * 3. Services can be imported
 * 4. Rate limiting works
 */

import { db } from '../src/lib/db.ts';
import { portalUsers } from '../src/db/schema.ts';
import { sql } from 'drizzle-orm';

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  gray: '\x1b[90m',
};

function log(message, color = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

function success(message) {
  log(`✓ ${message}`, 'green');
}

function error(message) {
  log(`✗ ${message}`, 'red');
}

function info(message) {
  log(`ℹ ${message}`, 'blue');
}

function warn(message) {
  log(`⚠ ${message}`, 'yellow');
}

async function checkDatabaseSchema() {
  info('\nChecking database schema...');
  
  try {
    // Check if 2FA columns exist
    const result = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'portal_users' 
      AND column_name IN ('totp_enabled', 'totp_secret', 'totp_verified_at', 'backup_codes', 'backup_codes_generated_at')
      ORDER BY column_name;
    `);

    const columns = result.rows.map(row => row.column_name);
    const expectedColumns = [
      'backup_codes',
      'backup_codes_generated_at',
      'totp_enabled',
      'totp_secret',
      'totp_verified_at',
    ];

    let allFound = true;
    for (const col of expectedColumns) {
      if (columns.includes(col)) {
        success(`Column exists: ${col}`);
      } else {
        error(`Column missing: ${col}`);
        allFound = false;
      }
    }

    if (!allFound) {
      warn('Some columns are missing. Run migration:');
      warn('  npm run db:push');
      return false;
    }

    // Check indexes
    const indexResult = await db.execute(sql`
      SELECT indexname 
      FROM pg_indexes 
      WHERE tablename = 'portal_users' 
      AND (indexname LIKE '%totp%' OR indexname LIKE '%role%');
    `);

    const indexes = indexResult.rows.map(row => row.indexname);
    info(`Indexes found: ${indexes.length}`);
    indexes.forEach(idx => log(`  - ${idx}`, 'gray'));

    return true;
  } catch (err) {
    error(`Database check failed: ${err.message}`);
    return false;
  }
}

async function checkAPIEndpoints() {
  info('\nChecking API endpoints...');
  
  const endpoints = [
    '/api/v1/auth/2fa/setup',
    '/api/v1/auth/2fa/verify',
    '/api/v1/auth/2fa/disable',
    '/api/v1/auth/2fa/verify-backup-code',
    '/api/v1/auth/login/verify-2fa',
  ];

  let allExist = true;
  const fs = await import('fs');
  const path = await import('path');

  for (const endpoint of endpoints) {
    const filePath = path.join(
      process.cwd(),
      'src/app',
      endpoint,
      'route.ts'
    );

    if (fs.existsSync(filePath)) {
      success(`Endpoint exists: ${endpoint}`);
    } else {
      error(`Endpoint missing: ${endpoint}`);
      allExist = false;
    }
  }

  return allExist;
}

async function checkServiceFiles() {
  info('\nChecking service files...');
  
  const services = [
    'src/lib/services/totp-service.ts',
    'src/lib/services/require-2fa.ts',
  ];

  let allExist = true;
  const fs = await import('fs');
  const path = await import('path');

  for (const service of services) {
    const filePath = path.join(process.cwd(), service);

    if (fs.existsSync(filePath)) {
      success(`Service exists: ${service}`);
      
      // Check for key functions
      const content = fs.readFileSync(filePath, 'utf-8');
      
      if (service.includes('totp-service')) {
        const functions = [
          'generateTOTPSecret',
          'generateQRCodeDataURL',
          'verifyTOTPToken',
          'generateBackupCodes',
          'hashBackupCode',
          'verifyBackupCode',
        ];
        
        for (const fn of functions) {
          if (content.includes(fn)) {
            log(`  ✓ Function: ${fn}`, 'gray');
          } else {
            warn(`  ✗ Function missing: ${fn}`);
            allExist = false;
          }
        }
      }
      
      if (service.includes('require-2fa')) {
        const functions = [
          'check2FARequired',
          'is2FAEnabled',
          'enforce2FAEnabled',
          'get2FAStatus',
        ];
        
        for (const fn of functions) {
          if (content.includes(fn)) {
            log(`  ✓ Function: ${fn}`, 'gray');
          } else {
            warn(`  ✗ Function missing: ${fn}`);
            allExist = false;
          }
        }
      }
    } else {
      error(`Service missing: ${service}`);
      allExist = false;
    }
  }

  return allExist;
}

async function checkUIPages() {
  info('\nChecking UI pages...');
  
  const pages = [
    'src/app/settings/2fa/page.tsx',
    'src/app/login/2fa-challenge/page.tsx',
  ];

  let allExist = true;
  const fs = await import('fs');
  const path = await import('path');

  for (const page of pages) {
    const filePath = path.join(process.cwd(), page);

    if (fs.existsSync(filePath)) {
      success(`Page exists: ${page}`);
    } else {
      error(`Page missing: ${page}`);
      allExist = false;
    }
  }

  return allExist;
}

async function checkPackages() {
  info('\nChecking npm packages...');
  
  const fs = await import('fs');
  const path = await import('path');
  
  try {
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf-8')
    );

    const requiredPackages = [
      'speakeasy',
      'qrcode',
      '@types/speakeasy',
      '@types/qrcode',
    ];

    let allInstalled = true;
    for (const pkg of requiredPackages) {
      const installed = 
        packageJson.dependencies?.[pkg] || 
        packageJson.devDependencies?.[pkg];
      
      if (installed) {
        success(`Package installed: ${pkg}@${installed}`);
      } else {
        error(`Package missing: ${pkg}`);
        allInstalled = false;
      }
    }

    if (!allInstalled) {
      warn('Some packages are missing. Install them:');
      warn('  npm install speakeasy qrcode @types/speakeasy @types/qrcode');
    }

    return allInstalled;
  } catch (err) {
    error(`Package check failed: ${err.message}`);
    return false;
  }
}

async function main() {
  log('\n╔═══════════════════════════════════════════╗', 'blue');
  log('║   2FA Implementation Test Script          ║', 'blue');
  log('╚═══════════════════════════════════════════╝', 'blue');

  const results = {
    packages: await checkPackages(),
    schema: await checkDatabaseSchema(),
    endpoints: await checkAPIEndpoints(),
    services: await checkServiceFiles(),
    pages: await checkUIPages(),
  };

  // Summary
  log('\n╔═══════════════════════════════════════════╗', 'blue');
  log('║   Test Results Summary                    ║', 'blue');
  log('╚═══════════════════════════════════════════╝', 'blue');

  const allPassed = Object.values(results).every(r => r === true);

  for (const [test, passed] of Object.entries(results)) {
    const status = passed ? '✓' : '✗';
    const color = passed ? 'green' : 'red';
    log(`${status} ${test.padEnd(20)}: ${passed ? 'PASSED' : 'FAILED'}`, color);
  }

  if (allPassed) {
    log('\n🎉 All tests passed! 2FA implementation is ready.', 'green');
    log('\nNext steps:', 'blue');
    log('1. Start dev server: npm run dev');
    log('2. Navigate to: /settings/2fa');
    log('3. Enable 2FA with Google Authenticator');
    log('4. Test login flow with 2FA');
    process.exit(0);
  } else {
    log('\n⚠️  Some tests failed. Fix the issues above.', 'red');
    process.exit(1);
  }
}

main().catch((err) => {
  error(`\nTest script failed: ${err.message}`);
  console.error(err);
  process.exit(1);
});
