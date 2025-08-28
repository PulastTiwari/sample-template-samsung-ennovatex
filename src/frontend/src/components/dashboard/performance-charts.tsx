'use client';

import type { Metrics as IMetrics } from '../../../lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface PerformanceChartsProps {
  metrics?: IMetrics;
}

export function PerformanceCharts({ metrics }: PerformanceChartsProps) {
  if (!metrics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-500">No metrics available</div>
        </CardContent>
      </Card>
    );
  }

  const chartData = [
    { name: 'High Priority', Bandwidth: metrics.high_prio.bandwidth, Packets: metrics.high_prio.packets },
    { name: 'Video Stream', Bandwidth: metrics.video_stream.bandwidth, Packets: metrics.video_stream.packets },
    { name: 'Best Effort', Bandwidth: metrics.best_effort.bandwidth, Packets: metrics.best_effort.packets },
    { name: 'Low Priority', Bandwidth: metrics.low_prio.bandwidth, Packets: metrics.low_prio.packets },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance Metrics by QoS Class</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.8)',
                  border: '1px solid #ccc',
                  borderRadius: '0.5rem',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '14px' }} />
              <Bar dataKey="Bandwidth" fill="#8884d8" radius={[6, 6, 0, 0]} />
              <Bar dataKey="Packets" fill="#82ca9d" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
