import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    // Minimal deterministic heuristic for demo: map ports
    const port = Number(body.dest_port || 0)
    let app_type = 'Browsing'
    let confidence = 0.7
    if ([3478, 5004, 5005].includes(port)) {
      app_type = 'Audio/Video Call'
      confidence = 0.95
    } else if (port === 443 || port === 80) {
      app_type = 'Browsing'
      confidence = 0.85
    } else if (body.avg_pkt_len && body.avg_pkt_len > 900) {
      app_type = 'Video Streaming'
      confidence = 0.92
    }

    const result = {
      flow_id: `serverless_${Date.now()}`,
      app_type,
      confidence,
      explanation: 'Serverless heuristic response',
      engine: 'Serverless',
    }

    return NextResponse.json(result)
  } catch (e) {
    return NextResponse.json({ error: 'invalid payload' }, { status: 400 })
  }
}
