'use client';

import React, { useState, useEffect } from 'react';
import { Truck, Package, User, CreditCard, RotateCcw, CheckCircle, XCircle, FileText, Search, Filter } from 'lucide-react';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/orders')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setOrders(data.orders);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filteredOrders = orders.filter((order) => {
    const matchesFilter = filter === 'all' || order.status === filter || order.fulfillmentStatus === filter;
    const matchesSearch = order.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          order.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    const res = await fetch('/api/admin/orders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, status: newStatus })
    });
    const data = await res.json();
    if (data.success) {
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto text-white bg-neutral-950 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Order Management</h1>
          <p className="text-neutral-400 text-sm">Monitor, process, and fulfill customer store orders</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => window.print()} className="bg-neutral-800 hover:bg-neutral-700 px-4 py-2 rounded text-sm flex items-center gap-2">
            <FileText size={16} /> Print Invoices
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
        <div className="flex flex-wrap gap-2">
          {['all', 'new', 'paid', 'processing', 'packed', 'shipped', 'delivered', 'cancelled', 'refunded'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium uppercase tracking-wider transition ${
                filter === status ? 'bg-emerald-600 text-white' : 'bg-neutral-900 text-neutral-400 hover:bg-neutral-800'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-2.5 text-neutral-500" size={16} />
          <input
            type="text"
            placeholder="Search order ID, customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-8 text-center text-neutral-400">Loading orders...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-8 text-center text-neutral-400">No orders found matching your criteria.</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-neutral-800 text-neutral-400 text-xs uppercase tracking-wider bg-neutral-950/50">
                <th className="p-4">Order ID</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Total</th>
                <th className="p-4">Payment</th>
                <th className="p-4">Status</th>
                <th className="p-4">Date</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800 text-sm">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-neutral-800/50 transition">
                  <td className="p-4 font-mono font-medium text-emerald-400">{order.id}</td>
                  <td className="p-4">
                    <div className="font-medium">{order.customerName}</div>
                    <div className="text-xs text-neutral-400">{order.email}</div>
                  </td>
                  <td className="p-4 font-semibold">R {order.total.toFixed(2)}</td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      order.paymentStatus === 'verified' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-amber-950 text-amber-400 border border-amber-800'
                    }`}>
                      {order.paymentStatus}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium uppercase ${
                      order.status === 'paid' ? 'bg-blue-950 text-blue-400 border border-blue-800' : 'bg-neutral-800 text-neutral-300'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="p-4 text-neutral-400 text-xs">{new Date(order.createdAt).toLocaleDateString()}</td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="bg-neutral-800 hover:bg-neutral-700 text-white px-3 py-1 rounded text-xs font-medium transition"
                    >
                      View & Manage
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
            <div className="flex justify-between items-start mb-6 border-b border-neutral-800 pb-4">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <span>Order {selectedOrder.id}</span>
                  <span className="text-xs font-normal px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 uppercase">
                    {selectedOrder.status}
                  </span>
                </h2>
                <p className="text-xs text-neutral-400 mt-1">Placed on {new Date(selectedOrder.createdAt).toLocaleString()}</p>
              </div>
              <button 
                onClick={() => setSelectedOrder(null)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-sm px-3"
              >
                ✕ Close
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-3 flex items-center gap-2">
                  <User size={14} /> Customer Information
                </h3>
                <p className="font-medium">{selectedOrder.customerName}</p>
                <p className="text-sm text-neutral-400">{selectedOrder.email}</p>
                <p className="text-sm text-neutral-400">{selectedOrder.phone}</p>
              </div>

              <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-3 flex items-center gap-2">
                  <Truck size={14} /> Shipping & Fulfillment
                </h3>
                <p className="text-sm">{selectedOrder.shippingAddress.street}</p>
                <p className="text-sm">{selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.province} {selectedOrder.shippingAddress.postalCode}</p>
                <p className="text-xs text-emerald-400 mt-2 font-mono">Courier: {selectedOrder.courier || 'None assigned'} ({selectedOrder.trackingNumber || 'No tracking'})</p>
              </div>
            </div>

            {/* Order Items */}
            <div className="mb-6">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-3">Order Items</h3>
              <div className="bg-neutral-950 rounded-xl border border-neutral-800 divide-y divide-neutral-800">
                {selectedOrder.items.map((item: any, idx: number) => (
                  <div key={idx} className="p-3 flex justify-between items-center text-sm">
                    <div>
                      <span className="font-medium">{item.name}</span>
                      <span className="text-neutral-500 ml-2">x{item.quantity}</span>
                    </div>
                    <span className="font-semibold">R {(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Status Control Buttons */}
            <div className="flex flex-wrap gap-2 pt-4 border-t border-neutral-800">
              <button
                onClick={() => updateOrderStatus(selectedOrder.id, 'processing')}
                className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded text-xs font-medium"
              >
                Mark Processing
              </button>
              <button
                onClick={() => updateOrderStatus(selectedOrder.id, 'shipped')}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded text-xs font-medium"
              >
                Mark Shipped
              </button>
              <button
                onClick={() => updateOrderStatus(selectedOrder.id, 'delivered')}
                className="bg-purple-600 hover:bg-purple-500 text-white px-3 py-1.5 rounded text-xs font-medium"
              >
                Mark Delivered
              </button>
              <button
                onClick={() => updateOrderStatus(selectedOrder.id, 'cancelled')}
                className="bg-rose-900 hover:bg-rose-800 text-rose-200 px-3 py-1.5 rounded text-xs font-medium ml-auto"
              >
                Cancel Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
