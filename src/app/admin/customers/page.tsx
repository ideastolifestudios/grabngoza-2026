'use client';

import React, { useState, useEffect } from 'react';
import { Users, Search, Mail, Phone, ShoppingBag, Shield, UserCheck, Calendar } from 'lucide-react';

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/customers')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setCustomers(data.customers);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filteredCustomers = customers.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto text-white bg-neutral-950 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="text-emerald-500" /> Customer Management
          </h1>
          <p className="text-neutral-400 text-sm">View registered store users, purchase history, and lifetime spend</p>
        </div>
        <div className="relative w-72">
          <Search className="absolute left-3 top-2.5 text-neutral-500" size={16} />
          <input
            type="text"
            placeholder="Search customers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-8 text-center text-neutral-400">Loading customers...</div>
        ) : filteredCustomers.length === 0 ? (
          <div className="p-8 text-center text-neutral-400">No customers found.</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-neutral-800 text-neutral-400 text-xs uppercase tracking-wider bg-neutral-950/50">
                <th className="p-4">Customer</th>
                <th className="p-4">Contact</th>
                <th className="p-4">Orders</th>
                <th className="p-4">Total Spent</th>
                <th className="p-4">Joined</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800 text-sm">
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-neutral-800/50 transition">
                  <td className="p-4">
                    <div className="font-medium">{customer.name}</div>
                    <div className="text-xs text-neutral-400 font-mono">{customer.id}</div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1.5 text-xs text-neutral-300"><Mail size={12} className="text-neutral-500" /> {customer.email}</div>
                    <div className="flex items-center gap-1.5 text-xs text-neutral-400 mt-0.5"><Phone size={12} className="text-neutral-500" /> {customer.phone}</div>
                  </td>
                  <td className="p-4 font-semibold">{customer.ordersCount}</td>
                  <td className="p-4 font-semibold text-emerald-400">R {customer.totalSpent.toFixed(2)}</td>
                  <td className="p-4 text-xs text-neutral-400">{new Date(customer.joinedAt).toLocaleDateString()}</td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => setSelectedCustomer(customer)}
                      className="bg-neutral-800 hover:bg-neutral-700 text-white px-3 py-1 rounded text-xs font-medium transition"
                    >
                      View Profile
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-xl p-6 shadow-2xl">
            <div className="flex justify-between items-start mb-6 border-b border-neutral-800 pb-4">
              <div>
                <h2 className="text-xl font-bold">{selectedCustomer.name}</h2>
                <p className="text-xs text-neutral-400 font-mono mt-0.5">{selectedCustomer.email}</p>
              </div>
              <button 
                onClick={() => setSelectedCustomer(null)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-sm px-3"
              >
                ✕ Close
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800">
                <span className="text-xs text-neutral-400 uppercase tracking-wider">Total Orders</span>
                <p className="text-xl font-bold mt-1 text-white">{selectedCustomer.ordersCount}</p>
              </div>
              <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800">
                <span className="text-xs text-neutral-400 uppercase tracking-wider">Lifetime Spend</span>
                <p className="text-xl font-bold mt-1 text-emerald-400">R {selectedCustomer.totalSpent.toFixed(2)}</p>
              </div>
            </div>

            <div className="space-y-3 text-sm bg-neutral-950 p-4 rounded-xl border border-neutral-800">
              <div className="flex justify-between">
                <span className="text-neutral-400">Phone Number:</span>
                <span className="font-medium">{selectedCustomer.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Account Status:</span>
                <span className="text-emerald-400 uppercase text-xs font-bold bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-900">{selectedCustomer.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Registration Date:</span>
                <span className="text-neutral-300">{new Date(selectedCustomer.joinedAt).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
