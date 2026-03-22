/**
 * API Health Monitoring Dashboard
 * Real-time monitoring of all API connections and system health
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { smartPayAPI, smartPayAI, APIClient } from '@/lib/api/client';
import { backendWebSocket, aiWebSocket } from '@/lib/websocket/manager';
import { dashboardCache } from '@/lib/cache/cache-manager';

interface EndpointHealth {
  name: string;
  endpoint: string;
  status: 'healthy' | 'degraded' | 'down';
  latency: number;
  lastChecked: Date;
  errorRate: number;
  requests24h: number;
}

interface ServiceHealth {
  name: string;
  status: 'online' | 'offline' | 'degraded';
  uptime: number;
  endpoints: EndpointHealth[];
}

export default function APIHealthPage() {
  const [services, setServices] = useState<ServiceHealth[]>([]);
  const [loading, setLoading] = useState(true);
  const [wsBackendConnected, setWsBackendConnected] = useState(false);
  const [wsAIConnected, setWsAIConnected] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const checkEndpointHealth = async (
    name: string,
    endpoint: string,
    apiClient: APIClient
  ): Promise<EndpointHealth> => {
    const startTime = Date.now();
    
    try {
      await apiClient.get(endpoint);
      const latency = Date.now() - startTime;
      
      return {
        name,
        endpoint,
        status: latency < 1000 ? 'healthy' : latency < 3000 ? 'degraded' : 'down',
        latency,
        lastChecked: new Date(),
        errorRate: 0,
        requests24h: 0,
      };
    } catch (error) {
      return {
        name,
        endpoint,
        status: 'down',
        latency: Date.now() - startTime,
        lastChecked: new Date(),
        errorRate: 100,
        requests24h: 0,
      };
    }
  };

  const fetchHealthData = async () => {
    setLoading(true);
    
    try {
      const backendEndpoints = await Promise.all([
        checkEndpointHealth('KRI Metrics', '/api/v1/compliance/kri', smartPayAPI),
        checkEndpointHealth('Reconciliation', '/api/v1/compliance/reconciliation/status', smartPayAPI),
        checkEndpointHealth('Security Overview', '/api/v1/admin/security/overview', smartPayAPI),
        checkEndpointHealth('Analytics System', '/api/v1/admin/analytics/system', smartPayAPI),
        checkEndpointHealth('Transaction Metrics', '/api/v1/admin/financial/transactions/metrics', smartPayAPI),
      ]);

      const aiEndpoints = await Promise.all([
        checkEndpointHealth('Copilot Performance', '/api/v1/ai/copilot/performance', smartPayAI),
        checkEndpointHealth('Model Metrics', '/api/v1/ai/models/metrics', smartPayAI),
        checkEndpointHealth('Fraud Detection', '/api/v1/ai/fraud/metrics', smartPayAI),
      ]);

      const backendStatus = backendEndpoints.every(e => e.status === 'healthy')
        ? 'online'
        : backendEndpoints.some(e => e.status === 'down')
        ? 'degraded'
        : 'online';

      const aiStatus = aiEndpoints.every(e => e.status === 'healthy')
        ? 'online'
        : aiEndpoints.some(e => e.status === 'down')
        ? 'degraded'
        : 'online';

      const backendUptime = (backendEndpoints.filter(e => e.status !== 'down').length / backendEndpoints.length) * 100;
      const aiUptime = (aiEndpoints.filter(e => e.status !== 'down').length / aiEndpoints.length) * 100;

      setServices([
        {
          name: 'SmartPay Backend',
          status: backendStatus,
          uptime: backendUptime,
          endpoints: backendEndpoints,
        },
        {
          name: 'SmartPay AI',
          status: aiStatus,
          uptime: aiUptime,
          endpoints: aiEndpoints,
        },
      ]);

      setWsBackendConnected(backendWebSocket.isConnected());
      setWsAIConnected(aiWebSocket.isConnected());
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Failed to fetch health data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealthData();
    
    const interval = setInterval(fetchHealthData, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'online':
        return 'text-green-600';
      case 'degraded':
        return 'text-yellow-600';
      case 'down':
      case 'offline':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'online':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'degraded':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'down':
      case 'offline':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Activity className="h-5 w-5 text-gray-600" />;
    }
  };

  const cacheStats = dashboardCache.getStats();

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">API Health Monitoring</h1>
          <p className="text-muted-foreground">
            Real-time monitoring of API connections and system health
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            Last refresh: {lastRefresh.toLocaleTimeString()}
          </div>
          <Button onClick={fetchHealthData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">SmartPay Backend</CardTitle>
            {getStatusIcon(services[0]?.status || 'offline')}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{services[0]?.uptime.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Uptime</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">SmartPay AI</CardTitle>
            {getStatusIcon(services[1]?.status || 'offline')}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{services[1]?.uptime.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Uptime</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">WebSocket Backend</CardTitle>
            {wsBackendConnected ? (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            ) : (
              <XCircle className="h-5 w-5 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{wsBackendConnected ? 'Connected' : 'Disconnected'}</div>
            <p className="text-xs text-muted-foreground">Real-time events</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cache Status</CardTitle>
            <Activity className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cacheStats.size}/{cacheStats.maxSize}</div>
            <p className="text-xs text-muted-foreground">
              {cacheStats.totalHits} hits
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="backend" className="space-y-4">
        <TabsList>
          <TabsTrigger value="backend">Backend Endpoints</TabsTrigger>
          <TabsTrigger value="ai">AI Endpoints</TabsTrigger>
          <TabsTrigger value="cache">Cache Details</TabsTrigger>
        </TabsList>

        <TabsContent value="backend" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>SmartPay Backend Endpoints</CardTitle>
              <CardDescription>Status and performance of backend API endpoints</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {services[0]?.endpoints.map((endpoint) => (
                  <div
                    key={endpoint.endpoint}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {getStatusIcon(endpoint.status)}
                      <div>
                        <div className="font-medium">{endpoint.name}</div>
                        <div className="text-sm text-muted-foreground">{endpoint.endpoint}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="text-sm font-medium">{endpoint.latency}ms</div>
                        <div className="text-xs text-muted-foreground">Latency</div>
                      </div>
                      <Badge variant={endpoint.status === 'healthy' ? 'default' : 'destructive'}>
                        {endpoint.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>SmartPay AI Endpoints</CardTitle>
              <CardDescription>Status and performance of AI service endpoints</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {services[1]?.endpoints.map((endpoint) => (
                  <div
                    key={endpoint.endpoint}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {getStatusIcon(endpoint.status)}
                      <div>
                        <div className="font-medium">{endpoint.name}</div>
                        <div className="text-sm text-muted-foreground">{endpoint.endpoint}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="text-sm font-medium">{endpoint.latency}ms</div>
                        <div className="text-xs text-muted-foreground">Latency</div>
                      </div>
                      <Badge variant={endpoint.status === 'healthy' ? 'default' : 'destructive'}>
                        {endpoint.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cache" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cache Performance</CardTitle>
              <CardDescription>Dashboard cache statistics and performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="p-4 border rounded-lg">
                    <div className="text-2xl font-bold">{cacheStats.size}</div>
                    <div className="text-sm text-muted-foreground">Cached Entries</div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="text-2xl font-bold">{cacheStats.totalHits}</div>
                    <div className="text-sm text-muted-foreground">Total Hits</div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="text-2xl font-bold">
                      {((cacheStats.size / cacheStats.maxSize) * 100).toFixed(0)}%
                    </div>
                    <div className="text-sm text-muted-foreground">Capacity Used</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Active Cache Entries</h4>
                  {cacheStats.entries.slice(0, 10).map((entry) => (
                    <div key={entry.key} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <div className="font-medium text-sm">{entry.key}</div>
                        <div className="text-xs text-muted-foreground">
                          Age: {Math.floor(entry.age / 1000)}s | TTL: {Math.floor(entry.ttl / 1000)}s
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={entry.expired ? 'destructive' : 'default'}>
                          {entry.hits} hits
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
