'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface ProductStock {
  id: string;
  name: string;
  sku: string;
  stock: number;
  price: number;
  category: string;
  status: 'active' | 'low_stock' | 'out_of_stock';
}

export default function InventoryDashboard() {
  const [products, setProducts] = useState<ProductStock[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'low_stock' | 'out_of_stock'>('all');
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/products');
      if (res.ok) {
        const data = await res.json();
        // Map data to stock view model
        const formatted = (data.products || data || []).map((p: any) => ({
          id: p.id || p._id,
          name: p.name || 'Untitled Product',
          sku: p.sku || 'SKU-PENDING',
          stock: p.stock ?? p.inventory ?? 10,
          price: p.price ?? 0,
          category: p.category || 'General',
          status: (p.stock ?? p.inventory ?? 10) <= 0 ? 'out_of_stock' : (p.stock ?? p.inventory ?? 10) <= 5 ? 'low_stock' : 'active'
        }));
        setProducts(formatted);
      }
    } catch (err) {
      console.error('Failed to load inventory', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStockUpdate = async (id: string, newStock: number) => {
    if (newStock < 0) return;
    try {
      const res = await fetch(`/api/admin/products`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, stock: newStock })
      });

      if (res.ok) {
        setProducts(products.map(p => p.id === id ? { 
          ...p, 
          stock: newStock, 
          status: newStock <= 0 ? 'out_of_stock' : newStock <= 5 ? 'low_stock' : 'active' 
        } : p));
        setNotification('Stock updated successfully.');
        setTimeout(() => setNotification(null), 3000);
      }
    } catch (err) {
      console.error('Failed to update stock', err);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    if (filterStatus === 'low_stock') return matchesSearch && p.status === 'low_stock';
    if (filterStatus === 'out_of_stock') return matchesSearch && p.status === 'out_of_stock';
    return matchesSearch;
  });

  const lowStockCount = products.filter(p => p.stock <= 5 && p.stock > 0).length;
  const outOfStockCount = products.filter(p => p.stock <= 0).length;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header & Breadcrumb */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
              <Link href="/admin" className="hover:underline">Admin OS</Link>
              <span>/</span>
              <span className="text-gray-900 font-medium">Inventory & Stock</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Live Inventory Management</h1>
            <p className="text-gray-500 text-sm">Real-time omnichannel stock tracking across Website, Google, and Meta channels.</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={fetchInventory} className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 shadow-sm transition">
              Refresh Stock
            </button>
          </div>
        </div>

        {/* Notification Toast */}
        {notification && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-lg text-sm font-medium shadow-sm flex items-center justify-between">
            <span>{notification}</span>
          </div>
        )}

        {/* Summary Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <p className="text-sm font-medium text-gray-500">Total Tracked SKUs</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{products.length}</p>
          </div>
          <div className="bg-white p-5 rounded-xl border border-amber-200 bg-amber-50/30 shadow-sm">
            <p className="text-sm font-medium text-amber-700">Low Stock Alerts (≤ 5)</p>
            <p className="text-3xl font-bold text-amber-800 mt-1">{lowStockCount}</p>
          </div>
          <div className="bg-white p-5 rounded-xl border border-red-200 bg-red-50/30 shadow-sm">
            <p className="text-sm font-medium text-red-700">Out of Stock</p>
            <p className="text-3xl font-bold text-red-800 mt-1">{outOfStockCount}</p>
          </div>
        </div>

        {/* Filters & Search Toolbar */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="w-full sm:w-96">
            <input 
              type="text" 
              placeholder="Search by product name or SKU..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button 
              onClick={() => setFilterStatus('all')} 
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${filterStatus === 'all' ? 'bg-black text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              All
            </button>
            <button 
              onClick={() => setFilterStatus('low_stock')} 
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${filterStatus === 'low_stock' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'}`}
            >
              Low Stock
            </button>
            <button 
              onClick={() => setFilterStatus('out_of_stock')} 
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${filterStatus === 'out_of_stock' ? 'bg-red-600 text-white' : 'bg-red-50 text-red-700 hover:bg-red-100'}`}
            >
              Out of Stock
            </button>
          </div>
        </div>

        {/* Inventory Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="py-3.5 px-6">Product</th>
                  <th className="py-3.5 px-6">SKU</th>
                  <th className="py-3.5 px-6">Category</th>
                  <th className="py-3.5 px-6">Stock Level</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-right">Quick Adjust</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-sm">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-gray-500">Loading inventory data...</td>
                  </tr>
                ) : filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-gray-500">No products found matching your filter.</td>
                  </tr>
                ) : (
                  filteredProducts.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50/50 transition">
                      <td className="py-4 px-6 font-medium text-gray-900">{p.name}</td>
                      <td className="py-4 px-6 text-gray-500 font-mono text-xs">{p.sku}</td>
                      <td className="py-4 px-6 text-gray-600">{p.category}</td>
                      <td className="py-4 px-6 font-semibold text-gray-900">{p.stock} units</td>
                      <td className="py-4 px-6">
                        {p.stock <= 0 ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Out of Stock</span>
                        ) : p.stock <= 5 ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">Low Stock</span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">In Stock</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right space-x-2">
                        <button 
                          onClick={() => handleStockUpdate(p.id, Math.max(0, p.stock - 1))}
                          className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-xs font-bold transition"
                          title="Decrease Stock"
                        >
                          -
                        </button>
                        <button 
                          onClick={() => handleStockUpdate(p.id, p.stock + 1)}
                          className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-xs font-bold transition"
                          title="Increase Stock"
                        >
                          +
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
