import React from 'react';
import { Package, Truck, CheckCircle2, Clock, AlertCircle, RotateCcw } from 'lucide-react';

export type StatusTab = 'all' | 'confirmed' | 'shipped' | 'in-transit' | 'delivered' | 'failed-delivery';

interface Props {
  active: StatusTab;
  counts: Record<string, number>;
  onChange: (tab: StatusTab) => void;
}

const TABS: { key: StatusTab; label: string; icon: any; color: string }[] = [
  { key: 'all',             label: 'All Orders',    icon: Package,      color: '#888' },
  { key: 'confirmed',       label: 'Pending',       icon: Clock,        color: '#f59e0b' },
  { key: 'shipped',         label: 'Shipped',       icon: Truck,        color: '#3b82f6' },
  { key: 'in-transit',      label: 'In Transit',    icon: Truck,        color: '#8b5cf6' },
  { key: 'delivered',       label: 'Delivered',     icon: CheckCircle2, color: '#22c55e' },
  { key: 'failed-delivery', label: 'Failed',        icon: AlertCircle,  color: '#ef4444' },
];

export default function StatusFilter({ active, counts, onChange }: Props) {
  return (
    <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '4px 0' }}>
      {TABS.map(({ key, label, icon: Icon, color }) => {
        const isActive = active === key;
        const count = key === 'all'
          ? Object.values(counts).reduce((a, b) => a + b, 0)
          : counts[key] || 0;
        return (
          <button
            key={key}
            onClick={() => onChange(key)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 16px', borderRadius: 8,
              border: isActive ? `1px solid ${color}` : border: '1px solid #e5e7eb',
              background: isActive ? `${color}15` : '#f8f9fa',
              color: isActive ? color : '#999',
              cursor: 'pointer', fontSize: 12, fontWeight: 600,
              whiteSpace: 'nowrap', transition: 'all 0.2s',
            }}
          >
            <Icon size={14} />
            {label}
            <span style={{
              background: isActive ? color : '#333',
              color: isActive ? '#000' : '#888',
              padding: '1px 6px', borderRadius: 10, fontSize: 10, fontWeight: 700,
            }}>{count}</span>
          </button>
        );
      })}
    </div>
  );
}