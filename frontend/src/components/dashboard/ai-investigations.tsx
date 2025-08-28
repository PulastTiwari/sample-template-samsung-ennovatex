'use client';

import type { Investigation } from '../../../lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ShapExplanation from '@/components/ui/ShapExplanation';

interface AIInvestigationsProps {
  investigations: Investigation[];
}

export function AIInvestigations({ investigations }: AIInvestigationsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Investigations</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {investigations.length === 0 ? (
            <p className="text-gray-500 text-sm">No active investigations</p>
          ) : (
            investigations.map((investigation) => (
              <div key={investigation.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium text-sm">Flow ID: {investigation.flow_id}</h4>
                  <span className="text-xs text-gray-500">{investigation.timestamp}</span>
                </div>
                <p className="text-sm text-gray-700 mb-2">{investigation.details}</p>
                <span className={`inline-block px-2 py-1 text-xs rounded ${
                  investigation.status === 'active' 
                    ? 'bg-yellow-100 text-yellow-800' 
                    : 'bg-green-100 text-green-800'
                }`}>
                  {investigation.status}
                </span>
                {/* SHAP explanation */}
                {investigation.shap && <ShapExplanation shap={investigation.shap} />}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
