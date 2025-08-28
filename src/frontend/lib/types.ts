export interface FlowFeatures {
  source_ip: string
  dest_ip: string
  dest_port: number
  packet_count: number
  avg_pkt_len: number
  duration_seconds: number
  bytes_total: number
  protocol?: string
}

export interface ClassificationResult {
  flow_id: string
  app_type: string
  confidence: number
  explanation?: string
  engine?: "Sentry" | "Vanguard"
}

export interface Flow {
  id: string
  source_ip: string
  dest_ip: string
  dest_port: number
  status: string
  app_type: string
  engine?: "Sentry" | "Vanguard"
}

export interface ClassificationLogEntry {
  timestamp: string
  message: string
  explanation?: string
  engine?: "Sentry" | "Vanguard"
}

export interface Policy {
  flow_id: string
  app_type: string
  dscp_class: string
  tc_class: string
  explanation?: string
}

export interface Metrics {
  high_prio: {
    bandwidth: number
    packets: number
  }
  video_stream: {
    bandwidth: number
    packets: number
  }
  best_effort: {
    bandwidth: number
    packets: number
  }
  low_prio: {
    bandwidth: number
    packets: number
  }
}

export interface Suggestion {
  id: string
  profile_id: string
  suggested_app: string
  suggested_dscp: string
  suggested_tc: string
  rationale: string
  votes: number
  status: "pending" | "approved" | "denied"
}

export interface Investigation {
  id: string
  flow_id: string
  timestamp: string
  details: string
  status: string
  shap?: Record<string, number>
}

export interface StatusResponse {
  active_flows: Flow[]
  classification_log: ClassificationLogEntry[]
  active_policies: Policy[]
  metrics: Metrics
  investigations: Investigation[]
}
