'use client';

import type { ClassificationLogEntry as ILogEntry } from '../../../lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ClassificationLogProps {
  logs: ILogEntry[];
}

export function ClassificationLog({ logs }: ClassificationLogProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Classification Log</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64 overflow-y-auto rounded-md bg-gray-900 p-4 font-mono text-xs text-white">
          {logs.map((log, index) => (
            <p key={index} className="whitespace-pre-wrap">
              <span className="text-gray-400">{` `}</span>
              <span className={log.message.includes('classified as') ? 'text-cyan-300' : 'text-gray-200'}>
                {log.message}
              </span>
            </p>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
