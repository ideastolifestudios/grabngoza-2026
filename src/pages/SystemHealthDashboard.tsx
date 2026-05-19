'use client';
import { useEffect } from 'react';
import { motion } from 'motion/react';
import { Mail, Database, ShieldAlert, Activity, RefreshCw, ExternalLink } from 'lucide-react';

const SystemHealthDashboard = () => {
  const systems: { name: string; status: string; message: string; icon: any; action?: string; actionLabel?: string }[] = [
    {
      name: 'SMTP Email Service',
      status: 'healthy',
      message: 'Operational',
      icon: Mail,
    },
    {
      name: 'Firestore Database',
      status: 'healthy',
      message: 'Operational',
      icon: Database,
    },
    {
      name: 'Authentication Service',
      status: 'healthy',
      message: 'Operational',
      icon: ShieldAlert,
    }
  ];

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="bg-[#E4E3E0] min-h-screen p-6 md:p-12 font-sans text-[#141414] pt-32">
      <div className="max-w-5xl mx-auto">
        <header className="mb-12 border-b border-[#141414] pb-6 flex justify-between items-end">
          <div>
            <h1 className="font-serif italic text-4xl mb-2">System Health</h1>
            <p className="font-mono text-[10px] uppercase tracking-widest opacity-50">Diagnostic Console v2.4.0</p>
          </div>
          <div className="text-right">
            <p className="font-mono text-[10px] uppercase tracking-widest opacity-50">Last Scan</p>
            <p className="font-mono text-xs">{new Date().toLocaleString()}</p>
          </div>
        </header>

        <div className="grid gap-px bg-[#141414] border border-[#141414]">
          {/* Table Header */}
          <div className="grid grid-cols-[40px_1fr_1.5fr_1fr] bg-[#E4E3E0] p-4">
            <div className="font-serif italic text-[11px] uppercase tracking-wider opacity-50">#</div>
            <div className="font-serif italic text-[11px] uppercase tracking-wider opacity-50">System</div>
            <div className="font-serif italic text-[11px] uppercase tracking-wider opacity-50">Status / Diagnostics</div>
            <div className="font-serif italic text-[11px] uppercase tracking-wider opacity-50 text-right">Action</div>
          </div>

          {/* Table Rows */}
          {systems.map((system, idx) => (
            <motion.div
              key={system.name}
              whileHover={{ backgroundColor: '#141414', color: '#E4E3E0' }}
              className="grid grid-cols-[40px_1fr_1.5fr_1fr] bg-[#E4E3E0] p-4 items-center transition-colors cursor-default group"
            >
              <div className="font-mono text-xs opacity-50">0{idx + 1}</div>
              <div className="flex items-center gap-3">
                <system.icon size={16} className={system.status === 'error' ? 'text-red-500 group-hover:text-red-400' : 'text-emerald-600 group-hover:text-emerald-400'} />
                <span className="font-bold uppercase tracking-tight text-sm">{system.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${system.status === 'error' ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`} />
                <span className="font-mono text-xs">{system.message}</span>
              </div>
              <div className="text-right">
                {system.action ? (
                  <a
                    href={system.action}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest border border-current px-2 py-1 hover:bg-white hover:text-black transition-colors"
                  >
                    {system.actionLabel} <ExternalLink size={10} />
                  </a>
                ) : (
                  <span className="font-mono text-[10px] uppercase tracking-widest opacity-30">No Action Required</span>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-12 grid md:grid-cols-2 gap-8">
          <div className="border border-[#141414] p-6 flex flex-col justify-center items-center text-center">
            <Activity size={48} className="mb-4 opacity-20" />
            <h3 className="font-serif italic text-xl mb-2">Auto-Recovery</h3>
            <p className="text-xs opacity-50 mb-6">System will attempt to re-validate tokens every 24 hours.</p>
            <button className="font-mono text-[10px] uppercase tracking-widest border border-[#141414] px-6 py-3 hover:bg-[#141414] hover:text-[#E4E3E0] transition-all flex items-center gap-2">
              <RefreshCw size={14} /> Trigger Manual Scan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


export default SystemHealthDashboard;
