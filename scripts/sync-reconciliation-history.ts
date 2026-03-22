/**
 * Sync Reconciliation History Script
 * Imports reconciliation logs and financial data from SmartPay backend
 * Usage: npx ts-node scripts/sync-reconciliation-history.ts
 */

import { smartPayAPI } from '../src/lib/api/client';

interface ReconciliationHistoryEntry {
  date: string;
  walletSum: number;
  trustBalance: number;
  discrepancy: number;
  status: 'PASS' | 'WARNING' | 'CRITICAL';
  notes?: string;
}

interface TransactionHistoryEntry {
  date: string;
  volume: number;
  count: number;
  successRate: number;
}

async function syncReconciliationHistory(days: number = 90): Promise<void> {
  console.log(`\n💰 Syncing reconciliation history for last ${days} days...`);
  
  try {
    const response = await smartPayAPI.get<{ history: ReconciliationHistoryEntry[] }>(
      `/api/v1/compliance/reconciliation/history?days=${days}`
    );
    
    console.log(`✅ Successfully fetched ${response.history.length} reconciliation entries`);
    
    // Calculate statistics
    const passCount = response.history.filter(e => e.status === 'PASS').length;
    const warningCount = response.history.filter(e => e.status === 'WARNING').length;
    const criticalCount = response.history.filter(e => e.status === 'CRITICAL').length;
    
    console.log(`   - PASS: ${passCount}`);
    console.log(`   - WARNING: ${warningCount}`);
    console.log(`   - CRITICAL: ${criticalCount}`);
    
    // Store in local database or cache
    // TODO: Implement storage logic based on your database schema
    
    return;
  } catch (error) {
    console.error('❌ Failed to sync reconciliation history:', error);
    throw error;
  }
}

async function syncTransactionHistory(days: number = 90): Promise<void> {
  console.log(`\n📈 Syncing transaction history for last ${days} days...`);
  
  try {
    const response = await smartPayAPI.get<{ history: TransactionHistoryEntry[] }>(
      `/api/v1/admin/financial/transactions/history?days=${days}`
    );
    
    console.log(`✅ Successfully fetched ${response.history.length} transaction history entries`);
    
    // Calculate totals
    const totalVolume = response.history.reduce((sum, e) => sum + e.volume, 0);
    const totalCount = response.history.reduce((sum, e) => sum + e.count, 0);
    const avgSuccessRate = response.history.reduce((sum, e) => sum + e.successRate, 0) / response.history.length;
    
    console.log(`   - Total Volume: N$${totalVolume.toLocaleString()}`);
    console.log(`   - Total Count: ${totalCount.toLocaleString()}`);
    console.log(`   - Avg Success Rate: ${avgSuccessRate.toFixed(2)}%`);
    
    // Store in local database or cache
    // TODO: Implement storage logic based on your database schema
    
    return;
  } catch (error) {
    console.error('❌ Failed to sync transaction history:', error);
    throw error;
  }
}

async function syncCapitalAdequacyHistory(days: number = 90): Promise<void> {
  console.log(`\n📊 Syncing capital adequacy history for last ${days} days...`);
  
  try {
    const response = await smartPayAPI.get<{ history: any[] }>(
      `/api/v1/admin/financial/capital/history?days=${days}`
    );
    
    console.log(`✅ Successfully fetched ${response.history.length} capital adequacy entries`);
    
    // Store in local database or cache
    // TODO: Implement storage logic based on your database schema
    
    return;
  } catch (error) {
    console.error('❌ Failed to sync capital adequacy history:', error);
    throw error;
  }
}

async function main() {
  console.log('🚀 Starting reconciliation and financial history sync...');
  console.log(`Timestamp: ${new Date().toISOString()}\n`);
  
  const days = parseInt(process.env.SYNC_DAYS || '90', 10);
  
  try {
    await syncReconciliationHistory(days);
    await syncTransactionHistory(days);
    await syncCapitalAdequacyHistory(days);
    
    console.log('\n✨ Reconciliation and financial history sync completed successfully!');
  } catch (error) {
    console.error('\n💥 Reconciliation history sync failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { syncReconciliationHistory, syncTransactionHistory, syncCapitalAdequacyHistory };
