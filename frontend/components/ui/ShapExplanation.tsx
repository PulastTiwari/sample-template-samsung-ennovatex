'use client'

import React from 'react'

interface Props {
  shap: Record<string, number>
}

export default function ShapExplanation({ shap }: Props) {
  const entries = Object.entries(shap || {})
  if (entries.length === 0) return null

  // sort by absolute importance
  entries.sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))

  return (
    <div className="mt-3">
      <h5 className="text-sm font-medium mb-2">Feature importances (SHAP)</h5>
      <ul className="space-y-2">
        {entries.map(([k, v]) => (
          <li key={k} className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{k}</span>
            <span className="font-mono text-sm">{v >= 0 ? '+' : ''}{v.toFixed(4)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
