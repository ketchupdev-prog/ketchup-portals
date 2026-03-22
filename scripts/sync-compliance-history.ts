/**
 * Sync Compliance History Script
 * Imports last 90 days of KRI metrics and compliance data from SmartPay backend
 * Usage: npx ts-node scripts/sync-compliance-history.ts
 */

import { smartPayAPI } from '../src/lib/api/client';

interface KRIHistoryEntry {
  date: string;
  metrics: Record<string, number>;
}

interface ComplianceAlertHistory {
  date: string;
  alerts: any[];
}

async function syncKRIHistory(days: number = 90): Promise<void> {
  console.log(`\n📊 Syncing KRI history for last ${days} days...`);
  
  try {
    const response = await smartPayAPI.get<{ history: KRIHistoryEntry[] }>(
      `/api/v1/compliance/kri/history?days=${days}`
    );
    
    console.log(`✅ Successfully fetched ${response.history.length} KRI history entries`);
    
    // Store in local database or cache
    // TODO: Implement storage logic based on your database schema
    
    return;
  } catch (error) {
    console.error('❌ Failed to sync KRI history:', error);
    throw error;
  }
}

async function syncBonReportHistory(days: number = 90): Promise<void> {
  console.log(`\n📋 Syncing BON report history for last ${days} days...`);
  
  try {
    const response = await smartPayAPI.get<{ reports: any[] }>(
      `/api/v1/compliance/bon-reporting/history?days=${days}`
    );
    
    console.log(`✅ Successfully fetched ${response.reports.length} BON reports`);
    
    // Store in local database or cache
    // TODO: Implement storage logic based on your database schema
    
    return;
  } catch (error) {
    console.error('❌ Failed to sync BON report history:', error);
    throw error;
  }
}

async function syncComplianceAlerts(days: number = 90): Promise<void> {
  console.log(`\n🚨 Syncing compliance alerts for last ${days} days...`);
  
  try {
    const response = await smartPayAPI.get<{ alerts: any[] }>(
      `/api/v1/compliance/alerts/history?days=${days}`
    );
    
    console.log(`✅ Successfully fetched ${response.alerts.length} compliance alerts`);
    
    // Store in local database or cache
    // TODO: Implement storage logic based on your database schema
    
    return;
  } catch (error) {
    console.error('❌ Failed to sync compliance alerts:', error);
    throw error;
  }
}

async function main() {
  console.log('🚀 Starting compliance history sync...');
  console.log(`Timestamp: ${new Date().toISOString()}\n`);
  
  const days = parseInt(process.env.SYNC_DAYS || '90', 10);
  
  try {
    await syncKRIHistory(days);
    await syncBonReportHistory(days);
    await syncComplianceAlerts(days);
    
    console.log('\n✨ Compliance history sync completed successfully!');
  } catch (error) {
    console.error('\n💥 Compliance history sync failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { syncKRIHistory, syncBonReportHistory, syncComplianceAlerts };
