import React from 'react';
import { Package, ExternalLink, Printer, MapPin, Clock } from 'lucide-react';

interface OrderRow {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: string;
  total: number;
  date: string;
  trackingReference?: string;
  shiplogicShipmentId?: number;
  deliveryMethod: string;
  city?: string;
  province?: string;
  items: any[];
  lastTrackingUpdate?: string;
}

interface Props {
  orders: OrderRow[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  onToggleAll: () => void;
  onPrintLabel: (shipmentId: number) => void;
}

const STATUS_BADGES: Record<string, { label: string; color: string; bg: string }> = {
  'confirmed':        { label: 'Pending',         color: '#f59e0b', bg: '#f59e0b18' },
  'pickup-scheduled': { label: 'Pickup Sched.',   color: '#f59e0b', bg: '#f59e0b18' },
  'collected':        { label: 'Collected',       color: '#3b82f6', bg: '#3b82f618' },
  'shipped':          { label: 'Shipped',         color: '#3b82f6', bg: '#3b82f618' },
  'in-transit':       { label: 'In Transit',      color: '#8b5cf6', bg: '#8b5cf618' },
  'out-for-delivery': { label: 'Out for Delivery',color: '#06b6d4', bg: '#06b6d418' },
  'delivered':        { label: 'Delivered',        color: '#22c55e', bg: '#22c55e18' },
  'failed-delivery':  { label: 'Failed',           color: '#ef4444', bg: '#ef444418' },
  'returned':         { label: 'Returned',         color: '#ef4444', bg: '#ef444418' },
};

export default function ShipmentTable({ orders, selected, onToggle, onToggleAll, onPrintLabel }: Props) {
  const allSelected = orders.length > 0 && selected.size === orders.length;

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #222' }}>
            <th style={thStyle}>
              <input type="checkbox" checked={allSelected} onChange={onToggleAll}
                style={{ accentColor: '#22c55e' }} />
            </th>
            <th style={thStyle}>Order</th>
            <th style={thStyle}>Customer</th>
            <th style={thStyle}>Status</th>
            <th style={thStyle}>Tracking</th>
            <th style={thStyle}>Total</th>
            <th style={thStyle}>Date</th>
            <th style={thStyle}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => {
            const badge = STATUS_BADGES[o.status] || { label: o.status, color: '#888', bg: '#88888818' };
            return (
              <tr key={o.id} style={{
                borderBottom: '1px solid #1a1a1a',
                background: selected.has(o.id) ? '#1a2332' : 'transparent',
              }}>
                <td style={tdStyle}>
                  <input type="checkbox" checked={selected.has(o.id)}
                    onChange={() => onToggle(o.id)} style={{ accentColor: '#22c55e' }} />
                </td>
                <td style={tdStyle}>
                  <div style={{ fontWeight: 700, color: '#fff', textTransform: 'uppercase' }}>
                    #{o.id.slice(0, 8)}
                  </div>
                  <div style={{ color: '#555', fontSize: 10 }}>
                    {o.items?.length || 0} item{o.items?.length !== 1 ? 's' : ''}
                  </div>
                </td>
                <td style={tdStyle}>
                  <div style={{ color: '#fff', fontWeight: 600 }}>{o.firstName} {o.lastName}</div>
                  <div style={{ color: '#555', fontSize: 10 }}>{o.email}</div>
                  {o.city && <div style={{ color: '#444', fontSize: 10, display: 'flex', alignItems: 'center', gap: 3 }}>
                    <MapPin size={9} /> {o.city}{o.province ? `, ${o.province}` : ''}
                  </div>}
                </td>
                <td style={tdStyle}>
                  <span style={{
                    padding: '3px 10px', borderRadius: 20, fontSize: 10, fontWeight: 700,
                    color: badge.color, background: badge.bg, textTransform: 'uppercase',
                    letterSpacing: 0.5,
                  }}>{badge.label}</span>
                </td>
                <td style={tdStyle}>
                  {o.trackingReference ? (
                    <span style={{ color: '#8b5cf6', fontFamily: 'monospace', fontSize: 11 }}>
                      {o.trackingReference}
                    </span>
                  ) : (
                    <span style={{ color: '#444', fontSize: 10 }}>Not shipped</span>
                  )}
                  {o.lastTrackingUpdate && (
                    <div style={{ color: '#444', fontSize: 9, display: 'flex', alignItems: 'center', gap: 3, marginTop: 2 }}>
                      <Clock size={8} /> {new Date(o.lastTrackingUpdate).toLocaleDateString('en-ZA')}
                    </div>
                  )}
                </td>
                <td style={{ ...tdStyle, fontWeight: 700, color: '#fff' }}>R{o.total}</td>
                <td style={{ ...tdStyle, color: '#555', fontSize: 11 }}>
                  {new Date(o.date).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })}
                </td>
                <td style={tdStyle}>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {o.shiplogicShipmentId && (
                      <button onClick={() => onPrintLabel(o.shiplogicShipmentId!)}
                        title="Print label"
                        style={actionBtnStyle}>
                        <Printer size={13} />
                      </button>
                    )}
                    {o.trackingReference && (
                      <a href={`/track-order?ref=${o.trackingReference}`} target="_blank"
                        title="Track"
                        style={{ ...actionBtnStyle, textDecoration: 'none' }}>
                        <ExternalLink size={13} />
                      </a>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
          {orders.length === 0 && (
            <tr><td colSpan={8} style={{ padding: 40, textAlign: 'center', color: '#444' }}>
              <Package size={32} style={{ marginBottom: 8, opacity: 0.3 }} />
              <div>No orders found</div>
            </td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

const thStyle: React.CSSProperties = {
  padding: '10px 12px', textAlign: 'left', color: '#444',
  fontSize: 9, fontWeight: 900, letterSpacing: 2, textTransform: 'uppercase',
};
const tdStyle: React.CSSProperties = { padding: '12px', verticalAlign: 'top' };
const actionBtnStyle: React.CSSProperties = {
  background: '#1a1a1a', border: '1px solid #333', borderRadius: 6,
  padding: '5px 8px', cursor: 'pointer', color: '#888', display: 'flex',
  alignItems: 'center', transition: 'all 0.2s',
};