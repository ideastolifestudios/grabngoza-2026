import React, { useState, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Search, Plus, Grid, Edit3, Trash2, Upload, Database, Activity, RefreshCw, Loader2, Check } from "lucide-react";
import { Product, Category, Brand, ProductVariant } from "../types";
import { formatPrice } from "../utils/format";
import Logo from "./Logo";


const ProductManagementDrawer = ({
  isOpen,
  onClose,
  products,
  categories,
  brands,
  onSave,
  onDelete,
  onOpenCategories,
  onOpenBrands
}: {
  isOpen: boolean,
  onClose: () => void,
  products: Product[],
  categories: Category[],
  brands: Brand[],
  onSave: (p: Partial<Product>) => Promise<void>,
  onDelete: (id: string) => Promise<void>,
  onOpenCategories: () => void,
  onOpenBrands: () => void
}) => {
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingMultiple, setIsUploadingMultiple] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [filterGender, setFilterGender] = useState<string>('All');
  const [filterSubCategory, setFilterSubCategory] = useState<string>('All');
  const [activeTab, setActiveTab] = useState<'general' | 'media' | 'variants' | 'brand'>('general');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const multipleFileInputRef = useRef<HTMLInputElement>(null);

  const subCategories = useMemo(() => {
    const subs = new Set<string>();
    products.forEach(p => { if (p.subCategory) subs.add(p.subCategory); });
    return Array.from(subs);
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (!Array.isArray(products)) return [];
    return products.filter(p => {
      const matchesSearch =
        p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.categories || []).some(c => c.toLowerCase().includes(searchQuery.toLowerCase())) ||
        p.brand?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory = filterCategory === 'All' || (p.categories || []).includes(filterCategory);
      const matchesGender = filterGender === 'All' || p.gender === filterGender;
      const matchesSub = filterSubCategory === 'All' || p.subCategory === filterSubCategory;

      return matchesSearch && matchesCategory && matchesGender && matchesSub;
    });
  }, [products, searchQuery, filterCategory, filterGender, filterSubCategory]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    setIsSaving(true);
    await onSave(editingProduct);
    setIsSaving(false);
    setEditingProduct(null);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'image' | 'brandBanner' | 'soldByLogo' = 'image') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file as unknown as Blob);
      formData.append('upload_preset', 'eigqziuu');
      formData.append('folder', 'grab-go-za');

      const res = await fetch('https://api.cloudinary.com/v1_1/dggitwduo/image/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Upload failed');

      setEditingProduct(prev => prev ? { ...prev, [field]: data.secure_url } : null);
    } catch (err) {
      console.error("Upload failed:", err);
      window.dispatchEvent(new CustomEvent("grab-toast", { detail: { message: "Image upload failed", type: "error" } }));
    } finally {
      setIsUploading(false);
    }
  };

  const handleMultipleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingMultiple(true);

    try {
      const uploadedUrls: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const formData = new FormData();
        formData.append('file', files[i] as unknown as Blob);
        formData.append('upload_preset', 'eigqziuu');
        formData.append('folder', 'grab-go-za');

        const res = await fetch('https://api.cloudinary.com/v1_1/dggitwduo/image/upload', {
          method: 'POST',
          body: formData,
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error?.message || `Upload failed for file ${i + 1}`);

        uploadedUrls.push(data.secure_url);
      }

      setEditingProduct(prev => {
        if (!prev) return null;
        const currentImages = prev.images || [];
        return { ...prev, images: [...currentImages, ...uploadedUrls] };
      });
    } catch (err) {
      console.error("Multiple upload failed:", err);
      window.dispatchEvent(new CustomEvent("grab-toast", { detail: { message: "Some images failed to upload", type: "error" } }));
    } finally {
      setIsUploadingMultiple(false);
    }
  };



  const removeGalleryImage = (url: string) => {
    setEditingProduct(prev => {
      if (!prev) return null;
      return { ...prev, images: (prev.images || []).filter(img => img !== url) };
    });
  };

  const addVariant = () => {
    if (!editingProduct) return;
    const newVariant = { id: Math.random().toString(36).substr(2, 9), name: '', options: [] };
    const variants = [...(editingProduct.variants || []), newVariant];
    setEditingProduct({ ...editingProduct, variants });
  };

  const updateVariant = (vId: string, updates: Partial<ProductVariant>) => {
    if (!editingProduct) return;
    const variants = (editingProduct.variants || []).map(v =>
      v.id === vId ? { ...v, ...updates } : v
    );
    setEditingProduct({ ...editingProduct, variants });
  };

  const removeVariant = (vId: string) => {
    if (!editingProduct) return;
    const variants = (editingProduct.variants || []).filter(v => v.id !== vId);
    setEditingProduct({ ...editingProduct, variants });
  };

  const addOption = (vId: string, option: string) => {
    if (!editingProduct || !option.trim()) return;
    const variants = (editingProduct.variants || []).map(v => {
      if (v.id === vId) {
        if (v.options.includes(option.trim())) return v;
        return { ...v, options: [...v.options, option.trim()] };
      }
      return v;
    });
    setEditingProduct({ ...editingProduct, variants });
  };

  const removeOption = (vId: string, option: string) => {
    if (!editingProduct) return;
    const variants = (editingProduct.variants || []).map(v =>
      v.id === vId ? { ...v, options: v.options.filter(o => o !== option) } : v
    );
    setEditingProduct({ ...editingProduct, variants });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-xl bg-white border-l border-gray-100 z-[70] p-6 flex flex-col"
          >
            <div className="flex justify-between items-center mb-8">
              <div className="flex flex-col gap-1">
                <Logo className="h-8" dark />
                <span className="text-[10px] font-mono opacity-30 uppercase tracking-widest text-black">
                  {products.length} Items
                </span>
    </div>
              <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-full transition-colors text-black">
                <X size={24} />
              </button>
    </div>

            <div className="mb-8 space-y-4">
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <div className="relative flex-grow">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-black/30" size={16} />
                    <input
                      type="text"
                      placeholder="Search products..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-100 pl-12 pr-4 py-3 text-xs font-bold uppercase tracking-widest focus:border-black outline-none transition-all text-black"
                    />
    </div>
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="bg-gray-50 border border-gray-100 px-4 py-3 text-[10px] font-bold uppercase tracking-widest focus:border-black outline-none appearance-none text-black min-w-[120px]"
                  >
                    <option value="All">All Categories</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
    </div>
                <div className="flex gap-2">
                  <select
                    value={filterGender}
                    onChange={(e) => setFilterGender(e.target.value)}
                    className="flex-1 bg-gray-50 border border-gray-100 px-4 py-3 text-[10px] font-bold uppercase tracking-widest focus:border-black outline-none appearance-none text-black"
                  >
                    <option value="All">All Genders</option>
                    <option value="Men">Men</option>
                    <option value="Women">Women</option>
                    <option value="Kids">Kids</option>
                    <option value="Unisex">Unisex</option>
                  </select>
                  <select
                    value={filterSubCategory}
                    onChange={(e) => setFilterSubCategory(e.target.value)}
                    className="flex-1 bg-gray-50 border border-gray-100 px-4 py-3 text-[10px] font-bold uppercase tracking-widest focus:border-black outline-none appearance-none text-black"
                  >
                    <option value="All">Sub-Categories</option>
                    {subCategories.map(sub => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
    </div>
    </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setEditingProduct({ name: '', price: 0, image: '', description: '', variants: [] })}
                  className="py-4 border border-dashed border-gray-200 hover:border-black/20 transition-colors flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest text-black"
                >
                  <Plus size={16} /> Add Product
                </button>
                <button
                  onClick={onOpenCategories}
                  className="py-4 border border-dashed border-gray-200 hover:border-black/20 transition-colors flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest text-black"
                >
                  <Grid size={16} /> Categories
                </button>
    </div>
    </div>

            <div className="flex-grow overflow-y-auto space-y-4 pr-4 custom-scrollbar">
              {filteredProducts.map((product) => (
                <div key={product.id} className="p-4 border border-gray-50 bg-gray-50/30 flex gap-4 items-center text-black group">
                  <img
                    src={product.image || undefined}
                    alt={product.name}
                    className="w-12 h-16 object-cover grayscale"
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex-grow">
                    <h4 className="text-sm font-bold uppercase tracking-tight">{product.name}</h4>
                    <p className="text-[10px] opacity-50 uppercase tracking-widest">{formatPrice(product.price)} • {(product.categories || []).join(', ')}</p>
    </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingProduct(product)}
                      className="p-2 hover:bg-black/5 rounded-full transition-colors"
                    >
                      <Edit3 size={16} />
                    </button>
                    <button
                      onClick={() => setDeletingId(product.id)}
                      className="p-2 hover:bg-red-50 rounded-full transition-colors text-red-500"
                    >
                      <Trash2 size={16} />
                    </button>
    </div>
    </div>
              ))}
    </div>

            {/* Delete Confirmation Overlay */}
            <AnimatePresence>
              {deletingId && (
                <div className="fixed inset-0 z-[90] flex items-center justify-center p-6">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setDeletingId(null)}
                    className="absolute inset-0 bg-white/80 backdrop-blur-sm"
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="relative w-full max-w-sm bg-white border border-gray-100 shadow-2xl p-6 text-black text-center"
                  >
                    <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Trash2 size={24} />
    </div>
                    <h3 className="text-lg font-display font-bold uppercase tracking-tighter mb-2">Delete Product?</h3>
                    <p className="text-[10px] text-gray-500 mb-6 uppercase tracking-widest">This action cannot be undone.</p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setDeletingId(null)}
                        className="flex-grow py-2.5 border border-gray-100 font-bold uppercase tracking-widest text-[10px]"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={async () => {
                          if (deletingId) {
                            await onDelete(deletingId);
                            setDeletingId(null);
                          }
                        }}
                        className="flex-grow py-2.5 bg-red-500 text-white font-bold uppercase tracking-widest text-[10px]"
                      >
                        Delete
                      </button>
    </div>
                  </motion.div>
    </div>
              )}
            </AnimatePresence>

            {/* Edit Modal Overlay */}
            <AnimatePresence>
              {editingProduct && (
                <div className="fixed inset-0 z-[80] flex items-center justify-center p-6">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setEditingProduct(null)}
                    className="absolute inset-0 bg-white/80 backdrop-blur-sm"
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="relative w-full max-w-2xl bg-white border border-gray-100 shadow-2xl p-0 text-black flex flex-col max-h-[90vh]"
                  >
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                      <h3 className="text-xl font-display font-bold uppercase tracking-tighter">
                        {editingProduct.id ? 'Edit Product' : 'New Product'}
                      </h3>
                      <button onClick={() => setEditingProduct(null)} className="p-2 hover:bg-gray-50 rounded-full transition-colors">
                        <X size={20} />
                      </button>
    </div>

                    {/* Shopify-like Tabs */}
                    <div className="flex border-b border-gray-100 px-6 overflow-x-auto no-scrollbar">
                      {[
                        { id: 'general', label: 'General' },
                        { id: 'media', label: 'Media' },
                        { id: 'variants', label: 'Variants' },
                        { id: 'stock', label: 'Stock' },
                        { id: 'brand', label: 'Brand & Tags' }
                      ].map(tab => (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id as any)}
                          className={`py-4 px-4 text-[10px] font-black uppercase tracking-widest whitespace-nowrap border-b-2 transition-all ${activeTab === tab.id ? 'border-black text-black' : 'border-transparent text-gray-400 hover:text-black'}`}
                        >
                          {tab.label}
                        </button>
                      ))}
    </div>

                    <form onSubmit={handleSave} className="flex-grow overflow-y-auto p-6 space-y-6 custom-scrollbar">
                      {activeTab === 'general' && (
                        <div className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold uppercase tracking-widest opacity-50">Product Name</label>
                              <input
                                type="text"
                                required
                                value={editingProduct.name}
                                onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                                className="w-full bg-gray-50 border border-gray-100 px-4 py-3 text-sm focus:border-black outline-none transition-all"
                                placeholder="e.g. Classic Street Tee"
                              />
    </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold uppercase tracking-widest opacity-50">Categories</label>
                              <div className="space-y-3">
                                <div className="flex gap-2">
                                  <div className="flex-grow flex flex-wrap gap-2 p-3 bg-gray-50 border border-gray-100 min-h-[44px]">
                                    {(editingProduct.categories || []).map(catName => (
                                      <span key={catName} className="px-2 py-1 bg-black text-white text-[8px] font-black uppercase tracking-widest flex items-center gap-2">
                                        {catName}
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const newCats = (editingProduct.categories || []).filter(c => c !== catName);
                                            setEditingProduct({ ...editingProduct, categories: newCats });
                                          }}
                                          className="hover:text-red-400 transition-colors"
                                        >
                                          <X size={10} />
                                        </button>
                                      </span>
                                    ))}
                                    {(editingProduct.categories || []).length === 0 && (
                                      <span className="text-[10px] opacity-30 uppercase tracking-widest">No categories selected</span>
                                    )}
    </div>
                                  <button
                                    type="button"
                                    onClick={onOpenCategories}
                                    className="px-4 bg-black text-white text-[10px] font-bold uppercase tracking-widest hover:bg-black/80 transition-colors"
                                  >
                                    Manage
                                  </button>
    </div>

                                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                                  {categories.map(c => {
                                    const isSelected = (editingProduct.categories || []).includes(c.name);
                                    return (
                                      <button
                                        key={c.id}
                                        type="button"
                                        onClick={() => {
                                          const current = editingProduct.categories || [];
                                          if (isSelected) {
                                            setEditingProduct({ ...editingProduct, categories: current.filter(cat => cat !== c.name) });
                                          } else {
                                            setEditingProduct({ ...editingProduct, categories: [...current, c.name] });
                                          }
                                        }}
                                        className={`px-3 py-2 text-[10px] font-bold uppercase tracking-widest border transition-all text-left flex items-center justify-between ${isSelected ? 'bg-black text-white border-black' : 'bg-white text-black border-gray-100 hover:border-black/20'}`}
                                      >
                                        <span className="truncate">{c.name}</span>
                                        {isSelected && <Check size={12} />}
                                      </button>
                                    );
                                  })}
    </div>
    </div>
    </div>
    </div>

                          {/* New Fields: Gender and Sub-category */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold uppercase tracking-widest opacity-50">Gender / Target</label>
                              <select
                                value={editingProduct.gender || 'Unisex'}
                                onChange={(e) => setEditingProduct({ ...editingProduct, gender: e.target.value as any })}
                                className="w-full bg-gray-50 border border-gray-100 px-4 py-3 text-sm focus:border-black outline-none transition-all text-black"
                              >
                                <option value="Men">Men</option>
                                <option value="Women">Women</option>
                                <option value="Kids">Kids</option>
                                <option value="Unisex">Unisex</option>
                              </select>
    </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold uppercase tracking-widest opacity-50">Sub-category</label>
                              <input
                                type="text"
                                value={editingProduct.subCategory || ''}
                                onChange={(e) => setEditingProduct({ ...editingProduct, subCategory: e.target.value })}
                                className="w-full bg-gray-50 border border-gray-100 px-4 py-3 text-sm focus:border-black outline-none transition-all text-black"
                                placeholder="e.g. Sneakers, Accessories, Tees"
                              />
    </div>
    </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold uppercase tracking-widest opacity-50">Sale Price (R)</label>
                              <input
                                type="number"
                                required
                                value={editingProduct.price}
                                onChange={(e) => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })}
                                className="w-full bg-gray-50 border border-gray-100 px-4 py-3 text-sm focus:border-black outline-none transition-all"
                              />
    </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold uppercase tracking-widest opacity-50">Compare at Price (R)</label>
                              <input
                                type="number"
                                value={editingProduct.originalPrice || ''}
                                onChange={(e) => setEditingProduct({ ...editingProduct, originalPrice: Number(e.target.value) })}
                                className="w-full bg-gray-50 border border-gray-100 px-4 py-3 text-sm focus:border-black outline-none transition-all"
                                placeholder="Optional"
                              />
    </div>
    </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-widest opacity-50">Description</label>
                            <textarea
                              required
                              value={editingProduct.description}
                              onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                              className="w-full bg-gray-50 border border-gray-100 px-4 py-3 text-sm focus:border-black outline-none h-32 resize-none text-black transition-all"
                              placeholder="Describe your product..."
                            />
    </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold uppercase tracking-widest opacity-50">Weight (kg)</label>
                              <input
                                type="number"
                                step="0.1"
                                value={editingProduct.weight || ''}
                                onChange={(e) => setEditingProduct({ ...editingProduct, weight: Number(e.target.value) })}
                                className="w-full bg-gray-50 border border-gray-100 px-4 py-3 text-sm focus:border-black outline-none transition-all"
                              />
    </div>
                            <div className="flex items-center gap-4 pt-6">
                              <label className="flex items-center gap-2 cursor-pointer group">
                                <input
                                  type="checkbox"
                                  checked={editingProduct.isDrop}
                                  onChange={(e) => setEditingProduct({ ...editingProduct, isDrop: e.target.checked })}
                                  className="w-4 h-4 border-gray-200 rounded text-black focus:ring-black"
                                />
                                <span className="text-[10px] font-bold uppercase tracking-widest opacity-50 group-hover:opacity-100 transition-opacity">Featured Drop</span>
                              </label>
    </div>
    </div>
    </div>
                      )}

                      {activeTab === 'media' && (
                        <div className="space-y-6">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-widest opacity-50">Main Product Image</label>
                            <div
                              onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-black'); }}
                              onDragLeave={(e) => { e.preventDefault(); e.currentTarget.classList.remove('border-black'); }}
                              onDrop={(e) => {
                                e.preventDefault();
                                e.currentTarget.classList.remove('border-black');
                                const file = e.dataTransfer.files?.[0];
                                if (file) {
                                  const event = { target: { files: [file] } } as any;
                                  handleFileUpload(event);
                                }
                              }}
                              className={`relative border-2 border-dashed border-gray-200 p-12 transition-all flex flex-col items-center justify-center gap-4 group/drop ${isUploading ? 'opacity-50 pointer-events-none' : 'hover:border-black/20 cursor-pointer'}`}
                              onClick={() => fileInputRef.current?.click()}
                            >
                              {editingProduct.image ? (
                                <div className="relative w-40 aspect-[4/5] shadow-2xl group/main">
                                  <img src={editingProduct.image || undefined} alt="Preview" className="w-full h-full object-cover grayscale group-hover/drop:grayscale-0 transition-all" referrerPolicy="no-referrer" />
                                  <div className="absolute top-2 left-2 px-2 py-1 bg-black text-white text-[6px] font-black uppercase tracking-widest z-10">
                                    Main Image
    </div>
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/main:opacity-100 transition-opacity flex items-center justify-center">
                                    <p className="text-[8px] font-black uppercase text-white">Change Image</p>
    </div>
    </div>
                              ) : (
                                <>
                                  <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover/drop:text-black transition-colors">
                                    <Upload size={24} />
    </div>
                                  <div className="text-center">
                                    <p className="text-[10px] font-black uppercase tracking-widest">Drag & Drop Image</p>
                                    <p className="text-[8px] opacity-40 uppercase tracking-widest mt-1">or click to browse</p>
    </div>
                                </>
                              )}
                              {isUploading && (
                                <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
                                  <Loader2 className="animate-spin text-black" size={32} />
    </div>
                              )}
                              <input
                                type="file"
                                accept="image/*"
                                ref={fileInputRef}
                                onChange={handleFileUpload}
                                className="hidden"
                              />
    </div>
                            <div className="mt-4">
                              <label className="text-[8px] font-bold uppercase tracking-widest opacity-30">Or use URL</label>
                              <input
                                type="text"
                                placeholder="https://image-url.com/photo.jpg"
                                value={editingProduct.image}
                                onChange={(e) => setEditingProduct({ ...editingProduct, image: e.target.value })}
                                className="w-full bg-gray-50 border border-gray-100 px-4 py-3 text-[10px] font-mono focus:border-black outline-none mt-1 transition-all"
                              />
    </div>
    </div>

                            <div className="space-y-1">
                              <div className="flex justify-between items-end mb-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest opacity-50">Gallery Images</label>
                                <span className="text-[8px] font-mono opacity-30 uppercase tracking-widest">
                                  {editingProduct.images?.length || 0} / 10 Images
                                </span>
    </div>
                              <div
                                onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-black'); }}
                                onDragLeave={(e) => { e.preventDefault(); e.currentTarget.classList.remove('border-black'); }}
                                onDrop={(e) => {
                                  e.preventDefault();
                                  e.currentTarget.classList.remove('border-black');
                                  const files = e.dataTransfer.files;
                                  if (files && files.length > 0) {
                                    const event = { target: { files } } as any;
                                    handleMultipleFileUpload(event);
                                  }
                                }}
                                className="border-2 border-dashed border-gray-100 p-4 rounded-xl transition-all bg-gray-50/30"
                              >
                                <div className="grid grid-cols-4 gap-3 mb-4">
                                  {editingProduct.images?.map((img, idx) => (
                                    <div key={idx} className="relative aspect-[4/5] group/img bg-gray-50 rounded-lg overflow-hidden border border-gray-100 shadow-sm">
                                      <img src={img || undefined} alt={`Gallery ${idx}`} className="w-full h-full object-cover grayscale group-hover/img:grayscale-0 transition-all" referrerPolicy="no-referrer" />
                                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                        <button
                                          type="button"
                                          onClick={() => removeGalleryImage(img)}
                                          className="p-1.5 bg-white text-red-500 rounded-full hover:scale-110 transition-transform shadow-lg"
                                        >
                                          <Trash2 size={12} />
                                        </button>
    </div>
                                      <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/60 text-white text-[6px] font-mono rounded">
                                        #{idx + 1}
    </div>
    </div>
                                  ))}
                                  <button
                                    type="button"
                                    onClick={() => multipleFileInputRef.current?.click()}
                                    className={`aspect-[4/5] border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center gap-2 hover:border-black hover:bg-white transition-all bg-white/50 ${isUploadingMultiple ? 'opacity-50 pointer-events-none' : ''}`}
                                  >
                                    {isUploadingMultiple ? (
                                      <Loader2 className="animate-spin text-black" size={20} />
                                    ) : (
                                      <>
                                        <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:text-black">
                                          <Plus size={16} />
    </div>
                                        <span className="text-[8px] font-black uppercase tracking-widest">Add Media</span>
                                      </>
                                    )}
                                  </button>
    </div>

                                <div className="flex items-center justify-between">
                                  <p className="text-[8px] opacity-40 uppercase tracking-widest">Drag images here or click to add</p>
                                  {editingProduct.images && editingProduct.images.length > 0 && (
                                    <button
                                      type="button"
                                      onClick={() => setEditingProduct({ ...editingProduct, images: [] })}
                                      className="text-[8px] font-black uppercase tracking-widest text-red-500 hover:underline"
                                    >
                                      Clear All
                                    </button>
                                  )}
    </div>
    </div>

                            <input
                              type="file"
                              multiple
                              accept="image/*"
                              ref={multipleFileInputRef}
                              onChange={handleMultipleFileUpload}
                              className="hidden"
                            />

                            <div className="mt-6">
                              <label className="text-[8px] font-bold uppercase tracking-widest opacity-30">Gallery URLs (Comma separated)</label>
                              <textarea
                                placeholder="https://image1.jpg, https://image2.jpg"
                                value={editingProduct.images?.join(', ') || ''}
                                onChange={(e) => setEditingProduct({ ...editingProduct, images: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                                className="w-full bg-gray-50 border border-gray-100 px-4 py-3 text-[10px] font-mono focus:border-black outline-none h-24 resize-none text-black transition-all mt-1"
                              />
    </div>
    </div>
    </div>
                      )}

                      {activeTab === 'variants' && (
                        <div className="space-y-6">
                          <div className="flex justify-between items-center">
                            <div>
                              <h4 className="text-[10px] font-black uppercase tracking-widest">Product Variants</h4>
                              <p className="text-[8px] opacity-40 uppercase tracking-widest mt-1">Add sizes, colors, or materials</p>
    </div>
                            <button
                              type="button"
                              onClick={addVariant}
                              className="px-4 py-2 bg-black text-white text-[10px] font-black uppercase tracking-widest hover:opacity-80 transition-all flex items-center gap-2"
                            >
                              <Plus size={14} /> Add Variant
                            </button>
    </div>

                          <div className="space-y-4">
                            {editingProduct.variants?.map((variant) => (
                              <div key={variant.id} className="p-6 bg-gray-50 border border-gray-100 space-y-4 relative group">
                                <button
                                  type="button"
                                  onClick={() => removeVariant(variant.id)}
                                  className="absolute top-4 right-4 p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                                >
                                  <Trash2 size={16} />
                                </button>

                                <div className="space-y-1">
                                  <label className="text-[8px] font-black uppercase tracking-widest opacity-30">Variant Name</label>
                                  <input
                                    type="text"
                                    placeholder="e.g. Size or Color"
                                    value={variant.name}
                                    onChange={(e) => updateVariant(variant.id, { name: e.target.value })}
                                    className="w-full bg-white border border-gray-100 px-4 py-2 text-xs font-bold focus:border-black outline-none text-black transition-all"
                                  />
    </div>

                                <div className="space-y-2">
                                  <label className="text-[8px] font-black uppercase tracking-widest opacity-30">Options (Press Enter to add)</label>
                                  <div className="flex flex-wrap gap-2">
                                    {variant.options.map((opt) => (
                                      <span key={opt} className="pl-3 pr-2 py-1.5 bg-white border border-gray-100 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-black shadow-sm">
                                        {opt}
                                        <button
                                          type="button"
                                          onClick={() => removeOption(variant.id, opt)}
                                          className="text-gray-300 hover:text-red-500 transition-colors"
                                        >
                                          <X size={12} />
                                        </button>
                                      </span>
                                    ))}
                                    <input
                                      type="text"
                                      placeholder="Add option..."
                                      className="bg-white border border-gray-100 px-4 py-1.5 text-[10px] font-bold outline-none focus:border-black w-32 text-black shadow-sm"
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          e.preventDefault();
                                          addOption(variant.id, e.currentTarget.value);
                                          e.currentTarget.value = '';
                                        }
                                      }}
                                    />
    </div>
    </div>
    </div>
                            ))}
                            {(!editingProduct.variants || editingProduct.variants.length === 0) && (
                              <div className="py-12 text-center border-2 border-dashed border-gray-100 rounded-xl">
                                <p className="text-[10px] font-black uppercase tracking-widest opacity-20">No variants added</p>
    </div>
                            )}
    </div>
    </div>
                      )}

                      {activeTab === ('stock' as string) && (
                        <div className="space-y-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="text-[10px] font-black uppercase tracking-widest">Inventory Management</h4>
                              <p className="text-[8px] opacity-40 uppercase tracking-widest mt-1">Set stock levels per variant</p>
    </div>
    </div>

                          {editingProduct.variants && editingProduct.variants.length > 0 ? (
                            <div className="space-y-4">
                              {editingProduct.variants.map((variant) => (
                                <div key={variant.id} className="p-4 bg-gray-50 border border-gray-100 space-y-3">
                                  <label className="text-[8px] font-black uppercase tracking-widest opacity-50">{variant.name} Stock</label>
                                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {variant.options.map((opt) => {
                                      const stockKey = `${variant.name}:${opt}`;
                                      return (
                                        <div key={opt} className="flex items-center gap-2">
                                          <span className="text-xs font-bold min-w-[40px]">{opt}</span>
                                          <input
                                            type="number"
                                            min="0"
                                            value={editingProduct.stock?.[stockKey] ?? 0}
                                            onChange={(e) => {
                                              const newStock = { ...(editingProduct.stock || {}), [stockKey]: parseInt(e.target.value) || 0 };
                                              setEditingProduct({ ...editingProduct, stock: newStock });
                                            }}
                                            className="w-20 bg-white border border-gray-200 px-3 py-2 text-sm text-center focus:border-black outline-none"
                                          />
    </div>
                                      );
                                    })}
    </div>
    </div>
                              ))}
    </div>
                          ) : (
                            <div className="p-4 bg-gray-50 border border-gray-100 space-y-3">
                              <label className="text-[8px] font-black uppercase tracking-widest opacity-50">Total Stock</label>
                              <input
                                type="number"
                                min="0"
                                value={editingProduct.stock?.['_default'] ?? 0}
                                onChange={(e) => {
                                  setEditingProduct({ ...editingProduct, stock: { _default: parseInt(e.target.value) || 0 } });
                                }}
                                className="w-32 bg-white border border-gray-200 px-4 py-3 text-sm focus:border-black outline-none"
                                placeholder="0"
                              />
                              <p className="text-[8px] text-gray-400">Add variants in the Variants tab to track stock per size/color</p>
    </div>
                          )}
    </div>
                      )}

                      {activeTab === 'brand' && (
                        <div className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold uppercase tracking-widest opacity-50">Select Brand</label>
                              <div className="flex gap-2">
                                <select
                                  value={editingProduct.brandId || ''}
                                  onChange={(e) => {
                                    if (e.target.value === 'new') {
                                      onOpenBrands();
                                      return;
                                    }
                                    const selectedBrand = brands.find(b => b.id === e.target.value);
                                    if (selectedBrand) {
                                      setEditingProduct({
                                        ...editingProduct,
                                        brandId: selectedBrand.id,
                                        brand: selectedBrand.name,
                                        brandBanner: selectedBrand.banner,
                                        brandDescription: selectedBrand.description,
                                        soldBy: selectedBrand.soldBy
                                      });
                                    } else {
                                      setEditingProduct({ ...editingProduct, brandId: '', brand: '' });
                                    }
                                  }}
                                  className="flex-grow bg-gray-50 border border-gray-100 px-4 py-3 text-sm focus:border-black outline-none appearance-none"
                                >
                                  <option value="">No Brand</option>
                                  {brands.map(b => (
                                    <option key={b.id} value={b.id}>{b.name}</option>
                                  ))}
                                  <option value="new">+ Add New Brand</option>
                                </select>
                                <button
                                  type="button"
                                  onClick={onOpenBrands}
                                  className="px-4 bg-black text-white text-[10px] font-bold uppercase tracking-widest hover:bg-black/80 transition-colors"
                                >
                                  Manage
                                </button>
    </div>
    </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold uppercase tracking-widest opacity-50">Brand Name (Display)</label>
                              <input
                                type="text"
                                placeholder="e.g. Anatomy"
                                value={editingProduct.brand || ''}
                                onChange={(e) => setEditingProduct({ ...editingProduct, brand: e.target.value })}
                                className="w-full bg-gray-50 border border-gray-100 px-4 py-3 text-sm focus:border-black outline-none transition-all"
                              />
    </div>
    </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold uppercase tracking-widest opacity-50">Brand Banner</label>
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const input = document.createElement('input');
                                    input.type = 'file';
                                    input.accept = 'image/*';
                                    input.onchange = (e) => handleFileUpload(e as any, 'brandBanner');
                                    input.click();
                                  }}
                                  className="w-12 h-12 border border-dashed border-gray-200 flex items-center justify-center hover:border-black transition-colors"
                                >
                                  {isUploading ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />}
                                </button>
                                <input
                                  type="text"
                                  placeholder="Banner Image URL"
                                  value={editingProduct.brandBanner || ''}
                                  onChange={(e) => setEditingProduct({ ...editingProduct, brandBanner: e.target.value })}
                                  className="flex-grow bg-gray-50 border border-gray-100 px-4 py-3 text-sm focus:border-black outline-none transition-all"
                                />
    </div>
    </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold uppercase tracking-widest opacity-50">Sold By</label>
                              <input
                                type="text"
                                placeholder="e.g. Sportscene"
                                value={editingProduct.soldBy || ''}
                                onChange={(e) => setEditingProduct({ ...editingProduct, soldBy: e.target.value })}
                                className="w-full bg-gray-50 border border-gray-100 px-4 py-3 text-sm focus:border-black outline-none transition-all"
                              />
    </div>
    </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-widest opacity-50">Brand Description</label>
                            <textarea
                              placeholder="Briefly introduce the brand..."
                              value={editingProduct.brandDescription || ''}
                              onChange={(e) => setEditingProduct({ ...editingProduct, brandDescription: e.target.value })}
                              className="w-full bg-gray-50 border border-gray-100 px-4 py-3 text-sm focus:border-black outline-none h-24 resize-none text-black transition-all"
                            />
    </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold uppercase tracking-widest opacity-50">Sold By Logo</label>
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const input = document.createElement('input');
                                    input.type = 'file';
                                    input.accept = 'image/*';
                                    input.onchange = (e) => handleFileUpload(e as any, 'soldByLogo');
                                    input.click();
                                  }}
                                  className="w-12 h-12 border border-dashed border-gray-200 flex items-center justify-center hover:border-black transition-colors"
                                >
                                  {isUploading ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />}
                                </button>
                                <input
                                  type="text"
                                  placeholder="Logo URL"
                                  value={editingProduct.soldByLogo || ''}
                                  onChange={(e) => setEditingProduct({ ...editingProduct, soldByLogo: e.target.value })}
                                  className="flex-grow bg-gray-50 border border-gray-100 px-4 py-3 text-sm focus:border-black outline-none transition-all"
                                />
    </div>
    </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold uppercase tracking-widest opacity-50">Tags (Comma separated)</label>
                              <input
                                type="text"
                                placeholder="Summer, Streetwear, Limited"
                                value={editingProduct.tags?.join(', ') || ''}
                                onChange={(e) => setEditingProduct({ ...editingProduct, tags: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                                className="w-full bg-gray-50 border border-gray-100 px-4 py-3 text-sm focus:border-black outline-none transition-all"
                              />
    </div>
    </div>
    </div>
                      )}
                    </form>

                    <div className="p-6 border-t border-gray-100 flex gap-4 bg-white">
                      <button
                        type="button"
                        onClick={() => setEditingProduct(null)}
                        className="flex-grow py-4 border border-gray-100 font-bold uppercase tracking-widest text-[10px] text-black hover:bg-gray-50 transition-all"
                      >
                        Discard Changes
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex-grow py-4 bg-black text-white font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-50"
                      >
                        {isSaving ? <Loader2 className="animate-spin" size={16} /> : 'Save Product'}
                      </button>
    </div>
                  </motion.div>
    </div>
              )}
            </AnimatePresence>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ProductManagementDrawer;
