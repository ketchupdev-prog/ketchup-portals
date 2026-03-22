'use client';

/**
 * RAG Performance Dashboard – Knowledge base, query performance, and document coverage
 * Location: src/app/admin/ai-ml/rag/page.tsx
 * Connected to: SmartPay AI Service - LanceDB RAG system
 */

import { useState } from 'react';
import { useRAGPolling } from '@/lib/hooks/use-ai-ml-polling';
import { uploadRAGDocument, triggerRAGReindex, debugRAGQuery } from '@/lib/api/ai-ml';
import { MetricCard, MetricCardSkeleton, StatBar } from '@/components/ai-ml/charts';
import type { RAGPerformanceData } from '@/lib/types/ai-ml';

export default function RAGPerformancePage() {
  const { data, loading, error, lastUpdate, refresh } = useRAGPolling();
  const [uploading, setUploading] = useState(false);
  const [reindexing, setReindexing] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const result = await uploadRAGDocument(file);
    setUploading(false);

    if (result.success) {
      alert('Document uploaded successfully');
      refresh();
    } else {
      alert(`Upload failed: ${result.error ?? 'Unknown error'}`);
    }
  };

  const handleReindex = async () => {
    if (!confirm('Reindexing will rebuild the vector index. This may take several minutes. Continue?')) {
      return;
    }

    setReindexing(true);
    const result = await triggerRAGReindex();
    setReindexing(false);

    if (result.success) {
      alert('Reindexing started successfully');
      refresh();
    } else {
      alert(`Reindexing failed: ${result.error ?? 'Unknown error'}`);
    }
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-base-content">RAG Performance</h1>
          <p className="text-sm text-content-muted mt-1">Knowledge base & query performance</p>
        </div>
        <div className="alert alert-error">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Failed to load RAG performance data: {error}</span>
          <button onClick={refresh} className="btn btn-sm">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-base-content">RAG Performance</h1>
          <p className="text-sm text-content-muted mt-1">
            Knowledge base & query performance
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
          <RAGStatsSection data={data} />
          <QueryMetricsSection data={data} />
          <DocumentCoverageSection data={data} />
          <DocumentBrowserSection data={data} onUpload={handleFileUpload} uploading={uploading} />
          <ManagementSection onReindex={handleReindex} reindexing={reindexing} />
        </>
      ) : null}
    </div>
  );
}

function RAGStatsSection({ data }: { data: RAGPerformanceData }) {
  const { stats } = data;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <MetricCard
        label="Knowledge Base Size"
        value={`${stats.knowledgeBaseSize} docs`}
        icon="📚"
      />
      <MetricCard
        label="Total Chunks"
        value={stats.totalChunks.toLocaleString()}
        icon="📄"
      />
      <MetricCard
        label="Vector Dimensions"
        value={stats.vectorDimensions}
        icon="🔢"
      />
      <MetricCard
        label="Index Size"
        value={`${stats.indexSizeMB.toFixed(1)} MB`}
        icon="💾"
      />
    </div>
  );
}

function QueryMetricsSection({ data }: { data: RAGPerformanceData }) {
  const { queryMetrics } = data;
  
  const metrics = [
    {
      label: 'Avg Retrieval Time',
      value: queryMetrics.avgRetrievalTimeMs,
      target: queryMetrics.targetRetrievalTimeMs,
      unit: 'ms',
      status: queryMetrics.avgRetrievalTimeMs <= queryMetrics.targetRetrievalTimeMs ? 'success' : 'warning',
    },
    {
      label: 'Avg Relevance Score',
      value: queryMetrics.avgRelevanceScore,
      target: queryMetrics.targetRelevanceScore,
      unit: '',
      status: queryMetrics.avgRelevanceScore >= queryMetrics.targetRelevanceScore ? 'success' : 'warning',
    },
    {
      label: 'Context Window Usage',
      value: queryMetrics.contextWindowUsage,
      target: queryMetrics.targetContextWindowUsage,
      unit: '%',
      status: queryMetrics.contextWindowUsage <= queryMetrics.targetContextWindowUsage ? 'success' : 'warning',
    },
    {
      label: 'Hallucination Rate',
      value: queryMetrics.hallucinationRate,
      target: queryMetrics.targetHallucinationRate,
      unit: '%',
      status: queryMetrics.hallucinationRate <= queryMetrics.targetHallucinationRate ? 'success' : 'error',
    },
  ];

  return (
    <div className="card bg-base-200">
      <div className="card-body">
        <h2 className="card-title">Query Performance</h2>
        <div className="overflow-x-auto">
          <table className="table table-zebra">
            <thead>
              <tr>
                <th>Metric</th>
                <th>Value</th>
                <th>Target</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {metrics.map((metric) => (
                <tr key={metric.label}>
                  <td className="font-medium">{metric.label}</td>
                  <td>
                    {metric.unit === '%' ? `${(metric.value * 100).toFixed(0)}%` : 
                     `${metric.value}${metric.unit}`}
                  </td>
                  <td className="text-content-muted">
                    {metric.unit === '%' ? `<${(metric.target * 100).toFixed(0)}%` :
                     metric.label === 'Avg Relevance Score' ? `>${metric.target}` :
                     `<${metric.target}${metric.unit}`}
                  </td>
                  <td>
                    <span className={`badge badge-${metric.status}`}>
                      {metric.status === 'success' ? '✓' : '⚠'}
                    </span>
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

function DocumentCoverageSection({ data }: { data: RAGPerformanceData }) {
  return (
    <div className="card bg-base-200">
      <div className="card-body">
        <h2 className="card-title">Document Coverage (24h)</h2>
        <div className="overflow-x-auto">
          <table className="table table-zebra">
            <thead>
              <tr>
                <th>Document Type</th>
                <th>Count</th>
                <th>Queries (24h)</th>
                <th>Avg Relevance</th>
              </tr>
            </thead>
            <tbody>
              {data.documentCoverage.map((doc) => (
                <tr key={doc.documentType}>
                  <td className="font-medium">{doc.documentType}</td>
                  <td>{doc.count}</td>
                  <td>{doc.queries24h.toLocaleString()}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <progress 
                        className="progress progress-primary w-24" 
                        value={doc.avgRelevance * 100} 
                        max="100"
                      />
                      <span className="text-sm">{(doc.avgRelevance * 100).toFixed(0)}%</span>
                    </div>
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

function DocumentBrowserSection({ 
  data, 
  onUpload, 
  uploading 
}: { 
  data: RAGPerformanceData; 
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  uploading: boolean;
}) {
  return (
    <div className="card bg-base-200">
      <div className="card-body">
        <div className="flex items-center justify-between mb-4">
          <h2 className="card-title">Document Browser</h2>
          <label className={`btn btn-sm btn-primary ${uploading ? 'loading' : ''}`}>
            {uploading ? 'Uploading...' : '+ Upload Document'}
            <input 
              type="file" 
              className="hidden" 
              onChange={onUpload}
              accept=".pdf,.txt,.md,.docx"
              disabled={uploading}
            />
          </label>
        </div>
        
        <div className="overflow-x-auto">
          <table className="table table-sm">
            <thead>
              <tr>
                <th>Title</th>
                <th>Type</th>
                <th>Chunks</th>
                <th>Uploaded</th>
                <th>Last Queried</th>
                <th>Avg Relevance</th>
              </tr>
            </thead>
            <tbody>
              {data.documents.map((doc) => (
                <tr key={doc.id}>
                  <td className="font-medium">{doc.title}</td>
                  <td>
                    <span className="badge badge-sm badge-ghost">{doc.type}</span>
                  </td>
                  <td>{doc.chunksCount}</td>
                  <td className="text-xs">{new Date(doc.uploadedAt).toLocaleDateString()}</td>
                  <td className="text-xs">
                    {doc.lastQueried ? new Date(doc.lastQueried).toLocaleDateString() : 'Never'}
                  </td>
                  <td>
                    {doc.avgRelevance ? (
                      <span className={`badge badge-sm ${doc.avgRelevance >= 0.8 ? 'badge-success' : 'badge-warning'}`}>
                        {(doc.avgRelevance * 100).toFixed(0)}%
                      </span>
                    ) : (
                      <span className="text-content-muted">-</span>
                    )}
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

function ManagementSection({ 
  onReindex, 
  reindexing 
}: { 
  onReindex: () => void;
  reindexing: boolean;
}) {
  return (
    <div className="card bg-base-200">
      <div className="card-body">
        <h2 className="card-title">RAG Management</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h3 className="font-medium">Vector Index</h3>
            <p className="text-sm text-content-muted">
              Rebuild the vector index to improve query performance and include newly uploaded documents.
            </p>
            <button 
              onClick={onReindex}
              className={`btn btn-primary ${reindexing ? 'loading' : ''}`}
              disabled={reindexing}
            >
              {reindexing ? 'Reindexing...' : 'Trigger Reindex'}
            </button>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-medium">Query Debugger</h3>
            <p className="text-sm text-content-muted">
              Test RAG queries and inspect retrieved chunks with relevance scores.
            </p>
            <button className="btn btn-secondary">
              Open Query Debugger
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
