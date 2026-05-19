'use client';
import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Truck, Loader2, MapPin, AlertCircle } from 'lucide-react';
import { orderService } from '../services/api';
import { formatPrice } from '../utils/shared';
import SEO from '../components/SEO';
import type { Order } from '../types';

const TrackingTimeline = ({ trackingNumber, trackingUrl }: { trackingNumber: string, trackingUrl?: string }) => {
  const [events, setEvents] = useState<any[]>([]);
  const [status, setStatus] = useState<string>('');
  const [loadingEvents, setLoadingEvents] = useState(false);

  useEffect(() => {
    const fetchTracking = async () => {
      setLoadingEvents(true);
      try {
        const res = await fetch(`/api/shipping?action=track&trackingNumber=${encodeURIComponent(trackingNumber)}`);
        if (res.ok) {
          const data = await res.json();
          setEvents(data.events || []);
          setStatus(data.status || '');
        }
      } catch (err) {
        console.error('Tracking fetch failed:', err);
      } finally {
        setLoadingEvents(false);
      }
    };
    fetchTracking();
  }, [trackingNumber]);

  return (
    <div className="space-y-4">
      <div className="bg-emerald-50 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Truck className="text-emerald-600" size={20} />
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Tracking Number</p>
            <p className="text-xs font-mono font-bold">{trackingNumber}</p>
            {status && <p className="text-[10px] text-emerald-500 mt-1 uppercase">{status}</p>}
          </div>
        </div>
        {trackingUrl && (
          <a
            href={trackingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] font-black uppercase tracking-widest underline hover:text-emerald-700"
          >
            Track Package
          </a>
        )}
      </div>

      {loadingEvents ? (
        <div className="flex items-center gap-2 py-4 px-4 text-sm text-gray-400">
          <Loader2 className="animate-spin" size={16} /> Loading tracking events...
        </div>
      ) : events.length > 0 ? (
        <div className="pl-4 border-l-2 border-gray-100 space-y-4 ml-2">
          {events.map((event: any, idx: number) => (
            <div key={idx} className="relative pl-6">
              <div className={`absolute -left-[9px] top-1.5 w-4 h-4 rounded-full border-2 ${
                idx === 0 ? 'bg-emerald-500 border-emerald-500' : 'bg-white border-gray-300'
              }`} />
              <div>
                <p className="text-xs font-bold text-black">{event.description}</p>
                <div className="flex gap-3 mt-1">
                  {event.location && (
                    <p className="text-[10px] text-gray-400 flex items-center gap-1">
                      <MapPin size={10} /> {event.location}
                    </p>
                  )}
                  {event.timestamp && (
                    <p className="text-[10px] text-gray-400">
                      {new Date(event.timestamp).toLocaleDateString('en-ZA', {
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
};

const OrderTrackingPage = () => {
  const [orderId, setOrderId] = useState('');
  const [email, setEmail] = useState('');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    const params = new URLSearchParams(window.location.search);
    const refId = params.get('id') || params.get('ref') || '';
    const refEmail = params.get('email') || '';
    if (refId) setOrderId(refId);
    if (refEmail) setEmail(refEmail);
    if (refId && refEmail) {
      orderService.lookupOrder(refId, refEmail).then(result => {
        if (result) setOrder(result);
        else setError('Order not found. Check your Order ID and email.');
      }).catch(() => setError('Failed to load order.')).finally(() => setLoading(false));
    }
  }, []);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setOrder(null);

    try {
      const result = await orderService.lookupOrder(orderId, email);
      if (result) {
        setOrder(result);
      } else {
        setError("Order not found. Please check your Order ID and Email address.");
      }
    } catch (err) {
      setError("An error occurred while tracking your order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white pt-32 pb-20 px-6">
      <SEO
        title="Track Order | Real-time Updates"
        description="Track your Grab & Go order in real-time. Enter your order number to see the current status and location."
        url="https://grabandgo.co.za/track-order"
      />
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-display font-bold uppercase tracking-tighter mb-4 text-black">Track Your Order</h1>
          <p className="text-[10px] text-gray-400 uppercase tracking-widest">Enter your details below to see your order status</p>
        </div>

        <form onSubmit={handleTrack} className="space-y-6 mb-12">
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest opacity-40 mb-2 text-black">Order ID</label>
              <input
                type="text"
                placeholder="e.g. #ABC12345"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                required
                className="w-full border border-gray-100 rounded-sm px-4 py-3 text-sm focus:border-black outline-none transition-all uppercase tracking-widest font-bold text-black"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest opacity-40 mb-2 text-black">Email Address</label>
              <input
                type="email"
                placeholder="The email used at checkout"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full border border-gray-100 rounded-sm px-4 py-3 text-sm focus:border-black outline-none transition-all uppercase tracking-widest font-bold text-black"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-black text-white text-[10px] font-black uppercase tracking-[0.3em] hover:bg-zinc-800 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : 'Track Order'}
          </button>
        </form>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 bg-red-50 border border-red-100 text-red-600 text-[10px] font-bold uppercase tracking-widest flex items-center gap-3 mb-8"
            >
              <AlertCircle size={16} />
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {order && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="border border-gray-100 p-8 space-y-8 text-black"
          >
            <div className="flex justify-between items-start border-b border-gray-100 pb-6">
              <div>
                <h2 className="text-xl font-bold uppercase tracking-tighter">Order #{order.id.slice(0, 8).toUpperCase()}</h2>
                <p className="text-[10px] opacity-30 uppercase tracking-widest mt-1">Placed on {new Date(order.date).toLocaleDateString()}</p>
              </div>
              <div className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest ${
                order.status === 'pending' ? 'bg-yellow-50 text-yellow-600' :
                order.status === 'preparing' ? 'bg-blue-50 text-blue-600' :
                order.status === 'ready' ? 'bg-emerald-50 text-emerald-600' :
                order.status === 'completed' ? 'bg-gray-50 text-gray-400' :
                'bg-red-50 text-red-600'
              }`}>
                {order.status}
              </div>
            </div>

            {order.trackingNumber && (
              <TrackingTimeline trackingNumber={order.trackingNumber} trackingUrl={order.trackingUrl} />
            )}

            <div className="space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-widest opacity-30">Order Items</h3>
              <div className="space-y-3">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs">
                    <span className="font-bold uppercase tracking-tight">{item.quantity}x {item.name}</span>
                    <span className="font-mono opacity-60">{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-6 border-t border-gray-100 flex justify-between items-center">
              <span className="text-[10px] font-black uppercase tracking-widest opacity-30">Total Paid</span>
              <span className="text-lg font-bold">{formatPrice(order.total)}</span>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};


export default OrderTrackingPage;
