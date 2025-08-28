"use client"

import React, { useEffect, useState } from "react"
import { api, setAdminAuth } from "@/lib/api"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Button } from '@/components/ui/button'
import { useToast } from "@/hooks/use-toast"

export default function AdminPage() {
  const [simEnabled, setSimEnabled] = useState<boolean | null>(null)
  const [uploading, setUploading] = useState(false)
  // LLM-related settings removed
  const [user, setUser] = useState("")
  const [pass, setPass] = useState("")
  const t = useToast()

  useEffect(() => {
  // infer simulate flag from global state endpoint via status — fallback true
    api.fetchStatus().then(() => setSimEnabled(true)).catch(() => setSimEnabled(false))
    
  }, [])

  async function toggleSim() {
    const target = !simEnabled
    setSimEnabled(target)
    try {
      await api.setSimulation(Boolean(target))
  t.toast({ title: "Simulation updated", description: `Simulation ${target ? "enabled" : "disabled"}` })
    } catch (e) {
      setSimEnabled(!target)
    }
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setUploading(true)
    try {
      const res = await api.uploadModel(f)
      if (res.error) {
        t.toast({ title: "Upload failed", description: String(res.error) })
      } else {
        t.toast({ title: "Upload successful", description: `Saved ${res.saved}` })
      }
    } catch (err) {
      t.toast({ title: "Upload error", description: String(err) })
    } finally {
      setUploading(false)
    }
  }

  async function saveLlm() {
  // removed
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Admin Console</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl border p-4">
          <h3 className="font-medium mb-2">Simulator</h3>
          <p className="text-sm text-muted-foreground mb-3">Toggle background traffic simulation.</p>
          {simEnabled === null ? (
            <LoadingSpinner />
          ) : (
            <Button
              onClick={toggleSim}
              className={`px-4 py-2 rounded ${simEnabled ? "bg-green-600 text-white" : "bg-muted"}`}
            >
              {simEnabled ? "Disable Simulation" : "Enable Simulation"}
            </Button>
          )}
        </div>

        <div className="bg-card rounded-xl border p-4">
          <h3 className="font-medium mb-2">Upload Sentry Model</h3>
          <p className="text-sm text-muted-foreground mb-3">Upload a joblib/.pkl payload produced by <code>train_sentry.py</code>.</p>
            <input type="file" accept=".pkl,.joblib" onChange={onFile} />
          <div className="mt-3">
            <Button className="px-4 py-2 rounded bg-primary text-white" onClick={() => {}}>Upload</Button>
            {uploading && <span className="ml-3"><LoadingSpinner size="sm" /></span>}
          </div>
        </div>

  {/* LLM settings removed per cleanup request */}
      </div>

      <div className="mt-6 bg-card rounded-xl border p-4">
        <h3 className="font-medium mb-2">Admin Credentials</h3>
        <div className="flex items-center space-x-3">
          <input className="border rounded px-2 py-1" placeholder="username" value={user} onChange={(e) => setUser(e.target.value)} />
          <input className="border rounded px-2 py-1" placeholder="password" type="password" value={pass} onChange={(e) => setPass(e.target.value)} />
          <Button
            className="px-3 py-1 rounded bg-primary text-white"
            onClick={() => {
              setAdminAuth(user, pass)
              t.toast({ title: "Credentials set", description: "Admin auth stored in session" })
            }}
          >
            Set Credentials
          </Button>
        </div>
      </div>
    </div>
  )
}
