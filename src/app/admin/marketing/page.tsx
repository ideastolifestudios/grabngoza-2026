'use client';

import React, { useState, useEffect } from 'react';
import { Tag, Gift, PackagePlus, ShoppingCart, Percent, Plus, CheckCircle, XCircle } from 'lucide-react';

export default function AdminMarketingPage() {
  const [activeTab, setActiveTab] = useState<'coupons' | 'bundles' | 'giftCards' | 'abandoned'>('coupons');
  const [data, setData] = useState<any>({ coupons: [], bundles: [], giftCards: [], abandonedCarts: [] });
  const [loading, setLoading] = useState(true);

  // New Coupon Modal state
  const [showModal, setShowModal] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newValue, setNewValue] = useState('');

  useEffect(() => {
    fetch('/api/admin/marketing')
      .then((res) => res.json())
      .then((resData) => {
        if (resData.success) setData(resData);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/admin/marketing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'coupon', code: newCode, value: parseFloat(newValue) })
    });
    const resData = await res.json();
    if (resData.success) {
      setData({ ...data, coupons: [resData.item, ...data.coupons] });
      setShowModal(false);
      setNewCode('');
      setNewValue('');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto text-white bg-neutral-950 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Tag className="text-emerald-500" /> Marketing & Promotions
          </h1>
          <p className="text-neutral-400 text-sm">Manage discount coupons, product bundles, gift cards, and abandoned carts</p>
        </div>
        {activeTab === 'coupons' && (
          <button
            onClick={() => setShowModal(true)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition"
          >
            <Plus size={16} /> Create Coupon
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-neutral-800 pb-3">
        {[
          { id: 'coupons', label: 'Coupons & Discounts', icon: Percent },
          { id: 'bundles', label: 'Product Bundles', icon: PackagePlus },
          { id: 'giftCards', label: 'Gift Cards', icon: Gift },
          { id: 'abandoned', label: 'Abandoned Carts', icon: ShoppingCart },
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
        <div className="p-12 text-center text-neutral-400">Loading marketing tools...</div>
      ) : (
        <div>
          {/* Coupons Tab */}
          {activeTab === 'coupons' && (
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-neutral-800 text-neutral-400 text-xs uppercase tracking-wider bg-neutral-950/50">
                    <th className="p-4">Coupon Code</th>
                    <th className="p-4">Type</th>
                    <th className="p-4">Value</th>
                    <th className="p-4">Usage Count</th>
                    <th className="p-4">Expires</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800 text-sm">
                  {data.coupons.map((coupon: any) => (
                    <tr key={coupon.id} className="hover:bg-neutral-800/50 transition">
                      <td className="p-4 font-mono font-bold text-emerald-400">{coupon.code}</td>
                      <td className="p-4 uppercase text-xs text-neutral-300">{coupon.discountType}</td>
                      <td className="p-4 font-semibold">{coupon.discountType === 'percentage' ? `${coupon.value}%` : `R ${coupon.value}`}</td>
                      <td className="p-4">{coupon.usageCount} orders</td>
                      <td className="p-4 text-xs text-neutral-400">{coupon.expiresAt}</td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          coupon.active ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-neutral-800 text-neutral-400'
                        }`}>
                          {coupon.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Bundles Tab */}
          {activeTab === 'bundles' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {data.bundles.map((bundle: any) => (
                <div key={bundle.id} className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-xl">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-bold">{bundle.name}</h3>
                    <span className="text-xs bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded">Bundle</span>
                  </div>
                  <div className="space-y-2 mb-4 text-sm text-neutral-400">
                    <p className="text-xs uppercase tracking-wider text-neutral-500 font-semibold">Included Items:</p>
                    {bundle.items.map((item: string, idx: number) => (
                      <div key={idx} className="flex items-center gap-2">• {item}</div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t border-neutral-800">
                    <div>
                      <span className="text-xs text-neutral-500 line-through">R {bundle.originalPrice}</span>
                      <span className="text-lg font-bold text-emerald-400 ml-2">R {bundle.bundlePrice}</span>
                    </div>
                    <span className="text-xs text-emerald-400 font-medium">Active Campaign</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Gift Cards Tab */}
          {activeTab === 'giftCards' && (
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-neutral-800 text-neutral-400 text-xs uppercase tracking-wider bg-neutral-950/50">
                    <th className="p-4">Gift Card Code</th>
                    <th className="p-4">Recipient</th>
                    <th className="p-4">Initial Balance</th>
                    <th className="p-4">Remaining</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800 text-sm">
                  {data.giftCards.map((gc: any) => (
                    <tr key={gc.id} className="hover:bg-neutral-800/50 transition">
                      <td className="p-4 font-mono font-bold text-purple-400">{gc.code}</td>
                      <td className="p-4 text-neutral-300">{gc.recipientEmail}</td>
                      <td className="p-4">R {gc.initialBalance.toFixed(2)}</td>
                      <td className="p-4 font-semibold text-emerald-400">R {gc.remainingBalance.toFixed(2)}</td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium uppercase ${
                          gc.status === 'active' ? 'bg-blue-950 text-blue-400 border border-blue-800' : 'bg-neutral-800 text-neutral-400'
                        }`}>
                          {gc.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Abandoned Carts Tab */}
          {activeTab === 'abandoned' && (
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-neutral-800 text-neutral-400 text-xs uppercase tracking-wider bg-neutral-950/50">
                    <th className="p-4">Cart ID</th>
                    <th className="p-4">Customer Email</th>
                    <th className="p-4">Items Count</th>
                    <th className="p-4">Cart Total</th>
                    <th className="p-4">Last Active</th>
                    <th className="p-4 text-right">Recovery Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800 text-sm">
                  {data.abandonedCarts.map((cart: any) => (
                    <tr key={cart.id} className="hover:bg-neutral-800/50 transition">
                      <td className="p-4 font-mono text-neutral-400">{cart.id}</td>
                      <td className="p-4 font-medium">{cart.customerEmail}</td>
                      <td className="p-4">{cart.itemsCount} items</td>
                      <td className="p-4 font-semibold text-emerald-400">R {cart.cartTotal.toFixed(2)}</td>
                      <td className="p-4 text-xs text-neutral-400">{new Date(cart.lastActive).toLocaleString()}</td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => alert(`Recovery email triggered for ${cart.customerEmail}`)}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1 rounded text-xs font-medium transition"
                        >
                          Send Recovery Email
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

      {/* Create Coupon Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h2 className="text-xl font-bold mb-4">Create New Discount Coupon</h2>
            <form onSubmit={handleCreateCoupon} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-400 uppercase mb-1">Coupon Code</label>
                <input
                  type="text"
                  placeholder="e.g. SUMMER20"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                  required
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-400 uppercase mb-1">Discount Value (Percentage)</label>
                <input
                  type="number"
                  placeholder="15"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  required
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="bg-neutral-800 hover:bg-neutral-700 text-white px-4 py-2 rounded-lg text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium"
                >
                  Save Coupon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
