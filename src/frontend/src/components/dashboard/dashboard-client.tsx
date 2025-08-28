'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import type { StatusResponse as ISystemStatus } from '../../../lib/types';
import { TrafficMonitor } from './traffic-monitor';
import { ClassificationLog } from './classification-log';
import { PerformanceCharts } from './performance-charts';
import { AIInvestigations } from './ai-investigations';

const API_URL = 'http://localhost:8000/status';

// Initial state to prevent undefined errors on first render
const initialSystemState: ISystemStatus = {
  active_flows: [],
  classification_log: [],
  active_policies: [],
  metrics: {
    high_prio: { bandwidth: 0, packets: 0 },
    video_stream: { bandwidth: 0, packets: 0 },
    best_effort: { bandwidth: 0, packets: 0 },
    low_prio: { bandwidth: 0, packets: 0 },
  },
  investigations: [],
};

export function DashboardClient() {
  const [activeTab, setActiveTab] = useState<'log' | 'investigations'>('log');
  const [systemStatus, setSystemStatus] = useState<ISystemStatus>(initialSystemState);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function fetchData() {
      try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Network response was not ok');
        const data: ISystemStatus = await response.json();
        if (mounted) {
          setSystemStatus(data);
          if (hasError) setHasError(false);
        }
      } catch (error) {
        console.error('Failed to fetch system status:', error);
        if (mounted) setHasError(true);
      }
    }
    fetchData();
    const intervalId = setInterval(fetchData, 2000); // Poll every 2 seconds

    return () => {
      mounted = false;
      clearInterval(intervalId);
    };
  }, [hasError]); // Dependency array includes hasError to retry connection

  if (hasError) return <ErrorDisplay />;

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <Button
          size="sm"
          variant={activeTab === 'log' ? 'default' : 'ghost'}
          className={`${activeTab === 'log' ? 'bg-sky-500 text-white' : 'bg-gray-100'}`}
          onClick={() => setActiveTab('log')}
        >
          Classification Log
        </Button>

        <Button
          size="sm"
          variant={activeTab === 'investigations' ? 'default' : 'ghost'}
          className={`${activeTab === 'investigations' ? 'bg-sky-500 text-white' : 'bg-gray-100'}`}
          onClick={() => setActiveTab('investigations')}
        >
          AI Investigations
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="lg:col-span-2">
          <TrafficMonitor
            flows={systemStatus.active_flows}
            policies={systemStatus.active_policies}
            suggestions={[]}
          />
        </div>

        {activeTab === 'log' ? (
          <ClassificationLog logs={systemStatus.classification_log} />
        ) : (
          <AIInvestigations investigations={systemStatus.investigations} />
        )}

        <PerformanceCharts metrics={systemStatus.metrics} />
      </div>
    </div>
  );
}

function ErrorDisplay() {
  return (
    <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed border-red-300 bg-red-50 text-red-700">
      <p className="text-center font-medium">
        Connection to backend orchestrator failed.
        <br />
        Please ensure the Python service is running on port 8000.
      </p>
    </div>
  );
}
