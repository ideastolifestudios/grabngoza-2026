import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Search, Plus, Edit3, Trash2, Upload, Loader2 } from "lucide-react";
import { Category } from "../types";
import Logo from "./Logo";

const CategoryManagementDrawer = ({
  isOpen,
  onClose,
  categories,
  onSave,
  onDelete
}: {
  isOpen: boolean,
  onClose: () => void,
  categories: Category[],
  onSave: (c: Partial<Category>) => Promise<void>,
  onDelete: (id: string) => Promise<void>
}) => {
  const [editingCategory, setEditingCategory] = useState<Partial<Category> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;
    setIsSaving(true);
    await onSave(editingCategory);
    setIsSaving(false);
    setEditingCategory(null);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

      setEditingCategory(prev => prev ? { ...prev, image: data.secure_url } : null);
    } catch (err) {
      console.error("Upload failed:", err);
      window.dispatchEvent(new CustomEvent("grab-toast", { detail: { message: "Image upload failed", type: "error" } }));
    } finally {
      setIsUploading(false);
    }
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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[80]"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-white border-l border-gray-100 z-[90] p-6 flex flex-col"
          >
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-display font-bold uppercase tracking-tighter">Manage Categories</h2>
              <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-full transition-colors text-black">
                <X size={24} />
              </button>
    </div>

            <div className="mb-6">
              <button
                onClick={() => setEditingCategory({ name: '', description: '', image: '' })}
                className="w-full py-3 border border-dashed border-gray-200 hover:border-black/20 transition-colors flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest text-black"
              >
                <Plus size={16} /> Add New Category
              </button>
    </div>

            <div className="flex-grow overflow-y-auto space-y-3 pr-2 custom-scrollbar">
              {categories.filter(c => !c.parentId).map((mainCat) => (
                <div key={mainCat.id} className="space-y-2">
                  <div className="p-3 border border-gray-50 bg-gray-50/30 flex gap-3 items-center text-black group">
                    <div className="w-10 h-10 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                      {mainCat.image ? <img src={mainCat.image} alt={mainCat.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" /> : null}
    </div>
                    <div className="flex-grow">
                      <h4 className="text-xs font-bold uppercase tracking-tight">{mainCat.name}</h4>
                      {mainCat.description && (
                        <p className="text-[8px] opacity-40 uppercase tracking-widest truncate max-w-[150px]">
                          {mainCat.description}
                        </p>
                      )}
    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setEditingCategory(mainCat)}
                        className="p-1.5 hover:bg-black/5 rounded-full transition-colors"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        onClick={() => setDeletingId(mainCat.id)}
                        className="p-1.5 hover:bg-red-50 rounded-full transition-colors text-red-500"
                      >
                        <Trash2 size={14} />
                      </button>
    </div>
    </div>

                  {/* Sub-categories */}
                  <div className="pl-6 space-y-2">
                    {categories.filter(c => c.parentId === mainCat.id).map(subCat => (
                      <div key={subCat.id} className="p-2 border border-gray-50 bg-white flex gap-3 items-center text-black group">
                        <div className="w-8 h-8 bg-gray-50 rounded overflow-hidden flex-shrink-0">
                          {subCat.image ? <img src={subCat.image} alt={subCat.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" /> : null}
    </div>
                        <div className="flex-grow">
                          <h4 className="text-[10px] font-bold uppercase tracking-tight">{subCat.name}</h4>
    </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => setEditingCategory(subCat)}
                            className="p-1 hover:bg-black/5 rounded-full transition-colors"
                          >
                            <Edit3 size={12} />
                          </button>
                          <button
                            onClick={() => setDeletingId(subCat.id)}
                            className="p-1 hover:bg-red-50 rounded-full transition-colors text-red-500"
                          >
                            <Trash2 size={12} />
                          </button>
    </div>
    </div>
                    ))}
    </div>
    </div>
              ))}

              {/* Orphaned sub-categories (if any) */}
              {categories.filter(c => c.parentId && !categories.find(p => p.id === c.parentId)).map(orphan => (
                <div key={orphan.id} className="p-3 border border-red-50 bg-red-50/10 flex gap-3 items-center text-black group">
                  <div className="flex-grow">
                    <h4 className="text-xs font-bold uppercase tracking-tight">{orphan.name} (Orphaned)</h4>
    </div>
                  <div className="flex gap-1">
                    <button onClick={() => setEditingCategory(orphan)} className="p-1.5 hover:bg-black/5 rounded-full transition-colors"><Edit3 size={14} /></button>
                    <button onClick={() => setDeletingId(orphan.id)} className="p-1.5 hover:bg-red-50 rounded-full transition-colors text-red-500"><Trash2 size={14} /></button>
    </div>
    </div>
              ))}
    </div>

            {/* Edit Modal */}
            <AnimatePresence>
              {editingCategory && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setEditingCategory(null)}
                    className="absolute inset-0 bg-white/80 backdrop-blur-sm"
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="relative w-full max-w-sm bg-white border border-gray-100 shadow-2xl p-6 text-black"
                  >
                    <h3 className="text-lg font-bold uppercase tracking-tighter mb-6">
                      {editingCategory.id ? 'Edit Category' : 'New Category'}
                    </h3>
                    <form onSubmit={handleSave} className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-widest opacity-50">Category Name</label>
                        <input
                          type="text"
                          required
                          value={editingCategory.name}
                          onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                          className="w-full bg-gray-50 border border-gray-100 px-4 py-2 text-sm focus:border-black outline-none"
                        />
    </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-widest opacity-50">Description</label>
                        <textarea
                          value={editingCategory.description || ''}
                          onChange={(e) => setEditingCategory({ ...editingCategory, description: e.target.value })}
                          className="w-full bg-gray-50 border border-gray-100 px-4 py-2 text-sm focus:border-black outline-none h-20 resize-none"
                        />
    </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-widest opacity-50">Image</label>
                        <div className="flex gap-2">
                          <div
                            onClick={() => fileInputRef.current?.click()}
                            className="w-12 h-12 border border-dashed border-gray-200 flex items-center justify-center cursor-pointer hover:border-black transition-colors"
                          >
                            {isUploading ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />}
    </div>
                          <input
                            type="text"
                            placeholder="Image URL"
                            value={editingCategory.image || ''}
                            onChange={(e) => setEditingCategory({ ...editingCategory, image: e.target.value })}
                            className="flex-grow bg-gray-50 border border-gray-100 px-4 py-2 text-[10px] focus:border-black outline-none"
                          />
                          <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                            className="hidden"
                          />
    </div>
    </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-widest opacity-50">Parent Category</label>
                        <select
                          value={editingCategory.parentId || ''}
                          onChange={(e) => setEditingCategory({ ...editingCategory, parentId: e.target.value || undefined })}
                          className="w-full bg-gray-50 border border-gray-100 px-4 py-2 text-sm focus:border-black outline-none appearance-none"
                        >
                          <option value="">None (Main Category)</option>
                          {categories.filter(c => c.id !== editingCategory.id && !c.parentId).map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
    </div>
                      <div className="flex gap-3 pt-4">
                        <button
                          type="button"
                          onClick={() => setEditingCategory(null)}
                          className="flex-grow py-2 border border-gray-100 font-bold uppercase tracking-widest text-[10px]"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isSaving}
                          className="flex-grow py-2 bg-black text-white font-bold uppercase tracking-widest text-[10px] flex items-center justify-center gap-2"
                        >
                          {isSaving ? <Loader2 className="animate-spin" size={14} /> : 'Save'}
                        </button>
    </div>
                    </form>
                  </motion.div>
    </div>
              )}
            </AnimatePresence>

            {/* Delete Confirmation */}
            <AnimatePresence>
              {deletingId && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
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
                    <h3 className="text-lg font-bold uppercase tracking-tighter mb-2">Delete Category?</h3>
                    <p className="text-[10px] text-gray-500 mb-6 uppercase tracking-widest">This may affect products in this category.</p>
                    <div className="flex gap-3">
                      <button onClick={() => setDeletingId(null)} className="flex-grow py-2 border border-gray-100 font-bold uppercase tracking-widest text-[10px]">Cancel</button>
                      <button
                        onClick={async () => {
                          await onDelete(deletingId);
                          setDeletingId(null);
                        }}
                        className="flex-grow py-2 bg-red-500 text-white font-bold uppercase tracking-widest text-[10px]"
                      >
                        Delete
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
export default CategoryManagementDrawer;
