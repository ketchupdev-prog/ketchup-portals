/**
 * Sync Audit Logs Script
 * Imports security audit logs from SmartPay backend
 * Usage: npx ts-node scripts/sync-audit-logs.ts
 */

import { smartPayAPI } from '../src/lib/api/client';

interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userEmail: string;
  action: string;
  resource: string;
  ipAddress: string;
  userAgent: string;
  status: 'SUCCESS' | 'FAILURE';
  details?: Record<string, any>;
}

interface SecurityIncidentEntry {
  id: string;
  timestamp: string;
  type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: string;
  description: string;
}

async function syncAuditLogs(days: number = 90): Promise<void> {
  console.log(`\n🔍 Syncing audit logs for last ${days} days...`);
  
  try {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    const endDate = new Date().toISOString();
    
    const response = await smartPayAPI.get<{ logs: AuditLogEntry[]; total: number }>(
      `/api/v1/admin/security/audit?startDate=${startDate}&endDate=${endDate}&limit=10000`
    );
    
    console.log(`✅ Successfully fetched ${response.logs.length} audit log entries`);
    console.log(`   Total logs available: ${response.total}`);
    
    // Categorize logs
    const successCount = response.logs.filter(l => l.status === 'SUCCESS').length;
    const failureCount = response.logs.filter(l => l.status === 'FAILURE').length;
    
    // Group by action
    const actionCounts: Record<string, number> = {};
    response.logs.forEach(log => {
      actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
    });
    
    console.log(`\n📊 Log Statistics:`);
    console.log(`   - Success: ${successCount}`);
    console.log(`   - Failure: ${failureCount}`);
    console.log(`\n🔝 Top Actions:`);
    
    Object.entries(actionCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .forEach(([action, count]) => {
        console.log(`   - ${action}: ${count}`);
      });
    
    // Store in local database
    // TODO: Implement storage logic based on your database schema
    
    return;
  } catch (error) {
    console.error('❌ Failed to sync audit logs:', error);
    throw error;
  }
}

async function syncSecurityIncidents(days: number = 90): Promise<void> {
  console.log(`\n🚨 Syncing security incidents for last ${days} days...`);
  
  try {
    const response = await smartPayAPI.get<{ incidents: SecurityIncidentEntry[] }>(
      `/api/v1/admin/security/incidents/history?days=${days}`
    );
    
    console.log(`✅ Successfully fetched ${response.incidents.length} security incidents`);
    
    // Categorize by severity
    const severityCounts = {
      LOW: response.incidents.filter(i => i.severity === 'LOW').length,
      MEDIUM: response.incidents.filter(i => i.severity === 'MEDIUM').length,
      HIGH: response.incidents.filter(i => i.severity === 'HIGH').length,
      CRITICAL: response.incidents.filter(i => i.severity === 'CRITICAL').length,
    };
    
    console.log(`\n📊 Incident Severity Distribution:`);
    console.log(`   - LOW: ${severityCounts.LOW}`);
    console.log(`   - MEDIUM: ${severityCounts.MEDIUM}`);
    console.log(`   - HIGH: ${severityCounts.HIGH}`);
    console.log(`   - CRITICAL: ${severityCounts.CRITICAL}`);
    
    // Store in local database
    // TODO: Implement storage logic based on your database schema
    
    return;
  } catch (error) {
    console.error('❌ Failed to sync security incidents:', error);
    throw error;
  }
}

async function syncFraudDetections(days: number = 90): Promise<void> {
  console.log(`\n🎯 Syncing fraud detections for last ${days} days...`);
  
  try {
    const response = await smartPayAPI.get<{ detections: any[] }>(
      `/api/v1/admin/security/fraud/history?days=${days}`
    );
    
    console.log(`✅ Successfully fetched ${response.detections.length} fraud detections`);
    
    // Store in local database
    // TODO: Implement storage logic based on your database schema
    
    return;
  } catch (error) {
    console.error('❌ Failed to sync fraud detections:', error);
    throw error;
  }
}

async function main() {
  console.log('🚀 Starting security audit log sync...');
  console.log(`Timestamp: ${new Date().toISOString()}\n`);
  
  const days = parseInt(process.env.SYNC_DAYS || '90', 10);
  
  try {
    await syncAuditLogs(days);
    await syncSecurityIncidents(days);
    await syncFraudDetections(days);
    
    console.log('\n✨ Security audit log sync completed successfully!');
  } catch (error) {
    console.error('\n💥 Security audit log sync failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { syncAuditLogs, syncSecurityIncidents, syncFraudDetections };
