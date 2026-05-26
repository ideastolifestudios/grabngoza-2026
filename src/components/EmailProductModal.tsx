import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Send, Loader2, CheckCircle2 } from "lucide-react";
import { Product } from "../types";
import { formatPrice } from "../utils/format";
import { emailService } from "../services/emailService";
import Logo from "./Logo";

const EmailProductModal = ({
  isOpen,
  onClose,
  product
}: {
  isOpen: boolean,
  onClose: () => void,
  product: Product | null
}) => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [errorDetails, setErrorDetails] = useState<string | null>(null);

  if (!product) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus('sending');
    setErrorDetails(null);
    try {
      await emailService.sendProductDetails(email, product);

      setStatus('success');
      setTimeout(() => {
        onClose();
        setStatus('idle');
        setEmail('');
      }, 2000);
    } catch (err: any) {
      setStatus('error');
      setErrorDetails(err.message || 'Network error');
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
            className="fixed inset-0 bg-white/80 backdrop-blur-md z-[100]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-md bg-white border border-gray-100 shadow-2xl z-[110] p-6"
          >
            <div className="flex justify-between items-center mb-6">
              <Logo className="h-6" dark />
              <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-full transition-colors text-black">
                <X size={20} />
              </button>
            </div>

            <div className="flex gap-4 mb-6 p-4 bg-gray-50 border border-gray-100 text-black">
              <img src={product.image || undefined} alt={product.name} className="w-12 h-16 md:w-16 md:h-20 object-cover grayscale" />
              <div className="min-w-0">
                <h4 className="font-bold uppercase text-xs md:text-sm tracking-tight truncate">{product.name}</h4>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest truncate">{(product.categories || []).join(', ')}</p>
                <p className="text-xs font-bold mt-1">{formatPrice(product.price)}</p>
              </div>
            </div>

            <form onSubmit={handleSend} className="space-y-6">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-[0.2em] mb-2 opacity-50 text-black">Customer Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="enter@email.com"
                  className="w-full bg-gray-50 border border-gray-100 px-4 py-4 text-sm font-mono focus:outline-none focus:border-black transition-colors text-black"
                />
              </div>

              <button
                type="submit"
                disabled={status === 'sending' || status === 'success'}
                className={`w-full py-5 font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all ${
                  status === 'success' ? 'bg-emerald-500 text-white' : 'bg-black text-white hover:scale-[1.02]'
                }`}
              >
                {status === 'sending' ? <Loader2 className="animate-spin" size={20} /> :
                 status === 'success' ? <CheckCircle2 size={20} /> :
                 <><Send size={18} /> Send Product Details</>}
              </button>

              {status === 'error' && (
                <div className="space-y-2">
                  <p className="text-[10px] text-red-500 font-mono uppercase tracking-widest text-center">
                    Failed to send.
                  </p>
                  {errorDetails && (
                    <p className="text-[8px] text-red-400 font-mono uppercase tracking-tighter text-center opacity-70">
                      Error: {errorDetails}
                    </p>
                  )}
                </div>
              )}
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default EmailProductModal;
