"use client"

import { useEffect, useState } from 'react'

export default function LlmHealthIndicator() {
  const [health, setHealth] = useState<any>(null)

  async function fetchHealth() {
    try {
      const res = await fetch('/admin/llm-health')
      if (!res.ok) throw new Error('health fetch failed')
      const j = await res.json()
      setHealth(j)
    } catch (e) {
      setHealth({ollama_installed:false, model_present:false})
    }
  }

  useEffect(() => {
    fetchHealth()
    const id = setInterval(fetchHealth, 10_000)
    return () => clearInterval(id)
  }, [])

  if (!health) return null

  const status = health.ollama_installed && health.model_present ? 'ready' : health.ollama_installed ? 'no-model' : 'missing'

  const className = status === 'ready' ? 'text-green-600' : status === 'no-model' ? 'text-yellow-600' : 'text-red-600'

  return (
    <div className="flex items-center">
      <div className={`text-xs ${className} font-medium`}>{status === 'ready' ? 'Vanguard: Ready' : status === 'no-model' ? 'Vanguard: No model' : 'Vanguard: Offline'}</div>
    </div>
  )
}
