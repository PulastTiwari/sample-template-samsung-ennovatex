"use client";

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button'
import type { Flow as IFlow, Policy as IPolicy, Suggestion as ISuggestion } from '../../../lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { api } from '../../../lib/api';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface TrafficMonitorProps {
  flows: IFlow[];
  policies: IPolicy[];
  suggestions?: ISuggestion[];
}

export function TrafficMonitor({ flows, policies, suggestions = [] }: TrafficMonitorProps) {
  const policyMap = new Map(policies.map((p) => [p.flow_id, p]));
  const [localSuggestions, setLocalSuggestions] = useState<ISuggestion[]>(suggestions);

  useEffect(() => {
    setLocalSuggestions(suggestions);
  }, [suggestions]);

  async function approveSuggestion(id: string) {
    try {
      await api.approveSuggestion(id);
      setLocalSuggestions((s: ISuggestion[]) => s.filter((x: ISuggestion) => x.id !== id));
    } catch (e) {
      console.error('approve failed', e);
    }
  }

  async function denySuggestion(id: string) {
    try {
      await api.denySuggestion(id);
      setLocalSuggestions((s: ISuggestion[]) => s.filter((x: ISuggestion) => x.id !== id));
    } catch (e) {
      console.error('deny failed', e);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Live Traffic Monitor</CardTitle>
        <CardDescription>
          Real-time view of detected traffic flows and applied QoS policies.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {suggestions.length > 0 && (
          <div className="mb-4">
            <h4 className="mb-2 text-sm font-semibold">Suggested Policies</h4>
            <div className="space-y-2">
              {suggestions.map((s) => (
                <div key={s.id} className="flex items-center justify-between rounded border p-2">
                  <div>
                    <div className="text-sm font-medium">{s.suggested_app}</div>
                    <div className="text-xs text-gray-500">{s.rationale}</div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => approveSuggestion(s.id)} className="px-2 py-1 rounded bg-green-500 text-white text-xs">Approve</Button>
                    <Button onClick={() => denySuggestion(s.id)} className="px-2 py-1 rounded bg-red-200 text-red-700 text-xs">Deny</Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        <Table>
          <TableHeader>
            <TableRow>
                <TableHead>Engine</TableHead>
              <TableHead>Source IP</TableHead>
              <TableHead>Destination</TableHead>
              <TableHead>Application</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>DSCP Class</TableHead>
              <TableHead>TC Class</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {flows.map((flow) => {
              const policy = policyMap.get(flow.id) as IPolicy | undefined;
              return (
                <TableRow key={flow.id}>
                  <TableCell className="w-12 text-center">{
                    flow.engine === 'Sentry' ? '⚡' : flow.engine === 'Vanguard' ? '🧠' : '❓'
                  }</TableCell>
                  <TableCell className="font-mono text-xs">{flow.source_ip}</TableCell>
                  <TableCell className="font-mono text-xs">{`${flow.dest_ip}:${flow.dest_port}`}</TableCell>
                  <TableCell>{flow.app_type ?? '---'}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        flow.status === 'Policy Applied' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {flow.status}
                    </span>
                  </TableCell>
                  <TableCell>{policy?.dscp_class ?? '---'}</TableCell>
                  <TableCell>{policy?.tc_class ?? '---'}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
