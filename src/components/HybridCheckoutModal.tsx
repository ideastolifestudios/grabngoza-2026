import { PAYMENT_LOGOS } from "../utils/shared";
import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Truck, Package, MapPin, Globe, ChevronRight, Loader2, Info, ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { CartItem, User, ShippingMethod } from "../types";
import { formatPrice } from "../utils/format";
import { orderService } from "../services/api";
import Logo from "./Logo";

interface BobGoPickupPoint {
  id: string;
  name: string;
  address: string;
  suburb: string;
  city: string;
  province: string;
  postal_code: string;
  lat: number;
  lng: number;
  operating_hours?: string;
  type: "locker" | "counter" | "pudo";
}

const BOBGO_FALLBACK_POINTS: BobGoPickupPoint[] = [
  { id: "bg-jnb-001", name: "PUDO Locker – Sandton City", address: "Shop L23, Sandton City Mall, 83 Rivonia Rd", suburb: "Sandton", city: "Johannesburg", province: "Gauteng", postal_code: "2196", lat: -26.1076, lng: 28.0567, operating_hours: "Mon–Sat 09:00–21:00, Sun 10:00–19:00", type: "locker" },
  { id: "bg-jnb-002", name: "PUDO Counter – Rosebank Mall", address: "Shop 14, The Zone @ Rosebank, Oxford Rd", suburb: "Rosebank", city: "Johannesburg", province: "Gauteng", postal_code: "2196", lat: -26.1453, lng: 28.044, operating_hours: "Mon–Sun 09:00–20:00", type: "counter" },
  { id: "bg-cpt-001", name: "PUDO Locker – V&A Waterfront", address: "Ground Floor, Victoria Wharf", suburb: "Waterfront", city: "Cape Town", province: "Western Cape", postal_code: "8001", lat: -33.9025, lng: 18.4199, operating_hours: "Mon–Sun 09:00–21:00", type: "locker" },
  { id: "bg-cpt-002", name: "PUDO Counter – Cavendish Square", address: "Lower Ground, Cavendish Square, Dreyer St", suburb: "Claremont", city: "Cape Town", province: "Western Cape", postal_code: "7708", lat: -33.9821, lng: 18.4692, operating_hours: "Mon–Sat 09:00–19:00", type: "counter" },
  { id: "bg-dbn-001", name: "PUDO Locker – Gateway", address: "Upper Level, Gateway Theatre, 1 Palm Blvd", suburb: "Umhlanga", city: "Durban", province: "KwaZulu-Natal", postal_code: "4319", lat: -29.7298, lng: 31.0723, operating_hours: "Mon–Sat 09:00–21:00", type: "locker" },
  { id: "bg-pta-001", name: "PUDO Counter – Menlyn Park", address: "Menlyn Park Shopping Centre, Atterbury Rd", suburb: "Menlyn", city: "Pretoria", province: "Gauteng", postal_code: "0181", lat: -25.7836, lng: 28.277, operating_hours: "Mon–Sat 09:00–21:00", type: "counter" },
];

const HybridCheckoutModal = ({
  isOpen,
  onClose,
  cartItems,
  total,
  paymentStatus,
  onPaymentStatusChange,
  user,
  onOpenAuth
}: {
  isOpen: boolean,
  onClose: () => void,
  cartItems: CartItem[],
  total: number,
  paymentStatus: 'success' | 'cancelled' | 'processing' | null,
  onPaymentStatusChange: (status: 'success' | 'cancelled' | 'processing' | null) => void,
  user: User | null,
  onOpenAuth: () => void
}) => {
   const [deliveryMethod, setDeliveryMethod] = useState<'standard' | 'pickup' | 'international'>('standard');
  const [country, setCountry] = useState('South Africa');
  const [discountCode, setDiscountCode] = useState('');
  const [email, setEmail] = useState(user?.email || '');
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [phone, setPhone] = useState('');
  const [isPaying, setIsPaying] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [orderMessage, setOrderMessage] = useState<string | null>(null);
  const [paymentGateway, setPaymentGateway] = useState<'yoco'>('yoco');
  const [shippingRates, setShippingRates] = useState<any[]>([]);
  const [selectedRate, setSelectedRate] = useState<any>(null);
  const [loadingRates, setLoadingRates] = useState(false);
  // Bob Go pickup point state
  const [pickupPoints, setPickupPoints] = useState<BobGoPickupPoint[]>([]);
  const [selectedPickupPoint, setSelectedPickupPoint] = useState<BobGoPickupPoint | null>(null);
  const [loadingPickupPoints, setLoadingPickupPoints] = useState(false);

  // Fetch live shipping rates (standard + international)
  useEffect(() => {
    if ((deliveryMethod !== 'standard' && deliveryMethod !== 'international') || !address || !city || !province || !postalCode) {
      setShippingRates([]);
      setSelectedRate(null);
      return;
    }
    const timer = setTimeout(async () => {
      setLoadingRates(true);
      try {
        const deliveryCountry = deliveryMethod === 'international' ? country : 'ZA';
        const res = await fetch('/api/shipping?action=rates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            deliveryAddress: { address, city, province, postalCode, country: deliveryCountry },
            items: cartItems.map(item => ({ name: item.name, weight: item.weight || 0.5, quantity: item.quantity })),
          }),
        });
        if (res.ok) {
          const data = await res.json();
          setShippingRates(data.rates || []);
          if (data.rates?.length > 0) setSelectedRate(data.rates[0]);
        }
      } catch (err) {
        console.error('Failed to fetch rates:', err);
      } finally {
        setLoadingRates(false);
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [address, city, province, postalCode, deliveryMethod, country, cartItems]);

  // Fetch Bob Go pickup points when that tab is selected
  useEffect(() => {

    setLoadingPickupPoints(true);
    const fetchPoints = async () => {
      try {
        const params = new URLSearchParams();
        if (postalCode) params.set('postal_code', postalCode);
        if (city) params.set('city', city);
        const res = await fetch(`/api/shipping?action=pickup-points&${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          // Normalise — ensure all fields are primitives (ShipLogic may return nested objects)
          const normalisePoint = (p: any): BobGoPickupPoint => {
            const s = (v: any): string => {
              if (!v) return '';
              if (typeof v === 'string') return v;
              if (typeof v === 'object') return v.street_address || v.entered_address || v.name || v.address || '';
              return String(v);
            };
            return {
              id:              String(p.id || p.code || Math.random()),
              name:            s(p.name) || s(p.title) || 'Pickup Point',
              address:         s(p.address) || s(p.street_address) || '',
              suburb:          s(p.suburb)  || s(p.local_area) || '',
              city:            s(p.city) || city,
              province:        s(p.province) || s(p.zone) || '',
              postal_code:     s(p.postal_code) || s(p.code) || postalCode,
              lat:             typeof p.lat === 'number' ? p.lat : 0,
              lng:             typeof p.lng === 'number' ? p.lng : 0,
              operating_hours: typeof p.operating_hours === 'string' ? p.operating_hours : '',
              type:            (['locker','counter','pudo'].includes(p.type) ? p.type : 'counter') as 'locker'|'counter'|'pudo',
            };
          };
          const points = (data.pickup_points || []).map(normalisePoint);
          setPickupPoints(points.length > 0 ? points : BOBGO_FALLBACK_POINTS);
        } else {
          setPickupPoints(BOBGO_FALLBACK_POINTS);
        }
      } catch {
        setPickupPoints(BOBGO_FALLBACK_POINTS);
      } finally {
        setLoadingPickupPoints(false);
      }
    };
    fetchPoints();
  }, [deliveryMethod, postalCode, city]);

  const shippingCost = useMemo(() => {
    if (deliveryMethod === 'pickup') return 0;
    // bobgo removed // Bob Go flat fallback R89
    if (deliveryMethod === 'international') return selectedRate?.amount || 450;
    return selectedRate?.amount || 0;
  }, [deliveryMethod, selectedRate]);


  const subtotal = total;
  const finalTotal = subtotal + shippingCost;

  useEffect(() => {
    if (user) {
      setEmail(user.email);
      setFirstName(user.firstName);
      setLastName(user.lastName);
    }
  }, [user]);

  const handleFinalize = async () => {
    setIsPaying(true);
    setPaymentError(null);

    if (!email || !firstName || !lastName || !phone) {
      setPaymentError("Please fill in all required contact fields.");
      setIsPaying(false);
      return;
    }

    if (deliveryMethod === 'standard' && (!address || !city || !province || !postalCode)) {
      setPaymentError("Please fill in all shipping address fields.");
      setIsPaying(false);
      return;
    }

    try {
      // Save pending order details
      const orderData: any = {
        userId: user?.id || null,
        email,
        firstName,
        lastName,
        address,
        city,
        province,
        postalCode,
        phone,
        deliveryMethod,
        country,
        shippingCost,
        items: cartItems,
        total: finalTotal,
        paymentGateway,
        // Bob Go pickup point — saved to Firestore so admin can see it
        ...(false && selectedPickupPoint ? { // bobgo removed
          bobGoPickupPoint: {
            id: selectedPickupPoint?.id,
            name: selectedPickupPoint?.name,
            address: selectedPickupPoint?.address,
            suburb: selectedPickupPoint?.suburb,
            city: selectedPickupPoint?.city,
            province: selectedPickupPoint?.province,
            postal_code: selectedPickupPoint?.postal_code,
          },
          // Override delivery address with pickup point address for ShipLogic
          deliveryAddress: {
            type: 'business',
            company: selectedPickupPoint?.name,
            street_address: selectedPickupPoint?.address,
            local_area: selectedPickupPoint?.suburb,
            city: selectedPickupPoint?.city,
            zone: selectedPickupPoint?.province,
            code: selectedPickupPoint?.postal_code,
            country: 'ZA',
          },
          specialInstructions: `PUDO Pickup: ${selectedPickupPoint?.name} — ${selectedPickupPoint?.address}, ${selectedPickupPoint?.suburb}. Hours: ${selectedPickupPoint?.operating_hours || 'See store'}`,
        } : {}),
        // International — flag for admin/ShipLogic customs
        ...(deliveryMethod === 'international' ? {
          isInternational: true,
          deliveryCountry: country,
        } : {}),
        // Selected ShipLogic rate — saved so admin dispatch uses same service
        ...(selectedRate ? {
          selectedServiceLevel: selectedRate.serviceLevel?.code || selectedRate.serviceLevel?.name || null,
          selectedServiceName: selectedRate.serviceLevel?.name || null,
        } : {}),
      };

      // In a production environment, this would integrate with a payment gateway
      // For now, we save the order to Firestore to finalize the purchase

      // Set to processing state for better UX
      onPaymentStatusChange('processing');

      const savedOrder = await orderService.createOrder(orderData);

      // Store order data in localStorage key grab_go_pending_order
      localStorage.setItem('grab_go_pending_order', JSON.stringify({
        ...orderData,
        id: savedOrder.id
      }));

      // Call Yoco checkout API
      const response = await fetch('/api/payments?action=yoco', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: finalTotal,
          currency: 'ZAR',
          metadata: {
            orderId: savedOrder.id
          }
        }),
      });

      const paymentData = await response.json();

      if (!response.ok) {
        throw new Error(paymentData.error || 'Failed to initialize payment');
      }

      if (paymentData.redirectUrl) {
        window.location.href = paymentData.redirectUrl;
      } else {
        throw new Error('Payment initialization failed: No redirect URL');
      }

    } catch (err: any) {
      onPaymentStatusChange(null);
      setPaymentError(err.message || 'Failed to place order');
    } finally {
      setIsPaying(false);
    }
  };

  if (paymentStatus === 'processing') {
    return (
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/90 backdrop-blur-md z-[150]" />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed inset-0 md:inset-20 bg-white text-black z-[160] flex flex-col items-center justify-center p-6 md:rounded-xl text-center"
            >
              <div className="w-12 h-12 md:w-16 md:h-16 border-4 border-black border-t-transparent rounded-full animate-spin mb-6" />
              <h2 className="text-xl md:text-2xl font-display font-bold uppercase tracking-tighter mb-4">Confirming Order...</h2>
              <p className="text-xs md:text-sm text-gray-500 max-w-md px-4">We're finalizing your payment and sending your confirmation email. Please don't close this window.</p>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );
  }

  if (paymentStatus === 'success') {
    return (
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-white/80 backdrop-blur-md z-[150]" />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed inset-0 md:inset-20 bg-white text-black z-[160] flex flex-col items-center justify-center p-6 md:rounded-xl text-center"
            >
              <div className="w-12 h-12 md:w-16 md:h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-6">
                <CheckCircle2 size={24} className="md:w-8 md:h-8" />
    </div>
              <h2 className="text-xl md:text-2xl font-display font-bold uppercase tracking-tighter mb-4">Order Confirmed!</h2>
              <p className="text-xs md:text-sm text-gray-500 max-w-md mb-6 px-4">Thank you for your order. We've sent a confirmation email to {email}.</p>

              {!user && (
                <div className="mb-8 p-6 bg-gray-50 border border-gray-100 rounded-xl max-w-md mx-4 text-center">
                  <h4 className="text-xs font-bold uppercase tracking-widest mb-2">Save your details for next time?</h4>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-4">Create an account to track your orders and checkout faster.</p>
                  <button
                    onClick={() => {
                      onClose();
                      onOpenAuth();
                    }}
                    className="text-[10px] font-black uppercase tracking-[0.2em] underline hover:text-gray-600 transition-colors"
                  >
                    Create Account
                  </button>
    </div>
              )}

              {orderMessage && (
                <div className="mb-6 md:mb-8 p-4 bg-emerald-50 border border-emerald-100 rounded-lg max-w-md mx-4">
                  <p className="text-[8px] md:text-[10px] font-bold uppercase tracking-widest text-emerald-700">{orderMessage}</p>
    </div>
              )}

              <button
                onClick={() => {
                  window.history.replaceState({}, document.title, "/");
                  onClose();
                }}
                className="w-full md:w-auto px-8 py-4 bg-black text-white font-bold uppercase tracking-widest hover:opacity-90 transition-opacity"
              >
                Back to Shop
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );
  }

  if (paymentStatus === 'cancelled') {
    return (
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/90 backdrop-blur-md z-[150]" />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed inset-0 md:inset-20 bg-white text-black z-[160] flex flex-col items-center justify-center p-6 md:rounded-xl text-center"
            >
              <div className="w-12 h-12 md:w-16 md:h-16 bg-red-500 text-white rounded-full flex items-center justify-center mb-6 shadow-lg shadow-red-500/20">
                <X size={24} className="md:w-8 md:h-8" />
    </div>
              <h2 className="text-xl md:text-2xl font-display font-bold uppercase tracking-tighter mb-4">Payment Cancelled</h2>
              <p className="text-xs md:text-sm text-gray-500 max-w-md mb-6 px-4">The payment process was cancelled. No funds were deducted. You can try again or contact support if you're having issues.</p>
              <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto px-4">
                <button
                  onClick={() => {
                    window.history.replaceState({}, document.title, "/");
                    onClose();
                  }}
                  className="w-full md:w-auto px-8 py-4 border border-black font-bold uppercase tracking-widest hover:bg-gray-50 transition-colors"
                >
                  Back to Shop
                </button>
                <button
                  onClick={() => {
                    window.history.replaceState({}, document.title, "/");
                    onPaymentStatusChange(null);
                  }}
                  className="w-full md:w-auto px-8 py-4 bg-black text-white font-bold uppercase tracking-widest hover:opacity-90 transition-opacity"
                >
                  Try Again
                </button>
    </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/90 backdrop-blur-md z-[150]"
          />
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="fixed inset-0 md:inset-10 bg-white text-black z-[160] overflow-hidden flex flex-col md:rounded-xl"
            >
              {/* Header / Logo */}
              <div className="p-4 md:p-6 border-b border-gray-100 flex justify-center relative">
                <Logo className="h-8 md:h-10" />
                <button onClick={onClose} className="absolute right-4 md:right-6 top-1/2 -translate-y-1/2 p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X size={20} />
                </button>
    </div>

              <div className="flex-grow overflow-y-auto">
                <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-[1fr_400px] h-full">

                  {/* Left Column: Form */}
                  <div className="p-6 md:p-8 space-y-6 md:space-y-8 border-b md:border-b-0 md:border-r border-gray-100">
                    {/* Contact */}
                    <section>
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-base md:text-lg font-bold tracking-tight">
                          {user ? 'Contact Information' : 'Guest Checkout'}
                        </h3>
                        {!user && (
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] opacity-40 uppercase tracking-widest font-bold">Have an account?</span>
                            <button
                              onClick={onOpenAuth}
                              className="text-[10px] md:text-xs underline font-bold hover:text-gray-600 transition-colors uppercase tracking-widest"
                            >
                              Login
                            </button>
    </div>
                        )}
    </div>
                      <div className="space-y-4">
                        <div className="relative">
                          <input
                            type="email"
                            placeholder="Email Address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full border border-gray-200 rounded-md px-4 py-3 text-sm focus:ring-2 focus:ring-black focus:outline-none transition-all"
                          />
                          {!user && (
                            <p className="mt-2 text-[9px] text-gray-400 uppercase tracking-wider font-medium">
                              We'll send your order confirmation and tracking details here.
                            </p>
                          )}
    </div>
    </div>
                    </section>

                      {/* Delivery */}
                    <section>
                      <h3 className="text-base md:text-lg font-bold tracking-tight mb-4">Delivery</h3>

                      {/* Delivery Method Toggle */}
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-0 border border-gray-200 rounded-md overflow-hidden mb-6">
                        <button
                          onClick={() => { setDeliveryMethod('standard'); setCountry('South Africa'); setSelectedPickupPoint(null); }}
                          className={`flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 py-3 md:py-4 text-[10px] md:text-xs font-bold transition-all ${deliveryMethod === 'standard' ? 'bg-gray-50 shadow-inner' : 'bg-white hover:bg-gray-50'}`}
                        >
                          <Truck size={14} className="md:w-4 md:h-4" /> Standard
                        </button>
                        <button
                          style={{display:'none'}} onClick={() => { setCountry('South Africa'); setSelectedPickupPoint(null); }}
                          className={`flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 py-3 md:py-4 text-[10px] md:text-xs font-bold transition-all ${false ? 'bg-gray-50 shadow-inner' : 'bg-white hover:bg-gray-50'}`}
                        >
                          <Package size={14} className="md:w-4 md:h-4" /> Bob Go
                        </button>
                        <button
                          onClick={() => { setDeliveryMethod('pickup'); setCountry('South Africa'); setSelectedPickupPoint(null); }}
                          className={`flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 py-3 md:py-4 text-[10px] md:text-xs font-bold transition-all ${deliveryMethod === 'pickup' ? 'bg-gray-50 shadow-inner' : 'bg-white hover:bg-gray-50'}`}
                        >
                          <MapPin size={14} className="md:w-4 md:h-4" /> Pickup
                        </button>
                        <button
                          onClick={() => { setDeliveryMethod('international'); setSelectedPickupPoint(null); }}
                          className={`flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 py-3 md:py-4 text-[10px] md:text-xs font-bold transition-all ${deliveryMethod === 'international' ? 'bg-gray-50 shadow-inner' : 'bg-white hover:bg-gray-50'}`}
                        >
                          <Globe size={14} className="md:w-4 md:h-4" /> International
                        </button>
    </div>

                    <div className="space-y-4">
                      {deliveryMethod === 'standard' || deliveryMethod === 'international' ? (
                        <>
                          <div className="relative">
                            <select
                              value={country}
                              onChange={(e) => setCountry(e.target.value)}
                              disabled={deliveryMethod === 'standard'}
                              className="w-full border border-gray-200 rounded-md px-4 py-3 text-sm appearance-none bg-white focus:ring-2 focus:ring-black focus:outline-none transition-all disabled:opacity-50"
                            >
                              <option>South Africa</option>
                              <option>Botswana</option>
                              <option>Namibia</option>
                              <option>United Kingdom</option>
                              <option>United States</option>
                              <option>Australia</option>
                              <option>Germany</option>
                              <option>France</option>
                            </select>
                            <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 rotate-90 opacity-50" size={16} />
    </div>

                          <div className="grid grid-cols-2 gap-4">
                            <input
                              type="text"
                              name="fname"
                              autoComplete="given-name"
                              placeholder="First name"
                              value={firstName}
                              onChange={(e) => setFirstName(e.target.value)}
                              required
                              className="w-full border border-gray-200 rounded-md px-4 py-4 text-sm focus:ring-2 focus:ring-black focus:outline-none transition-all"
                            />
                            <input
                              type="text"
                              name="lname"
                              autoComplete="family-name"
                              placeholder="Last name"
                              value={lastName}
                              onChange={(e) => setLastName(e.target.value)}
                              required
                              className="w-full border border-gray-200 rounded-md px-4 py-4 text-sm focus:ring-2 focus:ring-black focus:outline-none transition-all"
                            />
    </div>

                          <input
                            type="text"
                            name="address"
                            autoComplete="street-address"
                            placeholder="Address"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            required
                            className="w-full border border-gray-200 rounded-md px-4 py-4 text-sm focus:ring-2 focus:ring-black focus:outline-none transition-all"
                          />

                          <div className="grid grid-cols-3 gap-4">
                            <input
                              type="text"
                              name="city"
                              autoComplete="address-level2"
                              placeholder="City"
                              value={city}
                              onChange={(e) => setCity(e.target.value)}
                              required
                              className="col-span-1 w-full border border-gray-200 rounded-md px-4 py-4 text-sm focus:ring-2 focus:ring-black focus:outline-none transition-all"
                            />
                            <input
                              type="text"
                              name="province"
                              autoComplete="address-level1"
                              placeholder="Province"
                              value={province}
                              onChange={(e) => setProvince(e.target.value)}
                              required
                              className="col-span-1 w-full border border-gray-200 rounded-md px-4 py-4 text-sm focus:ring-2 focus:ring-black focus:outline-none transition-all"
                            />
                            <input
                              type="text"
                              name="postal"
                              autoComplete="postal-code"
                              inputMode="numeric"
                              placeholder="Postal code"
                              value={postalCode}
                              onChange={(e) => setPostalCode(e.target.value)}
                              required
                              className="col-span-1 w-full border border-gray-200 rounded-md px-4 py-4 text-sm focus:ring-2 focus:ring-black focus:outline-none transition-all"
                            />
    </div>

                          <input
                            type="tel"
                            name="tel"
                            autoComplete="tel"
                            placeholder="Phone number"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            required
                            className="w-full border border-gray-200 rounded-md px-4 py-4 text-sm focus:ring-2 focus:ring-black focus:outline-none transition-all"
                          />
                            {/* Shipping Rate Selector — Standard & International */}
                          {(deliveryMethod === 'standard' || deliveryMethod === 'international') && (
                            <div className="mt-4">
                              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2 block">
                                {deliveryMethod === 'international' ? 'International Shipping Service' : 'Shipping Service'}
                              </label>
                              {deliveryMethod === 'international' && (
                                <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-md">
                                  <p className="text-[10px] text-amber-700 font-medium uppercase tracking-wider">
                                    ⚠️ Customs & import duties are the buyer's responsibility (DDU — Delivered Duty Unpaid).
                                  </p>
    </div>
                              )}
                              {loadingRates ? (
                                <div className="flex items-center gap-2 py-4 text-sm text-gray-400">
                                  <Loader2 className="animate-spin" size={16} /> Fetching live rates...
    </div>
                              ) : shippingRates.length > 0 ? (
                                <div className="space-y-2">
                                  {shippingRates.map((rate: any, idx: number) => (
                                    <button
                                      key={idx}
                                      type="button"
                                      onClick={() => setSelectedRate(rate)}
                                      className={`w-full flex items-center justify-between p-3 rounded-md border text-left transition-all ${
                                        selectedRate === rate
                                          ? 'border-black bg-gray-50 shadow-sm'
                                          : 'border-gray-200 hover:border-gray-300'
                                      }`}
                                    >
                                      <div>
                                        <p className="text-sm font-semibold">{rate.serviceLevel?.name || rate.serviceLevel}</p>
                                        <p className="text-[10px] text-gray-400">
                                          {rate.serviceLevel?.description || rate.carrier}
                                          {rate.serviceLevel?.delivery_date_from && (
                                            <> • Est. {new Date(rate.serviceLevel.delivery_date_from).toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' })}</>
                                          )}
                                        </p>
    </div>
                                      <span className="text-sm font-bold whitespace-nowrap">R{rate.amount?.toFixed(2)}</span>
                                    </button>
                                  ))}
    </div>
                              ) : address && city && province && postalCode ? (
                                <p className="text-xs text-gray-400 py-2">No rates available for this address</p>
                              ) : null}
    </div>
                          )}

                          {/* ── Bob Go Pickup Point Selector ───────────────── */}
                          {false && (/* bobgo removed */
                            <div className="mt-4 space-y-4">
                              <div>
                                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2 block">
                                  1. Choose a Bob Go Pickup Point
                                </label>
                                {loadingPickupPoints ? (
                                  <div className="flex items-center gap-2 py-4 text-sm text-gray-400">
                                    <Loader2 className="animate-spin" size={16} /> Finding nearby pickup points...
    </div>
                                ) : (
                                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                                    {pickupPoints.map((point) => (
                                      <button
                                        key={point.id}
                                        type="button"
                                        onClick={() => setSelectedPickupPoint(point)}
                                        className={`w-full text-left p-3 rounded-md border transition-all ${
                                          selectedPickupPoint?.id === point.id
                                            ? 'border-black bg-gray-50 shadow-sm'
                                            : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                      >
                                        <div className="flex items-start justify-between gap-2">
                                          <div className="min-w-0">
                                            <p className="text-sm font-semibold truncate">{String(point.name || '')}</p>
                                            <p className="text-[10px] text-gray-400 truncate">{String(point.address || '')}{point.suburb ? `, ${String(point.suburb)}` : ''}</p>
                                            {point.operating_hours && typeof point.operating_hours === 'string' && (
                                              <p className="text-[10px] text-gray-300 mt-0.5">{point.operating_hours}</p>
                                            )}
    </div>
                                          <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400 shrink-0 mt-0.5">
                                            {point.type === 'locker' ? '🔒 Locker' : '🏪 Counter'}
                                          </span>
    </div>
                                      </button>
                                    ))}
                                    {pickupPoints.length === 0 && (
                                      <p className="text-xs text-gray-400 py-2">No pickup points found near your area.</p>
                                    )}
    </div>
                                )}
    </div>

                              {/* Speed selector — only after pickup point chosen */}
                              {selectedPickupPoint && (
                                <div>
                                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2 block">
                                    2. Delivery Speed to Pickup Point
                                  </label>
                                  {loadingRates ? (
                                    <div className="flex items-center gap-2 py-2 text-sm text-gray-400">
                                      <Loader2 className="animate-spin" size={16} /> Fetching rates...
    </div>
                                  ) : shippingRates.length > 0 ? (
                                    <div className="space-y-2">
                                      {shippingRates.slice(0, 3).map((rate: any, idx: number) => (
                                        <button
                                          key={idx}
                                          type="button"
                                          onClick={() => setSelectedRate(rate)}
                                          className={`w-full flex items-center justify-between p-3 rounded-md border text-left transition-all ${
                                            selectedRate === rate
                                              ? 'border-black bg-gray-50 shadow-sm'
                                              : 'border-gray-200 hover:border-gray-300'
                                          }`}
                                        >
                                          <div>
                                            <p className="text-sm font-semibold">{rate.serviceLevel?.name || rate.serviceLevel}</p>
                                            <p className="text-[10px] text-gray-400">{rate.serviceLevel?.description || rate.carrier}</p>
    </div>
                                          <span className="text-sm font-bold whitespace-nowrap">R{rate.amount?.toFixed(2)}</span>
                                        </button>
                                      ))}
    </div>
                                  ) : (
                                    /* Flat-rate fallback until ShipLogic Bob Go rates are live */
                                    <button
                                      type="button"
                                      onClick={() => setSelectedRate({ amount: 89, serviceLevel: { name: 'Bob Go Standard', description: '3–5 business days to pickup point' } })}
                                      className={`w-full flex items-center justify-between p-3 rounded-md border text-left transition-all ${
                                        selectedRate ? 'border-black bg-gray-50 shadow-sm' : 'border-gray-200 hover:border-gray-300'
                                      }`}
                                    >
                                      <div>
                                        <p className="text-sm font-semibold">Bob Go Standard</p>
                                        <p className="text-[10px] text-gray-400">3–5 business days to pickup point</p>
    </div>
                                      <span className="text-sm font-bold">R89.00</span>
                                    </button>
                                  )}
    </div>
                              )}

                              {/* Selected summary */}
                              {selectedPickupPoint && selectedRate && (
                                <div className="p-3 bg-gray-50 border border-gray-100 rounded-md">
                                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Delivering to</p>
                                  <p className="text-sm font-semibold">{String(selectedPickupPoint?.name || '')}</p>
                                  <p className="text-[10px] text-gray-500">{String(selectedPickupPoint?.address || '')}{selectedPickupPoint?.suburb ? `, ${String(selectedPickupPoint?.suburb)}` : ''}</p>
    </div>
                              )}
    </div>
                          )}                        </>
                      ) : (
                        <div className="space-y-4">
                          <p className="text-xs text-gray-500 mb-2">Pickup your order directly from our studio in Midrand (No shipping fee).</p>
                          <div className="p-4 border border-gray-200 rounded-md bg-gray-50">
                            <p className="text-sm font-bold mb-1">IDEAS TO LIFE STUDIOS</p>
                            <p className="text-[10px] text-gray-500 uppercase tracking-widest">1104 Tugela Street, Klipfontein view, Midrand</p>
    </div>
                          <div className="grid grid-cols-2 gap-4">
                            <input
                              type="text"
                              placeholder="First name"
                              value={firstName}
                              onChange={(e) => setFirstName(e.target.value)}
                              required
                              className="w-full border border-gray-200 rounded-md px-4 py-3 text-sm focus:ring-2 focus:ring-black focus:outline-none transition-all"
                            />
                            <input
                              type="text"
                              placeholder="Last name"
                              value={lastName}
                              onChange={(e) => setLastName(e.target.value)}
                              required
                              className="w-full border border-gray-200 rounded-md px-4 py-3 text-sm focus:ring-2 focus:ring-black focus:outline-none transition-all"
                            />
    </div>
                          <input
                            type="tel"
                            placeholder="Phone number"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            required
                            className="w-full border border-gray-200 rounded-md px-4 py-3 text-sm focus:ring-2 focus:ring-black focus:outline-none transition-all"
                          />
    </div>
                      )}
    </div>
                  </section>

                  {/* Payment */}
                  <section>
                    <h3 className="text-lg md:text-xl font-bold tracking-tight mb-4">Payment Method</h3>
                    <div className="space-y-3">
                      <div
                        className="w-full p-4 border border-black bg-gray-50 rounded-md flex items-center justify-between transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <img src={PAYMENT_LOGOS.yoco} alt="Yoco" className="h-6 object-contain" referrerPolicy="no-referrer" />
                          <span className="text-sm font-medium">Yoco Secure Checkout</span>
    </div>
                        <div className="flex gap-2">
                          <img src={PAYMENT_LOGOS.visa} alt="Visa" className="h-4 object-contain" referrerPolicy="no-referrer" />
                          <img src={PAYMENT_LOGOS.mastercard} alt="Mastercard" className="h-5 object-contain" referrerPolicy="no-referrer" />
    </div>
    </div>
    </div>

                    <p className="text-[10px] text-gray-400 mt-4 text-center uppercase tracking-widest">All transactions are secure and encrypted.</p>
                    <p className="text-[10px] text-gray-400 mt-4 text-center uppercase tracking-widest">
                      By placing an order, you agree to our <Link href="/legal" className="underline font-bold text-black">Terms & Conditions</Link>.
                    </p>
                  </section>

                  <div className="space-y-4">
                    {paymentError && (
                      <p className="text-xs text-red-500 font-medium text-center">{paymentError}</p>
                    )}
                    <button
                      onClick={handleFinalize}
                      disabled={isPaying}
                      className="w-full py-5 md:py-6 bg-black text-white font-black uppercase tracking-[0.2em] rounded-md hover:opacity-90 transition-opacity flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                      {isPaying ? (
                        <>
                          <Loader2 className="animate-spin" size={20} /> Initializing...
                        </>
                      ) : (
                        <>
                          Pay R{finalTotal} with Yoco <ArrowRight size={20} />
                        </>
                      )}
                    </button>
    </div>
    </div>

                {/* Right Column: Summary */}
                <div className="bg-gray-50 p-6 md:p-12 space-y-6 md:space-y-8">
                  <div className="space-y-6 max-h-[300px] md:max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {cartItems.map((item) => (
                      <div key={`${item.id}-${item.selectedVariants ? JSON.stringify(item.selectedVariants) : ''}`} className="flex items-center gap-4">
                        <div className="relative flex-shrink-0">
                          <div className="w-12 h-12 md:w-16 md:h-16 bg-white border border-gray-200 rounded-md overflow-hidden">
                            <img src={item.image || undefined} alt={item.name} className="w-full h-full object-cover grayscale" referrerPolicy="no-referrer" />
    </div>
                          <span className="absolute -top-2 -right-2 w-5 h-5 bg-gray-500 text-white text-[10px] flex items-center justify-center rounded-full font-bold">
                            {item.quantity}
                          </span>
    </div>
                        <div className="flex-grow min-w-0">
                          <h4 className="text-xs md:text-sm font-bold leading-tight truncate">{item.name}</h4>
                          <p className="text-[8px] md:text-[10px] text-gray-500 uppercase tracking-widest truncate">{(item.categories || []).join(', ')}</p>
                          {item.selectedVariants && Object.keys(item.selectedVariants).length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {Object.entries(item.selectedVariants).map(([k, v]) => (
                                <span key={k} className="text-[7px] md:text-[8px] font-mono opacity-40 uppercase bg-black/5 px-1 rounded">
                                  {k}: {v}
                                </span>
                              ))}
    </div>
                          )}
    </div>
                        <span className="text-xs md:text-sm font-medium flex-shrink-0">{formatPrice(item.price * item.quantity)}</span>
    </div>
                    ))}
    </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Discount code"
                      value={discountCode}
                      onChange={(e) => setDiscountCode(e.target.value)}
                      className="flex-grow border border-gray-200 rounded-md px-3 md:px-4 py-3 text-xs md:text-sm focus:ring-2 focus:ring-black focus:outline-none transition-all bg-white"
                    />
                    <button className="px-4 md:px-6 bg-gray-200 text-gray-500 font-bold text-xs md:text-sm rounded-md hover:bg-gray-300 transition-colors">
                      Apply
                    </button>
    </div>

                  <div className="space-y-3 pt-4 border-t border-gray-200">
                    <div className="flex justify-between text-xs md:text-sm">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-medium">{formatPrice(subtotal)}</span>
    </div>
                    <div className="flex justify-between text-xs md:text-sm">
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1 text-gray-600">
                          Shipping <Info size={12} className="opacity-50" />
    </div>
                        {selectedRate?.serviceLevel?.name && deliveryMethod === 'standard' && (
                          <span className="text-[10px] text-gray-400">{selectedRate.serviceLevel.name}</span>
                        )}
    </div>
                      <span className="text-gray-500">
                        {loadingRates ? '...' : shippingCost === 0 ? 'Free' : formatPrice(shippingCost)}
                      </span>
    </div>

                    <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                      <span className="text-base md:text-lg font-bold">Total</span>
                      <div className="flex items-baseline gap-2">
                        <span className="text-[10px] md:text-xs text-gray-500">ZAR</span>
                        <span className="text-xl md:text-2xl font-black">{formatPrice(finalTotal)}</span>
    </div>
    </div>
    </div>
    </div>

    </div>
    </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default HybridCheckoutModal;
