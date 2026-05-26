import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Package, Clock, Truck, CheckCircle2, AlertCircle, Search, ExternalLink, Edit3, Loader2, User as UserIcon } from "lucide-react";
import { Order, User, OrderStatus } from "../types";
import { formatPrice } from "../utils/format";
import Logo from "./Logo";
import LabelDownloadButton from "./LabelDownloadButton";

const OrdersDrawer = ({
  isOpen,
  onClose,
  orders,
  user,
  onUpdateOrder
}: {
  isOpen: boolean,
  onClose: () => void,
  orders: Order[],
  user: User | null,
  onUpdateOrder?: (id: string, updates: Partial<Order>) => void
}) => {
  const [trackingInputs, setTrackingInputs] = useState<Record<string, { number: string, url: string }>>({});

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-50 text-yellow-600';
      case 'confirmed': return 'bg-yellow-50 text-yellow-600';
      case 'preparing': return 'bg-blue-50 text-blue-600';
      case 'pickup-scheduled': return 'bg-blue-50 text-blue-600';
      case 'collected': return 'bg-indigo-50 text-indigo-600';
      case 'in-transit': return 'bg-purple-50 text-purple-600';
      case 'out-for-delivery': return 'bg-cyan-50 text-cyan-600';
      case 'ready': return 'bg-emerald-50 text-emerald-600';
      case 'delivered': return 'bg-emerald-50 text-emerald-600';
      case 'completed': return 'bg-gray-50 text-gray-400';
      case 'failed-delivery': return 'bg-red-50 text-red-600';
      case 'cancelled': return 'bg-red-50 text-red-600';
      case 'returned': return 'bg-orange-50 text-orange-600';
      default: return 'bg-gray-50 text-black';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'pending': 'Order Placed',
      'confirmed': 'Confirmed',
      'preparing': 'Preparing',
      'pickup-scheduled': 'Pickup Scheduled',
      'collected': 'Collected',
      'in-transit': 'In Transit',
      'out-for-delivery': 'Out for Delivery',
      'ready': 'Ready',
      'delivered': 'Delivered',
      'completed': 'Completed',
      'failed-delivery': 'Delivery Failed',
      'cancelled': 'Cancelled',
      'returned': 'Returned',
    };
    return labels[status] || status;
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
                  {orders.length} Total
                </span>
    </div>
              <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-full transition-colors">
                <X size={24} className="text-black" />
              </button>
    </div>

            <div className="flex-grow overflow-y-auto space-y-4 pr-2 custom-scrollbar">
              {!user ? (
                <div className="text-center py-20 opacity-30 text-black">
                  <UserIcon size={48} className="mx-auto mb-4" />
                  <p className="uppercase tracking-widest text-sm font-bold">Login to track your orders</p>
    </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-20 opacity-30 text-black">
                  <Package size={48} className="mx-auto mb-4" />
                  <p className="uppercase tracking-widest text-sm font-bold">No orders found</p>
    </div>
              ) : (
                orders.map((order) => (
                  <div key={order.id} className="p-6 border border-gray-100 bg-gray-50/50 space-y-4 text-black">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-xs font-mono font-bold uppercase tracking-widest opacity-50">Order #{order.id.slice(0, 8).toUpperCase()}</h4>
                        <p className="text-[10px] opacity-30 uppercase tracking-widest mt-1">{new Date(order.date).toLocaleDateString()}</p>
                        <p className="text-[10px] opacity-30 mt-1">{new Date(order.date).toLocaleString()}</p>
    </div>
                      <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest ${getStatusColor(order.status)}`}>
                        {getStatusLabel(order.status)}
                      </span>
    </div>

                    {order.trackingNumber && (
                      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-sm w-fit">
                        <Truck size={12} />
                        <span>Shipment: {order.status === 'completed' ? 'Delivered' : 'In Transit'}</span>
    </div>
                    )}

                    <div className="space-y-2">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-xs">
                          <span className="opacity-70">{item.quantity}x {item.name}</span>
                          <span className="font-mono">{formatPrice(item.price * item.quantity)}</span>
    </div>
                      ))}
    </div>

                    <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                      <span className="text-[10px] font-bold uppercase tracking-widest opacity-50">Total Paid</span>
                      <span className="font-mono font-bold">{formatPrice(order.total)}</span>
    </div>


                    {/* Tracking Information */}
                    {(order.trackingNumber || order.trackingUrl || (order as any).trackingReference) && (
                      <div className="pt-4 border-t border-gray-100 space-y-3">
                        <div className="flex justify-between items-end">
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest opacity-50 mb-1">Tracking Number</p>
                            <p className="text-xs font-mono">{order.trackingNumber || (order as any).trackingReference || 'N/A'}</p>
    </div>
                          <a
                            href={order.trackingUrl || `/track-order?id=${order.id}&email=${encodeURIComponent(order.email)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-4 py-2 bg-black text-white text-[10px] font-black uppercase tracking-widest hover:bg-black/80 transition-colors"
                          >
                            Track <ExternalLink size={12} />
                          </a>
    </div>
                        {user.role === 'admin' && (order.labelUrl || order.shipmentId) && (
                          <LabelDownloadButton order={order} />
                        )}

    </div>
                    )}

                    {user.role === 'admin' && onUpdateOrder && (
                      <div className="pt-4 border-t border-gray-100 space-y-4">
                        <div className="flex flex-wrap gap-2">
                          {(['preparing', 'ready', 'completed', 'cancelled'] as OrderStatus[]).map(s => (
                            <button
                              key={s}
                              onClick={() => onUpdateOrder(order.id, { status: s })}
                              className={`px-2 py-1 text-[8px] font-bold uppercase tracking-widest border border-gray-200 hover:bg-black/5 transition-colors ${order.status === s ? 'bg-black text-white border-black' : 'text-black'}`}
                            >
                              {s}
                            </button>
                          ))}
    </div>

                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            placeholder="Tracking #"
                            value={trackingInputs[order.id]?.number ?? order.trackingNumber ?? ''}
                            onChange={(e) => setTrackingInputs(prev => ({ ...prev, [order.id]: { ...prev[order.id], number: e.target.value, url: prev[order.id]?.url ?? order.trackingUrl ?? '' } }))}
                            className="text-[10px] p-2 border border-gray-200 focus:border-black outline-none transition-colors"
                          />
                          <input
                            type="text"
                            placeholder="Tracking URL"
                            value={trackingInputs[order.id]?.url ?? order.trackingUrl ?? ''}
                            onChange={(e) => setTrackingInputs(prev => ({ ...prev, [order.id]: { ...prev[order.id], url: e.target.value, number: prev[order.id]?.number ?? order.trackingNumber ?? '' } }))}
                            className="text-[10px] p-2 border border-gray-200 focus:border-black outline-none transition-colors"
                          />
                          <button
                            onClick={() => onUpdateOrder(order.id, {
                              trackingNumber: trackingInputs[order.id]?.number ?? order.trackingNumber,
                              trackingUrl: trackingInputs[order.id]?.url ?? order.trackingUrl
                            })}
                            className="col-span-2 py-2 bg-emerald-500 text-white text-[8px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-colors"
                          >
                            Update Tracking Info
                          </button>
    </div>
    </div>
                    )}
    </div>
                ))
              )}
    </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
export default OrdersDrawer;
