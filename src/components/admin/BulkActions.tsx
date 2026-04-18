import React, { useState } from 'react';
import { Truck, Printer, X, Loader2, AlertCircle } from 'lucide-react';

interface Props {
  selectedCount: number;
  onBulkDispatch: () => Promise<void>;
  onBulkPrintLabels: () => void;
  onClearSelection: () => void;
}

export default function BulkActions({ selectedCount, onBulkDispatch, onBulkPrintLabels, onClearSelection }: Props) {
  const [dispatching, setDispatching] = useState(false);

  if (selectedCount === 0) return null;

  const handleDispatch = async () => {
    setDispatching(true);
    try { await onBulkDispatch(); }
    finally { setDispatching(false); }
  };

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 20px', background: '#f8f9fa', border: '1px solid #e5e7eb',
      borderRadius: 10, marginBottom: 16,
    }}>
      <span style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>
        {selectedCount} selected
      </span>

      <button onClick={handleDispatch} disabled={dispatching}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '8px 16px', borderRadius: 8,
          background: '#22c55e', color: '#000', border: 'none',
          cursor: dispatching ? 'wait' : 'pointer',
          fontSize: 11, fontWeight: 800, letterSpacing: 1,
          textTransform: 'uppercase', opacity: dispatching ? 0.6 : 1,
        }}>
        {dispatching ? <Loader2 size={13} className="spin" /> : <Truck size={13} />}
        {dispatching ? 'Dispatching...' : 'Dispatch Selected'}
      </button>

      <button onClick={onBulkPrintLabels}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '8px 16px', borderRadius: 8,
          background: '#f1f3f5', color: '##333', border: '1px solid #d1d5db',
          cursor: 'pointer', fontSize: 11, fontWeight: 700,
          letterSpacing: 1, textTransform: 'uppercase',
        }}>
        <Printer size={13} /> Print Labels
      </button>

      <button onClick={onClearSelection}
        style={{
          background: 'transparent', border: 'none',
          color: '#999', cursor: 'pointer', padding: 4,
        }}>
        <X size={16} />
      </button>
    </div>
  );
}