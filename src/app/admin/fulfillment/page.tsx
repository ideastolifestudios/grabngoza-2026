'use client';

import React, { useState, useEffect } from 'react';
import { Truck, PackageCheck, Send, RotateCcw, CheckCircle, Search, ExternalLink, Mail } from 'lucide-react';

export default function AdminFulfillmentPage() {
  const [activeTab, setActiveTab] = useState<'queue' | 'shipped' | 'returns'>('queue');
  const [data, setData] = useState<any>({ shipments: [], returns: [] });
  const [loading, setLoading] = useState(true);
  const [selectedShipment, setSelectedShipment] = useState<any | null>(null);

  const [courier, setCourier] = useState('The Courier Guy');
  const [trackingNumber, setTrackingNumber] = useState('');

  useEffect(() => {
    fetch('/api/admin/fulfillment')
      .then((res) => res.json())
      .then((resData) => {
        if (resData.success) setData(resData);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleUpdateStatus = async (shipmentId: string, status: string) => {
    const res = await fetch('/api/admin/fulfillment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update_fulfillment', shipmentId, courier, trackingNumber, status })
    });
    const resData = await res.json();
    if (resData.success) {
      alert(resData.message);
      setData({
        ...data,
        shipments: data.shipments.map((s: any) => s.id === shipmentId ? { ...s, status, courier, trackingNumber } : s)
      });
      setSelectedShipment(null);
    }
  };

  const handleProcessReturn = async (returnId: string, status: string) => {
    const res = await fetch('/api/admin/fulfillment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'process_return', returnId, status })
    });
    const resData = await res.json();
    if (resData.success) {
      alert(resData.message);
      setData({
        ...data,
        returns: data.returns.map((r: any) => r.id === returnId ? { ...r, status } : r)
      });
    }
  };

  const packingQueue = data.shipments.filter((s: any) => s.status === 'ready_to_pack' || s.status === 'packed');
  const dispatchedList = data.shipments.filter((s: any) => s.status === 'shipped' || s.status === 'delivered');

  return (
    <div className="p-6 max-w-7xl mx-auto text-white bg-neutral-950 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Truck className="text-emerald-500" /> Fulfillment & Shipping
          </h1>
          <p className="text-neutral-400 text-sm">Manage order packing workflows, couriers, tracking, and customer returns</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-neutral-800 pb-3">
        {[
          { id: 'queue', label: `Packing Queue (${packingQueue.length})`, icon: PackageCheck },
          { id: 'shipped', label: `Dispatched & Shipped (${dispatchedList.length})`, icon: Send },
          { id: 'returns', label: `Returns & Refunds (${data.returns.length})`, icon: RotateCcw },
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
        <div className="p-12 text-center text-neutral-400">Loading fulfillment queue...</div>
      ) : (
        <div>
          {/* Packing Queue */}
          {activeTab === 'queue' && (
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-neutral-800 text-neutral-400 text-xs uppercase tracking-wider bg-neutral-950/50">
                    <th className="p-4">Shipment / Order</th>
                    <th className="p-4">Customer</th>
                    <th className="p-4">Delivery Address</th>
                    <th className="p-4">Items</th>
                    <th className="p-4">Packing Status</th>
                    <th className="p-4 text-right">Fulfillment Control</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800 text-sm">
                  {packingQueue.map((shipment: any) => (
                    <tr key={shipment.id} className="hover:bg-neutral-800/50 transition">
                      <td className="p-4">
                        <div className="font-mono text-emerald-400 font-bold">{shipment.id}</div>
                        <div className="text-xs text-neutral-400">{shipment.orderId}</div>
                      </td>
                      <td className="p-4">
                        <div className="font-medium">{shipment.customerName}</div>
                        <div className="text-xs text-neutral-400">{shipment.email}</div>
                      </td>
                      <td className="p-4 text-xs text-neutral-300 max-w-xs">{shipment.shippingAddress}</td>
                      <td className="p-4 font-semibold">{shipment.itemsCount} items</td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium uppercase ${
                          shipment.status === 'packed' ? 'bg-blue-950 text-blue-400 border border-blue-800' : 'bg-amber-950 text-amber-400 border border-amber-800'
                        }`}>
                          {shipment.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => { setSelectedShipment(shipment); setTrackingNumber(shipment.trackingNumber || ''); }}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1 rounded text-xs font-medium transition"
                        >
                          Dispatch / Add Tracking
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Shipped Tab */}
          {activeTab === 'shipped' && (
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-neutral-800 text-neutral-400 text-xs uppercase tracking-wider bg-neutral-950/50">
                    <th className="p-4">Order ID</th>
                    <th className="p-4">Customer</th>
                    <th className="p-4">Courier</th>
                    <th className="p-4">Tracking Number</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800 text-sm">
                  {dispatchedList.map((shipment: any) => (
                    <tr key={shipment.id} className="hover:bg-neutral-800/50 transition">
                      <td className="p-4 font-mono font-bold text-emerald-400">{shipment.orderId}</td>
                      <td className="p-4 font-medium">{shipment.customerName}</td>
                      <td className="p-4 text-neutral-300">{shipment.courier}</td>
                      <td className="p-4 font-mono text-xs text-neutral-400">{shipment.trackingNumber}</td>
                      <td className="p-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-950 text-emerald-400 border border-emerald-800 uppercase">
                          {shipment.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Returns Tab */}
          {activeTab === 'returns' && (
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-neutral-800 text-neutral-400 text-xs uppercase tracking-wider bg-neutral-950/50">
                    <th className="p-4">Return ID</th>
                    <th className="p-4">Order</th>
                    <th className="p-4">Reason</th>
                    <th className="p-4">Refund Amount</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Process Return</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800 text-sm">
                  {data.returns.map((ret: any) => (
                    <tr key={ret.id} className="hover:bg-neutral-800/50 transition">
                      <td className="p-4 font-mono font-bold text-rose-400">{ret.id}</td>
                      <td className="p-4 text-neutral-300">{ret.orderId} ({ret.customerName})</td>
                      <td className="p-4 text-neutral-400 text-xs">{ret.reason}</td>
                      <td className="p-4 font-semibold text-emerald-400">R {ret.refundAmount.toFixed(2)}</td>
                      <td className="p-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-950 text-amber-400 border border-amber-800 uppercase">
                          {ret.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => handleProcessReturn(ret.id, 'approved')}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1 rounded text-xs font-medium"
                        >
                          Approve Refund
                        </button>
                        <button
                          onClick={() => handleProcessReturn(ret.id, 'rejected')}
                          className="bg-rose-900 hover:bg-rose-800 text-rose-200 px-2.5 py-1 rounded text-xs font-medium"
                        >
                          Reject
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Dispatch Modal */}
      {selectedShipment && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h2 className="text-xl font-bold mb-4">Fulfill Order & Add Courier Tracking</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-400 uppercase mb-1">Select Courier</label>
                <select
                  value={courier}
                  onChange={(e) => setCourier(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="The Courier Guy">The Courier Guy</option>
                  <option value="Bob Go / Dawn Wing">Bob Go / Dawn Wing</option>
                  <option value="RAM Hand-to-Hand">RAM Hand-to-Hand</option>
                  <option value="Aramex South Africa">Aramex South Africa</option>
                  <option value="Pargo Pickup Point">Pargo Pickup Point</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-400 uppercase mb-1">Tracking Waybill Number</label>
                <input
                  type="text"
                  placeholder="e.g. TCG-9940182"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-neutral-800">
                <button
                  onClick={() => setSelectedShipment(null)}
                  className="bg-neutral-800 hover:bg-neutral-700 text-white px-4 py-2 rounded-lg text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleUpdateStatus(selectedShipment.id, 'shipped')}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
                >
                  <Send size={14} /> Dispatch & Notify Customer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
