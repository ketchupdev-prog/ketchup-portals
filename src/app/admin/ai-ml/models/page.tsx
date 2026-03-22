'use client';

/**
 * ML Models Dashboard – Machine learning model metrics, training, and deployment status
 * Location: src/app/admin/ai-ml/models/page.tsx
 * Connected to: SmartPay AI Service - ML models (Fraud, Credit, Spending)
 */

import { useState } from 'react';
import { useMLModelsPolling } from '@/lib/hooks/use-ai-ml-polling';
import { triggerModelRetrain, rollbackModel } from '@/lib/api/ai-ml';
import { MetricCard, MetricCardSkeleton, SimpleBarChart } from '@/components/ai-ml/charts';
import type { MLModelsData } from '@/lib/types/ai-ml';

export default function MLModelsPage() {
  const { data, loading, error, lastUpdate, refresh } = useMLModelsPolling();
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [retraining, setRetraining] = useState(false);

  const handleRetrain = async (modelId: string) => {
    if (!confirm('Retraining will create a new model version. This may take several hours. Continue?')) {
      return;
    }

    setRetraining(true);
    const result = await triggerModelRetrain(modelId);
    setRetraining(false);

    if (result.success) {
      alert(`Retraining started: Job ID ${result.jobId}`);
      refresh();
    } else {
      alert(`Retraining failed: ${result.error ?? 'Unknown error'}`);
    }
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-base-content">ML Models</h1>
          <p className="text-sm text-content-muted mt-1">Machine learning model metrics, training & deployment</p>
        </div>
        <div className="alert alert-error">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Failed to load ML models data: {error}</span>
          <button onClick={refresh} className="btn btn-sm">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-base-content">ML Models</h1>
          <p className="text-sm text-content-muted mt-1">
            Machine learning model metrics, training & deployment
            {lastUpdate && (
              <span className="ml-2">
                • Last updated: {lastUpdate.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
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

      {loading && !data ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
          </div>
        </>
      ) : data ? (
        <>
          <ModelRegistrySection 
            data={data} 
            onRetrain={handleRetrain} 
            retraining={retraining}
            selectedModel={selectedModel}
            setSelectedModel={setSelectedModel}
          />
          <FraudDetectionSection data={data} />
          <CreditScoringSection data={data} />
          <SpendingAnalysisSection data={data} />
          <DriftAlertsSection data={data} />
        </>
      ) : null}
    </div>
  );
}

function ModelRegistrySection({ 
  data, 
  onRetrain, 
  retraining,
  selectedModel,
  setSelectedModel 
}: { 
  data: MLModelsData; 
  onRetrain: (modelId: string) => void;
  retraining: boolean;
  selectedModel: string | null;
  setSelectedModel: (id: string | null) => void;
}) {
  return (
    <div className="card bg-base-200">
      <div className="card-body">
        <h2 className="card-title">Model Registry</h2>
        <div className="overflow-x-auto">
          <table className="table table-zebra">
            <thead>
              <tr>
                <th>Model</th>
                <th>Version</th>
                <th>Accuracy</th>
                <th>Last Trained</th>
                <th>Status</th>
                <th>Deployed</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.models.map((model) => (
                <tr key={model.modelId}>
                  <td className="font-medium">{model.name}</td>
                  <td>
                    <span className="badge badge-ghost">{model.version}</span>
                  </td>
                  <td>{(model.accuracy * 100).toFixed(1)}%</td>
                  <td className="text-xs">
                    {new Date(model.lastTrained).toLocaleDateString()}
                  </td>
                  <td>
                    <span className={`badge badge-${model.status === 'ACTIVE' ? 'success' : model.status === 'TRAINING' ? 'warning' : 'ghost'}`}>
                      {model.status}
                    </span>
                  </td>
                  <td>
                    {model.deployed ? (
                      <span className="text-success">✓</span>
                    ) : (
                      <span className="text-content-muted">-</span>
                    )}
                  </td>
                  <td>
                    <div className="flex gap-1">
                      <button 
                        className="btn btn-xs btn-ghost"
                        onClick={() => setSelectedModel(selectedModel === model.modelId ? null : model.modelId)}
                      >
                        Details
                      </button>
                      <button 
                        className={`btn btn-xs btn-primary ${retraining ? 'loading' : ''}`}
                        onClick={() => onRetrain(model.modelId)}
                        disabled={retraining || model.status === 'TRAINING'}
                      >
                        Retrain
                      </button>
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

function FraudDetectionSection({ data }: { data: MLModelsData }) {
  if (!data.fraudDetection) return null;

  const metrics = data.fraudDetection;
  const featureData = data.featureImportance['fraud']?.slice(0, 10).map(f => ({
    name: f.featureName,
    value: f.importance * 100,
  })) || [];

  return (
    <div className="card bg-base-200">
      <div className="card-body">
        <h2 className="card-title">Fraud Detection Model (Production)</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <MetricCard
            label="ROC-AUC"
            value={`${(metrics.rocAuc * 100).toFixed(1)}%`}
            changeType={metrics.rocAuc >= 0.85 ? 'positive' : 'negative'}
          />
          <MetricCard
            label="Precision"
            value={`${(metrics.precision * 100).toFixed(1)}%`}
          />
          <MetricCard
            label="Recall"
            value={`${(metrics.recall * 100).toFixed(1)}%`}
          />
          <MetricCard
            label="F1 Score"
            value={`${(metrics.f1Score * 100).toFixed(1)}%`}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <h3 className="font-medium mb-2">Training Data</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-content-muted">Training Data Size</span>
                <span className="font-medium">{metrics.trainingDataSize.toLocaleString()} transactions</span>
              </div>
              <div className="flex justify-between">
                <span className="text-content-muted">Feature Count</span>
                <span className="font-medium">{metrics.featureCount} features</span>
              </div>
            </div>

            <h3 className="font-medium mt-4 mb-2">Production Metrics (24h)</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-content-muted">Total Predictions</span>
                <span className="font-medium">{metrics.predictions24h.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-content-muted">High Risk Flagged</span>
                <span className="font-medium">{metrics.highRiskFlagged} ({((metrics.highRiskFlagged / metrics.predictions24h) * 100).toFixed(1)}%)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-content-muted">Confirmed Fraud</span>
                <span className="font-medium text-error">{metrics.confirmedFraud}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-content-muted">False Positives</span>
                <span className="font-medium text-warning">{metrics.falsePositives}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-2">Top Features by Importance</h3>
            {featureData.length > 0 ? (
              <SimpleBarChart 
                data={featureData} 
                dataKey="value" 
                height={250}
                color="#ef4444"
              />
            ) : (
              <p className="text-sm text-content-muted">No feature importance data available</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function CreditScoringSection({ data }: { data: MLModelsData }) {
  if (!data.creditScoring) return null;

  const metrics = data.creditScoring;

  return (
    <div className="card bg-base-200">
      <div className="card-body">
        <h2 className="card-title">Credit Scoring Model (Production)</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <MetricCard
            label="Accuracy"
            value={`${(metrics.accuracy * 100).toFixed(1)}%`}
            changeType={metrics.accuracy >= 0.80 ? 'positive' : 'negative'}
          />
          <MetricCard
            label="Training Data"
            value={`${metrics.trainingDataSize.toLocaleString()} loans`}
          />
          <MetricCard
            label="Features"
            value={metrics.featureCount}
          />
          <MetricCard
            label="Default Rate"
            value={`${(metrics.approvedLoansDefaultRate * 100).toFixed(1)}%`}
            changeType={metrics.approvedLoansDefaultRate <= metrics.targetDefaultRate ? 'positive' : 'negative'}
          />
        </div>

        <div className="mt-4">
          <div className="alert alert-info">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>
              Default rate of {(metrics.approvedLoansDefaultRate * 100).toFixed(1)}% is 
              {metrics.approvedLoansDefaultRate <= metrics.targetDefaultRate ? ' within' : ' above'} target of {(metrics.targetDefaultRate * 100).toFixed(0)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function SpendingAnalysisSection({ data }: { data: MLModelsData }) {
  if (!data.spendingAnalysis) return null;

  const metrics = data.spendingAnalysis;

  return (
    <div className="card bg-base-200">
      <div className="card-body">
        <h2 className="card-title">Spending Analysis Model (Production)</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <MetricCard
            label="Silhouette Score"
            value={metrics.silhouetteScore.toFixed(2)}
            changeType={metrics.silhouetteScore >= 0.7 ? 'positive' : 'neutral'}
          />
          <MetricCard
            label="Training Data"
            value={`${metrics.trainingDataSize.toLocaleString()} txns`}
          />
          <MetricCard
            label="Clusters"
            value={metrics.clusterCount}
          />
          <MetricCard
            label="Categories"
            value={metrics.categories.length}
          />
        </div>

        <div className="mt-4">
          <h3 className="font-medium mb-2">Spending Categories</h3>
          <div className="flex flex-wrap gap-2">
            {metrics.categories.map((category) => (
              <span key={category} className="badge badge-lg badge-primary">
                {category}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function DriftAlertsSection({ data }: { data: MLModelsData }) {
  return (
    <div className="card bg-base-200">
      <div className="card-body">
        <h2 className="card-title">Model Drift Alerts</h2>
        
        {data.driftAlerts.length === 0 ? (
          <div className="alert alert-success">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>No model drift detected. All models are performing within expected parameters.</span>
          </div>
        ) : (
          <div className="space-y-2">
            {data.driftAlerts.map((alert) => (
              <div key={alert.modelId} className={`alert alert-${alert.severity === 'high' ? 'error' : 'warning'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <h3 className="font-bold">Model: {alert.modelId}</h3>
                  <p className="text-sm">
                    Drift detected on {new Date(alert.detectedAt).toLocaleString()} (score: {alert.driftScore.toFixed(2)})
                  </p>
                  <p className="text-xs">Affected features: {alert.affectedFeatures.join(', ')}</p>
                </div>
                <button className="btn btn-sm">Investigate</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
