'use client';

import React, { useState, useEffect } from 'react';
import { Cpu, Bell, RefreshCw, CheckCircle2, Globe, Send, ShieldAlert, Layers } from 'lucide-react';

export default function AdminAutomationsPage() {
  const [data, setData] = useState<any>({ customerAutomations: [], adminAlerts: [], syncStatus: {} });
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/automations')
      .then((res) => res.json())
      .then((resData) => {
        if (resData.success) setData(resData);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const triggerSync = async (target: string) => {
    setSyncing(target);
    const res = await fetch('/api/admin/automations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'sync_platform', target })
    });
    const resData = await res.json();
    if (resData.success) {
      alert(resData.message);
    }
    setSyncing(null);
  };

  const testAlert = async (name: string) => {
    const res = await fetch('/api/admin/automations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'test_alert', target: name })
    });
    const resData = await res.json();
    if (resData.success) {
      alert(resData.message);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto text-white bg-neutral-950 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Cpu className="text-emerald-500" /> Automations & Cross-Platform Sync
          </h1>
          <p className="text-neutral-400 text-sm">Monitor event-driven notifications, admin alert webhooks, and Google/Meta product syncs</p>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-neutral-400">Loading automation pipelines...</div>
      ) : (
        <div className="space-y-8">
          {/* Cross-Platform Synchronization */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-xl">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Globe className="text-emerald-400" /> Cross-Platform Catalog & Inventory Sync
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-neutral-950 p-5 rounded-xl border border-neutral-800 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold">Google Merchant Center</span>
                    <span className="text-xs bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded">Synced</span>
                  </div>
                  <p className="text-xs text-neutral-400 mb-4">Products and inventory levels sync automatically via scheduled API feed.</p>
                  <p className="text-xs text-neutral-500 font-mono">Last Sync: {new Date(data.syncStatus.googleMerchant?.lastSync).toLocaleString()}</p>
                </div>
                <button
                  onClick={() => triggerSync('google')}
                  disabled={syncing === 'google'}
                  className="mt-4 bg-neutral-800 hover:bg-neutral-700 text-white px-4 py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition"
                >
                  <RefreshCw size={14} className={syncing === 'google' ? 'animate-spin' : ''} /> Force Google Sync
                </button>
              </div>

              <div className="bg-neutral-950 p-5 rounded-xl border border-neutral-800 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold">Meta Commerce Manager</span>
                    <span className="text-xs bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded">Synced</span>
                  </div>
                  <p className="text-xs text-neutral-400 mb-4">Facebook & Instagram shop catalog items and stock updates.</p>
                  <p className="text-xs text-neutral-500 font-mono">Last Sync: {new Date(data.syncStatus.metaCatalog?.lastSync).toLocaleString()}</p>
                </div>
                <button
                  onClick={() => triggerSync('meta')}
                  disabled={syncing === 'meta'}
                  className="mt-4 bg-neutral-800 hover:bg-neutral-700 text-white px-4 py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition"
                >
                  <RefreshCw size={14} className={syncing === 'meta' ? 'animate-spin' : ''} /> Force Meta Sync
                </button>
              </div>
            </div>
          </div>

          {/* Customer Notifications */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-neutral-800 bg-neutral-950/50 flex justify-between items-center">
              <h2 className="font-bold flex items-center gap-2 text-sm uppercase tracking-wider text-neutral-300">
                <Send size={16} className="text-emerald-400" /> Customer Notification Triggers
              </h2>
              <span className="text-xs text-neutral-500">Automated Email / SMS</span>
            </div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-neutral-800 text-neutral-400 text-xs uppercase tracking-wider">
                  <th className="p-4">Event Notification</th>
                  <th className="p-4">Trigger Event</th>
                  <th className="p-4">Channel</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Test Trigger</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800 text-sm">
                {data.customerAutomations.map((item: any) => (
                  <tr key={item.id} className="hover:bg-neutral-800/50 transition">
                    <td className="p-4 font-medium">{item.name}</td>
                    <td className="p-4 text-neutral-400 text-xs">{item.trigger}</td>
                    <td className="p-4 text-neutral-300 text-xs">{item.channel}</td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-950 text-emerald-400 border border-emerald-800">
                        <CheckCircle2 size={12} /> {item.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => testAlert(item.name)}
                        className="bg-neutral-800 hover:bg-neutral-700 text-white px-3 py-1 rounded text-xs transition"
                      >
                        Send Test
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Admin Alerts */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-neutral-800 bg-neutral-950/50 flex justify-between items-center">
              <h2 className="font-bold flex items-center gap-2 text-sm uppercase tracking-wider text-neutral-300">
                <Bell size={16} className="text-amber-400" /> Admin Alert Triggers
              </h2>
              <span className="text-xs text-neutral-500">Dashboard & Webhooks</span>
            </div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-neutral-800 text-neutral-400 text-xs uppercase tracking-wider">
                  <th className="p-4">Alert Rule</th>
                  <th className="p-4">Trigger Condition</th>
                  <th className="p-4">Notification Channel</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Test Alert</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800 text-sm">
                {data.adminAlerts.map((alert: any) => (
                  <tr key={alert.id} className="hover:bg-neutral-800/50 transition">
                    <td className="p-4 font-medium">{alert.name}</td>
                    <td className="p-4 text-neutral-400 text-xs">{alert.trigger}</td>
                    <td className="p-4 text-neutral-300 text-xs">{alert.channel}</td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-950 text-emerald-400 border border-emerald-800">
                        <CheckCircle2 size={12} /> {alert.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => testAlert(alert.name)}
                        className="bg-neutral-800 hover:bg-neutral-700 text-white px-3 py-1 rounded text-xs transition"
                      >
                        Test Alert
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
