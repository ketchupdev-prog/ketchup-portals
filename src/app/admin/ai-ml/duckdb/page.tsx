'use client';

/**
 * DuckDB Analytics Dashboard – ETL sync status, table management, and query console
 * Location: src/app/admin/ai-ml/duckdb/page.tsx
 * Connected to: SmartPay AI Service - DuckDB analytics database
 */

import { useState } from 'react';
import { useDuckDBPolling } from '@/lib/hooks/use-ai-ml-polling';
import { triggerDuckDBSync, executeDuckDBQuery } from '@/lib/api/ai-ml';
import { MetricCard, MetricCardSkeleton, TimeSeriesChart } from '@/components/ai-ml/charts';
import type { DuckDBAnalyticsData } from '@/lib/types/ai-ml';

export default function DuckDBAnalyticsPage() {
  const [isSyncing, setIsSyncing] = useState(false);
  const { data, loading, error, lastUpdate, refresh } = useDuckDBPolling({ 
    enabled: true,
    isSyncing 
  });
  const [queryInput, setQueryInput] = useState('');
  const [queryResult, setQueryResult] = useState<any>(null);
  const [queryLoading, setQueryLoading] = useState(false);
  const [queryError, setQueryError] = useState<string | null>(null);

  const handleSync = async () => {
    if (!confirm('Trigger ETL sync from PostgreSQL to DuckDB? This may take several minutes.')) {
      return;
    }

    setIsSyncing(true);
    const result = await triggerDuckDBSync();

    if (result.success) {
      alert('Sync started successfully');
      refresh();
      setTimeout(() => setIsSyncing(false), 300000);
    } else {
      alert(`Sync failed: ${result.error ?? 'Unknown error'}`);
      setIsSyncing(false);
    }
  };

  const handleQuery = async () => {
    if (!queryInput.trim()) {
      alert('Please enter a SQL query');
      return;
    }

    setQueryLoading(true);
    setQueryError(null);
    
    const result = await executeDuckDBQuery(queryInput);
    setQueryLoading(false);

    if (result.success) {
      setQueryResult(result.data ?? result.rows);
    } else {
      setQueryError(result.error || 'Query execution failed');
    }
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-base-content">DuckDB Analytics</h1>
          <p className="text-sm text-content-muted mt-1">ETL sync status & query console</p>
        </div>
        <div className="alert alert-error">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Failed to load DuckDB status: {error}</span>
          <button onClick={refresh} className="btn btn-sm">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-base-content">DuckDB Analytics</h1>
          <p className="text-sm text-content-muted mt-1">
            ETL sync status & query console
            {lastUpdate && (
              <span className="ml-2">
                • Last updated: {lastUpdate.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={refresh} 
            className="btn btn-sm btn-ghost"
            disabled={loading}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
          <button 
            onClick={handleSync}
            className={`btn btn-sm btn-primary ${isSyncing ? 'loading' : ''}`}
            disabled={isSyncing}
          >
            {isSyncing ? 'Syncing...' : '🔄 Trigger Sync'}
          </button>
        </div>
      </div>

      {loading && !data ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
          </div>
        </>
      ) : data ? (
        <>
          <StatusSection data={data} isSyncing={isSyncing} />
          <TablesSection data={data} />
          <SyncHealthSection data={data} />
          <QueryConsoleSection
            queryInput={queryInput}
            setQueryInput={setQueryInput}
            handleQuery={handleQuery}
            queryLoading={queryLoading}
            queryResult={queryResult}
            queryError={queryError}
          />
          <ETLPipelineSection />
        </>
      ) : null}
    </div>
  );
}

function StatusSection({ data, isSyncing }: { data: DuckDBAnalyticsData; isSyncing: boolean }) {
  const { status } = data;
  const statusColor = status.syncStatus === 'HEALTHY' ? 'success' : status.syncStatus === 'WARNING' ? 'warning' : 'error';
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <MetricCard
        label="Database Size"
        value={`${status.databaseSizeMB.toFixed(1)} MB`}
        icon="💾"
      />
      <MetricCard
        label="Tables"
        value={status.tableCount}
        icon="📊"
      />
      <MetricCard
        label="Last Sync"
        value={new Date(status.lastSyncAt).toLocaleTimeString()}
        icon="🔄"
      />
      <div className="card bg-base-200">
        <div className="card-body">
          <h3 className="text-xs text-content-muted uppercase tracking-wide">Sync Status</h3>
          <div className="flex items-center gap-2 mt-1">
            <span className={`badge badge-${statusColor} badge-lg`}>
              {isSyncing ? 'SYNCING' : status.syncStatus}
            </span>
            {isSyncing && (
              <span className="loading loading-spinner loading-sm"></span>
            )}
          </div>
          {status.lastError && (
            <p className="text-xs text-error mt-1">{status.lastError}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function TablesSection({ data }: { data: DuckDBAnalyticsData }) {
  return (
    <div className="card bg-base-200">
      <div className="card-body">
        <h2 className="card-title">Tables</h2>
        <div className="overflow-x-auto">
          <table className="table table-zebra">
            <thead>
              <tr>
                <th>Table</th>
                <th>Row Count</th>
                <th>Last Update</th>
                <th>Sync Frequency</th>
              </tr>
            </thead>
            <tbody>
              {data.tables.map((table) => (
                <tr key={table.tableName}>
                  <td className="font-medium font-mono">{table.tableName}</td>
                  <td>{table.rowCount.toLocaleString()}</td>
                  <td className="text-xs">
                    {new Date(table.lastUpdate).toLocaleString()}
                  </td>
                  <td>
                    <span className="badge badge-sm badge-ghost">{table.syncFrequency}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SyncHealthSection({ data }: { data: DuckDBAnalyticsData }) {
  const { syncHealth } = data;
  
  const chartData = syncHealth.syncHistory.map((sync) => ({
    name: new Date(sync.timestamp).toLocaleTimeString(),
    value: sync.duration,
    status: sync.status,
  }));

  return (
    <div className="card bg-base-200">
      <div className="card-body">
        <h2 className="card-title">Sync Health</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Data Quality</h3>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <progress 
                    className={`progress progress-${syncHealth.dataQualityScore >= 95 ? 'success' : 'warning'} w-full`}
                    value={syncHealth.dataQualityScore} 
                    max="100"
                  />
                </div>
                <span className="text-lg font-bold">{syncHealth.dataQualityScore}%</span>
              </div>
              <p className="text-xs text-content-muted mt-1">
                Row count parity ±5% between PostgreSQL and DuckDB
              </p>
            </div>

            <div>
              <h3 className="font-medium mb-2">Sync Status</h3>
              <div className="space-y-2 text-sm">
                {syncHealth.lastFailedSync && (
                  <div className="flex justify-between">
                    <span className="text-content-muted">Last Failed Sync</span>
                    <span className="text-error">
                      {new Date(syncHealth.lastFailedSync).toLocaleString()}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-content-muted">Retry Count</span>
                  <span className="font-medium">{syncHealth.retryCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-content-muted">Total Syncs</span>
                  <span className="font-medium">{syncHealth.syncHistory.length}</span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-2">Recent Sync History</h3>
            <div className="space-y-2">
              {syncHealth.syncHistory.slice(-5).reverse().map((sync, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-base-100 rounded">
                  <div className="flex items-center gap-2">
                    <span className={`badge badge-${sync.status === 'success' ? 'success' : 'error'} badge-sm`}>
                      {sync.status}
                    </span>
                    <span className="text-xs">{new Date(sync.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <div className="text-xs text-content-muted">
                    {sync.rowsProcessed.toLocaleString()} rows • {sync.duration}ms
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function QueryConsoleSection({
  queryInput,
  setQueryInput,
  handleQuery,
  queryLoading,
  queryResult,
  queryError,
}: {
  queryInput: string;
  setQueryInput: (value: string) => void;
  handleQuery: () => void;
  queryLoading: boolean;
  queryResult: any;
  queryError: string | null;
}) {
  return (
    <div className="card bg-base-200">
      <div className="card-body">
        <h2 className="card-title">Query Console</h2>
        
        <div className="space-y-4">
          <div>
            <textarea
              className="textarea textarea-bordered w-full font-mono text-sm"
              rows={6}
              placeholder="SELECT * FROM transactions LIMIT 10;"
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            <button 
              onClick={handleQuery}
              className={`btn btn-primary ${queryLoading ? 'loading' : ''}`}
              disabled={queryLoading}
            >
              {queryLoading ? 'Executing...' : '▶ Execute Query'}
            </button>
            <button 
              onClick={() => setQueryInput('')}
              className="btn btn-ghost"
            >
              Clear
            </button>
          </div>

          {queryError && (
            <div className="alert alert-error">
              <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{queryError}</span>
            </div>
          )}

          {queryResult && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">Results</h3>
                <span className="text-xs text-content-muted">
                  {queryResult.rows.length} rows • Executed in {queryResult.executionTimeMs}ms
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="table table-sm table-zebra">
                  <thead>
                    <tr>
                      {queryResult.columns.map((col: string) => (
                        <th key={col}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {queryResult.rows.map((row: any, idx: number) => (
                      <tr key={idx}>
                        {queryResult.columns.map((col: string) => (
                          <td key={col} className="font-mono text-xs">
                            {JSON.stringify(row[col])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ETLPipelineSection() {
  return (
    <div className="card bg-base-200">
      <div className="card-body">
        <h2 className="card-title">ETL Pipeline</h2>
        
        <div className="bg-base-100 p-4 rounded-lg">
          <pre className="text-xs overflow-x-auto">
{`PostgreSQL → DuckDB ETL Service → DuckDB → ML Training
   (Neon)     (Python cron)      (Local file)  (Models)

Flow:
1. PostgreSQL (Neon) stores production data
2. ETL service syncs data to DuckDB on schedule
3. DuckDB provides fast analytics queries
4. ML training reads from DuckDB snapshots`}
          </pre>
        </div>

        <div className="mt-4">
          <h3 className="font-medium mb-2">Sync Schedule</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between p-2 bg-base-100 rounded">
              <span>Transactions, Fraud Events</span>
              <span className="badge badge-primary">Hourly</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-base-100 rounded">
              <span>Users, Wallets</span>
              <span className="badge badge-secondary">Daily</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-base-100 rounded">
              <span>Groups, Loans</span>
              <span className="badge badge-accent">Weekly</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
