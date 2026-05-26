import Logo from "./Logo";
import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, ShoppingBag, Trash2, Minus, Plus, ArrowRight, Loader2, Truck } from "lucide-react";
import { CartItem } from "../types";
import { formatPrice } from "../utils/format";

const CartDrawer = ({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemove,
  onCheckout,
  isLoading = false
}: {
  isOpen: boolean,
  onClose: () => void,
  cartItems: CartItem[],
  onUpdateQuantity: (id: string, delta: number, variants?: Record<string, string>) => void,
  onRemove: (id: string, variants?: Record<string, string>) => void,
  onCheckout: () => void,
  isLoading?: boolean
}) => {
  const total = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const FREE_SHIPPING_THRESHOLD = 1000;
  const progress = Math.min((total / FREE_SHIPPING_THRESHOLD) * 100, 100);
  const remaining = FREE_SHIPPING_THRESHOLD - total;

  return (
  <AnimatePresence>
    {isOpen && (
      <>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-white/80 backdrop-blur-sm z-[60]"
        />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-full md:max-w-md bg-white border-l border-gray-100 z-[70] p-6 flex flex-col"
          >
            <div className="flex justify-between items-center mb-8">
              <div className="flex flex-col gap-1">
                <Logo className="h-8" dark />
                <span className="text-[10px] font-mono opacity-30 uppercase tracking-widest text-black">
                  {cartItems.reduce((acc, item) => acc + item.quantity, 0)} Items
                </span>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-full transition-colors">
                <X size={24} className="text-black" />
              </button>
            </div>

            {/* Free Shipping Progress Bar */}
            {cartItems.length > 0 && (
              <div className="mb-6 bg-gray-50 p-4 rounded-sm border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Truck size={14} className={remaining <= 0 ? "text-green-600" : "text-black"} />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-black">
                      {remaining <= 0 ? "You've unlocked Free Shipping!" : `R${remaining} away from Free Shipping`}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono opacity-40">{Math.round(progress)}%</span>
                </div>
                <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    className={`h-full ${remaining <= 0 ? "bg-green-600" : "bg-black"}`}
                  />
                </div>
              </div>
            )}

            <div className="flex-grow overflow-y-auto space-y-6 pr-2 custom-scrollbar relative">
              {isLoading && (
                <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex items-center justify-center">
                  <Loader2 className="animate-spin text-black" size={32} />
                </div>
              )}
            {cartItems.length === 0 ? (
              <div className="text-center py-20 opacity-30 text-black">
                <ShoppingBag size={48} className="mx-auto mb-4" />
                <p className="uppercase tracking-widest text-sm font-bold">Your cart is empty</p>
              </div>
            ) : (
              cartItems.map((item) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  key={`${item.id}-${item.selectedVariants ? JSON.stringify(item.selectedVariants) : ''}`}
                  className="flex gap-4 group text-black"
                >
                  <div className="w-24 h-32 bg-gray-50 border border-gray-100 flex-shrink-0 overflow-hidden">
                    <img src={item.image || undefined} alt={item.name} className="w-full h-full object-cover grayscale" referrerPolicy="no-referrer" />
                  </div>
                  <div className="flex-grow flex flex-col justify-between py-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold uppercase text-sm tracking-tight leading-tight">{item.name}</h4>
                        <p className="text-[10px] opacity-50 uppercase tracking-widest mt-1">{(item.categories || []).join(', ')}</p>
                        {item.selectedVariants && Object.keys(item.selectedVariants).length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {Object.entries(item.selectedVariants).map(([k, v]) => (
                              <span key={k} className="text-[8px] font-mono opacity-40 uppercase bg-gray-100 px-1">
                                {k}: {v}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => onRemove(item.id, item.selectedVariants)}
                        className="p-1 opacity-0 group-hover:opacity-30 hover:opacity-100 transition-opacity"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <div className="flex justify-between items-end">
                      <div className="flex items-center border border-gray-100 rounded-sm">
                        <button
                          onClick={() => onUpdateQuantity(item.id, -1, item.selectedVariants)}
                          className="p-3 hover:bg-gray-50 active:bg-gray-100 transition-colors"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-10 text-center text-sm font-mono font-bold">{item.quantity}</span>
                        <button
                          onClick={() => onUpdateQuantity(item.id, 1, item.selectedVariants)}
                          className="p-3 hover:bg-gray-50 active:bg-gray-100 transition-colors"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <span className="font-mono font-bold">{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
            </div>

          {cartItems.length > 0 && (
            <div className="mt-8 pt-8 border-t border-gray-100">
              <div className="space-y-2 mb-8 text-black">
                <div className="flex justify-between items-center text-xs font-mono uppercase tracking-widest opacity-50">
                  <span>Subtotal</span>
                  <span>{formatPrice(total)}</span>
                </div>
                <div className="flex justify-between items-center text-xs font-mono uppercase tracking-widest opacity-50">
                  <span>Logistics</span>
                  <span>{total >= FREE_SHIPPING_THRESHOLD ? "FREE" : "Calculated at checkout"}</span>
                </div>
                <div className="flex justify-between items-center pt-4">
                  <span className="uppercase tracking-widest text-xs font-bold">Total</span>
                  <span className="text-3xl font-mono font-bold">{formatPrice(total)}</span>
                </div>
              </div>
              <button
                onClick={onCheckout}
                className="w-full py-5 bg-black text-white font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                Checkout <ArrowRight size={20} />
              </button>
              <p className="text-center mt-4 text-[10px] font-mono uppercase tracking-widest opacity-30 text-black">
                Secure checkout & Email Confirmation
              </p>
            </div>
          )}
        </motion.div>
      </>
    )}
  </AnimatePresence>
);
};
export default CartDrawer;
