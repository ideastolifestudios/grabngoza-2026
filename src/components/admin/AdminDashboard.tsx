import React, { useState, useEffect, useMemo } from 'react';
import { collection, getDocs, query, orderBy, where, doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '../../firebase';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Loader2 as AuthLoader } from 'lucide-react';
import { RefreshCw, Search, Package, Truck, CheckCircle2, Clock, Loader2 } from 'lucide-react';
import StatusFilter, { StatusTab } from './StatusFilter';
import ShipmentTable from './ShipmentTable';
import BulkActions from './BulkActions';

const API_BASE = import.meta.env.VITE_API_URL || '';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Auth check — only allow users with role: 'admin'
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setAuthChecked(true);
        setIsAdmin(false);
        return;
      }
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const role = userDoc.data()?.role;
        setIsAdmin(role === 'admin');
      } catch (err) {
        console.error('Auth check failed:', err);
        setIsAdmin(false);
      }
      setAuthChecked(true);
    });
    return () => unsub();
  }, []);

  // Block non-admins
  if (!authChecked) {
    return (
      <div style={{ minHeight: '100vh', background: '#111fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <AuthLoader size={24} style={{ animation: 'spin 1s linear infinite', color: '#999' }} />
      </div>
    );
  }
  if (!isAdmin) {
    return (
      <div style={{
        minHeight: '100vh', background: '#111fff', display: 'flex',
        flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16,
      }}>
        <ShieldAlert size={48} style={{ color: '#ef4444' }} />
        <h2 style={{ color: '#111', fontSize: 20, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 2 }}>
          Access Denied
        </h2>
        <p style={{ color: '#666', fontSize: 13 }}>You need admin privileges to view this page.</p>
        <button onClick={() => navigate('/')}
          style={{
            marginTop: 8, padding: '10px 24px', borderRadius: 8,
            background: '#111', color: '#000', border: 'none',
            cursor: 'pointer', fontWeight: 700, fontSize: 11,
            letterSpacing: 2, textTransform: 'uppercase',
          }}>
          Back to Store
        </button>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }
  const [activeTab, setActiveTab] = useState<StatusTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Fetch all orders from Firebase
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'orders'), orderBy('date', 'desc'));
      const snap = await getDocs(q);
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setOrders(data);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    }
    setLoading(false);
  };

  useEffect(() => { fetchOrders(); }, []);

  // Status counts
  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    orders.forEach(o => { c[o.status] = (c[o.status] || 0) + 1; });
    return c;
  }, [orders]);

  // Filtered orders
  const filtered = useMemo(() => {
    let list = orders;
    if (activeTab !== 'all') {
      // "shipped" tab shows collected + shipped + in-transit
      if (activeTab === 'shipped') {
        list = list.filter(o => ['shipped', 'collected', 'pickup-scheduled'].includes(o.status));
      } else {
        list = list.filter(o => o.status === activeTab);
      }
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(o =>
        o.id?.toLowerCase().includes(q) ||
        o.firstName?.toLowerCase().includes(q) ||
        o.lastName?.toLowerCase().includes(q) ||
        o.email?.toLowerCase().includes(q) ||
        o.trackingReference?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [orders, activeTab, searchQuery]);

  // Selection handlers
  const toggleSelect = (id: string) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };
  const toggleAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map(o => o.id)));
  };

  // Print label
  const printLabel = (shipmentId: number) => {
    window.open(`${API_BASE}/api/shipment-actions?action=label&shipmentId=${shipmentId}`, '_blank');
  };

    // Bulk print labels
  const bulkPrintLabels = () => {
    const selectedOrders = filtered.filter(o => selected.has(o.id));
    const withShipments = selectedOrders.filter(o => o.shiplogicShipmentId);

    if (withShipments.length === 0) {
      alert(
        selectedOrders.length === 0
          ? 'No orders selected.'
          : `${selectedOrders.length} order(s) selected but none have been dispatched via ShipLogic yet.\n\nDispatch orders first to generate waybill labels.`
      );
      return;
    }

    // Open each label PDF in a new tab (browser prints it)
    withShipments.forEach(o => {
      window.open(
        `${API_BASE}/api/shipment-actions?action=label&shipmentId=${o.shiplogicShipmentId}&type=label`,
        '_blank'
      );
    });

    if (withShipments.length < selectedOrders.length) {
      alert(`Opened ${withShipments.length} label(s).\n${selectedOrders.length - withShipments.length} order(s) skipped (not yet dispatched).`);
    }
  };

  // Bulk dispatch (placeholder — triggers create-shipment for pending orders)
  const bulkDispatch = async () => {
    const pending = filtered.filter(o => selected.has(o.id) && o.status === 'confirmed');
    if (pending.length === 0) {
      alert('No pending orders selected to dispatch.');
      return;
    }
    const confirmed = window.confirm(`Dispatch ${pending.length} order(s)? This will create ShipLogic shipments.`);
    if (!confirmed) return;

    // TODO: Call /api/create-shipment for each pending order
    // For now, show a message
    alert(`Ready to dispatch ${pending.length} orders.\n\nConnect this to your /api/create-shipment endpoint.\nEach order needs collection/delivery addresses to create a shipment.`);
    await fetchOrders();
    setSelected(new Set());
  };

  // Stats cards
  const pendingCount = counts['confirmed'] || 0;
  const shippedCount = (counts['shipped'] || 0) + (counts['collected'] || 0) + (counts['in-transit'] || 0);
  const deliveredCount = counts['delivered'] || 0;

  return (
    <div style={{ minHeight: '100vh', background: '#111fff', color: '#111', padding: '24px 20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <img
            src="https://res.cloudinary.com/dggitwduo/image/upload/v1774084848/GRAB_GO_WEB_LOGO_as09yx.png"
            alt="Grab & Go"
            style={{ height: 32, filter: 'brightness(0) invert(1)' }}
          />
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 2, color: '#111' }}>
              Dispatch Dashboard
            </h1>
            <p style={{ color: '#999', fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', marginTop: 2 }}>
              Shipping Operations
            </p>
          </div>
        </div>
        <button onClick={fetchOrders}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 16px', borderRadius: 8,
            background: '#f8f9fa', border: '1px solid #e5e7eb'
,
            color: '#999', cursor: 'pointer', fontSize: 11, fontWeight: 700,
          }}>
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* Stats cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Pending', value: pendingCount, icon: Clock, color: '#f59e0b' },
          { label: 'In Transit', value: shippedCount, icon: Truck, color: '#3b82f6' },
          { label: 'Delivered', value: deliveredCount, icon: CheckCircle2, color: '#22c55e' },
          { label: 'Total Orders', value: orders.length, icon: Package, color: '#999' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} style={{
            background: '#f8f9fa', border: '1px solid #e5e7eb'
, borderRadius: 10, padding: '16px 20px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: 3, textTransform: 'uppercase', color: '#999' }}>
                  {label}
                </div>
                <div style={{ fontSize: 28, fontWeight: 900, color, marginTop: 4 }}>{value}</div>
              </div>
              <Icon size={24} style={{ color: `${color}44` }} />
            </div>
          </div>
        ))}
      </div>

      {/* Filters + Search */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
        <StatusFilter active={activeTab} counts={counts} onChange={setActiveTab} />
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: 9, color: '#999' }} />
          <input
            type="text" placeholder="Search orders..."
            value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            style={{
              background: '#f8f9fa', border: '1px solid #e5e7eb'
, borderRadius: 8,
              padding: '8px 12px 8px 32px', color: '#111', fontSize: 12, width: 220,
              outline: 'none',
            }}
          />
        </div>
      </div>

      {/* Bulk actions */}
      <BulkActions
        selectedCount={selected.size}
        onBulkDispatch={bulkDispatch}
        onBulkPrintLabels={bulkPrintLabels}
        onClearSelection={() => setSelected(new Set())}
      />

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#999' }}>
          <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
          <div style={{ marginTop: 8 }}>Loading orders...</div>
        </div>
      ) : (
        <div style={{ background: '#f8f9fa', border: '1px solid #e5e7eb'
, borderRadius: 10, overflow: 'hidden' }}>
          <ShipmentTable
            orders={filtered}
            selected={selected}
            onToggle={toggleSelect}
            onToggleAll={toggleAll}
            onPrintLabel={printLabel}
          />
        </div>
      )}

      {/* CSS for spinner */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}