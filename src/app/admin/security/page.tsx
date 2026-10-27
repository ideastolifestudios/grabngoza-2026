'use client';

import React, { useState, useEffect } from 'react';
import { Shield, Lock, Users, Activity, HardDrive, AlertTriangle, CheckCircle2, Key, RefreshCw, XCircle } from 'lucide-react';

export default function AdminSecurityPage() {
  const [activeTab, setActiveTab] = useState<'roles' | 'logs' | 'sessions' | 'backups'>('roles');
  const [securityData, setSecurityData] = useState<any>({ roles: [], auditLogs: [], activeSessions: [], backupStatus: {} });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/security')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setSecurityData(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const revokeSession = async (sessionId: string) => {
    const res = await fetch('/api/admin/security', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'revoke_session', sessionId })
    });
    const data = await res.json();
    if (data.success) {
      alert(data.message);
      setSecurityData({
        ...securityData,
        activeSessions: securityData.activeSessions.filter((s: any) => s.id !== sessionId)
      });
    }
  };

  const triggerBackup = async () => {
    const res = await fetch('/api/admin/security', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'trigger_backup' })
    });
    const data = await res.json();
    if (data.success) {
      alert(data.message);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto text-white bg-neutral-950 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="text-emerald-500" /> Admin Security & Access Control
          </h1>
          <p className="text-neutral-400 text-sm">Manage RBAC permissions, audit logs, active sessions, and disaster recovery backups</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-neutral-800 pb-3">
        {[
          { id: 'roles', label: 'RBAC Roles & Permissions', icon: Key },
          { id: 'logs', label: 'Audit Activity Logs', icon: Activity },
          { id: 'sessions', label: 'Active Sessions', icon: Users },
          { id: 'backups', label: 'Backup & Disaster Recovery', icon: HardDrive },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                activeTab === tab.id ? 'bg-neutral-800 text-emerald-400 border border-neutral-700' : 'text-neutral-400 hover:bg-neutral-900 hover:text-white'
              }`}
            >
              <Icon size={16} /> {tab.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="p-12 text-center text-neutral-400">Loading security protocols...</div>
      ) : (
        <div>
          {/* Roles Tab */}
          {activeTab === 'roles' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {securityData.roles.map((role: any) => (
                <div key={role.id} className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-xl flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-lg font-bold flex items-center gap-2">
                        <Lock size={16} className="text-emerald-400" /> {role.name}
                      </h3>
                      <span className="text-xs bg-neutral-950 px-2.5 py-1 rounded-full text-neutral-300 border border-neutral-800">{role.usersCount} users</span>
                    </div>
                    <p className="text-xs text-neutral-400 mb-4">{role.description}</p>
                    <div className="space-y-1.5 mb-4">
                      <span className="text-xs uppercase tracking-wider text-neutral-500 font-semibold">Permissions:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {role.permissions.map((perm: string, idx: number) => (
                          <span key={idx} className="text-xs bg-neutral-950 text-emerald-400 border border-emerald-900 px-2 py-0.5 rounded font-mono">
                            {perm}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <button className="w-full bg-neutral-800 hover:bg-neutral-700 text-white py-2 rounded-lg text-xs font-medium transition">
                    Configure Role Permissions
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Audit Logs Tab */}
          {activeTab === 'logs' && (
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-neutral-800 text-neutral-400 text-xs uppercase tracking-wider bg-neutral-950/50">
                    <th className="p-4">Timestamp</th>
                    <th className="p-4">Admin User</th>
                    <th className="p-4">Action</th>
                    <th className="p-4">Details</th>
                    <th className="p-4">IP Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800 text-sm">
                  {securityData.auditLogs.map((log: any) => (
                    <tr key={log.id} className="hover:bg-neutral-800/50 transition">
                      <td className="p-4 text-xs font-mono text-neutral-400">{new Date(log.timestamp).toLocaleString()}</td>
                      <td className="p-4 font-medium text-neutral-200">{log.adminEmail}</td>
                      <td className="p-4">
                        <span className="text-xs font-mono bg-neutral-950 text-emerald-400 border border-emerald-900 px-2 py-0.5 rounded">
                          {log.action}
                        </span>
                      </td>
                      <td className="p-4 text-xs text-neutral-300">{log.details}</td>
                      <td className="p-4 text-xs font-mono text-neutral-400">{log.ipAddress}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Sessions Tab */}
          {activeTab === 'sessions' && (
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-neutral-800 text-neutral-400 text-xs uppercase tracking-wider bg-neutral-950/50">
                    <th className="p-4">Admin Account</th>
                    <th className="p-4">Role</th>
                    <th className="p-4">Device / Browser</th>
                    <th className="p-4">IP Address</th>
                    <th className="p-4 text-right">Session Control</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800 text-sm">
                  {securityData.activeSessions.map((session: any) => (
                    <tr key={session.id} className="hover:bg-neutral-800/50 transition">
                      <td className="p-4 font-medium">{session.email}</td>
                      <td className="p-4">
                        <span className="text-xs bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded">
                          {session.role}
                        </span>
                      </td>
                      <td className="p-4 text-xs text-neutral-300">{session.device}</td>
                      <td className="p-4 text-xs font-mono text-neutral-400">{session.ipAddress}</td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => revokeSession(session.id)}
                          className="bg-rose-900 hover:bg-rose-800 text-rose-200 px-3 py-1 rounded text-xs font-medium transition"
                        >
                          Revoke Session
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Backups Tab */}
          {activeTab === 'backups' && (
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-xl max-w-2xl">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <HardDrive className="text-emerald-400" /> Disaster Recovery & Database Snapshots
              </h3>
              <div className="space-y-4 mb-6">
                <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 flex justify-between items-center">
                  <div>
                    <span className="text-xs uppercase text-neutral-400 tracking-wider">Backup Status</span>
                    <p className="text-emerald-400 font-bold flex items-center gap-1.5 mt-1">
                      <CheckCircle2 size={16} /> {securityData.backupStatus.status} (AES-256 Encrypted)
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs uppercase text-neutral-400 tracking-wider">Automated Daily</span>
                    <p className="text-white font-medium mt-1">Enabled at 02:00 SAST</p>
                  </div>
                </div>
                <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800">
                  <span className="text-xs uppercase text-neutral-400 tracking-wider">Last Snapshot Timestamp</span>
                  <p className="text-neutral-200 font-mono mt-1">{new Date(securityData.backupStatus.lastBackup).toLocaleString()}</p>
                </div>
              </div>
              <button
                onClick={triggerBackup}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition shadow-lg"
              >
                <RefreshCw size={16} /> Trigger Manual Cloud Snapshot Now
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
