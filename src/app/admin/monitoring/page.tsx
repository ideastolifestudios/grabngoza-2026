'use client';

import React, { useState, useEffect } from 'react';
import { Activity, ShieldCheck, AlertTriangle, CheckCircle2, Zap, Server, BarChart3, Radio } from 'lucide-react';

export default function AdminMonitoringPage() {
  const [monitoringData, setMonitoringData] = useState<any>({ services: [], recentAlerts: [] });
  const [loading, setLoading] = useState(true);
  const [testingSentry, setTestingSentry] = useState(false);

  useEffect(() => {
    fetch('/api/admin/monitoring')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setMonitoringData(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const triggerSentryTest = async () => {
    setTestingSentry(true);
    const res = await fetch('/api/admin/monitoring', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'trigger_sentry_test' })
    });
    const data = await res.json();
    if (data.success) {
      alert(data.message);
    }
    setTestingSentry(false);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto text-white bg-neutral-950 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="text-emerald-500" /> System Monitoring & Observability
          </h1>
          <p className="text-neutral-400 text-sm">Real-time status for Sentry, Vercel, GA4, Meta Pixel, Merchant Center, and Firestore</p>
        </div>
        <button
          onClick={triggerSentryTest}
          disabled={testingSentry}
          className="bg-neutral-800 hover:bg-neutral-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition"
        >
          <Zap size={16} className="text-amber-400" /> Verify Sentry Telemetry
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-neutral-400">Fetching system telemetry...</div>
      ) : (
        <div className="space-y-8">
          {/* Services Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {monitoringData.services.map((service: any) => (
              <div key={service.id} className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 shadow-xl flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-bold text-sm text-neutral-200">{service.name}</h3>
                    <span className="flex items-center gap-1.5 text-xs bg-emerald-950 text-emerald-400 border border-emerald-800 px-2.5 py-0.5 rounded-full uppercase font-medium">
                      <CheckCircle2 size={12} /> {service.status}
                    </span>
                  </div>
                  <div className="space-y-1 text-xs text-neutral-400 mt-2 font-mono">
                    {service.dsnConfigured !== undefined && <p>DSN Activation: Active</p>}
                    {service.errorsLast24h !== undefined && <p>24h Error Count: {service.errorsLast24h}</p>}
                    {service.uptime && <p>SLA Uptime: {service.uptime}</p>}
                    {service.responseTimeMs && <p>Edge Latency: {service.responseTimeMs}ms</p>}
                    {service.trackingId && <p>Tracking ID: {service.trackingId}</p>}
                    {service.pixelId && <p>Pixel ID: {service.pixelId}</p>}
                    {service.readWriteLatencyMs && <p>Firestore R/W Latency: {service.readWriteLatencyMs}ms</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Real-time System Log Stream */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-xl">
            <h2 className="text-base font-bold mb-4 flex items-center gap-2 text-neutral-300">
              <Radio size={16} className="text-emerald-400 animate-pulse" /> System Telemetry & Alert Stream
            </h2>
            <div className="bg-neutral-950 rounded-xl p-4 border border-neutral-800 divide-y divide-neutral-900 font-mono text-xs">
              {monitoringData.recentAlerts.map((alert: any) => (
                <div key={alert.id} className="py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-neutral-500">{new Date(alert.timestamp).toLocaleTimeString()}</span>
                    <span className="bg-neutral-900 text-emerald-400 px-2 py-0.5 rounded border border-neutral-800 font-bold">{alert.system}</span>
                    <span className="text-neutral-300">{alert.message}</span>
                  </div>
                  <span className="text-emerald-500 text-[10px] uppercase font-bold tracking-wider">{alert.type}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
