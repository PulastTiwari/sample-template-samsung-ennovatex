import { NextResponse } from 'next/server'

export async function GET() {
  const payload = {
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
  }
  return NextResponse.json(payload)
}
