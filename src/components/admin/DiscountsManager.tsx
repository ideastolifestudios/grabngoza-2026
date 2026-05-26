import React, { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Tag, Search, CheckCircle2, AlertCircle, Loader2, X, Percent } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image?: string;
  images?: string[];
  categories?: string[];
  brand?: string;
  inStock?: boolean;
}

interface EditState {
  originalPrice: string;
  salePrice: string;
}

const DiscountsManager: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null);
  const [search, setSearch] = useState('');
  const [editState, setEditState] = useState<Record<string, EditState>>({});
  const [filterOnSale, setFilterOnSale] = useState<'all' | 'sale' | 'full'>('all');

  const showToast = (msg: string, type: 'ok' | 'err' = 'ok') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'products'));
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as Product));
      data.sort((a, b) => {
        // On-sale items first, then alphabetical
        const aOnSale = !!(a.originalPrice && a.originalPrice > a.price);
        const bOnSale = !!(b.originalPrice && b.originalPrice > b.price);
        if (aOnSale !== bOnSale) return aOnSale ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
      setProducts(data);
    } catch (err) {
      showToast('Failed to load products', 'err');
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const isOnSale = (p: Product) =>
    !!(p.originalPrice && p.originalPrice > p.price);

  const discountPct = (p: Product) =>
    isOnSale(p)
      ? Math.round(((p.originalPrice! - p.price) / p.originalPrice!) * 100)
      : 0;

  // Toggle sale on/off
  const toggleSale = async (p: Product) => {
    setSaving(s => ({ ...s, [p.id]: true }));
    try {
      const ref = doc(db, 'products', p.id);
      if (isOnSale(p)) {
        // Remove discount: set price back to originalPrice, clear originalPrice
        await updateDoc(ref, { price: p.originalPrice, originalPrice: null });
        setProducts(prev => prev.map(x =>
          x.id === p.id ? { ...x, price: p.originalPrice!, originalPrice: undefined } : x
        ));
        showToast(`${p.name} — discount removed`);
      } else {
        // Enable: open edit panel
        setEditState(s => ({
          ...s, [p.id]: { originalPrice: String(p.price), salePrice: String(Math.round(p.price * 0.8)) }
        }));
      }
    } catch {
      showToast('Save failed', 'err');
    }
    setSaving(s => ({ ...s, [p.id]: false }));
  };

  // Save discount values
  const saveDiscount = async (p: Product) => {
    const st = editState[p.id];
    if (!st) return;
    const orig = parseFloat(st.originalPrice);
    const sale = parseFloat(st.salePrice);
    if (!orig || !sale || orig <= 0 || sale <= 0 || sale >= orig) {
      showToast('Sale price must be less than original price', 'err');
      return;
    }
    setSaving(s => ({ ...s, [p.id]: true }));
    try {
      const ref = doc(db, 'products', p.id);
      await updateDoc(ref, { price: sale, originalPrice: orig });
      setProducts(prev => prev.map(x =>
        x.id === p.id ? { ...x, price: sale, originalPrice: orig } : x
      ));
      setEditState(s => { const n = { ...s }; delete n[p.id]; return n; });
      showToast(`${p.name} — ${Math.round(((orig - sale) / orig) * 100)}% off applied!`);
    } catch {
      showToast('Save failed', 'err');
    }
    setSaving(s => ({ ...s, [p.id]: false }));
  };

  const cancelEdit = (id: string) =>
    setEditState(s => { const n = { ...s }; delete n[id]; return n; });

  const filtered = products.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      p.name?.toLowerCase().includes(q) ||
      p.brand?.toLowerCase().includes(q) ||
      (p.categories || []).some(c => c.toLowerCase().includes(q));
    const matchFilter =
      filterOnSale === 'all' ? true :
      filterOnSale === 'sale' ? isOnSale(p) :
      !isOnSale(p);
    return matchSearch && matchFilter;
  });

  const onSaleCount = products.filter(isOnSale).length;

  return (
    <div className="p-6 md:p-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tighter">Promotions</h2>
          <p className="text-sm text-gray-500 mt-1">
            {onSaleCount} product{onSaleCount !== 1 ? 's' : ''} on sale &bull; Updates live in the promo strip
          </p>
        </div>
        <button
          onClick={fetchProducts}
          className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-black border border-gray-200 hover:border-black px-4 py-2 transition-all"
        >
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 text-sm focus:outline-none focus:border-black transition-colors"
          />
        </div>
        <div className="flex gap-1">
          {(['all', 'sale', 'full'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilterOnSale(f)}
              className={`px-4 py-2.5 text-[10px] font-black uppercase tracking-wider border transition-all ${
                filterOnSale === f ? 'bg-black text-white border-black' : 'border-gray-200 text-gray-500 hover:border-black hover:text-black'
              }`}
            >
              {f === 'all' ? 'All' : f === 'sale' ? 'On Sale' : 'Full Price'}
            </button>
          ))}
        </div>
      </div>

      {/* Product list */}
      {loading ? (
        <div className="flex items-center justify-center py-24 text-gray-400">
          <Loader2 size={24} className="animate-spin mr-3" />
          Loading products...
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-24 text-gray-400">No products found.</div>
      ) : (
        <div className="space-y-2">
          {filtered.map(p => {
            const onSale = isOnSale(p);
            const pct = discountPct(p);
            const isEditing = !!editState[p.id];
            const isSaving = saving[p.id];
            const img = (p.images && p.images[0]) || p.image;
            const cat = (p.categories || [])[0] || p.brand || '';

            return (
              <div key={p.id} className={`border transition-all ${onSale ? 'border-[#06402B]/30 bg-[#06402B]/[0.02]' : 'border-gray-100'}`}>
                {/* Main row */}
                <div className="flex items-center gap-4 p-4">
                  {/* Image */}
                  <div className="w-12 h-12 flex-shrink-0 bg-gray-100 overflow-hidden rounded">
                    {img ? (
                      <img src={img} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <Tag size={16} />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-sm truncate">{p.name}</p>
                      {onSale && (
                        <span className="flex-shrink-0 text-[9px] font-black uppercase tracking-wider bg-[#06402B] text-white px-2 py-0.5">
                          -{pct}% OFF
                        </span>
                      )}
                    </div>
                    {cat && <p className="text-[10px] text-gray-400 uppercase tracking-wider mt-0.5">{cat}</p>}
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-sm font-black">R{p.price?.toLocaleString()}</span>
                      {onSale && (
                        <span className="text-xs text-gray-400 line-through">R{p.originalPrice?.toLocaleString()}</span>
                      )}
                    </div>
                  </div>

                  {/* Toggle */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className={`text-[10px] font-black uppercase tracking-wider ${onSale ? 'text-[#06402B]' : 'text-gray-400'}`}>
                      {onSale ? 'On Sale' : 'Full Price'}
                    </span>
                    <button
                      onClick={() => toggleSale(p)}
                      disabled={isSaving}
                      className={`relative w-11 h-6 rounded-full transition-all duration-300 ${onSale ? 'bg-[#06402B]' : 'bg-gray-200'} ${isSaving ? 'opacity-50' : ''}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all duration-300 ${onSale ? 'left-6' : 'left-1'}`} />
                    </button>
                  </div>
                </div>

                {/* Edit panel — shown when toggling on */}
                {isEditing && (
                  <div className="border-t border-gray-100 bg-gray-50 p-4">
                    <p className="text-[10px] font-black uppercase tracking-wider text-gray-500 mb-3">
                      Set discount for {p.name}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 items-end">
                      <div>
                        <label className="text-[9px] font-black uppercase tracking-wider text-gray-400 block mb-1">
                          Original Price (R)
                        </label>
                        <input
                          type="number"
                          value={editState[p.id]?.originalPrice}
                          onChange={e => setEditState(s => ({
                            ...s, [p.id]: { ...s[p.id], originalPrice: e.target.value }
                          }))}
                          className="w-32 border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-black"
                          placeholder="e.g. 599"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-black uppercase tracking-wider text-gray-400 block mb-1">
                          Sale Price (R)
                        </label>
                        <input
                          type="number"
                          value={editState[p.id]?.salePrice}
                          onChange={e => setEditState(s => ({
                            ...s, [p.id]: { ...s[p.id], salePrice: e.target.value }
                          }))}
                          className="w-32 border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-black"
                          placeholder="e.g. 399"
                        />
                      </div>
                      {/* Discount preview */}
                      {editState[p.id]?.originalPrice && editState[p.id]?.salePrice && (() => {
                        const o = parseFloat(editState[p.id].originalPrice);
                        const s2 = parseFloat(editState[p.id].salePrice);
                        const d2 = (o > 0 && s2 > 0 && s2 < o) ? Math.round(((o - s2) / o) * 100) : null;
                        return d2 ? (
                          <div className="flex items-center gap-1 text-[#06402B] font-black text-sm">
                            <Percent size={14} />
                            {d2}% off
                          </div>
                        ) : null;
                      })()}
                      <div className="flex gap-2">
                        <button
                          onClick={() => saveDiscount(p)}
                          disabled={isSaving}
                          className="px-5 py-2 bg-[#06402B] text-white text-[10px] font-black uppercase tracking-wider hover:bg-[#06402B]/80 transition-all disabled:opacity-50"
                        >
                          {isSaving ? <Loader2 size={14} className="animate-spin" /> : 'Apply'}
                        </button>
                        <button
                          onClick={() => cancelEdit(p.id)}
                          className="px-4 py-2 border border-gray-200 text-[10px] font-black uppercase tracking-wider hover:border-black transition-all"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 flex items-center gap-3 shadow-xl text-white text-[10px] font-black uppercase tracking-widest ${
          toast.type === 'ok' ? 'bg-gray-950' : 'bg-red-600'
        }`}>
          {toast.type === 'ok' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
          {toast.msg}
        </div>
      )}
    </div>
  );
};

export default DiscountsManager;
