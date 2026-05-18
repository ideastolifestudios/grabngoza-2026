import InstagramFeed from './components/InstagramFeed.tsx';
// import SupportChat from "./components/SupportChat";
// import './sentryClient';
// import AdminDashboard from './components/admin/AdminDashboard';
// import ReturnRequestPage from './pages/ReturnRequestPage';
// import HowToOrderPage from './pages/HowToOrderPage';
// import { isOrderReturnable } from './services/returnService';
import React, { useState, useEffect, useRef, useMemo, Component } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useParams, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShoppingBag,
  ShoppingCart,
  Zap,
  MessageSquare,
  Instagram,
  ArrowRight,
  X,
  Check,
  CheckCircle2,
  Truck,
  CreditCard,
  Facebook,
  Phone,
  MapPin,
  Menu,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Heart,
  Plus,
  Minus,
  Trash2,
  Mail,
  Send,
  Loader2,
  Info,
  HelpCircle,
  Star,
  RotateCcw,
  User as UserIcon,
  LogOut,
  Settings,
  Clock,
  Package,
  AlertCircle,
  AlertTriangle,
  Activity,
  ShieldAlert,
  RefreshCw,
  Search,
  Edit3,
  Database,
  Upload,
  Filter,
  ExternalLink,
  Globe,
  Ruler,
  ShieldCheck,
  Shirt,
  Watch,
  Footprints,
  Grid,
  Sparkles,
  Tag
} from 'lucide-react';
import { Product, CartItem, User, Order, OrderStatus, ProductVariant, ShippingMethod, Category, Brand, Testimonial, Partner } from './types';

// Bob Go pickup point type — used in checkout state
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
  type: 'locker' | 'counter' | 'pudo';
}

// Fallback pickup points shown before Bob Go API is live
const BOBGO_FALLBACK_POINTS: BobGoPickupPoint[] = [
  { id: 'bg-jnb-001', name: 'PUDO Locker – Sandton City', address: 'Shop L23, Sandton City Mall, 83 Rivonia Rd', suburb: 'Sandton', city: 'Johannesburg', province: 'Gauteng', postal_code: '2196', lat: -26.1076, lng: 28.0567, operating_hours: 'Mon–Sat 09:00–21:00, Sun 10:00–19:00', type: 'locker' },
  { id: 'bg-jnb-002', name: 'PUDO Counter – Rosebank Mall', address: 'Shop 14, The Zone @ Rosebank, Oxford Rd', suburb: 'Rosebank', city: 'Johannesburg', province: 'Gauteng', postal_code: '2196', lat: -26.1453, lng: 28.044, operating_hours: 'Mon–Sun 09:00–20:00', type: 'counter' },
  { id: 'bg-cpt-001', name: 'PUDO Locker – V&A Waterfront', address: 'Ground Floor, Victoria Wharf', suburb: 'Waterfront', city: 'Cape Town', province: 'Western Cape', postal_code: '8001', lat: -33.9025, lng: 18.4199, operating_hours: 'Mon–Sun 09:00–21:00', type: 'locker' },
  { id: 'bg-cpt-002', name: 'PUDO Counter – Cavendish Square', address: 'Lower Ground, Cavendish Square, Dreyer St', suburb: 'Claremont', city: 'Cape Town', province: 'Western Cape', postal_code: '7708', lat: -33.9821, lng: 18.4692, operating_hours: 'Mon–Sat 09:00–19:00', type: 'counter' },
  { id: 'bg-dbn-001', name: 'PUDO Locker – Gateway', address: 'Upper Level, Gateway Theatre, 1 Palm Blvd', suburb: 'Umhlanga', city: 'Durban', province: 'KwaZulu-Natal', postal_code: '4319', lat: -29.7298, lng: 31.0723, operating_hours: 'Mon–Sat 09:00–21:00', type: 'locker' },
  { id: 'bg-pta-001', name: 'PUDO Counter – Menlyn Park', address: 'Menlyn Park Shopping Centre, Atterbury Rd', suburb: 'Menlyn', city: 'Pretoria', province: 'Gauteng', postal_code: '0181', lat: -25.7836, lng: 28.277, operating_hours: 'Mon–Sat 09:00–21:00', type: 'counter' },
];

import {
  productService,
  orderService,
  authService,
  supportService,
  categoryService,
  brandService,
  testimonialService,
  partnerService
} from './services/api';
import { emailService } from './services/emailService';
import SEO from './components/SEO';
import { auth, googleProvider, facebookProvider } from './firebase';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';

// --- Constants & Utils ---

class ErrorBoundary extends Component<any, any> {
  constructor(props: any) {
    super(props);
    (this as any).state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error('Uncaught error:', error, errorInfo);
    let displayError = error.message;
    try {
      const parsed = JSON.parse(error.message);
      if (parsed.error) {
        displayError = `Firestore Error: ${parsed.error} (${parsed.operationType} on ${parsed.path})`;
      }
    } catch (e) {}
    (this as any).setState({ error, errorInfo: displayError });
  }

  handleReset = () => {
    (this as any).setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  render() {
    if ((this as any).state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-white p-6 text-black">
          <div className="max-w-md w-full text-center space-y-6">
            <div className="flex justify-center">
              <div className="p-4 bg-red-50 rounded-full">
                <AlertCircle className="text-red-600" size={48} />
    </div>
    </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-display font-bold uppercase tracking-tighter">Something went wrong</h1>
              <p className="text-gray-500 text-sm">
                {(this as any).state.errorInfo || (this as any).state.error?.message || 'An unexpected error occurred.'}
              </p>
    </div>
            <div className="pt-4">
              <button
                onClick={this.handleReset}
                className="inline-flex items-center gap-2 px-8 py-3 bg-black text-white text-xs font-black uppercase tracking-widest hover:bg-black/80 transition-all active:scale-95"
              >
                <RefreshCw size={16} />
                Reload Application
              </button>
    </div>
    </div>
    </div>
      );
    }
    return (this as any).props.children;
  }
}

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

const Highlight = ({ text, query }: { text: string; query: string }) => {
  if (!query.trim()) return <span>{text}</span>;

  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
  return (
    <span>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} className="bg-yellow-200 text-black px-0.5 rounded-sm font-bold">{part}</mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
};

const formatPrice = (amount: number) => {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// --- Components ---

const Toast = ({ message, type = 'success', onClose }: { message: string, type?: 'success' | 'error', onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-8 inset-x-0 flex items-center justify-center z-[500] pointer-events-none p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="pointer-events-auto"
      >
        <div className={`px-5 py-2.5 rounded-full shadow-[0_15px_30px_-5px_rgba(0,0,0,0.3)] flex items-center gap-3 bg-black text-white border border-white/10`}>
          {type === 'success' ? <CheckCircle2 size={12} className="text-white" /> : <AlertCircle size={12} className="text-white" />}
          <span className="text-[8px] md:text-[9px] font-black uppercase tracking-[0.2em] whitespace-nowrap">{message}</span>
          <button onClick={onClose} className="ml-1 hover:opacity-50 transition-opacity">
            <X size={10} />
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const WishlistDrawer = ({
  isOpen,
  onClose,
  wishlist,
  products,
  onAddToCart,
  onToggleWishlist
}: {
  isOpen: boolean,
  onClose: () => void,
  wishlist: string[],
  products: Product[],
  onAddToCart: (p: Product) => void,
  onToggleWishlist: (id: string) => void
}) => {
  const wishlistItems = products.filter(p => wishlist.includes(p.id));

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[150]"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-full md:w-[450px] bg-white z-[160] flex flex-col shadow-2xl"
          >
            <div className="p-6 md:p-8 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Heart size={20} className="text-red-500" fill="currentColor" />
                <h2 className="text-xl font-display font-bold uppercase tracking-tighter">My Wishlist</h2>
    </div>
              <button onClick={onClose} className="p-2 hover:bg-gray-50 rounded-full transition-colors">
                <X size={24} />
              </button>
    </div>

            <div className="flex-grow overflow-y-auto p-6 md:p-8 custom-scrollbar">
              {wishlistItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-30">
                  <Heart size={48} />
                  <p className="text-[10px] font-black uppercase tracking-widest">Your wishlist is empty</p>
    </div>
              ) : (
                <div className="space-y-6">
                  {wishlistItems.map((item) => (
                    <div key={item.id} className="flex gap-4 group">
                      <div className="w-24 h-32 bg-gray-50 rounded-lg overflow-hidden flex-shrink-0">
                        <img src={item.image} alt={item.name} loading="lazy"
                        className="w-full h-full object-cover" referrerPolicy="no-referrer" />
    </div>
                      <div className="flex-grow flex flex-col justify-between py-1">
                        <div>
                          <h3 className="text-[10px] font-black uppercase tracking-widest mb-1">{item.name}</h3>
                          <p className="text-[10px] font-bold text-gray-400">{formatPrice(item.price)}</p>
    </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => onAddToCart(item)}
                            className="flex-grow py-2 bg-black text-white text-[8px] font-black uppercase tracking-widest hover:bg-zinc-800 transition-colors"
                          >
                            Add to Cart
                          </button>
                          <button
                            onClick={() => onToggleWishlist(item.id)}
                            className="p-2 border border-gray-100 hover:bg-red-50 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
    </div>
    </div>
    </div>
                  ))}
    </div>
              )}
    </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

const WelcomePopup = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');

  useEffect(() => {
    const hasSeenPopup = localStorage.getItem('grab-go-welcome-popup');
    if (!hasSeenPopup) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem('grab-go-welcome-popup', 'true');
  };

  const handleClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      try {
        await supportService.subscribeNewsletter(email);
        handleClose();
      } catch (err) {
        console.error("Popup subscription error:", err);
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-lg bg-white overflow-hidden shadow-2xl rounded-sm max-h-[90vh] overflow-y-auto"
          >
            {/* Top accent line */}
            <div className="h-1 w-full bg-[#18A374]" />

            <button
              onClick={handleClose}
              className="absolute top-4 right-4 z-10 p-2 hover:bg-black/5 rounded-full transition-colors text-black"
            >
              <X size={20} />
            </button>

            <div className="p-8 md:p-10">
              {/* Warm greeting */}
              <h2 className="text-3xl md:text-4xl font-black tracking-tight text-black mb-2">
                What's good!
              </h2>
              <p className="text-sm text-gray-500 leading-relaxed mb-8">
                Welcome to Grab & Go — premium streetwear, curated drops, and a community
                that moves different. We're glad you're here.
              </p>

              {/* Perks grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Sparkles size={14} className="text-black" />
    </div>
                  <div>
                    <p className="text-xs font-bold text-black uppercase tracking-wider">Exclusive Drops</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">First access to limited releases.</p>
    </div>
    </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Truck size={14} className="text-black" />
    </div>
                  <div>
                    <p className="text-xs font-bold text-black uppercase tracking-wider">Free Delivery</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">On orders over R1,000.</p>
    </div>
    </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Tag size={14} className="text-black" />
    </div>
                  <div>
                    <p className="text-xs font-bold text-black uppercase tracking-wider">10% Off First Order</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">A welcome gift from us to you.</p>
    </div>
    </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <ShieldCheck size={14} className="text-black" />
    </div>
                  <div>
                    <p className="text-xs font-bold text-black uppercase tracking-wider">Secure Checkout</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">Powered by Yoco. Safe & easy.</p>
    </div>
    </div>
    </div>

              {/* Email form */}
              <form onSubmit={handleClaim} className="space-y-3">
                <input
                  type="email"
                  placeholder="Drop your email..."
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-gray-200 px-4 py-3.5 text-sm focus:ring-2 focus:ring-black focus:border-black focus:outline-none transition-all rounded-sm"
                />
                <button
                  type="submit"
                  className="w-full py-3.5 bg-[#06402B] text-white text-xs font-bold uppercase tracking-widest rounded-sm hover:bg-[#06402B]/90 transition-colors"
                >
                  Start Shopping
                </button>
              </form>

              <button
                onClick={handleClose}
                className="mt-4 w-full text-center text-[10px] font-semibold uppercase tracking-widest text-gray-400 hover:text-black transition-colors py-2"
              >
                Just browsing for now
              </button>

              <p className="mt-4 text-[8px] text-gray-300 leading-tight text-center">
                You are signing up to receive communications via email and can unsubscribe at any time.
              </p>
    </div>
          </motion.div>
    </div>
      )}
    </AnimatePresence>
  );
};

const Logo = ({ className = "h-8 w-auto", light = false, dark = false }: { className?: string, light?: boolean, dark?: boolean }) => {
  const [error, setError] = useState(false);

  if (error) {
    return (
      <span className={`font-semibold uppercase tracking-tight ${light ? 'text-white' : 'text-black'} text-sm md:text-base whitespace-nowrap ${className}`}>
        Grab & Go
      </span>
    );
  }

  const filterClass = light ? 'brightness-0 invert' : dark ? 'brightness-0' : '';

  return (
    <img
      src="https://res.cloudinary.com/dggitwduo/image/upload/v1776937297/GRAB_GO_WEB_LOGO_thq4su.png"
      alt="Grab & Go"
      className={`${className} object-contain ${filterClass}`}
      onError={() => setError(true)}
      referrerPolicy="no-referrer"
    />
  );
};

const HowToOrderDrawer = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-y-0 right-0 w-full md:w-[500px] bg-white z-[100] shadow-2xl flex flex-col"
    >
      <div className="p-6 md:p-10 border-b border-gray-100 flex items-center justify-between">
        <h2 className="text-2xl font-display font-bold uppercase tracking-tighter">How to Order</h2>
        <button onClick={onClose} className="p-2 hover:bg-gray-50 rounded-full transition-colors">
          <X size={24} />
        </button>
    </div>

      <div className="flex-grow overflow-y-auto p-6 md:p-10 custom-scrollbar">
        <div className="prose prose-sm max-w-none space-y-10">
          <section className="space-y-4">
            <h3 className="text-lg font-black uppercase tracking-widest border-b-2 border-black pb-2 inline-block">1. Browse & Select</h3>
            <p className="text-gray-600 leading-relaxed">
              Explore our curated collections of premium streetwear and limited drops. Use the category filters and search bar to find exactly what you're looking for.
            </p>
            <ul className="list-disc pl-5 space-y-2 text-gray-500">
              <li>Select your size and color variants carefully.</li>
              <li>Check the product description for specific fit details.</li>
              <li>Add items to your cart to begin the checkout process.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h3 className="text-lg font-black uppercase tracking-widest border-b-2 border-black pb-2 inline-block">2. Secure Checkout</h3>
            <p className="text-gray-600 leading-relaxed">
              Once you're ready, click the shopping cart icon to review your cart and proceed to checkout. We offer multiple secure payment options via Yoco:
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                <span className="text-[10px] font-black uppercase tracking-widest block mb-2">Cards</span>
                <p className="text-[10px] text-gray-400">Visa, Mastercard, American Express via secure gateway.</p>
    </div>
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                <span className="text-[10px] font-black uppercase tracking-widest block mb-2">Digital</span>
                <p className="text-[10px] text-gray-400">Apple Pay and Google Pay supported.</p>
    </div>
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                <span className="text-[10px] font-black uppercase tracking-widest block mb-1">EFT</span>
                <p className="text-[10px] text-gray-400">Direct Bank Transfer (EFT) available on request.</p>
    </div>
    </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-lg font-black uppercase tracking-widest border-b-2 border-black pb-2 inline-block">3. Shipping & Delivery</h3>
            <p className="text-gray-600 leading-relaxed">
              We ship nationwide across South Africa using premium courier services.
            </p>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-[10px] font-bold uppercase tracking-widest">Standard Shipping</span>
                <span className="text-[10px] font-black">R100 Flat Fee</span>
    </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-[10px] font-bold uppercase tracking-widest">Free Shipping</span>
                <span className="text-[10px] font-black">Orders over R1500</span>
    </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-[10px] font-bold uppercase tracking-widest">Delivery Time</span>
                <span className="text-[10px] font-black">2-4 Business Days</span>
    </div>
    </div>
          </section>

          <section className="p-6 bg-black text-white rounded-xl space-y-4">
            <h3 className="text-sm font-black uppercase tracking-[0.3em]">Important Notes</h3>
            <ul className="text-[10px] space-y-2 opacity-80 list-disc pl-4">
              <li>Limited drops are restricted to one item per customer.</li>
              <li>Returns are accepted within 14 days of delivery (unworn/original packaging).</li>
              <li>Sale items are final and cannot be returned or exchanged.</li>
              <li>Address changes are not possible once an order is processed.</li>
            </ul>
          </section>

          <div className="pt-10 border-t border-gray-100 text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4">Need help?</p>
            <div className="flex justify-center gap-6">
              <a href="mailto:support@grabandgo.co.za" className="text-[10px] font-black uppercase tracking-widest hover:underline">Email Support</a>
              <a href="tel:+27123456789" className="text-[10px] font-black uppercase tracking-widest hover:underline">Call Us</a>
    </div>
    </div>
    </div>
    </div>
    </motion.div>
  );
};



const CategoryBar = ({ categories = [] }: { categories?: Category[] }) => {
  const location = useLocation();
  const topCats = categories.filter(c => !c.parentId);

  if (topCats.length === 0) return null;

  return (
    <div className="bg-white border-b border-gray-100">
      <div className="max-w-[1800px] mx-auto overflow-hidden">
        <nav className="flex items-center justify-center gap-6 px-6 py-4 overflow-x-auto scrollbar-hide">
          <Link
            to="/"
            className={`flex-shrink-0 text-[10px] font-bold uppercase tracking-[0.2em] transition-all pb-1 border-b-2 ${
              location.pathname === '/'
                ? 'border-[#06402B] text-black'
                : 'border-transparent text-gray-400 hover:text-black'
            }`}
          >
            All
          </Link>
          {topCats.slice(0, 10).map(cat => {
            const isActive = location.pathname === `/category/${encodeURIComponent(cat.name.toLowerCase())}`;
            return (
              <Link
                key={cat.id}
                to={`/category/${encodeURIComponent(cat.name.toLowerCase())}`}
                className={`flex-shrink-0 text-[10px] font-bold uppercase tracking-[0.2em] transition-all pb-1 border-b-2 whitespace-nowrap ${
                  isActive
                    ? 'border-[#06402B] text-black'
                    : 'border-transparent text-gray-400 hover:text-black'
                }`}
              >
                {cat.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

const FreeDeliveryBar = ({ cartTotal }: { cartTotal: number }) => {
  const FREE_DELIVERY_THRESHOLD = 1000;
  const remaining = Math.max(0, FREE_DELIVERY_THRESHOLD - cartTotal);

  return (
    <div className="bg-[#000000] py-1.5 px-4 text-center">
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-3">
        <div className="flex items-center gap-2">
          {remaining > 0 ? (
            <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-white/80">
              Free delivery on all orders over <span className="text-white">R1000</span>
            </p>
          ) : (
            <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-[#18A374]">
              You qualify for <span className="text-white">Free Delivery!</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

const Header = ({
  cartCount,
  cartTotal,
  onOpenCart,
  onOpenWishlist,
  onOpenOrders,
  onOpenProducts,
  onOpenMenu,
  user,
  onOpenAuth,
  onLogout,
  searchQuery,
  setSearchQuery,
  products,
  onOpenHowToOrder,
  categories = []
}: {
  cartCount: number,
  cartTotal: number,
  onOpenCart: () => void,
  onOpenWishlist: () => void,
  onOpenOrders: () => void,
  onOpenProducts: () => void,
  onOpenMenu: () => void,
  user: User | null,
  onOpenAuth: () => void,
  onLogout: () => void,
  searchQuery: string,
  setSearchQuery: (q: string) => void,
  products: Product[],
  onOpenHowToOrder: () => void,
  categories?: Category[]
}) => {
  const [scrolled, setScrolled] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const debouncedSearch = useDebounce(localSearch, 300);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [megaMenuOpen, setMegaMenuOpen] = useState<string | null>(null);
  const megaMenuTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavEnter = (id: string) => {
    if (megaMenuTimer.current) clearTimeout(megaMenuTimer.current);
    setMegaMenuOpen(id);
  };
  const handleNavLeave = () => {
    megaMenuTimer.current = setTimeout(() => setMegaMenuOpen(null), 150);
  };

  const topCats = categories.filter(c => !c.parentId);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setScrolled(currentScrollY > 100);
      
      // Hide on scroll down, show on scroll up
      if (currentScrollY > lastScrollY && currentScrollY > 150) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  useEffect(() => {
    setSearchQuery(debouncedSearch);
  }, [debouncedSearch, setSearchQuery]);

  useEffect(() => {
    setLocalSearch(searchQuery);
  }, [searchQuery]);

  const suggestions = useMemo(() => {
    if (!localSearch.trim()) return [];
    return products
      .filter(p =>
        p.name.toLowerCase().includes(localSearch.toLowerCase()) ||
        (p.categories || []).some(c => c.toLowerCase().includes(localSearch.toLowerCase())) ||
        p.brand?.toLowerCase().includes(localSearch.toLowerCase())
      )
      .slice(0, 5);
  }, [products, localSearch]);

  return (
    <>
      <motion.header
        initial={false}
        animate={{
          opacity: isVisible ? 1 : 0,
          pointerEvents: isVisible ? 'auto' : 'none',
          backgroundColor: scrolled ? 'rgba(6, 64, 43, 0.95)' : 'rgba(0, 0, 0, 0)',
          backdropFilter: scrolled ? 'blur(12px)' : 'blur(0px)',
          borderBottomColor: scrolled ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0)'
        }}
        transition={{ 
          duration: 0.5, 
          ease: [0.16, 1, 0.3, 1]
        }}
        className="fixed top-0 left-0 right-0 z-50 border-b transition-all flex flex-col"
      >
        <FreeDeliveryBar cartTotal={cartTotal} />

        <div className={`max-w-[1800px] w-full mx-auto px-6 md:px-10 flex items-center justify-between transition-all duration-500 ${scrolled ? 'py-2.5' : 'py-5 md:py-7'}`}>
          
          {/* Left: Logo */}
          <div className="flex-shrink-0 lg:w-1/4">
            <Link to="/" className="block group">
              <Logo className="h-6 md:h-9 transition-all duration-500 group-hover:scale-105" light />
            </Link>
          </div>

          {/* Middle: Cinematic Nav Links */}
          <nav className="hidden lg:flex items-center justify-center gap-10 flex-1">
            {['BUNDLES', 'NEW ARRIVALS', 'APPAREL', 'ACCESSORIES', 'FOOTWEAR'].map((item) => (
              <Link
                key={item}
                to={item === 'BUNDLES' ? '/bundles' : `/category/${item.toLowerCase().replace(' ', '-')}`}
                className="text-[11px] font-bold uppercase tracking-[0.3em] text-white hover:text-[#18A374] transition-colors"
              >
                {item}
              </Link>
            ))}
          </nav>

          {/* Right: Thin Icons Bundle */}
          <div className="flex items-center justify-end gap-1.5 md:gap-5 lg:w-1/4">
            <button className="p-2 text-white/90 hover:text-[#18A374] transition-colors hidden sm:block">
              <MapPin size={20} strokeWidth={1.2} />
            </button>
            <button 
              onClick={onOpenAuth}
              className="p-2 text-white/90 hover:text-[#18A374] transition-colors hidden sm:block"
            >
              <UserIcon size={20} strokeWidth={1.2} />
            </button>
            <button className="p-2 text-white/90 hover:text-[#18A374] transition-colors">
              <Search size={20} strokeWidth={1.2} />
            </button>
            <button 
              onClick={onOpenCart}
              className="relative p-2 text-white/90 hover:text-[#18A374] transition-colors group"
            >
              <ShoppingCart size={20} strokeWidth={1.2} />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#18A374] text-black text-[9px] font-black flex items-center justify-center rounded-full group-hover:scale-110 transition-transform">
                  {cartCount}
                </span>
              )}
            </button>
            <button onClick={onOpenMenu} className="lg:hidden p-2 text-white/90">
              <Menu size={24} strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </motion.header>
      <CategoryBar categories={categories} />
    </>
  );
};

const Sidebar = ({
  isOpen,
  onClose,
  onOpenOrders,
  onOpenAuth,
  onOpenWishlist,
  onLogout,
  onOpenCart,
  onOpenProducts,
  cartCount,
  user,
  partners = [],
  searchQuery,
  setSearchQuery,
  setFilterCategory,
  categories = []
}: {
  isOpen: boolean,
  onClose: () => void,
  onOpenOrders: () => void,
  onOpenAuth: () => void,
  onOpenWishlist: () => void,
  onLogout: () => void,
  onOpenCart: () => void,
  onOpenProducts: () => void,
  cartCount: number,
  user: User | null,
  partners?: Partner[],
  searchQuery: string,
  setSearchQuery: (q: string) => void,
  setFilterCategory: (c: string) => void,
  categories?: Category[]
}) => {

  const navigate = useNavigate();
  const location = useLocation();
  const [isShopOpen, setIsShopOpen] = useState(true);

  // Use live categories from Firestore, fallback to defaults
  const navLinks = (categories && categories.length > 0)
    ? [{ name: 'All Products', filter: 'All' }, ...categories.filter(c => !c.parentId).map(c => ({ name: c.name, filter: c.name }))]
    : [
        { name: 'All Products', filter: 'All' },
        { name: 'New Arrivals', filter: 'New' },
        { name: 'Men', filter: 'Men' },
        { name: 'Women', filter: 'Women' },
        { name: 'Kids', filter: 'Kids' },
        { name: 'Sport', filter: 'Sport' },
        { name: 'Accessories', filter: 'Accessories' }
      ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[180]"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-sm bg-white text-black z-[190] flex flex-col shadow-2xl"
          >
            {/* Header: Logo and Close */}
            <div className="p-6 flex justify-between items-center border-b border-gray-50">
              <Logo className="w-[170px] h-[65px]" dark />
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X size={24} className="text-black" />
              </button>
    </div>

            <nav className="flex-grow overflow-y-auto px-8 custom-scrollbar space-y-10 pb-12 pt-6">
              {/* Search Bar */}
              <div className="relative group">
                <Search className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-black transition-colors" size={18} />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent border-b border-gray-100 focus:border-black py-4 pl-8 text-sm font-bold placeholder:text-gray-300 outline-none transition-all"
                />
    </div>

              {/* Main Navigation */}
              <div className="flex flex-col">
                {/* Shop Dropdown */}
                <div className="border-b border-gray-50 last:border-0 mb-2">
                  <button
                    onClick={() => setIsShopOpen(!isShopOpen)}
                    className="w-full py-4 flex items-center justify-between text-2xl font-bold tracking-tight hover:opacity-100 transition-all"
                  >
                    <span>Shop</span>
                    <ChevronDown size={20} className={`text-gray-300 transition-transform duration-300 ${isShopOpen ? 'rotate-180 text-black' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {isShopOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden flex flex-col pl-4 pb-4"
                      >
                        {navLinks.map((link) => (
                          <button
                            key={link.name}
                            onClick={() => {
                              onClose();
                              if (link.filter === 'All') {
                                navigate('/');
                              } else {
                                navigate(`/category/${encodeURIComponent(link.filter.toLowerCase())}`);
                              }
                            }}
                            className={`group py-3 flex items-center justify-between text-lg font-medium transition-all ${
                              (location.pathname === `/category/${encodeURIComponent(link.filter.toLowerCase())}` ||
                               (link.filter === 'All' && location.pathname === '/'))
                                ? 'text-black font-bold' : 'text-gray-500 hover:text-black'
                            }`}
                          >
                            <span>{link.name}</span>
                            <ChevronRight size={16} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
    </div>

    </div>

              {/* Membership / Account */}
              <div className="pt-4">
                {!user ? (
                  <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100 space-y-6">
                    <p className="text-xs text-gray-500 font-medium leading-relaxed">
                      Become a G&G Member for the best products and inspiration.
                    </p>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => { onClose(); onOpenAuth(); }}
                        className="flex-1 py-3 bg-black text-white text-[9px] font-bold uppercase tracking-widest rounded-full hover:shadow-lg transition-all"
                      >
                        Join Us
                      </button>
                      <button
                        onClick={() => { onClose(); onOpenAuth(); }}
                        className="flex-1 py-3 bg-white text-black text-[9px] font-bold uppercase tracking-widest rounded-full border border-gray-200 hover:border-black transition-all"
                      >
                        Sign In
                      </button>
    </div>
    </div>
                ) : (
                  <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-black text-white rounded-full flex items-center justify-center text-[11px] font-bold uppercase overflow-hidden border-2 border-white shadow-sm">
                        {user.photoURL ? (
                          <img src={user.photoURL} alt={user.firstName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          `${user.firstName[0]}${user.lastName[0]}`
                        )}
    </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold uppercase tracking-widest leading-none">{user.firstName} {user.lastName}</span>
                        <span className="text-[8px] opacity-40 uppercase tracking-widest mt-1">G&G Member</span>
    </div>
    </div>
                    <button
                      onClick={() => { onClose(); onLogout(); }}
                      className="p-2.5 hover:bg-gray-100 text-black rounded-full transition-colors border border-gray-100"
                      title="Logout"
                    >
                      <LogOut size={16} />
                    </button>
    </div>
                )}
    </div>

              {/* Quick Actions */}
              <div className="pt-6 space-y-5 pb-8 border-t border-gray-50">
                <button onClick={() => { onClose(); onOpenCart(); }} className="flex items-center gap-4 text-sm font-bold text-gray-500 hover:text-black transition-all">
                  <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center">
                    <ShoppingCart size={20} />
    </div>
                  <span>Cart ({cartCount})</span>
                </button>
                <button onClick={() => { onClose(); onOpenWishlist(); }} className="flex items-center gap-4 text-sm font-bold text-gray-500 hover:text-black transition-all">
                  <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center">
                    <Heart size={20} />
    </div>
                  <span>Wishlist</span>
                </button>
                <button onClick={() => { onClose(); onOpenOrders(); }} className="flex items-center gap-4 text-sm font-bold text-gray-500 hover:text-black transition-all">
                  <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center">
                    <Package size={20} />
    </div>
                  <span>Orders</span>
                </button>
                <button onClick={() => { onClose(); navigate('/faq'); }} className="flex items-center gap-4 text-sm font-bold text-gray-500 hover:text-black transition-all">
                  <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center">
                    <HelpCircle size={20} />
    </div>
                  <span>Support</span>
                </button>

  {user?.role === 'admin' && (
                  <>
                    <button onClick={() => { onClose(); onOpenProducts(); }} className="flex items-center gap-4 text-sm font-bold text-red-500 hover:text-red-700 transition-all">
                      <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center">
                        <Settings size={20} />
    </div>
                      <span>My Account</span>
                    </button>
                    <Link to="/admin" onClick={onClose} className="flex items-center gap-4 text-sm font-bold text-gray-500 hover:text-black transition-all" style={{ textDecoration: 'none' }}>
                      <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
                        <Truck size={20} style={{ color: '#3b82f6' }} />
    </div>
                      <span>Dispatch Dashboard</span>
                    </Link>
                  </>
                )}
    </div>
            </nav>

            <div className="mt-auto p-8 border-t border-gray-50 flex justify-between items-center bg-gray-50/50">
              <div className="flex gap-6 text-gray-300">
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:text-black transition-colors"><Instagram size={18} /></a>
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="hover:text-black transition-colors"><Facebook size={18} /></a>
    </div>
              <p className="text-[8px] font-mono uppercase tracking-widest opacity-20">© 2026 GRAB & GO</p>
    </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

const Hero = () => {
  const navigate = useNavigate();
  const [heroImgLoaded, setHeroImgLoaded] = React.useState(false);
  const heroSlides = [
    { 
      tagline: "New — 2026", 
      title: "Shop the Next Big Thing", 
      sub: "Premium streetwear, fresh drops & exclusive finds — curated for you.",
      img: "https://res.cloudinary.com/dggitwduo/image/upload/v1774452514/WhatsApp_Image_2026-03-25_at_17.25.44_zsxof4.jpg" 
    },
    { 
      tagline: "Just Dropped", 
      title: "Fresh Kicks", 
      sub: "Latest sneakers from the brands you love",
      img: "https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&q=80&w=2000"
    },
    { 
      tagline: "Limited Edition", 
      title: "Stand Out", 
      sub: "Exclusive drops you won't find anywhere else",
      img: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=2000"
    },
  ];
  const [currentSlide, setCurrentSlide] = useState(0);
  const slide = heroSlides[currentSlide];

  return (
    <section className="relative h-screen flex flex-col overflow-hidden bg-black">
      {/* Background Image Container */}
      <div className="absolute inset-0 z-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 1.5, ease: "circOut" }}
            className="absolute inset-0"
          >
            <img
              src={slide.img}
              alt={slide.title}
              className={`w-full h-full object-cover transition-opacity duration-1000 ${heroImgLoaded ? 'opacity-70' : 'opacity-0'}`}
              onLoad={() => setHeroImgLoaded(true)}
              referrerPolicy="no-referrer"
            />
          </motion.div>
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60" />
      </div>

      {/* Cinematic Content - Minimal */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 text-center pt-20">
        <motion.div
          key={`content-${currentSlide}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="max-w-4xl"
        >
          {/* Reference image is very clean, we keep text minimal or hidden if requested, but let's keep it elegant */}
          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white/40 mb-6">{slide.tagline}</p>
          <h1 className="text-5xl md:text-8xl font-display font-bold uppercase tracking-tighter text-white leading-none mb-4">
            {slide.title}
          </h1>
        </motion.div>
      </div>

      {/* Bottom Bar: Slide Indicators, Scroll Arrow, and Action Buttons */}
      <div className="relative z-20 w-full px-6 md:px-12 pb-12 flex items-end justify-between">
        
        {/* Pagination Dots */}
        <div className="flex gap-1.5 order-2 md:order-1">
          {heroSlides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`w-10 h-0.5 transition-all duration-700 ${idx === currentSlide ? 'bg-white' : 'bg-white/20'}`}
            />
          ))}
        </div>

        {/* Scroll Indicator Arrow */}
        <motion.div 
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute left-1/2 -translate-x-1/2 bottom-12 cursor-pointer flex flex-col items-center gap-2 group"
          onClick={() => document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' })}
        >
          <div className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center group-hover:bg-white/10 transition-colors">
            <ChevronDown size={20} className="text-white" />
          </div>
        </motion.div>

        {/* Bottom Right: Outlined Action Buttons */}
        <div className="flex items-center gap-4 order-1 md:order-3">
          <motion.button
            whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.1)' }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/category/shirts')}
            className="px-8 py-3 border border-white/40 text-[10px] font-black uppercase tracking-[0.3em] text-white transition-all"
          >
            Shop Shirts
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.1)' }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/category/shades')}
            className="px-8 py-3 border border-white/40 text-[10px] font-black uppercase tracking-[0.3em] text-white transition-all"
          >
            Shop Shades
          </motion.button>
        </div>

      </div>
    </section>
  );
};


const PAYMENT_LOGOS = {
  visa: "https://res.cloudinary.com/dggitwduo/image/upload/v1775882816/3840px-Visa_Inc._logo__282005_E2_80_932014_29.svg_l80vse.png",
  mastercard: "https://res.cloudinary.com/dggitwduo/image/upload/v1775882837/mastercard_r4oo9o.svg",
  applepay: "https://res.cloudinary.com/dggitwduo/image/upload/v1775882908/Apple_Pay_logo_mrpbqh.svg",
  googlepay: "https://upload.wikimedia.org/wikipedia/commons/f/f2/Google_Pay_Logo.svg",
  yoco: "https://res.cloudinary.com/dggitwduo/image/upload/v1775882870/yoco_ekl84d.svg"
};

const ProductDetailContent = ({
  product,
  allProducts,
  onAddToCart,
  onBuyNow,
  onEmailDetails,
  searchQuery = '',
  wishlist,
  onToggleWishlist,
  isCartLoading = false,
  categories = [],
  brands = []
}: {
  product: Product | null;
  allProducts: Product[];
  onAddToCart: (p: Product, variants?: Record<string, string>, quantity?: number) => void;
  onBuyNow: (p: Product, variants?: Record<string, string>) => void;
  onEmailDetails: (p: Product) => void;
  searchQuery?: string;
  wishlist: string[];
  onToggleWishlist: (productId: string) => void;
  isCartLoading?: boolean;
  categories?: Category[];
  brands?: Brand[];
}) => {
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);
  const navigate = useNavigate();
  const relatedScrollRef = useRef<HTMLDivElement>(null);
  const imageScrollRef = useRef<HTMLDivElement>(null);

  const scrollRelated = (direction: 'left' | 'right') => {
    if (relatedScrollRef.current) {
      const { scrollLeft, clientWidth } = relatedScrollRef.current;
      const scrollAmount = clientWidth * 0.8;
      const scrollTo = direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount;
      relatedScrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  // Recently viewed tracking
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>([]);

  useEffect(() => {
    if (product?.variants) {
      const initial: Record<string, string> = {};
      product.variants.forEach(v => {
        if (v.options.length > 0) initial[v.name] = v.options[0];
      });
      setSelectedVariants(initial);
    }
    setActiveImage(0);
    setQuantity(1);
    setOpenAccordion(null);
    window.scrollTo(0, 0);
  }, [product]);

  // Track recently viewed in localStorage
  useEffect(() => {
    if (!product) return;
    try {
      const stored = JSON.parse(localStorage.getItem('grab_go_recently_viewed') || '[]') as string[];
      const updated = [product.id, ...stored.filter(id => id !== product.id)].slice(0, 8);
      localStorage.setItem('grab_go_recently_viewed', JSON.stringify(updated));
      const viewed = updated.filter(id => id !== product.id).map(id => allProducts.find(p => p.id === id)).filter(Boolean) as Product[];
      setRecentlyViewed(viewed.slice(0, 6));
    } catch {}
  }, [product?.id]);

  // Scroll gallery to active image
  useEffect(() => {
    if (imageScrollRef.current) {
      imageScrollRef.current.scrollTo({ left: activeImage * imageScrollRef.current.clientWidth, behavior: 'smooth' });
    }
  }, [activeImage]);

  if (!product) return (
    <div className="min-h-screen flex items-center justify-center pt-24">
      <div className="text-center">
        <h2 className="text-xl font-bold uppercase mb-4">Product not found</h2>
        <Link to="/" className="text-[10px] font-bold uppercase tracking-widest underline">Back to shop</Link>
    </div>
    </div>
  );

  const allImages = [product.image, ...(product.images || [])];
  const discount = product.originalPrice ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0;

  const relatedProducts = allProducts
    .filter(p => p.id !== product.id && ((p.categories || []).some(c => (product.categories || []).includes(c)) || p.isDrop))
    .slice(0, 12);

  const toggleAccordion = (id: string) => {
    setOpenAccordion(openAccordion === id ? null : id);
  };

  const brandInfo = (brands || []).find(b => b.name === product.brand || b.id === product.brandId);

  return (
    <div className="pt-16 md:pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-6">
        {/* Back navigation */}
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 mb-6 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-black transition-colors group">
          <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Back
        </button>
        <div className="flex flex-col md:flex-row gap-8 lg:gap-12">
          {/* Left: Image Gallery */}
          <div className="w-full md:w-[55%] flex flex-col gap-6">
            {/* Breadcrumbs (Mobile) */}
            <div className="md:hidden">
              <Breadcrumbs
                categories={categories}
                product={product}
              />
    </div>

            <div className="relative aspect-[4/5] bg-gray-50 overflow-hidden group">
              <div ref={imageScrollRef} className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar h-full">
                {allImages.map((img, idx) => (
                  <div key={idx} className="min-w-full h-full snap-center">
                    <img
                      src={img || null}
                      alt={`${product.name} ${idx + 1}`}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
    </div>
                ))}
    </div>

              {allImages.length > 1 && (
                <>
                  <button
                    onClick={() => setActiveImage(prev => (prev === 0 ? allImages.length - 1 : prev - 1))}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white shadow-lg flex items-center justify-center rounded-full opacity-0 md:group-hover:opacity-100 transition-opacity hidden md:flex"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={() => setActiveImage(prev => (prev === allImages.length - 1 ? 0 : prev + 1))}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white shadow-lg flex items-center justify-center rounded-full opacity-0 md:group-hover:opacity-100 transition-opacity hidden md:flex"
                  >
                    <ChevronRight size={20} />
                  </button>
                </>
              )}

              {discount > 0 && (
                <div className="absolute bottom-6 left-6 px-3 py-1 bg-red-500 text-white text-[10px] font-black uppercase tracking-widest">
                  Sale
    </div>
              )}
    </div>

            <div className="flex gap-3 overflow-x-auto no-scrollbar">
              {allImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(idx)}
                  className={`w-20 aspect-[4/5] flex-shrink-0 border-2 transition-all ${activeImage === idx ? 'border-black' : 'border-transparent opacity-50 hover:opacity-100'}`}
                >
                  <img src={img || null} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </button>
              ))}
    </div>
    </div>

          {/* Right: Info */}
          <div className="w-full md:w-[45%] flex flex-col">
            {/* Breadcrumbs (Desktop) */}
            <div className="hidden md:block">
              <Breadcrumbs
                categories={categories}
                product={product}
              />
    </div>

            <div className="mb-4">
              {(() => {
                // Dynamic stock level for selected variants
                const currentStock = (() => {
                  if (!product.stock) return Infinity;
                  if (Object.keys(selectedVariants).length > 0) {
                    let min = Infinity;
                    for (const [k, v] of Object.entries(selectedVariants)) {
                      const key = `${k}:${v}`;
                      if (product.stock[key] !== undefined) min = Math.min(min, product.stock[key]);
                    }
                    return min;
                  }
                  return product.stock['_default'] ?? Infinity;
                })();
                const outOfStock = currentStock === 0;
                const lowStock   = currentStock > 0 && currentStock <= 5 && currentStock !== Infinity;
                return (
                  <>
                    {/* Out of stock banner */}
                    {outOfStock && (
                      <div className="mb-4 p-3 bg-red-50 border border-red-200 flex items-center gap-3">
                        <AlertCircle size={16} className="text-red-500 flex-shrink-0" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-red-600">
                          Out of Stock — {product.variants?.length ? 'Select a different size/colour' : 'Check back soon'}
                        </p>
    </div>
                    )}
                    {/* Low stock warning */}
                    {lowStock && (
                      <div className="mb-4 p-3 bg-amber-50 border border-amber-200 flex items-center gap-3">
                        <AlertTriangle size={16} className="text-amber-500 flex-shrink-0" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-amber-700">
                          Only {currentStock} left — order soon!
                        </p>
    </div>
                    )}
                  </>
                );
              })()}

              <h1 className="text-xl md:text-2xl font-bold uppercase tracking-tighter mb-1 leading-tight">{product.name}</h1>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-30 mb-6">{product.brand || 'Grab & Go'}</p>

              <div className="flex items-center gap-4 mb-4">
                <span className="text-xl font-bold">R {product.price.toFixed(2)}</span>
                {product.originalPrice && (
                  <>
                    <span className="text-base text-gray-400 line-through font-bold">R {product.originalPrice.toFixed(2)}</span>
                    <span className="text-red-500 font-bold text-xs">-{discount}%</span>
                  </>
                )}
    </div>
    </div>

            {/* Variants */}
            <div className="space-y-4 mb-6">
              {[...(product.variants || [])].sort((a, b) => {
                const aColor = a.name.toLowerCase() === 'color' || a.name.toLowerCase() === 'colour';
                const bColor = b.name.toLowerCase() === 'color' || b.name.toLowerCase() === 'colour';
                return aColor === bColor ? 0 : aColor ? -1 : 1;
              }).map(v => (
                <div key={v.id} className="space-y-4">
                  <div className="flex justify-between items-baseline">
                    <label className="text-[10px] font-black uppercase tracking-widest opacity-40">
                      {v.name} <span className="text-black font-black ml-2">{selectedVariants[v.name]}</span>
                    </label>
    </div>

                  <div className="flex flex-wrap gap-2">
                    {v.options.map(opt => {
                      const isColor = v.name.toLowerCase() === 'color' || v.name.toLowerCase() === 'colour';
                      return (
                        <button
                          key={opt}
                          onClick={() => setSelectedVariants(prev => ({ ...prev, [v.name]: opt }))}
                          className={`
                            min-w-[48px] h-12 flex items-center justify-center text-[10px] font-black uppercase border transition-all
                            ${selectedVariants[v.name] === opt
                              ? 'border-black bg-gray-50'
                              : 'border-gray-200 hover:border-black text-gray-400 hover:text-black'}
                            ${isColor ? 'w-12 rounded-full p-0.5' : 'px-4'}
                          `}
                        >
                          {isColor ? (
                            <div className="relative w-full h-full rounded-full" style={{ backgroundColor: opt.toLowerCase() }}>
                              {selectedVariants[v.name] === opt && <Check size={14} className="absolute inset-0 m-auto text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]" />}
    </div>
                          ) : opt}
                        </button>
                      );
                    })}
    </div>
    </div>
              ))}
    </div>

              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center border border-black p-1">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-3 py-1 hover:bg-black/5 transition-colors"><Minus size={12} /></button>
                  <span className="px-4 text-xs font-black">{quantity}</span>
                  <button onClick={() => setQuantity(quantity + 1)} className="px-3 py-1 hover:bg-black/5 transition-colors"><Plus size={12} /></button>
    </div>
                <div className="flex gap-4 text-[10px] font-black uppercase tracking-widest">
                  {(() => {
                    const s = (() => {
                      if (!product.stock) return Infinity;
                      if (Object.keys(selectedVariants).length > 0) {
                        let min = Infinity;
                        for (const [k, v] of Object.entries(selectedVariants)) {
                          const key = `${k}:${v}`;
                          if (product.stock[key] !== undefined) min = Math.min(min, product.stock[key]);
                        }
                        return min;
                      }
                      return product.stock['_default'] ?? Infinity;
                    })();
                    if (s === 0) return <span className="text-red-500 border-b-2 border-red-500 pb-1">Out of stock</span>;
                    if (s <= 5) return <span className="text-amber-600 border-b-2 border-amber-500 pb-1">{s} left</span>;
                    return <span className="text-green-600 border-b-2 border-green-600 pb-1">In stock</span>;
                  })()}
    </div>
    </div>

            {/* Actions */}
            {(() => {
              const currentStock = (() => {
                if (!product.stock) return Infinity;
                if (Object.keys(selectedVariants).length > 0) {
                  let min = Infinity;
                  for (const [k, v] of Object.entries(selectedVariants)) {
                    const key = `${k}:${v}`;
                    if (product.stock[key] !== undefined) min = Math.min(min, product.stock[key]);
                  }
                  return min;
                }
                return product.stock['_default'] ?? Infinity;
              })();
              const isOOS = currentStock === 0;
              return (
                <div className="space-y-3 mb-6">
                  <div className="flex gap-3">
                    <button
                      onClick={() => { if (!isOOS) onAddToCart(product, selectedVariants, quantity); }}
                      disabled={isCartLoading || isOOS}
                      className={`flex-1 h-14 font-black uppercase text-[11px] tracking-[0.3em] active:scale-[0.98] transition-all flex items-center justify-center gap-3 relative overflow-hidden ${
                        isOOS ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-[#06402B] text-white hover:bg-[#06402B]/90'
                      }`}
                    >
                      {isCartLoading ? (
                        <Loader2 className="animate-spin" size={20} />
                      ) : isOOS ? (
                        <>Out of Stock <AlertCircle size={16} /></>
                      ) : (
                        <>Add to cart <ShoppingBag size={16} /></>
                      )}
                    </button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => { if (product) onToggleWishlist(product.id); }}
                      className={`w-14 h-14 flex items-center justify-center rounded-none border-2 transition-all duration-300 ${
                        wishlist.includes(product?.id || '')
                          ? 'bg-black text-white border-black'
                          : 'border-black text-black hover:bg-black hover:text-white'
                      }`}
                      title={wishlist.includes(product?.id || '') ? "Remove from Wishlist" : "Add to Wishlist"}
                    >
                      <motion.div
                        animate={{ scale: wishlist.includes(product?.id || '') ? [1, 1.3, 1] : 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Heart size={20} fill={wishlist.includes(product?.id || '') ? "currentColor" : "none"} strokeWidth={2.5} />
                      </motion.div>
                    </motion.button>
    </div>
                  <button
                    onClick={() => { if (!isOOS) onBuyNow(product, selectedVariants); }}
                    disabled={isOOS}
                    className={`w-full h-14 border-2 border-[#06402B] text-[#06402B] font-black uppercase text-[11px] tracking-[0.3em] active:scale-[0.98] transition-all flex items-center justify-center gap-3 ${
                      isOOS ? 'border-gray-200 text-gray-300 cursor-not-allowed' : 'border-black text-black hover:bg-black hover:text-white'
                    }`}
                  >
                    Buy it now
                  </button>
    </div>
              );
            })()}

            {/* Mobile Sticky Bar */}
            <motion.div
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              className="fixed bottom-0 left-0 right-0 z-40 p-4 md:hidden bg-white/90 backdrop-blur-md border-t border-gray-100 flex gap-3 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]"
            >
              <button
                onClick={() => onAddToCart(product, selectedVariants, 1)}
                className="flex-[1] h-12 bg-black text-white font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-transform"
              >
                Add <Plus size={14} />
              </button>
              <button
                onClick={() => onBuyNow(product, selectedVariants)}
                className="flex-[2] h-12 bg-white border-2 border-black text-black font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-transform"
              >
                Checkout <ArrowRight size={14} />
              </button>
            </motion.div>


            <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest opacity-40 mb-6">
              <Truck size={14} />
              <span>Ships in 5-10 Business days</span>
    </div>

            {/* Description & Details */}
            <div className="space-y-8 mb-10">
              <div className="space-y-4">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Product Description</p>
                <div className="text-xs leading-relaxed text-black uppercase tracking-widest opacity-80 whitespace-pre-wrap">
                  {product.description || "Premium heavyweight garment designed for longevity and timeless style. Studio-born quality guaranteed."}
    </div>
    </div>

              <div className="space-y-4 pt-8 border-t border-gray-100">
                <div className="flex items-center gap-3">
                  <Truck size={14} className="opacity-40" />
                  <div className="flex flex-col">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Estimated Delivery</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-black">2-4 Business Days Nationwide</p>
    </div>
    </div>
    </div>
    </div>

            {/* Payment Icons */}
            <div className="mb-8 p-4 bg-gray-50/50 border border-gray-100 rounded-sm">
              <p className="text-[8px] font-black uppercase tracking-[0.2em] text-gray-400 mb-4">Secure Checkout via Yoco</p>
              <div className="flex flex-wrap items-center gap-6">
                <img src={PAYMENT_LOGOS.visa} alt="Visa" className="h-4 object-contain grayscale hover:grayscale-0 transition-all" referrerPolicy="no-referrer" />
                <img src={PAYMENT_LOGOS.mastercard} alt="Mastercard" className="h-5 object-contain grayscale hover:grayscale-0 transition-all" referrerPolicy="no-referrer" />
                <img src={PAYMENT_LOGOS.applepay} alt="Apple Pay" className="h-5 object-contain grayscale hover:grayscale-0 transition-all" referrerPolicy="no-referrer" />
                <img src={PAYMENT_LOGOS.googlepay} alt="Google Pay" className="h-5 object-contain grayscale hover:grayscale-0 transition-all" referrerPolicy="no-referrer" />
                <img src={PAYMENT_LOGOS.yoco} alt="Yoco" className="h-4 object-contain" referrerPolicy="no-referrer" />
    </div>
    </div>

            {/* Sold By */}
            <div className="space-y-4 pt-8 border-t border-gray-100">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Sold by</p>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                <div className="h-16 px-8 border border-gray-100 flex items-center justify-center rounded-sm bg-white shadow-sm">
                  {(product.soldByLogo || product.brandLogo || brandInfo?.logo) ? (
                    <img
                      src={product.soldByLogo || product.brandLogo || brandInfo?.logo || undefined}
                      alt={product.soldBy || product.brand}
                      className="h-10 w-auto object-contain"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span className="font-black text-sm uppercase tracking-[0.3em] text-black">
                      {product.soldBy || product.brand || 'Grab & Go'}
                    </span>
                  )}
    </div>
    </div>
    </div>
    </div>
    </div>

        {/* Pairs Well With */}
        <div className="mt-8 md:mt-10 pt-8 md:pt-10 border-t border-gray-100">
          <div className="flex justify-between items-center mb-4 md:mb-6">
            <h4 className="text-sm md:text-lg font-bold uppercase tracking-tighter">Pairs well with</h4>
            <div className="flex gap-2">
              <button
                onClick={() => scrollRelated('left')}
                className="w-8 h-8 border border-gray-100 flex items-center justify-center rounded-full hover:bg-black hover:text-white transition-all group/btn"
              >
                <ChevronLeft size={14} className="group-hover/btn:-translate-x-0.5 transition-transform" />
              </button>
              <button
                onClick={() => scrollRelated('right')}
                className="w-8 h-8 border border-gray-100 flex items-center justify-center rounded-full hover:bg-black hover:text-white transition-all group/btn"
              >
                <ChevronRight size={14} className="group-hover/btn:translate-x-0.5 transition-transform" />
              </button>
    </div>
    </div>

          <div
            ref={relatedScrollRef}
            className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar gap-4 md:gap-6 pb-8 scroll-smooth"
          >
            {relatedProducts.map(p => (
              <div key={p.id} className="min-w-[70vw] sm:min-w-[40vw] md:min-w-[22vw] lg:min-w-[15vw] snap-center">
                <ProductCard
                  product={p}
                  onAddToCart={onAddToCart}
                  onEmailDetails={onEmailDetails}
                  onBuyNow={onBuyNow}
                  searchQuery={searchQuery}
                  isWishlisted={wishlist.includes(p.id)}
                  onToggleWishlist={onToggleWishlist}
                  isLoading={isCartLoading}
                />
    </div>
            ))}
    </div>
    </div>

        {/* Recently Viewed */}
        {recentlyViewed.length > 0 && (
          <div className="mt-8 md:mt-10 pt-8 md:pt-10 border-t border-gray-100">
            <h4 className="text-sm md:text-lg font-bold uppercase tracking-tighter mb-4 md:mb-6">Recently Viewed</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
              {recentlyViewed.map(p => (
                <ProductCard
                  key={p.id}
                  product={p}
                  onAddToCart={onAddToCart}
                  onEmailDetails={onEmailDetails}
                  onBuyNow={onBuyNow}
                  isWishlisted={wishlist.includes(p.id)}
                  onToggleWishlist={onToggleWishlist}
                  isLoading={isCartLoading}
                />
              ))}
    </div>
    </div>
        )}
    </div>
    </div>
  );
};

const ProductCard = ({
  product,
  onAddToCart,
  onEmailDetails,
  onBuyNow,
  searchQuery = '',
  isWishlisted,
  onToggleWishlist,
  isLoading = false
}: {
  product: Product,
  onAddToCart: (p: Product, variants?: Record<string, string>) => void,
  onEmailDetails: (p: Product) => void,
  onBuyNow: (p: Product, variants?: Record<string, string>) => void,
  searchQuery?: string,
  isWishlisted: boolean,
  onToggleWishlist: (productId: string) => void,
  key?: string,
  isLoading?: boolean
}) => {
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const allImages = useMemo(() => [product.image, ...(product.images || [])], [product.image, product.images]);
  const [imgIdx, setImgIdx] = useState(0);
  useEffect(() => {
    if (allImages.length <= 1) return;
    const interval = setInterval(() => setImgIdx(prev => (prev + 1) % allImages.length), 3000);
    return () => clearInterval(interval);
  }, [allImages.length]);
  const navigate = useNavigate();
  const discount = product.originalPrice ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0;

  // Stock level for current variant selection
  const stockLevel = useMemo(() => {
    if (!product.stock) return Infinity;
    if (Object.keys(selectedVariants).length > 0) {
      let min = Infinity;
      for (const [k, v] of Object.entries(selectedVariants)) {
        const key = `${k}:${v}`;
        if (product.stock[key] !== undefined) min = Math.min(min, product.stock[key]);
      }
      return min;
    }
    return product.stock['_default'] ?? Infinity;
  }, [product.stock, selectedVariants]);

  const isOutOfStock = stockLevel === 0;
  const isLowStock   = stockLevel > 0 && stockLevel <= 5 && stockLevel !== Infinity;

  useEffect(() => {
    if (product.variants) {
      const initial: Record<string, string> = {};
      product.variants.forEach(v => {
        if (v.options.length > 0) initial[v.name] = v.options[0];
      });
      setSelectedVariants(initial);
    }
  }, [product.variants]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="group cursor-pointer relative bg-white"
    >
      <div className="aspect-[4/5] overflow-hidden bg-white mb-2 relative group-hover:shadow-lg transition-all duration-700">
        {isLoading && (
          <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] z-40 flex items-center justify-center">
            <Loader2 className="animate-spin text-black" size={24} />
    </div>
        )}

        {/* Action Icons */}
        <div className="absolute right-3 top-3 flex flex-col gap-2 z-30 transition-all duration-300">
          <motion.button
            key={isWishlisted ? 'wishlisted' : 'not-wishlisted'}
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.stopPropagation();
              onToggleWishlist(product.id);
            }}
            className={`w-9 h-9 flex items-center justify-center rounded-full shadow-lg backdrop-blur-md transition-all duration-300 ${
              isWishlisted
                ? 'bg-black text-white border-black'
                : 'bg-white/90 text-black border-transparent hover:bg-black hover:text-white md:opacity-0 md:group-hover:opacity-100'
            } border`}
          >
            <motion.div
              initial={false}
              animate={{ scale: isWishlisted ? [1, 1.3, 1] : 1 }}
              transition={{ duration: 0.3 }}
            >
              <Heart size={14} fill={isWishlisted ? "currentColor" : "none"} strokeWidth={2.5} />
            </motion.div>
          </motion.button>
    </div>

        {/* Auto-cycling product images */}
        {allImages.map((img, i) => (
          <img
            key={i}
            src={img || null}
            alt={i === 0 ? product.name : `${product.name} ${i + 1}`}
            onClick={() => navigate(`/product/${product.id}`)}
            onError={(e) => {
              e.currentTarget.src = `https://picsum.photos/seed/${product.id}-${i}/800/1000`;
            }}
            loading={i === 0 ? undefined : "lazy"}
            className={`${i === 0 ? '' : 'absolute inset-0'} w-full h-full object-cover transition-opacity duration-700 ease-in-out group-hover:scale-105 ${i === imgIdx ? 'opacity-100' : 'opacity-0'}`}
            referrerPolicy="no-referrer"
          />
        ))}
        {allImages.length > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-20">
            {allImages.map((_, i) => (
              <div key={i} className={`w-1 h-1 rounded-full transition-all duration-300 ${i === imgIdx ? 'bg-black w-3' : 'bg-black/30'}`} />
            ))}
    </div>
        )}

        {/* Discount badge */}
        {discount > 0 && !isOutOfStock && (
          <div className="absolute top-4 left-4 px-2 py-1 bg-[#18A374] text-white text-[7px] font-bold uppercase tracking-widest z-20">
            -{discount}%
    </div>
        )}

        {/* Out of Stock overlay + badge */}
        {isOutOfStock && (
          <>
            <div className="absolute inset-0 bg-white/60 z-20 pointer-events-none" />
            <div className="absolute top-4 left-4 px-2 py-1 bg-[#18A374] text-black text-[7px] font-bold uppercase tracking-widest z-30">
              Out of Stock
    </div>
          </>
        )}

        {/* Low Stock badge */}
        {isLowStock && !isOutOfStock && (
          <div className="absolute top-4 left-4 px-2 py-1 bg-amber-500 text-white text-[7px] font-bold uppercase tracking-widest z-20">
            Only {stockLevel} left
    </div>
        )}

        {/* Quick Add Button — disabled if out of stock */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (!isOutOfStock) onAddToCart(product, selectedVariants);
          }}
          disabled={isOutOfStock}
          className={`absolute bottom-0 left-0 right-0 py-4 text-[9px] font-bold uppercase tracking-[0.2em] z-30 transition-transform duration-300 active:scale-95 md:translate-y-full md:group-hover:translate-y-0 translate-y-0 ${
            isOutOfStock ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-[#18A374] text-white'
          }`}
        >
          {isOutOfStock ? 'Out of Stock' : 'Quick Add'}
        </button>
    </div>

      <div className="space-y-1 px-1" onClick={() => navigate(`/product/${product.id}`)}>
        <div className="flex justify-between items-start gap-2">
          <div className="min-w-0 flex-grow">
            <p className="text-[7px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-0 truncate">{product.brand}</p>
            <h3 className="text-[9px] font-medium uppercase tracking-widest text-black truncate">
              <Highlight text={product.name} query={searchQuery} />
            </h3>
    </div>
          <p className="text-[9px] font-bold text-black whitespace-nowrap">R{product.price}</p>
    </div>
        <div className="flex items-center justify-between">
          <p className="text-[8px] font-bold uppercase tracking-widest text-gray-300">
            {(product.categories || []).join(' / ')}
          </p>
          {product.soldByLogo && (
            <img src={product.soldByLogo} alt="" className="h-3 w-auto object-contain" referrerPolicy="no-referrer" />
          )}
    </div>
    </div>
    </motion.div>
  );
};

const PartnershipHub = ({ partners }: { partners: Partner[] }) => {
  const CAROUSEL = [
    "https://res.cloudinary.com/dggitwduo/image/upload/v1774452514/WhatsApp_Image_2026-03-25_at_17.25.44_zsxof4.jpg",
  ];
  const [slide, setSlide] = React.useState(0);
  const [dragging, setDragging] = React.useState(false);
  const dragStart = React.useRef(0);

  React.useEffect(() => {
    const t = setInterval(() => setSlide(s => (s + 1) % CAROUSEL.length), 5000);
    return () => clearInterval(t);
  }, [CAROUSEL.length]);

  const prev = () => setSlide(s => (s - 1 + CAROUSEL.length) % CAROUSEL.length);
  const next = () => setSlide(s => (s + 1) % CAROUSEL.length);

  return (
    <section id="collabs" className="py-12 md:py-20 px-4 md:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
          <div>
            <div className="flex items-center gap-3 mb-6 md:mb-8">
              <Logo className="h-6 md:h-8" dark />
              <div className="h-px w-12 bg-black/10" />
              <span className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.4em] text-black/30">Collective</span>
            </div>
            <h2 className="text-4xl md:text-7xl font-bold uppercase tracking-tighter mb-6 md:mb-8 text-black leading-[0.9]">
              The Culture<br />Collective
            </h2>
            <p className="text-sm md:text-xl font-medium opacity-70 mb-8 md:mb-12 leading-relaxed text-black max-w-lg">
              We don't just sell products; we build bridges. Collaborating with micro-influencers and cultural events to bring you exclusive limited edition drops.
            </p>
            <div className="space-y-3 md:space-y-4">
              {(partners.length > 0 ? partners : []).map(p => (
                <div
                  key={p.id}
                  onClick={() => document.getElementById('drops')?.scrollIntoView({ behavior: 'smooth' })}
                  className="flex items-center gap-3 md:gap-4 p-2 md:p-3 hover:bg-black/5 transition-colors border-l border-black/10 cursor-pointer group"
                >
                  <div className="w-10 h-10 bg-gray-50 flex-shrink-0 flex items-center justify-center overflow-hidden rounded-md">
                    <img src={p.logo || undefined} alt={p.name}
                      className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all"
                      referrerPolicy="no-referrer" />
                  </div>
                  <div>
                    <h4 className="font-semibold uppercase tracking-wider text-[10px] md:text-xs text-black">{p.name}</h4>
                    <p className="text-[9px] md:text-[10px] opacity-40 text-black">{p.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Carousel */}
          <div className="relative aspect-[4/5] md:aspect-square rounded-2xl overflow-hidden bg-gray-100 select-none"
            onMouseDown={e => { setDragging(true); dragStart.current = e.clientX; }}
            onMouseUp={e => {
              if (!dragging) return;
              setDragging(false);
              const diff = e.clientX - dragStart.current;
              if (Math.abs(diff) > 40) { diff < 0 ? next() : prev(); }
            }}
            onTouchStart={e => { dragStart.current = e.touches[0].clientX; }}
            onTouchEnd={e => {
              const diff = e.changedTouches[0].clientX - dragStart.current;
              if (Math.abs(diff) > 40) { diff < 0 ? next() : prev(); }
            }}
          >
            {CAROUSEL.map((img, i) => (
              <motion.img
                key={img}
                src={img}
                alt={`Grab & Go — Culture Collective ${i + 1}`}
                className="absolute inset-0 w-full h-full object-cover"
                initial={{ opacity: 0, scale: 1.04 }}
                animate={{ opacity: i === slide ? 1 : 0, scale: i === slide ? 1 : 1.04 }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                draggable={false}
                referrerPolicy="no-referrer"
              />
            ))}

            {/* Prev / Next arrows */}
            {CAROUSEL.length > 1 && (
              <>
                <button onClick={prev} className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-black hover:bg-white transition-all shadow-lg z-10">
                  <ChevronLeft size={16} />
                </button>
                <button onClick={next} className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-black hover:bg-white transition-all shadow-lg z-10">
                  <ChevronRight size={16} />
                </button>
              </>
            )}

            {/* Dot indicators */}
            {CAROUSEL.length > 1 && (
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5 z-10">
                {CAROUSEL.map((_, i) => (
                  <button key={i} onClick={() => setSlide(i)}
                    className={`h-[3px] rounded-full transition-all duration-400 ${i === slide ? 'w-6 bg-white' : 'w-3 bg-white/40'}`} />
                ))}
              </div>
            )}

            {/* Season tag */}
            <div className="absolute bottom-4 right-4 bg-black text-white px-3 py-2 rounded-lg shadow-xl z-10">
              <span className="text-lg md:text-2xl font-semibold block">2026</span>
              <span className="text-[8px] font-semibold uppercase tracking-wider">Season Drop</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const FAQChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{role: 'bot' | 'user', text: string}[]>([
    { role: 'bot', text: "Hey! 👋 I'm here to help. What can I assist you with?" }
  ]);
  const [input, setInput] = useState('');

  const faqs: Record<string, string> = {
    'size': "We use standard SA sizing. Check the size guide on each product page. If you're between sizes, we recommend going one size up for a relaxed fit.",
    'sizing': "We use standard SA sizing. Check the size guide on each product page. If you're between sizes, we recommend going one size up for a relaxed fit.",
    'delivery': "Standard delivery takes 5-10 business days within SA. Free delivery on orders over R650! Express options available at checkout.",
    'shipping': "We ship nationwide across South Africa. Standard delivery is 5-10 business days. Free on orders over R650.",
    'return': "You can return unworn items within 14 days for a full refund. Items must be in original condition with tags attached.",
    'refund': "Refunds are processed within 5-7 business days after we receive your return. You'll get an email confirmation.",
    'payment': "We accept Visa, Mastercard, Apple Pay, Google Pay — all powered by Yoco for secure checkout.",
    'track': "Go to Track Order in the menu, enter your order ID and email. You'll see real-time status updates.",
    'order': "Once you place an order, you'll receive a confirmation email. Track it anytime from the menu.",
    'contact': "Reach us via our Help Desk page, or DM us on Instagram @grabngoza. We typically respond within 24 hours.",
    'help': "I can help with: sizes, delivery, returns, payments, tracking, and more. Just ask!",
    'exchange': "We offer exchanges within 14 days. Visit our Returns page or contact us via Help Desk.",
    'pickup': "We offer pickup from our location in Midrand — no shipping fee! Select it at checkout.",
    'brand': "Grab & Go is a premium streetwear brand designed by IDEAS TO LIFE Studios, based in South Africa.",
  };

  const findAnswer = (q: string): string => {
    const lower = q.toLowerCase();
    for (const [key, answer] of Object.entries(faqs)) {
      if (lower.includes(key)) return answer;
    }
    return "I'm not sure about that one. Let me connect you with our team — head to the Help Desk for personalized support! 💬";
  };

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'bot', text: findAnswer(userMsg) }]);
    }, 500);
  };

  return (
    <>
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 z-[100] w-14 h-14 bg-[#06402B] text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-[#06402B]/90 transition-colors"
      >
        {isOpen ? <X size={22} /> : <MessageSquare size={22} />}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 z-[100] w-[340px] max-h-[480px] bg-white border border-gray-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            <div className="bg-[#06402B] text-white p-4 flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <MessageSquare size={14} />
    </div>
              <div>
                <p className="text-xs font-black uppercase tracking-wider">Grab & Go Support</p>
                <p className="text-[9px] text-white/60">Usually replies instantly</p>
    </div>
    </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[300px]">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-xs leading-relaxed ${
                    msg.role === 'user' ? 'bg-[#06402B] text-white rounded-br-sm' : 'bg-gray-100 text-gray-700 rounded-bl-sm'
                  }`}>{msg.text}</div>
    </div>
              ))}
    </div>
            <div className="px-4 pb-2 flex flex-wrap gap-1.5">
              {['Sizes', 'Delivery', 'Returns', 'Payment'].map(q => (
                <button key={q} onClick={() => setInput(q)}
                  className="text-[9px] px-3 py-1 bg-[#06402B]/10 text-[#06402B] rounded-full font-bold uppercase tracking-wider hover:bg-[#06402B]/20 transition-colors"
                >{q}</button>
              ))}
    </div>
            <div className="p-3 border-t border-gray-100 flex gap-2">
              <input type="text" value={input} onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask me anything..."
                className="flex-1 text-xs px-3 py-2.5 border border-gray-200 rounded-full focus:outline-none focus:border-[#06402B] transition-colors"
              />
              <button onClick={handleSend}
                className="w-9 h-9 bg-[#06402B] text-white rounded-full flex items-center justify-center hover:bg-[#06402B]/90 transition-colors flex-shrink-0"
              ><Send size={14} /></button>
    </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

const Footer = ({ categories = [] }: { categories?: Category[] }) => {
  const [subscribed, setSubscribed] = useState(false);
  const [email, setEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      try {
        await supportService.subscribeNewsletter(email);
        try {
          await emailService.sendNewsletterConfirmation(email);
        } catch (emailErr) {
          console.error("Failed to send newsletter email:", emailErr);
        }
        setSubscribed(true);
        setEmail('');
        setTimeout(() => setSubscribed(false), 5000);
      } catch (err) {
        console.error('Newsletter error:', err);
      }
    }
  };

  return (
    <footer className="bg-[#fafafa] border-t-[3px] border-[#06402B]">
      {/* Newsletter Section — Warm & Strategic */}
      <div className="bg-[#114834] text-white py-12 md:py-16 px-6 md:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div className="max-w-lg">
            <Logo className="h-8 mb-4 brightness-0 invert" />
            <h3 className="text-xl md:text-2xl font-black tracking-tight mb-2">Join the Grab & Go Fam</h3>
            <p className="text-xs text-white/50 leading-relaxed">
              Be the first to know about exclusive drops, restocks, and member-only offers.
              No spam — just the freshest gear, delivered to your inbox.
            </p>
            <div className="flex items-center gap-4 mt-4">
              <div className="flex items-center gap-2">
                <Sparkles size={12} className="text-[#18A374]" />
                <span className="text-[9px] text-white/40 uppercase tracking-wider font-bold">Exclusive Drops</span>
    </div>
              <div className="flex items-center gap-2">
                <Truck size={12} className="text-[#18A374]" />
                <span className="text-[9px] text-white/40 uppercase tracking-wider font-bold">Free Delivery R1,000+</span>
    </div>
    </div>
    </div>
          <div className="w-full md:w-auto md:min-w-[360px]">
            <AnimatePresence mode="wait">
              {subscribed ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center gap-2 text-emerald-400 py-3"
                >
                  <CheckCircle2 size={16} />
                  <span className="text-xs font-bold uppercase tracking-widest">Welcome to the fam! Check your inbox.</span>
                </motion.div>
              ) : (
                <form className="flex gap-2" onSubmit={handleSubmit}>
                  <input
                    type="email"
                    placeholder="Your email..."
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-grow bg-white/10 border border-white/20 rounded-sm px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/50 transition-colors"
                  />
                  <button
                    type="submit"
                    className="px-6 py-3 bg-[#18A374] text-black text-xs font-bold uppercase tracking-wider rounded-sm hover:bg-[#18A374]/90 transition-colors flex-shrink-0"
                  >
                    Join
                  </button>
                </form>
              )}
            </AnimatePresence>
    </div>
    </div>
    </div>

      {/* Footer Content — No Shopping Nav */}
      <div className="max-w-7xl mx-auto py-10 md:py-14 px-6 md:px-8">
        <div className="flex flex-col md:flex-row justify-between items-start gap-10 md:gap-16">

          {/* Brand + Socials */}
          <div className="space-y-4 md:space-y-5">
            <Logo className="h-10 md:h-12" dark />
            <p className="text-xs text-gray-400 max-w-xs leading-relaxed">
              Premium streetwear, curated drops, and a community that moves different. Based in South Africa, shipping nationwide.
            </p>
            <div className="flex gap-3">
              <motion.a
                whileHover={{ scale: 1.1 }}
                href="https://www.instagram.com/grabngoza"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-[#06402B]/10 flex items-center justify-center text-[#06402B] hover:bg-[#06402B] hover:text-white transition-all"
              >
                <Instagram size={14} />
              </motion.a>
              <motion.a
                whileHover={{ scale: 1.1 }}
                href="https://www.facebook.com/grabngoza"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-[#06402B]/10 flex items-center justify-center text-[#06402B] hover:bg-[#06402B] hover:text-white transition-all"
              >
                <Facebook size={14} />
              </motion.a>
    </div>
    </div>

          {/* Support + Legal columns */}
          <div className="grid grid-cols-2 gap-8 md:gap-16">
            <div className="space-y-3">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-black">Support</h4>
              <ul className="space-y-2 text-xs text-gray-400">
                <li><Link to="/how-to-order" className="hover:text-black transition-colors">How to Order</Link></li>
                <li><Link to="/track-order" className="hover:text-black transition-colors">Track Order</Link></li>
                <li><Link to="/shipping" className="hover:text-black transition-colors">Shipping Info</Link></li>
                <li><Link to="/helpdesk" className="hover:text-black transition-colors">Help Desk</Link></li>
                <li><Link to="/faq" className="hover:text-black transition-colors">FAQ</Link></li>
                <li><Link to="/refunds" className="hover:text-black transition-colors">Returns & Refunds</Link></li>
              </ul>
    </div>
            <div className="space-y-3">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-black">Company</h4>
              <ul className="space-y-2 text-xs text-gray-400">
                <li><Link to="/story" className="hover:text-black transition-colors">Our Story</Link></li>
                <li><Link to="/legal" className="hover:text-black transition-colors">Privacy Policy</Link></li>
                <li><Link to="/legal" className="hover:text-black transition-colors">Terms of Service</Link></li>
              </ul>
    </div>
    </div>
    </div>

        {/* Bottom bar */}
        <div className="mt-10 md:mt-14 flex flex-col md:flex-row justify-between items-center gap-4 border-t border-gray-100 pt-6">
          <p className="text-[10px] text-gray-300 uppercase tracking-widest">&copy; 2026 Grab & Go. All rights reserved.</p>
          <div className="flex flex-wrap justify-center items-center gap-4 md:gap-6">
            <img src={PAYMENT_LOGOS.visa} alt="Visa" className="h-4 object-contain opacity-30 hover:opacity-100 transition-opacity" referrerPolicy="no-referrer" />
            <img src={PAYMENT_LOGOS.mastercard} alt="Mastercard" className="h-5 object-contain opacity-30 hover:opacity-100 transition-opacity" referrerPolicy="no-referrer" />
            <img src={PAYMENT_LOGOS.applepay} alt="Apple Pay" className="h-5 object-contain opacity-30 hover:opacity-100 transition-opacity" referrerPolicy="no-referrer" />
            <img src={PAYMENT_LOGOS.googlepay} alt="Google Pay" className="h-5 object-contain opacity-30 hover:opacity-100 transition-opacity" referrerPolicy="no-referrer" />
            <img src={PAYMENT_LOGOS.yoco} alt="Yoco" className="h-4 object-contain opacity-30 hover:opacity-100 transition-opacity" referrerPolicy="no-referrer" />
    </div>
    </div>
    </div>
    </footer>
  );
};

// Recipe 1: Technical Dashboard / Data Grid
// Mood: Professional, precise, information-dense.
const SystemHealthDashboard = () => {
  const systems: { name: string; status: string; message: string; icon: any; action?: string; actionLabel?: string }[] = [
    {
      name: 'SMTP Email Service',
      status: 'healthy',
      message: 'Operational',
      icon: Mail,
    },
    {
      name: 'Firestore Database',
      status: 'healthy',
      message: 'Operational',
      icon: Database,
    },
    {
      name: 'Authentication Service',
      status: 'healthy',
      message: 'Operational',
      icon: ShieldAlert,
    }
  ];

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="bg-[#E4E3E0] min-h-screen p-6 md:p-12 font-sans text-[#141414] pt-32">
      <div className="max-w-5xl mx-auto">
        <header className="mb-12 border-b border-[#141414] pb-6 flex justify-between items-end">
          <div>
            <h1 className="font-serif italic text-4xl mb-2">System Health</h1>
            <p className="font-mono text-[10px] uppercase tracking-widest opacity-50">Diagnostic Console v2.4.0</p>
    </div>
          <div className="text-right">
            <p className="font-mono text-[10px] uppercase tracking-widest opacity-50">Last Scan</p>
            <p className="font-mono text-xs">{new Date().toLocaleString()}</p>
    </div>
        </header>

        <div className="grid gap-px bg-[#141414] border border-[#141414]">
          {/* Table Header */}
          <div className="grid grid-cols-[40px_1fr_1.5fr_1fr] bg-[#E4E3E0] p-4">
            <div className="font-serif italic text-[11px] uppercase tracking-wider opacity-50">#</div>
            <div className="font-serif italic text-[11px] uppercase tracking-wider opacity-50">System</div>
            <div className="font-serif italic text-[11px] uppercase tracking-wider opacity-50">Status / Diagnostics</div>
            <div className="font-serif italic text-[11px] uppercase tracking-wider opacity-50 text-right">Action</div>
    </div>

          {/* Table Rows */}
          {systems.map((system, idx) => (
            <motion.div
              key={system.name}
              whileHover={{ backgroundColor: '#141414', color: '#E4E3E0' }}
              className="grid grid-cols-[40px_1fr_1.5fr_1fr] bg-[#E4E3E0] p-4 items-center transition-colors cursor-default group"
            >
              <div className="font-mono text-xs opacity-50">0{idx + 1}</div>
              <div className="flex items-center gap-3">
                <system.icon size={16} className={system.status === 'error' ? 'text-red-500 group-hover:text-red-400' : 'text-emerald-600 group-hover:text-emerald-400'} />
                <span className="font-bold uppercase tracking-tight text-sm">{system.name}</span>
    </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${system.status === 'error' ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`} />
                <span className="font-mono text-xs">{system.message}</span>
    </div>
              <div className="text-right">
                {system.action ? (
                  <a
                    href={system.action}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest border border-current px-2 py-1 hover:bg-white hover:text-black transition-colors"
                  >
                    {system.actionLabel} <ExternalLink size={10} />
                  </a>
                ) : (
                  <span className="font-mono text-[10px] uppercase tracking-widest opacity-30">No Action Required</span>
                )}
    </div>
            </motion.div>
          ))}
    </div>

        <div className="mt-12 grid md:grid-cols-2 gap-8">
          <div className="border border-[#141414] p-6 flex flex-col justify-center items-center text-center">
            <Activity size={48} className="mb-4 opacity-20" />
            <h3 className="font-serif italic text-xl mb-2">Auto-Recovery</h3>
            <p className="text-xs opacity-50 mb-6">System will attempt to re-validate tokens every 24 hours.</p>
            <button className="font-mono text-[10px] uppercase tracking-widest border border-[#141414] px-6 py-3 hover:bg-[#141414] hover:text-[#E4E3E0] transition-all flex items-center gap-2">
              <RefreshCw size={14} /> Trigger Manual Scan
            </button>
    </div>
    </div>
    </div>
    </div>
  );
};

const SystemAlertBanner = ({ user }: { user: User | null }) => {
  return null;
};

const HelpDeskPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMessage('');

    try {
      await supportService.submitHelpDesk(formData);

      // Send Help Desk Notification Email
      try {
        await emailService.sendHelpDeskNotification(formData);
      } catch (emailErr) {
        console.error("Failed to send help desk email:", emailErr);
      }

      setStatus('success');
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (err: any) {
      console.error('HelpDesk error:', err);
      setStatus('error');
      setErrorMessage(err.message || 'Failed to send message. Please try again.');
    }
  };

  return (
    <div className="min-h-screen pt-32 pb-20 px-6 bg-white">
      <SEO
        title="Help Desk | Customer Support"
        description="Need help? Contact Grab & Go's customer support for any inquiries regarding orders, shipping, or products."
        url="https://grabandgo.co.za/helpdesk"
      />
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-display font-bold uppercase tracking-tighter mb-4">Help Desk</h1>
          <p className="text-sm text-gray-500 uppercase tracking-widest">How can we help you today?</p>
    </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Contact Form */}
          <div className="space-y-8">
            <div className="bg-gray-50 p-8 rounded-2xl border border-gray-100">
              <h2 className="text-xl font-bold uppercase tracking-tight mb-6">Send us a message</h2>

              {status === 'success' ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-8"
                >
                  <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 size={24} />
    </div>
                  <h3 className="text-lg font-bold mb-2">Message Sent!</h3>
                  <p className="text-xs text-gray-500 mb-6">We've received your inquiry and will get back to you within 24-48 hours.</p>
                  <button
                    onClick={() => setStatus('idle')}
                    className="text-[10px] font-black uppercase tracking-widest underline"
                  >
                    Send another message
                  </button>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Name</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full bg-white border border-gray-200 rounded-md px-4 py-3 text-xs focus:ring-1 focus:ring-black outline-none transition-all"
                      />
    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Email</label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="w-full bg-white border border-gray-200 rounded-md px-4 py-3 text-xs focus:ring-1 focus:ring-black outline-none transition-all"
                      />
    </div>
    </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Subject</label>
                    <input
                      type="text"
                      required
                      value={formData.subject}
                      onChange={(e) => setFormData({...formData, subject: e.target.value})}
                      className="w-full bg-white border border-gray-200 rounded-md px-4 py-3 text-xs focus:ring-1 focus:ring-black outline-none transition-all"
                    />
    </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Message</label>
                    <textarea
                      required
                      rows={5}
                      value={formData.message}
                      onChange={(e) => setFormData({...formData, message: e.target.value})}
                      className="w-full bg-white border border-gray-200 rounded-md px-4 py-3 text-xs focus:ring-1 focus:ring-black outline-none transition-all resize-none"
                    />
    </div>

                  {status === 'error' && (
                    <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest">{errorMessage}</p>
                  )}

                  <button
                    type="submit"
                    disabled={status === 'loading'}
                    className="w-full py-4 bg-black text-white text-[10px] font-black uppercase tracking-[0.2em] hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {status === 'loading' ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send size={14} />
                        Send Message
                      </>
                    )}
                  </button>
                </form>
              )}
    </div>

            <div className="grid grid-cols-1 gap-4">
              <div className="p-6 border border-gray-100 rounded-2xl flex flex-col items-center text-center hover:bg-gray-50 transition-colors group">
                <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Mail size={20} />
    </div>
                <h3 className="text-[10px] font-bold uppercase tracking-widest mb-1">Email</h3>
                <p className="text-[8px] text-gray-400 uppercase tracking-wider">support@grabandgo.co.za</p>
    </div>
    </div>
    </div>

          {/* Quick FAQs */}
          <div className="space-y-8">
            <h2 className="text-xl font-bold uppercase tracking-tight">Quick Answers</h2>
            <div className="space-y-6">
              {[
                {
                  q: "How long does delivery take?",
                  a: "Standard delivery within SA takes 5-10 business days. Studio pickups are usually ready in 1-2 business days."
                },
                {
                  q: "What is your return policy?",
                  a: "We accept returns within 14 days of delivery. Exchanges are accepted within 30 days. Items must be in original condition. Please contact our Help Desk to initiate a return."
                },
                {
                  q: "How can I track my order?",
                  a: "Once shipped, you'll receive a tracking number via email. You can also track it in your account dashboard."
                },
                {
                  q: "Do you ship internationally?",
                  a: "Yes! We ship worldwide. International rates are calculated at checkout based on your location."
                }
              ].map((faq, i) => (
                <div key={i} className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-black">{faq.q}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{faq.a}</p>
    </div>
              ))}
    </div>

            <div className="pt-8 border-t border-gray-100">
              <Link to="/faq" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] hover:gap-4 transition-all">
                View All FAQs <ArrowRight size={14} />
              </Link>
    </div>
    </div>
    </div>
    </div>
    </div>
  );
};

const FAQPage = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const faqs = [
    {
      category: "Orders & Speed",
      items: [
        {
          q: "How long does it take to order?",
          a: "Our mission is to get you \"shopped in seconds.\" Our interface is optimized so you can complete your entire order in less than 2 minutes."
        },
        {
          q: "How do I know my order went through?",
          a: "Once you’ve finalized your checkout, you will receive an instant branded order confirmation via our automated system."
        },
        {
          q: "Can I change my order?",
          a: "We are unable to make changes to confirmed or fulfilled orders. Please ensure your details are correct before you \"Grab & Go\"."
        }
      ]
    },
    {
      category: "Payments",
      items: [
        {
          q: "Which payment options are available?",
          a: "We offer a wide range of secure local and international options:\n• Express: Capitec Pay, Apple Pay, and Google Pay.\n• Buy Now, Pay Later: Payflex, PayJustNow, and Happy Pay.\n• Instant EFT & Card: Ozow, Paystack, Visa, Mastercard, and American Express."
        },
        {
          q: "Is my payment secure?",
          a: "Yes. We use only trusted gateways with data encryption and 3D secure protection to ensure your details are safe."
        }
      ]
    },
    {
      category: "Shipping & Collection",
      items: [
        {
          q: "What are the shipping costs?",
          a: "Standard delivery is R90, but it is Free for all orders over R900."
        },
        {
          q: "How long does delivery take?",
          a: "For delivery within South Africa, you can expect your order within 5 to 10 business days. During festive or sale periods, this may adjust to 5–7 business days."
        },
        {
          q: "Can I pick up my order?",
          a: "Yes. We offer in-store pickup from our studio/store (usually ready in 1 to 2 business days) and nationwide delivery via our courier partners."
        },
        {
          q: "How do I track my order?",
          a: "Once your order is with the courier, you will receive tracking details via email. You can also track it directly on our site using your order number."
        }
      ]
    },
    {
      category: "Returns & Exchanges",
      items: [
        {
          q: "What is the return policy?",
          a: "• Refunds: Must be requested within 14 days of delivery.\n• Exchanges: Must be requested within 30 days of purchase or delivery.\n\nTo initiate a return, please contact our support team via the Help Desk."
        },
        {
          q: "Are there any return fees?",
          a: "A R120 courier fee applies to all online returns and exchanges. However, you can return your online order in-store for free."
        },
        {
          q: "What items cannot be returned?",
          a: "No returns or exchanges are allowed for items bought on sale. Additionally, socks, underwear, pierced jewellery, and swimwear are non-returnable."
        }
      ]
    },
    {
      category: "Support",
      items: [
        {
          q: "How do I get in touch?",
          a: "Our Help Desk is available Monday to Friday, 08h00 – 16h00. Please quote your order number in all enquiries to help us keep things fast."
        }
      ]
    }
  ];

  return (
    <div className="pt-24 pb-16 px-6 md:px-12 max-w-3xl mx-auto">
      <SEO
        title="FAQ | Frequently Asked Questions"
        description="Find answers to common questions about orders, shipping, payments, and returns at Grab & Go."
        url="https://grabandgo.co.za/faq"
      />
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-12"
      >
        <header className="text-center space-y-3">
          <h1 className="text-2xl md:text-4xl font-semibold uppercase tracking-tight">Frequently Asked Questions</h1>
          <p className="text-[10px] font-semibold uppercase tracking-wider opacity-30 italic">Everything you need to know to Grab & Go.</p>
        </header>

        <div className="space-y-12">
          {faqs.map((section, idx) => (
            <section key={idx} className="space-y-6">
              <h2 className="text-lg font-semibold uppercase tracking-tight border-b border-gray-100 pb-2 text-black/40">
                {section.category}
              </h2>
              <div className="space-y-8">
                {section.items.map((item, i) => (
                  <div key={i} className="space-y-2">
                    <h3 className="text-sm font-semibold text-black uppercase tracking-tight">{item.q}</h3>
                    <p className="text-sm leading-relaxed text-gray-500 whitespace-pre-line">{item.a}</p>
    </div>
                ))}
    </div>
            </section>
          ))}
    </div>

        <footer className="pt-8 border-t border-gray-50 text-center">
          <p className="text-sm text-gray-500">
            Still have questions? Contact us on
            <Link to="/helpdesk" className="underline font-semibold ml-1">Help Desk</Link>.
          </p>
        </footer>
      </motion.div>
    </div>
  );
};

const ShippingPolicyPage = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="pt-24 pb-16 px-6 md:px-12 max-w-3xl mx-auto">
      <SEO
        title="Shipping Policy | Delivery Information"
        description="Detailed information about shipping methods, costs, and delivery times for Grab & Go orders across South Africa."
        url="https://grabandgo.co.za/shipping"
      />
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-12"
      >
        <header className="text-center space-y-3">
          <h1 className="text-2xl md:text-4xl font-semibold uppercase tracking-tight">Shipping & Pickups Policy</h1>
          <p className="text-[10px] font-semibold uppercase tracking-wider opacity-30">Last updated: 15/03/2026</p>
        </header>

        <section className="space-y-4">
          <p className="text-sm leading-relaxed text-gray-500">
            To ensure your experience is "shopped in seconds" and avoids the "slow and clunky" feel of traditional e-commerce,
            Grab & Go has built delivery and collection directly into your everyday customer flow.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold uppercase tracking-tight border-b border-gray-100 pb-2">1. Standard Shipping ("The Go Path")</h2>
          <p className="text-sm leading-relaxed text-gray-500">We aim to get your premium products to you with speed and convenience.</p>
          <ul className="space-y-2 text-sm text-gray-500 list-disc pl-5">
            <li><span className="font-semibold">Timeline:</span> Please allow 5 to 10 business days for nationwide order delivery within South Africa.</li>
            <li><span className="font-semibold">Cost:</span> Door-to-door delivery is R90, or <span className="font-bold">Free</span> for all orders over R900.</li>
            <li><span className="font-semibold">Partners:</span> We use high-speed logistics partners like The Courier Guy and Bob Go to ensure quick delivery adoption.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold uppercase tracking-tight border-b border-gray-100 pb-2">2. Collection & Pickup Points ("The Grab Path")</h2>
          <p className="text-sm leading-relaxed text-gray-500">For those who prefer to "Pick - Grab - Go," we offer flexible collection options that fit your lifestyle.</p>
          <ul className="space-y-2 text-sm text-gray-500 list-disc pl-5">
            <li><span className="font-semibold">Nationwide Delivery:</span> We deliver to your doorstep anywhere in South Africa using our trusted courier partners.</li>
            <li><span className="font-semibold">Studio/In-Store Pickup:</span> We offer pickup from our Co.Space location or designated studio spots.</li>
            <li><span className="font-semibold">Readiness:</span> Collection orders are generally ready within 1 to 2 business days. You will receive an automated notification as soon as your order is ready for "grab".</li>
          </ul>
        </section>
        <section className="space-y-4">
          <h2 className="text-lg font-semibold uppercase tracking-tight border-b border-gray-100 pb-2">3. Real-Time Tracking & Trust</h2>
          <p className="text-sm leading-relaxed text-gray-500">Building trust through transparency is core to our mission.</p>
          <ul className="space-y-2 text-sm text-gray-500 list-disc pl-5">
            <li><span className="font-semibold">Hybrid Updates:</span> Once your order is processed through our secure checkout, you will receive instant branded confirmations.</li>
            <li><span className="font-semibold">Stay Informed:</span> You will receive continuous tracking updates via SMS or Email. These updates allow you to track your order every step of the way.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold uppercase tracking-tight border-b border-gray-100 pb-2">4. Returns & Exchanges</h2>
          <ul className="space-y-2 text-sm text-gray-500 list-disc pl-5">
            <li><span className="font-semibold">Process:</span> To initiate a return or exchange, please contact our support team via the Help Desk.</li>
            <li><span className="font-semibold">Support:</span> We uphold the Consumer Goods and Services Code to ensure a "premium experience" that feels secure and stylish.</li>
          </ul>
        </section>

        <footer className="pt-8 border-t border-gray-50 text-center">
          <p className="text-sm text-gray-500">
            For any further assistance, please contact our support team through our
            <Link to="/helpdesk" className="underline font-semibold ml-1">Help Desk</Link>.
          </p>
        </footer>
      </motion.div>
    </div>
  );
};

const RefundPolicyPage = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="pt-24 pb-16 px-6 md:px-12 max-w-3xl mx-auto">
      <SEO
        title="Refund Policy | Returns & Exchanges"
        description="Learn about our returns and refund policy. We offer easy exchanges and returns within 14 days of delivery."
        url="https://grabandgo.co.za/refunds"
      />
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-12"
      >
        <header className="text-center space-y-3">
          <h1 className="text-2xl md:text-4xl font-semibold uppercase tracking-tight">Refund & Exchange Policy</h1>
          <p className="text-[10px] font-semibold uppercase tracking-wider opacity-30">Last updated: 15/03/2026</p>
        </header>

        <section className="space-y-4">
          <p className="text-sm leading-relaxed text-gray-500">
            We want to ensure our customers are happy with their "premium products" and their overall experience.
            To support our goal of providing a "seamless and stylish" service, the following terms apply to all returns and exchanges.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold uppercase tracking-tight border-b border-gray-100 pb-2">1. Return and Exchange Windows</h2>
          <ul className="space-y-2 text-sm text-gray-500 list-disc pl-5">
            <li><span className="font-semibold">Local Refunds:</span> You can return an item for a refund within 14 days from the date of purchase.</li>
            <li><span className="font-semibold">Local Exchanges:</span> You can exchange an item within 30 days from the date of purchase.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold uppercase tracking-tight border-b border-gray-100 pb-2">2. Condition Requirements</h2>
          <p className="text-sm leading-relaxed text-gray-500">To be eligible for a refund or exchange, the item must be in its original condition as when it was purchased and meet these requirements:</p>
          <ul className="space-y-2 text-sm text-gray-500 list-disc pl-5">
            <li>Unworn, undamaged, and unwashed.</li>
            <li>Original price tags must remain attached.</li>
            <li>The item must have been purchased directly through our official online platform.</li>
            <li><span className="font-semibold italic">Please note: There are no refunds or exchanges on sale items.</span></li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold uppercase tracking-tight border-b border-gray-100 pb-2">3. Shipping and Fees</h2>
          <ul className="space-y-2 text-sm text-gray-500 list-disc pl-5">
            <li>The cost of shipping for returned or exchanged items is for the customer's account.</li>
            <li>For online returns or exchanges, a flat R120 fee is charged to cover processing.</li>
            <li>If you choose to exchange an item in-person at a designated "Grab & Go" retail partner or studio, the exchange is free.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold uppercase tracking-tight border-b border-gray-100 pb-2">4. Defective or Faulty Products</h2>
          <p className="text-sm leading-relaxed text-gray-500">We strive to ensure all "premium quality" items are sent without defects.</p>
          <ul className="space-y-2 text-sm text-gray-500 list-disc pl-5">
            <li><span className="font-semibold">Warranty:</span> We offer a six-month limited warranty on all products for defects in materials and workmanship under normal use.</li>
            <li><span className="font-semibold">Exclusions:</span> This does not cover normal wear and tear, damage from negligence or abuse, or unauthorized modifications.</li>
            <li><span className="font-semibold">Resolution:</span> If an item is found to be validly defective, we will replace it with the same item. If stock is unavailable, we will provide an item of equal value or a gift card.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold uppercase tracking-tight border-b border-gray-100 pb-2">5. The Return Process</h2>
          <p className="text-sm leading-relaxed text-gray-500">To keep our workflow "fast" and aligned with our Hybrid Checkout model, please follow these steps:</p>
          <ol className="space-y-2 text-sm text-gray-500 list-decimal pl-5">
            <li><span className="font-semibold">Contact Support:</span> Reach out to our support team via the Help Desk with your Order ID and the items you wish to return.</li>
            <li><span className="font-semibold">Review:</span> Our team will review your request within 24-48 hours.</li>
            <li><span className="font-semibold">Shipping:</span> Once approved, you will receive instructions on how to return the items to our studio.</li>
            <li><span className="font-semibold">Finalisation:</span> After the product is returned and inspected, we will reach out via email to finalise your refund or exchange.</li>
          </ol>
        </section>

        <footer className="pt-8 border-t border-gray-50 text-center">
          <p className="text-sm text-gray-500">
            For any further assistance, please contact our support team through our
            <Link to="/helpdesk" className="underline font-semibold ml-1">Help Desk</Link>.
          </p>
        </footer>
      </motion.div>
    </div>
  );
};

const LegalPage = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="pt-24 pb-16 px-6 md:px-12 max-w-3xl mx-auto">
      <SEO
        title="Legal | Terms & Conditions"
        description="Terms of service, privacy policy, and other legal information for the Grab & Go website."
        url="https://grabandgo.co.za/legal"
      />
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-12"
      >
        <header className="text-center space-y-3">
          <h1 className="text-2xl md:text-4xl font-semibold uppercase tracking-tight">Legal & Policy</h1>
          <p className="text-[10px] font-semibold uppercase tracking-wider opacity-30">Last updated: 13/05/2025</p>
        </header>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold uppercase tracking-tight border-b border-gray-100 pb-2">1. Website & App Terms of Use</h2>
          <p className="text-sm leading-relaxed text-gray-500">By accessing and using our website or any associated mobile platforms, you agree to the following:</p>
          <ul className="space-y-2 text-sm text-gray-500 list-disc pl-5">
            <li>You must be 18+ or have permission from a parent/guardian.</li>
            <li>Do not misuse our website (e.g., distribute malware, steal content).</li>
            <li>All content belongs to Grab & Go / IDEAS TO LIFE Studios and cannot be copied without written consent.</li>
            <li>We may change features, layouts, or content at any time without notice.</li>
            <li>We are not responsible for third-party links or platforms you navigate to via our site.</li>
            <li>Use of our platform implies acceptance of these terms.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold uppercase tracking-tight border-b border-gray-100 pb-2">2. Privacy Statement</h2>
          <p className="text-sm leading-relaxed text-gray-500">We respect your privacy and protect your personal data. Here’s how:</p>
          <ul className="space-y-2 text-sm text-gray-500 list-disc pl-5">
            <li>We only collect necessary information: name, contact details, and delivery info.</li>
            <li>Data is used to process orders, communicate with you, and improve our service.</li>
            <li>We do not sell or share your information with third parties.</li>
            <li>Our website may use cookies for a better browsing experience.</li>
            <li>All payment info processed via Yoco or EFT remains confidential and secure.</li>
            <li>You may request access to your data or request deletion at any time.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold uppercase tracking-tight border-b border-gray-100 pb-2">3. Online Shopping Terms & Conditions</h2>
          <ul className="space-y-2 text-sm text-gray-500 list-disc pl-5">
            <li>Orders are placed via our online store and confirmed upon payment.</li>
            <li>Items are sold on a first-pay, first-serve basis.</li>
            <li>Prices are final unless a discount or promo is explicitly offered.</li>
            <li>We accept EFT, Yoco card payments, or cash (on collection only).</li>
            <li>Orders are dispatched only after payment reflects.</li>
            <li>Delivery timelines are estimates and may vary.</li>
            <li>Grab & Go is not responsible for courier delays or incorrect info submitted by the buyer.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold uppercase tracking-tight border-b border-gray-100 pb-2">4. Access to Information (PAIA Compliance)</h2>
          <p className="text-sm leading-relaxed text-gray-500">Under the Promotion of Access to Information Act (PAIA), you may request information we hold about you.</p>
          <ul className="space-y-2 text-sm text-gray-500 list-disc pl-5">
            <li>Email requests to <a href="mailto:cbrprints22@gmail.com" className="underline font-semibold">cbrprints22@gmail.com</a>.</li>
            <li>Clearly specify what information you are requesting.</li>
            <li>We may require proof of identity before releasing information.</li>
            <li>Requests will be responded to within the legally required timeframe.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold uppercase tracking-tight border-b border-gray-100 pb-2">5. Language Policy</h2>
          <ul className="space-y-2 text-sm text-gray-500 list-disc pl-5">
            <li>Grab & Go operates primarily in English.</li>
            <li>Where possible, assistance may be given in IsiZulu or Sesotho based on available team members.</li>
            <li>All legal, invoice, and formal documentation is issued in English.</li>
            <li>Customers can request basic assistance in other languages via our Help Desk.</li>
            <li>For any further clarification, contact us via email or our Help Desk.</li>
          </ul>
        </section>

        <footer className="pt-8 border-t border-gray-50 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-wider opacity-30">These policies were last updated on 13/05/2025 and may be revised periodically.</p>
        </footer>
      </motion.div>
    </div>
  );
};

const OurStoryPage = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="pt-16 pb-24 overflow-x-hidden">
      <SEO
        title="Our Story | About Grab & Go"
        description="Discover the vision and journey behind Grab & Go. Premium streetwear curation for the modern South African landscape."
        url="https://grabandgo.co.za/story"
      />
      
      {/* 1. Panoramic Hero Image */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2 }}
        className="w-full h-[40vh] md:h-[60vh] overflow-hidden"
      >
        <img 
          src="https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&q=80&w=2000" 
          alt="Grab & Go Team / Vibe" 
          className="w-full h-full object-cover grayscale brightness-75"
          referrerPolicy="no-referrer"
        />
      </motion.div>

      {/* 2. ABOUT US Section */}
      <div className="max-w-4xl mx-auto px-6 py-16 md:py-24 text-center">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-2xl md:text-3xl font-display font-light uppercase tracking-[0.4em] mb-12 text-black"
        >
          About Us!
        </motion.h2>
        
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="space-y-8 text-[13px] md:text-sm leading-[1.8] text-gray-600 font-medium tracking-wide max-w-2xl mx-auto"
        >
          <p>
            <span className="font-bold text-black">GRAB & GO</span> is a South African streetwear brand which has its roots in the underground and rebellious youth street culture that dominates the urban centres of Mzansi. <span className="font-bold text-black">GRAB & GO</span> is the brainchild of the creative collective at <span className="font-bold text-black">IDEAS TO LIFE Studios</span>.
          </p>

          <p>
            In 2024, we saw a gap in the market for a brand that was designed by the youth for the youth, in particular, Millennials as well as Generation Z. Through ambition, perseverance and teamwork <span className="font-bold text-black">GRAB & GO</span> was born.
          </p>

          <p>
            The <span className="font-bold text-black">GRAB & GO</span> aesthetic is characterized by its innovative designs brought to life through a 21st-century African design philosophy that showcases the modern aspirations of South African youth. Each piece is made with intention—from the fit and feel, to the colorways and artwork.
          </p>
        </motion.div>
      </div>

      {/* 3. Black Tagline Banner */}
      <div className="bg-black text-white py-24 md:py-32 relative overflow-hidden">
        {/* Background visual element */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
        
        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center space-y-4 md:space-y-6">
          <motion.p 
            initial={{ opacity: 0, letterSpacing: "0.2em" }}
            whileInView={{ opacity: 1, letterSpacing: "1em" }}
            viewport={{ once: true }}
            transition={{ duration: 1.5 }}
            className="text-[10px] md:text-xs font-black uppercase tracking-[1em] text-white/60 mb-8"
          >
            Smart | African | Ambitious
          </motion.p>
          
          <motion.h3 
            initial={{ scale: 0.9, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            className="text-5xl md:text-8xl font-display font-bold uppercase tracking-tighter"
          >
            Grab & Go
          </motion.h3>
        </div>
      </div>

      {/* 4. OUR VISION Section */}
      <div className="max-w-4xl mx-auto px-6 py-16 md:py-24 text-center">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-2xl md:text-3xl font-display font-light uppercase tracking-[0.4em] mb-12 text-black"
        >
          Our Vision.
        </motion.h2>

        <motion.p 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="text-[13px] md:text-sm leading-[1.8] text-gray-600 font-medium tracking-wide max-w-2xl mx-auto"
        >
          <span className="font-bold text-black">GRAB & GO</span> aims to become the leading streetwear brand on the African continent, inspiring the youth through creative design, innovation and affordable pricing driven by the brand's mantra of <span className="font-bold text-black">"SMART • AFRICAN • AMBITIOUS"</span>.
        </motion.p>
      </div>

      {/* Image Grid - Keeping the spirit of the previous design but matching the new aesthetic */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-4 md:px-8 max-w-7xl mx-auto mt-8">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="aspect-[16/9] md:aspect-square overflow-hidden grayscale hover:grayscale-0 transition-all duration-700 bg-gray-100"
        >
          <img src="https://picsum.photos/seed/studio/1200/1200" alt="Studio View" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        </motion.div>
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="aspect-[16/9] md:aspect-square overflow-hidden grayscale hover:grayscale-0 transition-all duration-700 bg-gray-100"
        >
          <img src="https://picsum.photos/seed/street/1200/1200" alt="Street View" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        </motion.div>
      </div>
    </div>
  );
};

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

const NotFoundPage = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <SEO
        title="404 | Page Not Found"
        description="The page you are looking for doesn't exist. Head back to Grab & Go home for the latest streetwear."
      />
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <h1 className="text-6xl md:text-8xl font-semibold leading-none tracking-tight opacity-5">404</h1>
        <div className="space-y-2">
          <h2 className="text-xl md:text-2xl font-semibold uppercase tracking-tight">Need Help?</h2>
          <p className="text-[10px] font-mono uppercase tracking-wider opacity-30">The page you're looking for doesn't exist or has been moved.</p>
    </div>
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white text-[10px] font-semibold uppercase tracking-wider hover:opacity-90 transition-opacity"
        >
          <ArrowRight className="rotate-180" size={16} /> Back to Shop
        </button>
      </motion.div>
    </div>
  );
};

const AuthModal = ({
  isOpen,
  onClose,
  onSuccess
}: {
  isOpen: boolean,
  onClose: () => void,
  onSuccess: () => void
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const [resetSent, setResetSent] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (mode === 'signup') {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        if (name) {
          await updateProfile(userCredential.user, { displayName: name });
        }
        // Send Welcome Email
        try {
          await emailService.sendWelcomeEmail(email, name || 'Valued Customer');
        } catch (emailErr) {
          console.error("Failed to send welcome email:", emailErr);
        }
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Auth failed:", err);
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your email address first.");
      return;
    }
    setLoading(true);
    setError('');
    try {
      await emailService.sendPasswordResetEmail(email);
      setResetSent(true);
      setTimeout(() => {
        setResetSent(false);
        setShowForgotPassword(false);
      }, 5000);
    } catch (err: any) {
      setError(err.message || "Failed to send reset email.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      await signInWithPopup(auth, googleProvider);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Google login failed:", err);
      if (err.code === 'auth/popup-closed-by-user') return;
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleFacebookLogin = async () => {
    setLoading(true);
    setError('');
    try {
      await signInWithPopup(auth, facebookProvider);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Facebook login failed:", err);
      if (err.code === 'auth/popup-closed-by-user') return;
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md bg-white border border-gray-100 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] overflow-y-auto"
          >
            <div className="p-8 md:p-10 text-center space-y-6">
              <div className="space-y-2">
                <Logo className="h-8 mx-auto" dark />
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-30">Account Access</p>
    </div>

              {showForgotPassword ? (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h2 className="text-xl font-display font-bold uppercase tracking-tighter">Reset Password</h2>
                    <p className="text-xs text-gray-500 leading-relaxed">Enter your email and we'll send you a link to reset your password.</p>
    </div>

                  {resetSent ? (
                    <div className="p-4 bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 text-left">
                      <CheckCircle2 size={14} className="flex-shrink-0" />
                      <span>Reset link sent! Check your inbox.</span>
    </div>
                  ) : (
                    <form onSubmit={handleForgotPassword} className="space-y-4">
                      <input
                        type="email"
                        placeholder="Email Address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 text-xs focus:border-black outline-none transition-all text-black"
                      />
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-black text-white font-bold uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 hover:bg-gray-900 transition-all disabled:opacity-50"
                      >
                        {loading ? <Loader2 className="animate-spin" size={16} /> : 'Send Reset Link'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowForgotPassword(false)}
                        className="text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-black transition-colors"
                      >
                        Back to Login
                      </button>
                    </form>
                  )}
    </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <h2 className="text-xl font-display font-bold uppercase tracking-tighter">
                      {mode === 'login' ? 'Welcome Back' : 'Create Account'}
                    </h2>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      {mode === 'login'
                        ? 'Sign in to track your orders and manage your account.'
                        : 'Join Grab & Go to save your details and track your orders.'}
                    </p>
    </div>

                  {error && (
                    <div className="p-3 bg-red-50 text-red-600 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 text-left">
                      <AlertCircle size={14} className="flex-shrink-0" />
                      <span>{error}</span>
    </div>
                  )}

                  <form onSubmit={handleEmailAuth} className="space-y-3">
                    {mode === 'signup' && (
                      <input
                        type="text"
                        placeholder="Full Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 text-xs focus:border-black outline-none transition-all text-black"
                      />
                    )}
                    <input
                      type="email"
                      placeholder="Email Address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 text-xs focus:border-black outline-none transition-all text-black"
                    />
                    <input
                      type="password"
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 text-xs focus:border-black outline-none transition-all text-black"
                    />
                    {mode === 'login' && (
                      <div className="text-right">
                        <button
                          type="button"
                          onClick={() => setShowForgotPassword(true)}
                          className="text-[9px] font-bold uppercase tracking-widest text-gray-400 hover:text-black transition-colors"
                        >
                          Forgot Password?
                        </button>
    </div>
                    )}
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-4 bg-black text-white font-bold uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 hover:bg-gray-900 transition-all disabled:opacity-50"
                    >
                      {loading ? <Loader2 className="animate-spin" size={16} /> : (mode === 'login' ? 'Sign In' : 'Create Account')}
                    </button>
                  </form>

                  <div className="relative py-2">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-100"></div>
    </div>
                    <div className="relative flex justify-center text-[8px] uppercase tracking-[0.2em] font-bold">
                      <span className="bg-white px-2 text-gray-300">Or continue with</span>
    </div>
    </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={handleGoogleLogin}
                      disabled={loading}
                      title="Google"
                      className="flex items-center justify-center py-3 border border-gray-100 hover:bg-gray-50 transition-all rounded-sm"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                    </button>

                    <button
                      onClick={handleFacebookLogin}
                      disabled={loading}
                      title="Facebook"
                      className="flex items-center justify-center py-3 border border-gray-100 hover:bg-gray-50 transition-all rounded-sm"
                    >
                      <Facebook size={16} className="text-[#1877F2]" />
                    </button>
    </div>

                  <div className="pt-2">
                    <button
                      onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                      className="text-[10px] font-bold uppercase tracking-widest text-black hover:opacity-70 transition-opacity"
                    >
                      {mode === 'login' ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
                    </button>
    </div>
                </>
              )}

              <p className="text-[8px] text-gray-400 uppercase tracking-widest">
                By continuing, you agree to our <Link to="/legal" className="text-black underline">Terms</Link>
              </p>
    </div>

            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 hover:bg-black/5 rounded-full transition-colors text-black"
            >
              <X size={20} />
            </button>
          </motion.div>
    </div>
      )}
    </AnimatePresence>
  );
};

// ─── Smart Label Download Button ─────────────────────────────────────────────
// Handles async label generation: if labelUrl is a direct URL, opens it.
// Otherwise polls /api/shipping?action=label&shipmentId=X with retries.
const LabelDownloadButton = ({ order }: { order: Order }) => {
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleDownload = async () => {
    setStatus('loading');
    setErrorMsg(null);

    // If we already have a direct label URL stored, open it immediately
    const directUrl = (order as any).labelUrl || (order as any).waybillUrl || (order as any).waybill_url;
    if (directUrl && typeof directUrl === 'string' && directUrl.startsWith('http')) {
      window.open(directUrl, '_blank');
      setStatus('idle');
      return;
    }

    const shipmentId = (order as any).shipmentId || (order as any).bobgoShipmentId;
    if (!shipmentId) {
      setErrorMsg('No shipment ID on this order — dispatch it first to generate a label.');
      setStatus('error');
      return;
    }

    const MAX_ATTEMPTS = 6;
    const DELAY_MS = 5000; // 5s between attempts — ShipLogic label generation is async
    const labelEndpoint = `/api/shipping?action=label&shipmentId=${shipmentId}`;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        const res = await fetch(labelEndpoint);

        if (res.status === 202) {
          // Server says label not ready yet — wait and retry
          if (attempt < MAX_ATTEMPTS) await new Promise(r => setTimeout(r, DELAY_MS));
          continue;
        }

        if (res.ok) {
          const contentType = res.headers.get('content-type') || '';
          if (contentType.includes('application/pdf') || contentType.includes('application/octet')) {
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `label-${shipmentId}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            setStatus('idle');
            return;
          } else {
            const data = await res.json();
            if (data.url || data.labelUrl) {
              window.open(data.url || data.labelUrl, '_blank');
              setStatus('idle');
              return;
            }
          }
        }
        // Non-ok, non-202 — wait and retry
        if (attempt < MAX_ATTEMPTS) {
          await new Promise(r => setTimeout(r, DELAY_MS));
        }
      } catch {
        if (attempt === MAX_ATTEMPTS) break;
        await new Promise(r => setTimeout(r, DELAY_MS));
      }
    }

    setErrorMsg('Label not ready yet — shipment may still be processing. Try again in a minute.');
    setStatus('error');
  };

  return (
    <div className="w-full space-y-1">
      <button
        onClick={handleDownload}
        disabled={status === 'loading'}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-black text-black text-[10px] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all disabled:opacity-50 disabled:cursor-wait"
      >
        {status === 'loading' ? (
          <><Loader2 size={12} className="animate-spin" /> Generating Label...</>
        ) : (
          <><Package size={12} /> Download Shipping Label</>
        )}
      </button>
      {status === 'error' && errorMsg && (
        <p className="text-[9px] text-red-500 font-bold uppercase tracking-widest text-center leading-tight">{errorMsg}</p>
      )}
    </div>
  );
};
// ─────────────────────────────────────────────────────────────────────────────

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
      formData.append('file', file);
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

const BrandManagementDrawer = ({
  isOpen,
  onClose,
  brands,
  onSave,
  onDelete
}: {
  isOpen: boolean,
  onClose: () => void,
  brands: Brand[],
  onSave: (b: Partial<Brand>) => Promise<void>,
  onDelete: (id: string) => Promise<void>
}) => {
  const [editingBrand, setEditingBrand] = useState<Partial<Brand> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBrand) return;
    setIsSaving(true);
    await onSave(editingBrand);
    setIsSaving(false);
    setEditingBrand(null);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'eigqziuu');
      formData.append('folder', 'grab-go-za');

      const res = await fetch('https://api.cloudinary.com/v1_1/dggitwduo/image/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Upload failed');

      setEditingBrand(prev =>
        prev ? { ...prev, logo: data.secure_url } : null
      );
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
              <h2 className="text-xl font-display font-bold uppercase tracking-tighter">Manage Brands</h2>
              <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-full transition-colors text-black">
                <X size={24} />
              </button>
    </div>

            <div className="mb-6">
              <button
                onClick={() => setEditingBrand({ name: '', description: '', logo: '', banner: '', soldBy: '' })}
                className="w-full py-3 border border-dashed border-gray-200 hover:border-black/20 transition-colors flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest text-black"
              >
                <Plus size={16} /> Add New Brand
              </button>
    </div>

            <div className="flex-grow overflow-y-auto space-y-3 pr-2 custom-scrollbar">
              {brands.map((brand) => (
                <div key={brand.id} className="p-3 border border-gray-50 bg-gray-50/30 flex gap-3 items-center text-black group">
                  <div className="w-10 h-10 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                    {brand.logo ? <img src={brand.logo} alt={brand.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" /> : null}
    </div>
                  <div className="flex-grow">
                    <h4 className="text-xs font-bold uppercase tracking-tight">{brand.name}</h4>
    </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setEditingBrand(brand)}
                      className="p-1.5 hover:bg-black/5 rounded-full transition-colors"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      onClick={() => setDeletingId(brand.id!)}
                      className="p-1.5 hover:bg-red-50 rounded-full transition-colors text-red-500"
                    >
                      <Trash2 size={14} />
                    </button>
    </div>
    </div>
              ))}
    </div>

            {/* Edit Modal */}
            <AnimatePresence>
              {editingBrand && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setEditingBrand(null)}
                    className="absolute inset-0 bg-white/80 backdrop-blur-sm"
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="relative w-full max-w-sm bg-white border border-gray-100 shadow-2xl p-6 text-black"
                  >
                    <h3 className="text-lg font-bold uppercase tracking-tighter mb-6">
                      {editingBrand.id ? 'Edit Brand' : 'New Brand'}
                    </h3>
                    <form onSubmit={handleSave} className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-widest opacity-50">Brand Name</label>
                        <input
                          type="text"
                          required
                          value={editingBrand.name}
                          onChange={(e) => setEditingBrand({ ...editingBrand, name: e.target.value })}
                          className="w-full bg-gray-50 border border-gray-100 px-4 py-2 text-sm focus:border-black outline-none"
                        />
    </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-widest opacity-50">Description</label>
                        <textarea
                          value={editingBrand.description || ''}
                          onChange={(e) => setEditingBrand({ ...editingBrand, description: e.target.value })}
                          className="w-full bg-gray-50 border border-gray-100 px-4 py-2 text-sm focus:border-black outline-none h-20 resize-none"
                        />
    </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-widest opacity-50">Logo</label>
                        <div className="flex gap-2">
                          <div
                            onClick={() => fileInputRef.current?.click()}
                            className="w-12 h-12 border border-dashed border-gray-200 flex items-center justify-center cursor-pointer hover:border-black transition-colors"
                          >
                            {isUploading ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />}
    </div>
                          <input
                            type="text"
                            placeholder="Logo URL"
                            value={editingBrand.logo || ''}
                            onChange={(e) => setEditingBrand({ ...editingBrand, logo: e.target.value })}
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
                      <div className="flex gap-3 pt-4">
                        <button
                          type="button"
                          onClick={() => setEditingBrand(null)}
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
                    <h3 className="text-lg font-bold uppercase tracking-tighter mb-2">Delete Brand?</h3>
                    <p className="text-[10px] text-gray-500 mb-6 uppercase tracking-widest">This may affect products associated with this brand.</p>
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
      formData.append('file', file);
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
        formData.append('file', files[i]);
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
                  onClick={() => setEditingProduct({ name: '', price: 0, category: categories[0]?.name || 'Apparel', image: '', description: '', variants: [] })}
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
                    src={product.image || null}
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

                      {activeTab === 'stock' && (
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
}) => (
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
                  <span>{formatPrice(cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0))}</span>
    </div>
                <div className="flex justify-between items-center text-xs font-mono uppercase tracking-widest opacity-50">
                  <span>Logistics</span>
                  <span>Calculated at checkout</span>
    </div>
                <div className="flex justify-between items-center pt-4">
                  <span className="uppercase tracking-widest text-xs font-bold">Total</span>
                  <span className="text-3xl font-mono font-bold">{formatPrice(cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0))}</span>
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
   const [deliveryMethod, setDeliveryMethod] = useState<ShippingMethod>('standard');
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
    if (deliveryMethod !== 'bobgo') return;
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
    if (deliveryMethod === 'bobgo') return selectedRate?.amount || 89; // Bob Go flat fallback R89
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
        ...(deliveryMethod === 'bobgo' && selectedPickupPoint ? {
          bobGoPickupPoint: {
            id: selectedPickupPoint.id,
            name: selectedPickupPoint.name,
            address: selectedPickupPoint.address,
            suburb: selectedPickupPoint.suburb,
            city: selectedPickupPoint.city,
            province: selectedPickupPoint.province,
            postal_code: selectedPickupPoint.postal_code,
          },
          // Override delivery address with pickup point address for ShipLogic
          deliveryAddress: {
            type: 'business',
            company: selectedPickupPoint.name,
            street_address: selectedPickupPoint.address,
            local_area: selectedPickupPoint.suburb,
            city: selectedPickupPoint.city,
            zone: selectedPickupPoint.province,
            code: selectedPickupPoint.postal_code,
            country: 'ZA',
          },
          specialInstructions: `PUDO Pickup: ${selectedPickupPoint.name} — ${selectedPickupPoint.address}, ${selectedPickupPoint.suburb}. Hours: ${selectedPickupPoint.operating_hours || 'See store'}`,
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
                          style={{display:'none'}} onClick={() => { setDeliveryMethod('bobgo'); setCountry('South Africa'); setSelectedPickupPoint(null); }}
                          className={`flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 py-3 md:py-4 text-[10px] md:text-xs font-bold transition-all ${deliveryMethod === 'bobgo' ? 'bg-gray-50 shadow-inner' : 'bg-white hover:bg-gray-50'}`}
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
                          {deliveryMethod === 'bobgo' && (
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
                                  <p className="text-sm font-semibold">{String(selectedPickupPoint.name || '')}</p>
                                  <p className="text-[10px] text-gray-500">{String(selectedPickupPoint.address || '')}{selectedPickupPoint.suburb ? `, ${String(selectedPickupPoint.suburb)}` : ''}</p>
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
                      By placing an order, you agree to our <Link to="/legal" className="underline font-bold text-black">Terms & Conditions</Link>.
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

// --- Main App ---

const BrandBanner = ({ brand, banner, description, logo }: { brand: string, banner?: string, description?: string, logo?: string }) => (
  <div className="relative w-full h-[30vh] md:h-[40vh] mb-12 group overflow-visible">
    <motion.div
      initial={{ clipPath: 'inset(10% 0% 10% 0%)' }}
      whileInView={{ clipPath: 'inset(0% 0% 0% 0%)' }}
      transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
      className="absolute inset-0 bg-gray-50 overflow-hidden shadow-2xl skew-y-1 md:skew-y-2"
    >
      <div className="absolute inset-0 bg-black/40 z-10 group-hover:bg-black/30 transition-all duration-700" />
      <img
        src={banner || `https://picsum.photos/seed/${brand}/1920/1080?grayscale`}
        alt={brand}
        className="w-full h-full object-cover scale-110 group-hover:scale-100 transition-transform duration-1000 -skew-y-1 md:-skew-y-2"
        referrerPolicy="no-referrer"
      />
    </motion.div>

    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="flex flex-col items-center"
      >
        {logo ? (
          <img
            src={logo}
            alt={brand}
            className="h-16 md:h-24 w-auto object-contain mb-8 brightness-0 invert drop-shadow-2xl"
            referrerPolicy="no-referrer"
          />
        ) : (
          <h2 className="text-4xl md:text-7xl font-display font-bold uppercase tracking-tighter text-white mb-6 leading-none drop-shadow-2xl">{brand}</h2>
        )}

        {description && (
          <p className="max-w-xl text-white/80 text-[10px] md:text-xs uppercase tracking-widest font-bold leading-relaxed hidden md:block border-l border-white/20 pl-6">
            {description}
          </p>
        )}
      </motion.div>
    </div>
  </div>
);

const Breadcrumbs = ({
  categories,
  currentCategory,
  product,
  onCategorySelect
}: {
  categories: Category[],
  currentCategory?: string,
  product?: Product,
  onCategorySelect?: (name: string) => void
}) => {
  const getPath = () => {
    const path: { name: string; id?: string }[] = [];

    if (product) {
      // Find the most specific category for the product
      const productCatNames = product.categories || [];
      const productCats = categories.filter(c => productCatNames.includes(c.name));

      // Prefer sub-categories (those with parentId)
      let targetCat = productCats.find(c => c.parentId) || productCats[0];

      if (targetCat) {
        const buildPath = (cat: Category) => {
          path.unshift({ name: cat.name, id: cat.id });
          if (cat.parentId) {
            const parent = categories.find(c => c.id === cat.parentId);
            if (parent) buildPath(parent);
          }
        };
        buildPath(targetCat);
      }
    } else if (currentCategory && currentCategory !== 'All') {
      const cat = categories.find(c => c.name === currentCategory);
      if (cat) {
        const buildPath = (c: Category) => {
          path.unshift({ name: c.name, id: c.id });
          if (c.parentId) {
            const parent = categories.find(p => p.id === c.parentId);
            if (parent) buildPath(parent);
          }
        };
        buildPath(cat);
      }
    }

    return path;
  };

  const path = getPath();

  return (
    <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-black/30 mb-6 overflow-x-auto no-scrollbar whitespace-nowrap">
      <Link to="/" className="hover:text-black transition-colors">Home</Link>
      {path.map((item, idx) => (
        <React.Fragment key={idx}>
          <ChevronRight size={8} className="flex-shrink-0" />
          <Link
            to={idx === path.length - 1 && !product ? '#' : `/category/${encodeURIComponent(item.name.toLowerCase())}`}
            onClick={() => onCategorySelect?.(item.name)}
            className={`hover:text-black transition-colors ${idx === path.length - 1 && !product ? 'text-black pointer-events-none' : ''}`}
          >
            {item.name}
          </Link>
        </React.Fragment>
      ))}
      {product && (
        <>
          <ChevronRight size={8} className="flex-shrink-0" />
          <span className="text-black truncate max-w-[150px] md:max-w-none">{product.name}</span>
        </>
      )}
    </nav>
  );
};

const CategoryPanel = ({
  categories,
  activeCategory,
  onSelect
}: {
  categories: Category[],
  activeCategory: string,
  onSelect: (c: string) => void
}) => {
  return null;
};


const HowToOrderGuide = () => {
  const steps = [
    { num: 1, icon: <Search size={20} />, title: "Browse & Choose", desc: "Explore our curated collections. Use categories or search to find your gear.", color: "bg-[#06402B]" },
    { num: 2, icon: <Ruler size={20} />, title: "Pick Your Size", desc: "Check the size guide on each product. Between sizes? Go one up for a relaxed fit.", color: "bg-[#06402B]" },
    { num: 3, icon: <ShoppingCart size={20} />, title: "Add to Cart", desc: "Hit 'Add to Cart' or 'Buy Now' for instant checkout. Cart icon shows your count.", color: "bg-[#18A374]" },
    { num: 4, icon: <CreditCard size={20} />, title: "Secure Checkout", desc: "Fill in your details. Pay safely with Visa, Mastercard, Apple Pay or Google Pay via Yoco.", color: "bg-[#06402B]" },
    { num: 5, icon: <Package size={20} />, title: "We Ship It", desc: "Standard delivery 5-10 days. Free on orders over R650! Track your order anytime.", color: "bg-[#06402B]" },
    { num: 6, icon: <CheckCircle2 size={20} />, title: "Rock It", desc: "Unbox your fresh gear. Not happy? Easy 14-day returns, no stress.", color: "bg-[#18A374]" },
  ];

  return (
    <section className="max-w-[1800px] mx-auto px-4 md:px-10 py-16 md:py-24">
      <div className="text-center mb-12">
        <p className="text-[9px] font-black uppercase tracking-[0.5em] text-[#06402B] mb-3">Simple as 1-2-3</p>
        <h2 className="text-3xl md:text-5xl font-display font-black uppercase tracking-tighter text-black">How to Order</h2>
    </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
        {steps.map((step, i) => (
          <motion.div
            key={step.num}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="group text-center"
          >
            <div className={`${step.color} w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center text-white mx-auto mb-4 group-hover:scale-110 transition-transform shadow-lg`}>
              {step.icon}
    </div>
            <div className="text-[9px] font-black text-[#06402B] uppercase tracking-widest mb-1">Step {step.num}</div>
            <h3 className="text-sm font-black uppercase tracking-tight text-black mb-1">{step.title}</h3>
            <p className="text-[10px] text-gray-400 leading-relaxed">{step.desc}</p>
          </motion.div>
        ))}
    </div>
      
      <div className="text-center mt-10">
        <p className="text-[10px] text-gray-400 uppercase tracking-wider">
          Questions? Our <span className="text-[#06402B] font-bold cursor-pointer hover:underline" onClick={() => document.querySelector('.fixed.bottom-6.right-6')?.dispatchEvent(new Event('click'))}>chat support</span> is always ready to help.
        </p>
    </div>
    </section>
  );
};

const PromoGrid = ({ products = [], categories = [] }: { products: Product[]; categories: Category[] }) => {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(true);
  const [imgIdx, setImgIdx] = React.useState<Record<string, number>>({});

  // Deduplicated product cards — discounted items first
  const promoCards = React.useMemo(() => {
    const seen = new Set<string>();
    return [...products]
      .sort((a, b) => {
        const da = (a.originalPrice && a.price) ? ((a.originalPrice - a.price) / a.originalPrice) : 0;
        const db = (b.originalPrice && b.price) ? ((b.originalPrice - b.price) / b.originalPrice) : 0;
        return db - da;
      })
      .filter(p => {
        const img = (p.images && p.images[0]) || p.image || '';
        if (!img || seen.has(img)) return false;
        seen.add(img);
        return true;
      })
      .slice(0, 14);
  }, [products]);

  // Cycle images within each card (staggered intervals)
  React.useEffect(() => {
    const timers: ReturnType<typeof setInterval>[] = [];
    promoCards.forEach((p, i) => {
      const imgs = (p.images && p.images.length > 1) ? p.images : null;
      if (!imgs) return;
      const t = setInterval(() => {
        setImgIdx(prev => ({ ...prev, [p.id]: ((prev[p.id] ?? 0) + 1) % imgs.length }));
      }, 4200 + i * 300);
      timers.push(t);
    });
    return () => timers.forEach(clearInterval);
  }, [promoCards]);

  const scroll = (dir: 'left' | 'right') => {
    scrollRef.current?.scrollBy({ left: dir === 'right' ? 340 : -340, behavior: 'smooth' });
  };

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  };

  if (promoCards.length === 0) return null;

  return (
    <section className="max-w-[1800px] mx-auto px-4 md:px-10 py-12 md:py-24">
      <div className="flex items-end justify-between mb-8">
        <div>
          <h2 className="text-4xl md:text-6xl font-display font-bold uppercase tracking-tighter text-black leading-none">Browse<br />the Range</h2>
          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-black/30 mt-3">Shop by Collection</p>
        </div>
        <div className="hidden md:flex items-center gap-2">
          <button onClick={() => scroll('left')} disabled={!canScrollLeft} className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:border-black hover:text-black transition-all disabled:opacity-20 disabled:cursor-not-allowed">
            <ChevronLeft size={16} />
          </button>
          <button onClick={() => scroll('right')} disabled={!canScrollRight} className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:border-black hover:text-black transition-all disabled:opacity-20 disabled:cursor-not-allowed">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties}
      >
        {promoCards.map(p => {
          const imgs = (p.images && p.images.length) ? p.images : p.image ? [p.image] : [];
          const currentImg = imgs[imgIdx[p.id] ?? 0] ?? imgs[0];
          const discount = (p.originalPrice && p.price && p.originalPrice > p.price)
            ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100) : 0;
          const cat = (p.categories && p.categories[0]) || p.brand || '';
          return (
            <motion.div
              key={p.id}
              whileHover={{ y: -4 }}
              transition={{ duration: 0.22 }}
              className="flex-none w-[240px] md:w-[280px] snap-start cursor-pointer group"
              onClick={() => window.location.assign(`/product/${p.id}`)}
            >
              <div className="relative w-full aspect-[3/4] rounded-xl overflow-hidden bg-gray-100 mb-3">
                {currentImg ? (
                  <img key={currentImg} src={currentImg} alt={p.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    loading="lazy" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-full h-full bg-gray-200 animate-pulse" />
                )}
                {discount > 0 && (
                  <div className="absolute top-3 left-3 px-2 py-1 bg-[#18A374] text-white text-[9px] font-black uppercase tracking-wider">
                    -{discount}%
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-end p-3">
                  <span className="text-[9px] font-black uppercase tracking-[0.25em] text-white flex items-center gap-1">View <ChevronRight size={10} /></span>
                </div>
              </div>
              <div>
                {cat && <p className="text-[9px] font-black uppercase tracking-[0.3em] text-black/30 mb-1 truncate">{cat}</p>}
                <p className="text-sm font-bold uppercase tracking-tight text-black leading-tight mb-1.5 truncate">{p.name}</p>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-black">R{p.price?.toLocaleString()}</span>
                  {p.originalPrice && p.originalPrice > p.price && (
                    <span className="text-xs text-black/30 line-through">R{p.originalPrice?.toLocaleString()}</span>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}

        {/* See All end-cap */}
        <div
          className="flex-none w-[180px] snap-start flex items-center justify-center cursor-pointer group"
          onClick={() => document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' })}
        >
          <div className="text-center">
            <div className="w-12 h-12 rounded-full border-2 border-black flex items-center justify-center mx-auto mb-3 group-hover:bg-black group-hover:text-white transition-all duration-300">
              <ChevronRight size={18} />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-black">See All</p>
          </div>
        </div>
      </div>
    </section>
  );
};

const FilterDropdown = ({
  label,
  value,
  options,
  onChange,
  onClear,
  displayValue,
  isOpen,
  onToggle
}: {
  label: string,
  value: any,
  options: { value: any, label: string | React.ReactNode }[],
  onChange: (v: any) => void,
  onClear: () => void,
  displayValue?: string | React.ReactNode,
  isOpen: boolean,
  onToggle: () => void
}) => {
  const selectedCount = (value === 'All' || value === Infinity) ? 0 : 1;

  return (
    <div className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); onToggle(); }}
        className={`group flex items-center justify-between gap-2 py-1.5 border-b-2 transition-all duration-300 w-auto min-w-[100px] md:min-w-[140px] text-left ${isOpen ? 'border-[#06402B]' : 'border-gray-50 hover:border-black'}`}
      >
        <span className="text-[8px] md:text-[9px] font-black uppercase tracking-[0.15em] text-black whitespace-nowrap">
          {label}
        </span>
        <ChevronDown size={10} className={`transition-transform duration-500 ease-out ${isOpen ? 'rotate-180 text-[#06402B]' : 'text-black'}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="absolute top-full left-0 mt-2 w-[280px] md:w-[320px] bg-white shadow-[0_30px_60px_-12px_rgba(0,0,0,0.25)] z-[100] p-6 md:p-8 border border-gray-100 rounded-sm"
          >
            <div className="flex items-center justify-between mb-6 pb-6 border-b border-gray-100">
              <div className="flex flex-col gap-1">
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-black">
                  {selectedCount} Selected
                </span>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest truncate max-w-[140px]">
                  {displayValue || 'All'}
                </span>
    </div>
              <button
                onClick={(e) => { e.stopPropagation(); onClear(); }}
                className="px-4 py-2 border border-black text-[9px] font-black uppercase tracking-[0.2em] hover:bg-black hover:text-white transition-all transform active:scale-95"
              >
                Reset
              </button>
    </div>

            <div className="space-y-0.5 max-h-[300px] md:max-h-[350px] overflow-y-auto no-scrollbar pr-2">
              {options.map((option) => {
                const isSelected = value === option.value;
                return (
                  <button
                    key={JSON.stringify(option.value)}
                    onClick={(e) => { e.stopPropagation(); onChange(option.value); onToggle(); }}
                    className="flex items-center gap-4 w-full group text-left py-3 border-b border-gray-50 last:border-0 last:pb-0"
                  >
                    <div className={`w-5 h-5 rounded-sm border-2 flex items-center justify-center transition-all duration-300 ${isSelected ? 'border-[#06402B] bg-[#06402B]' : 'border-gray-200 group-hover:border-black'}`}>
                      {isSelected && <div className="w-2 h-2 bg-white rounded-full animate-in fade-in zoom-in duration-300" />}
    </div>
                    <span className={`text-[11px] font-black uppercase tracking-wider transition-all duration-300 ${isSelected ? 'text-black translate-x-1' : 'text-gray-400 group-hover:text-black group-hover:translate-x-1'}`}>
                      {option.label}
                    </span>
                  </button>
                );
              })}
    </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* <SupportChat /> */}
    </div>
  );
};

const FilterBar = ({
  sortBy,
  setSortBy,
  filterBrand,
  setFilterBrand,
  maxPrice,
  setMaxPrice,
  activeDropdown,
  setActiveDropdown,
  sortOptions,
  brandOptions,
  priceOptions,
  searchQuery,
  topOffset = "sticky top-[56px] md:top-[60px]"
}: any) => {
  return (
    <div className={`${topOffset} z-40 py-1.5 md:py-2 px-4 md:px-10 bg-white border-b border-gray-100 shadow-sm transition-all duration-300`}>
      <div className="max-w-[1800px] mx-auto flex items-center justify-between gap-3">
        <div className="flex flex-nowrap items-center gap-4 md:gap-8 overflow-x-auto no-scrollbar py-0.5 w-full md:w-auto" onClick={e => e.stopPropagation()}>
          <FilterDropdown
            label="Sort By"
            value={sortBy}
            options={sortOptions}
            onChange={setSortBy}
            onClear={() => setSortBy('default')}
            displayValue={sortOptions.find((o: any) => o.value === sortBy)?.label as string}
            isOpen={activeDropdown === 'sort'}
            onToggle={() => setActiveDropdown(activeDropdown === 'sort' ? null : 'sort')}
          />

          <FilterDropdown
            label="Brand"
            value={filterBrand}
            options={brandOptions}
            onChange={setFilterBrand}
            onClear={() => setFilterBrand('All')}
            displayValue={filterBrand}
            isOpen={activeDropdown === 'brands'}
            onToggle={() => setActiveDropdown(activeDropdown === 'brands' ? null : 'brands')}
          />

          <FilterDropdown
            label="Price"
            value={maxPrice}
            options={priceOptions}
            onChange={setMaxPrice}
            onClear={() => setMaxPrice(Infinity)}
            displayValue={maxPrice === Infinity ? 'All' : `Under R${maxPrice}`}
            isOpen={activeDropdown === 'price'}
            onToggle={() => setActiveDropdown(activeDropdown === 'price' ? null : 'price')}
          />
        </div>

        {searchQuery && (
          <div className="hidden lg:flex items-center gap-2 opacity-30">
            <Search size={10} />
            <p className="text-[8px] font-black uppercase tracking-widest whitespace-nowrap">
              "{searchQuery}"
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

const HomePage = ({
  filteredAndSortedProducts,
  filterBrand,
  setFilterBrand,
  maxPrice,
  setMaxPrice,
  sortBy,
  setSortBy,
  scrollProducts,
  productScrollRef,
  addToCart,
  handleBuyNow,
  onEmailDetails,
  searchQuery,
  wishlist,
  toggleWishlist,
  isCartLoading = false,
  brands,
  categories,
  testimonials,
  partners,
  onClearAll
}: {
  filteredAndSortedProducts: Product[],
  filterBrand: string,
  setFilterBrand: (b: string) => void,
  maxPrice: number,
  setMaxPrice: (p: number) => void,
  sortBy: string,
  setSortBy: (s: any) => void,
  scrollProducts: (d: 'left' | 'right') => void,
  productScrollRef: React.RefObject<HTMLDivElement | null>,
  addToCart: (p: Product, v?: Record<string, string>, q?: number) => void,
  handleBuyNow: (p: Product, v?: Record<string, string>) => void,
  onEmailDetails: (p: Product) => void,
  searchQuery: string,
  wishlist: string[],
  toggleWishlist: (productId: string) => void,
  isCartLoading?: boolean,
  brands: Brand[],
  categories: Category[],
  testimonials: Testimonial[],
  partners: Partner[],
  onClearAll: () => void
}) => {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = () => setActiveDropdown(null);
    if (activeDropdown) {
      window.addEventListener('click', handleClickOutside);
    }
    return () => window.removeEventListener('click', handleClickOutside);
  }, [activeDropdown]);

  const brandOptions = [
    { value: 'All', label: 'All Brands' },
    ...brands.map(b => ({ value: b.name, label: b.name }))
  ];

  const brandNames = useMemo(() => {
    const b = new Set<string>();
    filteredAndSortedProducts.forEach(p => {
      if (p.brand) b.add(p.brand);
    });
    return Array.from(b);
  }, [filteredAndSortedProducts]);

  const sortOptions = [
    { value: 'default', label: 'Recommended' },
    { value: 'price-high', label: 'Price: High — Low' },
    { value: 'price-low', label: 'Price: Low — High' },
  ];

  const priceOptions = [
    { value: Infinity, label: 'All Prices' },
    { value: 100, label: <span>Under <span className="text-[#06402B]">R100</span></span> },
    { value: 200, label: <span>Under <span className="text-[#06402B]">R200</span></span> },
    { value: 400, label: <span>Under <span className="text-[#06402B]">R400</span></span> },
    { value: 600, label: <span>Under <span className="text-[#06402B]">R600</span></span> },
    { value: 800, label: <span>Under <span className="text-[#06402B]">R800</span></span> },
  ];

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Grab & Go",
    "url": "https://grabandgo.co.za",
    "logo": "https://grabandgo.co.za/logo.png",
    "description": "Premium Streetwear & Lifestyle Store. Shop exclusive brands, sneakers, and high-quality gear in South Africa.",
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+27-00-000-0000",
      "contactType": "customer service",
      "areaServed": "ZA",
      "availableLanguage": "English"
    },
    "sameAs": [
      "https://facebook.com/grabandgo",
      "https://instagram.com/grabandgo"
    ]
  };

  return (
    <main className="bg-white text-black">
      <SEO
        title="Home | Premium Streetwear & Lifestyle Store"
        description="Grab & Go is your destination for premium streetwear, sneakers, and lifestyle essentials in South Africa. Exclusive brands, fast delivery, and high-quality gear."
        schema={organizationSchema}
      />
      <Hero />
      <FilterBar
        sortBy={sortBy}
        setSortBy={setSortBy}
        filterBrand={filterBrand}
        setFilterBrand={setFilterBrand}
        maxPrice={maxPrice}
        setMaxPrice={setMaxPrice}
        activeDropdown={activeDropdown}
        setActiveDropdown={setActiveDropdown}
        brandOptions={brandOptions}
        sortOptions={sortOptions}
        priceOptions={priceOptions}
        searchQuery={searchQuery}
        topOffset="sticky top-[56px] md:top-[60px]"
      />

      <PromoGrid products={filteredAndSortedProducts} categories={categories} />

      {/* Products anchor for hero scroll */}
      <div id="products-section" />

      {/* Brand Sections with Banners */}
      {brandNames.map(brandName => {
        const brandProducts = filteredAndSortedProducts.filter(p => p.brand === brandName);
        const brandInfo = brands.find(b => b.name === brandName || b.id === brandProducts[0]?.brandId);

        return (
          <section key={brandName} className="pb-8">
            <BrandBanner
              brand={brandName}
              banner={brandInfo?.banner || brandProducts[0]?.brandBanner}
              description={brandInfo?.description || brandProducts[0]?.brandDescription}
              logo={brandInfo?.logo || brandProducts[0]?.soldByLogo}
            />
            <div className="max-w-[1800px] mx-auto px-4 md:px-10">
              <div className="space-y-8">
                {categories.filter(c => !c.parentId).map(cat => {
                  const catProducts = brandProducts.filter(p => (p.categories || []).includes(cat.name));
                  if (catProducts.length === 0) return null;
                  return (
                    <div key={cat.id}>
                      <div className="flex items-center gap-6 mb-4">
                        <h3 className="text-[10px] font-bold uppercase tracking-[0.4em] text-black">{cat.name}</h3>
                        <div className="flex-grow h-[1px] bg-gray-100" />
                        <span className="text-[9px] font-medium text-gray-300 uppercase tracking-widest">{catProducts.length} Items</span>
    </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 gap-y-6">
                        {catProducts.map((product, idx) => (
                          <ProductCard
                            key={product.id ? `brand-${brandName}-${product.id}` : `brand-${brandName}-${idx}`}
                            product={product}
                            onAddToCart={addToCart}
                            onEmailDetails={onEmailDetails}
                            onBuyNow={handleBuyNow}
                            isWishlisted={wishlist.includes(product.id)}
                            onToggleWishlist={toggleWishlist}
                            isLoading={isCartLoading}
                          />
                        ))}
    </div>
    </div>
                  );
                })}
    </div>
    </div>
          </section>
        );
      })}

      {/* Fallback for products without brands */}
      {filteredAndSortedProducts.filter(p => !p.brand).length > 0 && (
        <section className="py-24 px-6 border-t border-gray-100">
          <div className="max-w-7xl mx-auto">
            <div className="mb-16">
              <h2 className="text-4xl font-display font-bold uppercase tracking-tighter mb-2 text-black">More Essentials</h2>
              <p className="text-[10px] opacity-40 uppercase tracking-widest text-black">Handpicked for you</p>
    </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-10">
              {filteredAndSortedProducts.filter(p => !p.brand).map((product, idx) => (
                <ProductCard
                  key={product.id ? `grid-${product.id}` : `grid-fallback-${idx}`}
                  product={product}
                  onAddToCart={addToCart}
                  onEmailDetails={onEmailDetails}
                  onBuyNow={handleBuyNow}
                  isWishlisted={wishlist.includes(product.id)}
                  onToggleWishlist={toggleWishlist}
                  isLoading={isCartLoading}
                />
              ))}
    </div>
    </div>
        </section>
      )}

      {filteredAndSortedProducts.length === 0 && (
        <div className="py-40 text-center">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Search size={32} className="opacity-10" />
    </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-30 text-black">
            No products match your selection
          </p>
          <button
            onClick={onClearAll}
            className="mt-6 text-[10px] font-black uppercase tracking-widest underline underline-offset-4 hover:opacity-60 transition-opacity"
          >
            Clear All Filters
          </button>
    </div>
      )}

      {/* Shop by Category grid — only shown if categories have images */}
      {categories.filter(c => !c.parentId && c.image).length > 0 && (
        <section className="py-16 md:py-24 px-4 md:px-10 bg-gray-50/40">
          <div className="max-w-[1800px] mx-auto">
            <div className="flex items-end justify-between mb-10 md:mb-14">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.4em] text-black/30 mb-2">Browse by Category</p>
                <h2 className="text-3xl md:text-5xl font-display font-black uppercase tracking-tighter text-black leading-none">Shop<br />The Look</h2>
    </div>
              <Link to="/" className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-black transition-colors flex items-center gap-2 pb-1">
                View All <ArrowRight size={12} />
              </Link>
    </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 md:gap-4">
              {categories.filter(c => !c.parentId && c.image).slice(0, 6).map(cat => (
                <Link
                  key={cat.id}
                  to={`/category/${encodeURIComponent(cat.name.toLowerCase())}`}
                  className="group relative aspect-[3/4] overflow-hidden bg-gray-100 rounded-sm"
                >
                  <img
                    src={cat.image}
                    alt={cat.name}
                    loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-white leading-tight">{cat.name}</p>
                    <p className="text-[8px] text-white/60 uppercase tracking-widest mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                      Shop Now <ArrowRight size={8} />
                    </p>
    </div>
                </Link>
              ))}
    </div>
    </div>
        </section>
      )}

      <InstagramFeed />
      <PartnershipHub partners={partners} />
    </main>
  );
};

// ─── Category Page (MyRunway-style) ─────────────────────────────────────────

const CategoryPage = ({
  products,
  categories,
  brands,
  addToCart,
  handleBuyNow,
  onEmailDetails,
  wishlist,
  toggleWishlist,
  isCartLoading,
  showToast
}: {
  products: Product[];
  categories: Category[];
  brands: Brand[];
  addToCart: (p: Product, v?: Record<string, string>, q?: number) => void;
  handleBuyNow: (p: Product, v?: Record<string, string>) => void;
  onEmailDetails: (p: Product) => void;
  wishlist: string[];
  toggleWishlist: (id: string) => void;
  isCartLoading: boolean;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}) => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [sortBy, setSortBy] = useState<'default' | 'price-low' | 'price-high' | 'newest'>('default');
  const [maxPrice, setMaxPrice] = useState<number>(Infinity);
  const [filterBrand, setFilterBrand] = useState<string>('All');
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [selectedSubCat, setSelectedSubCat] = useState<string>('All');

  // Resolve category from slug
  const decodedSlug = slug ? decodeURIComponent(slug) : '';
  const matchedCat = categories.find(c => c.name.toLowerCase() === decodedSlug);
  const categoryName = matchedCat?.name || decodedSlug.charAt(0).toUpperCase() + decodedSlug.slice(1);

  // Sub-categories of this category
  const subCats = matchedCat
    ? categories.filter(c => c.parentId === matchedCat.id)
    : [];

  // Products in this category or its sub-categories
  const categoryProducts = useMemo(() => {
    let result = products.filter(p => {
      const cats = p.categories || [];
      if (matchedCat) {
        const subNames = categories.filter(c => c.parentId === matchedCat.id).map(c => c.name);
        return cats.includes(matchedCat.name) || subNames.some(sn => cats.includes(sn));
      }
      return cats.some(c => c.toLowerCase() === decodedSlug.toLowerCase());
    });

    if (selectedSubCat !== 'All') {
      result = result.filter(p => (p.categories || []).includes(selectedSubCat));
    }
    if (filterBrand !== 'All') {
      result = result.filter(p => p.brand === filterBrand);
    }
    if (maxPrice !== Infinity) {
      result = result.filter(p => p.price <= maxPrice);
    }
    if (sortBy === 'price-low') result.sort((a, b) => a.price - b.price);
    else if (sortBy === 'price-high') result.sort((a, b) => b.price - a.price);
    return result;
  }, [products, categories, matchedCat, decodedSlug, selectedSubCat, filterBrand, maxPrice, sortBy]);

  // Close dropdown on outside click
  useEffect(() => {
    const close = () => setActiveDropdown(null);
    if (activeDropdown) window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, [activeDropdown]);

  useEffect(() => {
    window.scrollTo(0, 0);
    setMaxPrice(Infinity);
    setSortBy('default');
    setSelectedSubCat('All');
    setFilterBrand('All');
  }, [slug]);

  const brandOptions = [
    { value: 'All', label: 'All Brands' },
    ...brands.map(b => ({ value: b.name, label: b.name }))
  ];

  const sortOptions = [
    { value: 'default', label: 'Recommended' },
    { value: 'price-low', label: 'Price: Low — High' },
    { value: 'price-high', label: 'Price: High — Low' },
  ];

  const priceOptions = [
    { value: Infinity, label: 'All Prices' },
    { value: 200, label: 'Under R200' },
    { value: 400, label: 'Under R400' },
    { value: 800, label: 'Under R800' },
    { value: 1500, label: 'Under R1500' },
  ];

  const brandNames = useMemo(() => {
    const b = new Set<string>();
    categoryProducts.forEach(p => { if (p.brand) b.add(p.brand); });
    return Array.from(b);
  }, [categoryProducts]);

  return (
    <main className="bg-white text-black min-h-screen pt-16 md:pt-20">
      <SEO
        title={`${categoryName} | Grab & Go`}
        description={matchedCat?.description || `Shop ${categoryName} at Grab & Go — premium streetwear and lifestyle essentials delivered across South Africa.`}
        image={matchedCat?.image || undefined}
        url={`https://grabandgo.co.za/category/${slug}`}
      />
      {/* Category Hero */}
      <div className="relative h-[28vh] md:h-[40vh] bg-gray-900 overflow-hidden">
        {matchedCat?.image ? (
          <img src={matchedCat.image} alt={categoryName} loading="lazy"
          className="absolute inset-0 w-full h-full object-cover opacity-60" referrerPolicy="no-referrer" />
        ) : (
          <img src={`https://picsum.photos/seed/${categoryName}/1920/600?grayscale`} alt={categoryName} className="absolute inset-0 w-full h-full object-cover opacity-40" referrerPolicy="no-referrer" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        <div className="absolute inset-0 flex flex-col justify-end px-6 md:px-12 pb-8 md:pb-12">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-white/50 mb-3">
            <button onClick={() => navigate('/')} className="hover:text-white transition-colors">Home</button>
            <ChevronRight size={8} />
            <span className="text-white">{categoryName}</span>
          </nav>
          <h1 className="text-3xl md:text-6xl font-display font-black uppercase tracking-tighter text-white leading-none">
            {categoryName}
          </h1>
          <p className="text-[10px] text-white/50 uppercase tracking-[0.3em] mt-2 font-bold">
            {categoryProducts.length} items
          </p>
    </div>
    </div>

      {/* Sub-category tabs */}
      {subCats.length > 0 && (
        <div className="sticky top-14 md:top-[60px] z-30 bg-white border-b border-gray-100 px-4 md:px-10">
          <div className="max-w-[1800px] mx-auto flex items-center gap-0 overflow-x-auto no-scrollbar">
            {[{ id: 'all', name: 'All' }, ...subCats].map(sc => (
              <button
                key={sc.id || 'all'}
                onClick={() => setSelectedSubCat(sc.name === 'All' ? 'All' : sc.name)}
                className={`flex-shrink-0 px-5 py-4 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all ${
                  selectedSubCat === (sc.name === 'All' ? 'All' : sc.name)
                    ? 'border-black text-black'
                    : 'border-transparent text-gray-400 hover:text-black hover:border-gray-300'
                }`}
              >
                {sc.name}
              </button>
            ))}
    </div>
    </div>
      )}

      {/* Filter bar */}
      <FilterBar
        sortBy={sortBy}
        setSortBy={setSortBy}
        filterBrand={filterBrand}
        setFilterBrand={setFilterBrand}
        maxPrice={maxPrice}
        setMaxPrice={setMaxPrice}
        activeDropdown={activeDropdown}
        setActiveDropdown={setActiveDropdown}
        brandOptions={brandOptions}
        sortOptions={sortOptions}
        priceOptions={priceOptions}
        topOffset={subCats.length > 0 ? 'top-[110px] md:top-[120px]' : 'top-[56px] md:top-[64px]'}
      />

      {/* Products — grouped by brand if multiple brands, otherwise plain grid */}
      <div className="max-w-[1800px] mx-auto px-4 md:px-10 py-10 md:py-16">
        {categoryProducts.length === 0 ? (
          <div className="py-32 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search size={24} className="opacity-20" />
    </div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-30">No products in this category yet</p>
            <button onClick={() => navigate('/')} className="mt-6 text-[10px] font-black uppercase tracking-widest underline underline-offset-4 hover:opacity-60 transition-opacity">
              Browse All Products
            </button>
    </div>
        ) : brandNames.length > 1 ? (
          // Multi-brand layout: brand sections
          <div className="space-y-16">
            {brandNames.map(brandName => {
              const brandProducts = categoryProducts.filter(p => p.brand === brandName);
              const brandInfo = brands.find(b => b.name === brandName);
              return (
                <div key={brandName}>
                  <div className="flex items-center gap-6 mb-6 pb-4 border-b border-gray-100">
                    {(brandInfo?.logo || brandProducts[0]?.soldByLogo) ? (
                      <img src={brandInfo?.logo || brandProducts[0]?.soldByLogo} alt={brandName} className="h-8 object-contain grayscale" referrerPolicy="no-referrer" />
                    ) : (
                      <h2 className="text-sm font-black uppercase tracking-[0.3em] text-black">{brandName}</h2>
                    )}
                    <div className="flex-grow h-[1px] bg-gray-100" />
                    <span className="text-[9px] text-gray-300 uppercase tracking-widest font-bold">{brandProducts.length} items</span>
    </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 gap-y-8">
                    {brandProducts.map((product, idx) => (
                      <ProductCard
                        key={product.id || idx}
                        product={product}
                        onAddToCart={addToCart}
                        onEmailDetails={onEmailDetails}
                        onBuyNow={handleBuyNow}
                        isWishlisted={wishlist.includes(product.id)}
                        onToggleWishlist={toggleWishlist}
                        isLoading={isCartLoading}
                      />
                    ))}
    </div>
    </div>
              );
            })}
            {/* Products without brand */}
            {categoryProducts.filter(p => !p.brand).length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 gap-y-8">
                {categoryProducts.filter(p => !p.brand).map((product, idx) => (
                  <ProductCard
                    key={product.id || idx}
                    product={product}
                    onAddToCart={addToCart}
                    onEmailDetails={onEmailDetails}
                    onBuyNow={handleBuyNow}
                    isWishlisted={wishlist.includes(product.id)}
                    onToggleWishlist={toggleWishlist}
                    isLoading={isCartLoading}
                  />
                ))}
    </div>
            )}
    </div>
        ) : (
          // Single-brand or unbranded: clean grid like MyRunway
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 gap-y-8">
            {categoryProducts.map((product, idx) => (
              <ProductCard
                key={product.id || idx}
                product={product}
                onAddToCart={addToCart}
                onEmailDetails={onEmailDetails}
                onBuyNow={handleBuyNow}
                isWishlisted={wishlist.includes(product.id)}
                onToggleWishlist={toggleWishlist}
                isLoading={isCartLoading}
              />
            ))}
    </div>
        )}
    </div>
    </main>
  );
};

// ─────────────────────────────────────────────────────────────────────────────

const ProductPage = ({
  products,
  addToCart,
  handleBuyNow,
  onEmailDetails,
  searchQuery,
  wishlist,
  onToggleWishlist,
  isCartLoading = false,
  categories,
  brands
}: {
  products: Product[],
  addToCart: (p: Product, v?: Record<string, string>, q?: number) => void,
  handleBuyNow: (p: Product, v?: Record<string, string>) => void,
  onEmailDetails: (p: Product) => void,
  searchQuery: string,
  wishlist: string[],
  onToggleWishlist: (productId: string) => void,
  isCartLoading?: boolean,
  categories: Category[],
  brands: Brand[]
}) => {
  const { id } = useParams();
  const product = products.find(p => p.id === id);

  if (!product) {
    return <NotFoundPage />;
  }

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "image": product.image,
    "description": product.description,
    "brand": {
      "@type": "Brand",
      "name": product.brand || "Grab & Go"
    },
    "sku": product.id,
    "offers": {
      "@type": "Offer",
      "url": `https://grabandgo.co.za/product/${product.id}`,
      "priceCurrency": "ZAR",
      "price": product.price,
      "itemCondition": "https://schema.org/NewCondition",
      "availability": "https://schema.org/InStock",
      "seller": {
        "@type": "Organization",
        "name": "Grab & Go"
      }
    }
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://grabandgo.co.za/"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": product.categories?.[0] || "Products",
        "item": `https://grabandgo.co.za/?category=${product.categories?.[0] || ""}`
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": product.name,
        "item": `https://grabandgo.co.za/product/${product.id}`
      }
    ]
  };

  return (
    <main>
      <SEO
        title={product.name}
        description={product.description.substring(0, 160)}
        image={product.image}
        url={`https://grabandgo.co.za/product/${product.id}`}
        type="product"
        schema={[productSchema, breadcrumbSchema]}
      />
      <ProductDetailContent
        product={product}
        allProducts={products}
        onAddToCart={addToCart}
        onBuyNow={handleBuyNow}
        onEmailDetails={onEmailDetails}
        searchQuery={searchQuery}
        wishlist={wishlist}
        onToggleWishlist={onToggleWishlist}
        isCartLoading={isCartLoading}
        categories={categories}
        brands={brands}
      />
    </main>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AppContent />
      <FAQChatbot />
    </BrowserRouter>
    </ErrorBoundary>
  );
}

function AppContent() {
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('grab_and_go_cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [orders, setOrders] = useState<Order[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isOrdersOpen, setIsOrdersOpen] = useState(false);
  const [isProductsOpen, setIsProductsOpen] = useState(false);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const [isBrandsOpen, setIsBrandsOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isHowToOrderOpen, setIsHowToOrderOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'success' | 'cancelled' | 'processing' | null>(null);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [isCartLoading, setIsCartLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const productScrollRef = useRef<HTMLDivElement>(null);

  // --- Auth Check ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userData = await authService.getCurrentUser();
          setUser(userData);
        } catch (error: any) {
          console.error("Error fetching user profile:", error);

          let errorMessage = "Profile fetch failed";
          try {
            const parsed = JSON.parse(error.message);
            if (parsed.error) errorMessage = parsed.error;
          } catch (e) {}

          // Fallback if profile fetch fails
          const nameParts = firebaseUser.displayName?.split(' ') || ['User'];
          setUser({
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            firstName: nameParts[0] || 'User',
            lastName: nameParts.slice(1).join(' ') || 'Customer',
            role: 'user'
          });
        }
      } else {
        setUser(null);
      }
      setIsAuthReady(true);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user?.wishlist) {
      setWishlist(user.wishlist);
    } else {
      setWishlist([]);
    }
  }, [user]);

  // --- Data Fetching ---
  useEffect(() => {
    const fetchData = async () => {
      setIsDataLoading(true);
      try {
        console.log("Fetching products, categories, brands, testimonials and partners...");
        const [productsData, categoriesData, brandsData, testimonialsData, partnersData] = await Promise.all([
          productService.getProducts().catch(err => {
            console.error("Products fetch error:", err);
            return [];
          }),
          categoryService.getCategories().catch(err => {
            console.error("Categories fetch error:", err);
            return [];
          }),
          brandService.getBrands().catch(err => {
            console.error("Brands fetch error:", err);
            return [];
          }),
          testimonialService.getTestimonials().catch(err => {
            console.error("Testimonials fetch error:", err);
            return [];
          }),
          partnerService.getPartners().catch(err => {
            console.error("Partners fetch error:", err);
            return [];
          })
        ]);

        console.log("Products received:", productsData?.length || 0);
        console.log("Categories received:", categoriesData?.length || 0);
        console.log("Brands received:", brandsData?.length || 0);
        console.log("Testimonials received:", testimonialsData?.length || 0);
        console.log("Partners received:", partnersData?.length || 0);

        setProducts(Array.isArray(productsData) ? productsData : []);
        setCategories(Array.isArray(categoriesData) ? categoriesData : []);
        setBrands(Array.isArray(brandsData) ? brandsData : []);
        setTestimonials(Array.isArray(testimonialsData) ? testimonialsData : []);
        setPartners(Array.isArray(partnersData) ? partnersData : []);
      } catch (error) {
        console.error("Critical error fetching data:", error);
        setProducts([]);
        setCategories([]);
        setBrands([]);
        setTestimonials([]);
        setPartners([]);
      } finally {
        setIsDataLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (!isAuthReady || !user) {
      setOrders([]);
      return;
    }

    const fetchOrders = async () => {
      try {
        const data = await orderService.getOrders();
        setOrders(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching orders:", error);
        setOrders([]);
      }
    };
    fetchOrders();
  }, [user, isAuthReady]);

  const scrollProducts = (direction: 'left' | 'right') => {
    if (productScrollRef.current) {
      const { scrollLeft, clientWidth } = productScrollRef.current;
      const scrollAmount = clientWidth * 0.8;
      const scrollTo = direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount;
      productScrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  const toggleWishlist = async (productId: string) => {
    if (!user) {
      setIsAuthOpen(true);
      setToast({ message: 'Sign in to save to your wishlist', type: 'error' });
      return;
    }
    const isAdding = !wishlist.includes(productId);
    const newWishlist = isAdding
      ? [...wishlist, productId]
      : wishlist.filter(id => id !== productId);

    setWishlist(newWishlist);
    try {
      await authService.updateWishlist(newWishlist);
      setToast({
        message: isAdding ? "Added to wishlist" : "Removed from wishlist",
        type: 'success'
      });
    } catch (error) {
      console.error("Failed to update wishlist:", error);
      setToast({ message: "Failed to update wishlist", type: 'error' });
    }
  };

  const handleSaveProduct = async (productData: Partial<Product>) => {
    if (user?.role !== 'admin') return;
    try {
      const saved = await productService.saveProduct(productData);
      setProducts(prev => {
        const exists = prev.find(p => p.id === saved.id);
        if (exists) {
          return prev.map(p => p.id === saved.id ? saved : p);
        }
        return [...prev, saved];
      });
      setToast({ message: productData.id ? 'Product updated' : 'Product added', type: 'success' });
    } catch (err) {
      console.error("Error saving product:", err);
      setToast({ message: 'Failed to save product', type: 'error' });
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (user?.role !== 'admin') return;
    try {
      await productService.deleteProduct(id);
      setProducts(prev => prev.filter(p => p.id !== id));
      setToast({ message: 'Product deleted', type: 'success' });
    } catch (err) {
      console.error("Error deleting product:", err);
      setToast({ message: 'Failed to delete product', type: 'error' });
    }
  };

  const handleLoginSuccess = async () => {
    setIsAuthOpen(false);
    setIsProfileLoading(true);
    try {
      const userData = await authService.getCurrentUser();
      setUser(userData);
      setToast({ message: `Welcome back, ${userData.firstName}!`, type: 'success' });
    } catch (err: any) {
      console.error("Failed to fetch user after login:", err);

      let message = "Failed to load user profile.";
      try {
        const parsed = JSON.parse(err.message);
        if (parsed.error) {
          message = `Profile Error: ${parsed.error}. Please try logging in again.`;
        }
      } catch (e) {
        message = err.message || message;
      }

      setUser(null);
      setToast({ message, type: 'error' });
      console.error(message);
    } finally {
      setIsProfileLoading(false);
    }
  };

  const handleSaveCategory = async (category: Partial<Category>) => {
    try {
      const saved = await categoryService.saveCategory(category);
      setCategories(prev => {
        const index = prev.findIndex(c => c.id === saved.id);
        if (index >= 0) {
          const newCategories = [...prev];
          newCategories[index] = saved;
          return newCategories;
        }
        return [...prev, saved];
      });
      setToast({ message: category.id ? 'Category updated' : 'Category created', type: 'success' });
    } catch (error) {
      console.error("Failed to save category:", error);
      setToast({ message: 'Failed to save category', type: 'error' });
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      await categoryService.deleteCategory(id);
      setCategories(prev => prev.filter(c => c.id !== id));
      setToast({ message: 'Category deleted', type: 'success' });
    } catch (error) {
      console.error("Failed to delete category:", error);
      setToast({ message: 'Failed to delete category', type: 'error' });
    }
  };

  const handleSaveBrand = async (brand: Partial<Brand>) => {
    try {
      const saved = await brandService.saveBrand(brand);
      setBrands(prev => {
        const index = prev.findIndex(b => b.id === saved.id);
        if (index >= 0) {
          const newBrands = [...prev];
          newBrands[index] = saved;
          return newBrands;
        }
        return [...prev, saved];
      });
      setToast({ message: brand.id ? 'Brand updated' : 'Brand created', type: 'success' });
    } catch (error) {
      console.error("Failed to save brand:", error);
      setToast({ message: 'Failed to save brand', type: 'error' });
    }
  };

  const handleDeleteBrand = async (id: string) => {
    try {
      await brandService.deleteBrand(id);
      setBrands(prev => prev.filter(b => b.id !== id));
      setToast({ message: 'Brand deleted', type: 'success' });
    } catch (error) {
      console.error("Failed to delete brand:", error);
      setToast({ message: 'Failed to delete brand', type: 'error' });
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setIsMenuOpen(false);
      setToast({ message: 'Signed out successfully', type: 'success' });
    } catch (err) {
      console.error("Logout failed:", err);
      setToast({ message: 'Failed to sign out', type: 'error' });
    }
  };

  const handleUpdateOrder = async (orderId: string, updates: Partial<Order>) => {
    if (user?.role !== 'admin') return;
    try {
      const updated = await orderService.updateOrder(orderId, updates);
      setOrders(prev => prev.map(o => o.id === orderId ? updated : o));
      setToast({ message: 'Order updated', type: 'success' });
    } catch (err) {
      console.error("Error updating order:", err);
      setToast({ message: 'Failed to update order', type: 'error' });
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get('status');
    const orderId = params.get('id');

    const finalizePayment = async (id: string) => {
      try {
        const pendingOrderStr = localStorage.getItem('grab_go_pending_order');
        if (!pendingOrderStr) return;

        const orderData = JSON.parse(pendingOrderStr);
        if (orderData.id !== id) return;

        // 1. Update status from payment_pending to pending in Firestore

        // 2. Send order confirmation email + WhatsApp
        await fetch('/api/payments?action=order-success', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order: orderData })
        });

        // 3. Clear cart and localStorage
        setCart([]);
        localStorage.removeItem('grab_and_go_cart');
        localStorage.removeItem('grab_go_pending_order');

        // 4. Update UI to success state
        setPaymentStatus('success');
        setIsCheckoutOpen(true);
        setToast({ message: '🎉 Order placed successfully!', type: 'success' });

        // Clean up URL
        window.history.replaceState({}, '', '/');
      } catch (err) {
        console.error("Error finalizing payment:", err);
        setToast({ message: 'Error confirming order — contact support', type: 'error' });
      }
    };

    if (window.location.pathname === '/order-success' && orderId) {
      finalizePayment(orderId);
    } else if (status === 'success') {
      // Legacy or fallback success param
      setPaymentStatus('success');
      setIsCheckoutOpen(true);
      setCart([]);
      localStorage.removeItem('grab_and_go_cart');
      setToast({ message: '🎉 Order placed successfully!', type: 'success' });
    } else if (status === 'cancelled') {
      setPaymentStatus('cancelled');
      setIsCheckoutOpen(true);
      setToast({ message: 'Payment cancelled', type: 'error' });
      // Clean up URL
      window.history.replaceState({}, '', '/');
    }

    const handleOpenOrders = () => setIsOrdersOpen(true);
    const handleOpenCart = () => setIsCartOpen(true);
    const handleOpenMenu = () => setIsMenuOpen(true);
    const handleSelectProduct = (e: any) => setSelectedProduct(e.detail);
    const handleGrabToast = (e: any) => setToast({ message: e.detail.message, type: e.detail.type || 'error' });

    window.addEventListener('open-orders', handleOpenOrders);
    window.addEventListener('open-cart', handleOpenCart);
    window.addEventListener('open-menu', handleOpenMenu);
    window.addEventListener('select-product', handleSelectProduct);
    window.addEventListener('grab-toast', handleGrabToast);

    return () => {
      window.removeEventListener('open-orders', handleOpenOrders);
      window.removeEventListener('open-cart', handleOpenCart);
      window.removeEventListener('open-menu', handleOpenMenu);
      window.removeEventListener('select-product', handleSelectProduct);
      window.removeEventListener('grab-toast', handleGrabToast);
    };
  }, []);
  const [lastAdded, setLastAdded] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'price-low' | 'price-high' | 'default'>('default');
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [filterBrand, setFilterBrand] = useState<string>('All');
  const [maxPrice, setMaxPrice] = useState<number>(Infinity);

  const filteredAndSortedProducts = useMemo(() => {
    let result = [...products];

    if (filterCategory !== 'All') {
      result = result.filter(p => (p.categories || []).includes(filterCategory));
    }

    if (filterBrand !== 'All') {
      result = result.filter(p => p.brand === filterBrand);
    }

    if (maxPrice !== Infinity) {
      result = result.filter(p => p.price <= maxPrice);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query) ||
        (p.categories || []).some(c => c.toLowerCase().includes(query)) ||
        p.brand?.toLowerCase().includes(query)
      );
    }

    if (sortBy === 'price-low') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-high') {
      result.sort((a, b) => b.price - a.price);
    }

    return result;
  }, [products, sortBy, filterCategory, filterBrand, searchQuery, maxPrice]);

  useEffect(() => {
    localStorage.setItem('grab_and_go_cart', JSON.stringify(cart));
  }, [cart]);

  // Stock helper
  const getStockForVariant = (product: Product, selectedVariants?: Record<string, string>): number => {
    if (!product.stock) return Infinity; // No stock tracking = unlimited
    if (!selectedVariants || Object.keys(selectedVariants).length === 0) {
      return product.stock['_default'] ?? Infinity;
    }
    // Check stock for each selected variant
    let minStock = Infinity;
    for (const [variantName, option] of Object.entries(selectedVariants)) {
      const key = `${variantName}:${option}`;
      const level = product.stock[key];
      if (level !== undefined && level < minStock) minStock = level;
    }
    return minStock;
  };

  const addToCart = (product: Product, selectedVariants?: Record<string, string>, quantity: number = 1) => {
    setIsCartLoading(true);
    setCart(prev => {
      const variantKey = selectedVariants ? JSON.stringify(selectedVariants) : '';
      const existing = prev.find(item =>
        item.id === product.id && JSON.stringify(item.selectedVariants || {}) === JSON.stringify(selectedVariants || {})
      );

      if (existing) {
        return prev.map(item =>
          (item.id === product.id && JSON.stringify(item.selectedVariants || {}) === JSON.stringify(selectedVariants || {}))
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { ...product, quantity, selectedVariants }];
    });
    setToast({ message: `Added ${product.name} to cart`, type: 'success' });
    setTimeout(() => {
      setIsCartLoading(false);
    }, 500);
    setIsCartOpen(true);
  };

  const updateQuantity = (productId: string, delta: number, variants?: Record<string, string>) => {
    setIsCartLoading(true);
    setCart(prev => prev.map(item => {
      if (item.id === productId && JSON.stringify(item.selectedVariants || {}) === JSON.stringify(variants || {})) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
    setTimeout(() => setIsCartLoading(false), 300);
  };

  const removeFromCart = (productId: string, variants?: Record<string, string>) => {
    setCart(prev => {
      const item = prev.find(i => i.id === productId && JSON.stringify(i.selectedVariants || {}) === JSON.stringify(variants || {}));
      if (item) setToast({ message: `${item.name} removed from cart`, type: 'success' });
      return prev.filter(i => !(i.id === productId && JSON.stringify(i.selectedVariants || {}) === JSON.stringify(variants || {})));
    });
  };

  const handleCheckout = () => {
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  const handleBuyNow = (product: Product, selectedVariants?: Record<string, string>) => {
    addToCart(product, selectedVariants);
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const cartTotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <SystemAlertBanner user={user} />
      <WelcomePopup />


      <Header
        cartCount={cartCount}
        cartTotal={cartTotal}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenWishlist={() => setIsWishlistOpen(true)}
        onOpenOrders={() => setIsOrdersOpen(true)}
        onOpenProducts={() => setIsProductsOpen(true)}
        onOpenMenu={() => setIsMenuOpen(true)}
        user={user}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={handleLogout}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        products={products}
        onOpenHowToOrder={() => setIsHowToOrderOpen(true)}
        categories={categories}
      />

      <div className="">
        <Routes>
        <Route path="/" element={
          isDataLoading ? (
            <div className="min-h-screen flex items-center justify-center bg-white">
              <div className="flex flex-col items-center gap-6">
                <Logo className="h-12 md:h-16" dark />
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-[#06402B] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-[#06402B] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-[#18A374] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
    </div>
    </div>
    </div>
          ) : (
            <HomePage
              filteredAndSortedProducts={filteredAndSortedProducts}
              filterBrand={filterBrand}
              setFilterBrand={setFilterBrand}
              maxPrice={maxPrice}
              setMaxPrice={setMaxPrice}
              sortBy={sortBy}
              setSortBy={setSortBy}
              scrollProducts={scrollProducts}
              productScrollRef={productScrollRef}
              addToCart={addToCart}
              handleBuyNow={handleBuyNow}
              onEmailDetails={(p) => {
                setSelectedProduct(p);
                setIsSendingEmail(true);
              }}
              searchQuery={searchQuery}
              wishlist={wishlist}
              toggleWishlist={toggleWishlist}
              isCartLoading={isCartLoading}
              brands={brands}
              categories={categories}
              testimonials={testimonials}
              partners={partners}
              onClearAll={() => {
                setFilterBrand('All');
                setFilterCategory('All');
                setSortBy('default');
                setMaxPrice(Infinity);
              }}
            />
          )
        } />
        <Route path="/product/:id" element={
          <ProductPage
            products={products}
            addToCart={addToCart}
            handleBuyNow={handleBuyNow}
            onEmailDetails={(p) => {
              setSelectedProduct(p);
              setIsSendingEmail(true);
            }}
            searchQuery={searchQuery}
            wishlist={wishlist}
            onToggleWishlist={toggleWishlist}
            isCartLoading={isCartLoading}
            categories={categories}
            brands={brands}
          />
        } />
        <Route path="/category/:slug" element={
          <CategoryPage
            products={products}
            categories={categories}
            brands={brands}
            addToCart={addToCart}
            handleBuyNow={handleBuyNow}
            onEmailDetails={(p) => {
              setSelectedProduct(p);
              setIsSendingEmail(true);
            }}
            wishlist={wishlist}
            toggleWishlist={toggleWishlist}
            isCartLoading={isCartLoading}
            showToast={(msg, type) => setToast({ message: msg, type: type || 'success' })}
          />
        } />
        {/* <Route path="/how-to-order" element={<HowToOrderPage />} /> */}
        <Route path="/order-success" element={
          <div className="min-h-screen flex items-center justify-center bg-white">
            <div className="text-center p-8">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 size={32} />
    </div>
              <h1 className="text-2xl font-display font-bold uppercase tracking-tighter mb-4">Processing Your Order...</h1>
              <p className="text-sm text-gray-500 max-w-md mx-auto">Please wait while we finalize your order details.</p>
              <div className="mt-8">
                <Loader2 className="animate-spin mx-auto text-black" size={24} />
    </div>
    </div>
    </div>
        } />
        {/* <Route path="/admin" element={user?.role === 'admin' ? <AdminDashboard /> : <NotFoundPage />} /> */}
        <Route path="/legal" element={<LegalPage />} />
        <Route path="/refunds" element={<RefundPolicyPage />} />
        <Route path="/shipping" element={<ShippingPolicyPage />} />
        <Route path="/faq" element={<FAQPage />} />
        <Route path="/helpdesk" element={<HelpDeskPage />} />
        <Route path="/track-order" element={<OrderTrackingPage />} />
        <Route path="/story" element={<OurStoryPage />} />
        <Route path="/admin/system" element={user?.role === 'admin' ? <SystemHealthDashboard /> : <NotFoundPage />} />
        <Route path="*" element={<NotFoundPage />} />
        {/* <Route path="/orders/:orderId/return" element={<ReturnRequestPage />} /> */}

      </Routes>
      </div>

      <EmailProductModal
        isOpen={isSendingEmail}
        onClose={() => {
          setIsSendingEmail(false);
          setSelectedProduct(null);
        }}
        product={selectedProduct}
      />

      <Footer categories={categories} />
      <Sidebar
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onOpenOrders={() => setIsOrdersOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenWishlist={() => setIsWishlistOpen(true)}
        onLogout={handleLogout}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenProducts={() => setIsProductsOpen(true)}
        cartCount={cartCount}
        user={user}
        partners={partners}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        setFilterCategory={setFilterCategory}
        categories={categories}
      />


      <AnimatePresence>
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </AnimatePresence>

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cart}
        onUpdateQuantity={updateQuantity}
        onRemove={removeFromCart}
        onCheckout={handleCheckout}
        isLoading={isCartLoading}
      />

      <HybridCheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => {
          setIsCheckoutOpen(false);
          setPaymentStatus(null);
          window.history.replaceState({}, document.title, "/");
        }}
        cartItems={cart}
        total={cartTotal}
        paymentStatus={paymentStatus}
        onPaymentStatusChange={setPaymentStatus}
        user={user}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      <OrdersDrawer
        isOpen={isOrdersOpen}
        onClose={() => setIsOrdersOpen(false)}
        orders={orders}
        user={user}
        onUpdateOrder={handleUpdateOrder}
      />

      <WishlistDrawer
        isOpen={isWishlistOpen}
        onClose={() => setIsWishlistOpen(false)}
        wishlist={wishlist}
        products={products}
        onToggleWishlist={toggleWishlist}
        onAddToCart={(p) => addToCart(p)}
      />

      <ProductManagementDrawer
        isOpen={isProductsOpen}
        onClose={() => setIsProductsOpen(false)}
        products={products}
        categories={categories}
        brands={brands}
        onSave={handleSaveProduct}
        onDelete={handleDeleteProduct}
        onOpenCategories={() => setIsCategoriesOpen(true)}
        onOpenBrands={() => setIsBrandsOpen(true)}
      />

      <CategoryManagementDrawer
        isOpen={isCategoriesOpen}
        onClose={() => setIsCategoriesOpen(false)}
        categories={categories}
        onSave={handleSaveCategory}
        onDelete={handleDeleteCategory}
      />

      <BrandManagementDrawer
        isOpen={isBrandsOpen}
        onClose={() => setIsBrandsOpen(false)}
        brands={brands}
        onSave={handleSaveBrand}
        onDelete={handleDeleteBrand}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={handleLoginSuccess}
      />

      <AnimatePresence>
        {isHowToOrderOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsHowToOrderOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90]"
            />
            <HowToOrderDrawer isOpen={isHowToOrderOpen} onClose={() => setIsHowToOrderOpen(false)} />
          </>
        )}
      </AnimatePresence>
      {/* <SupportChat /> */}
    </div>
  );
}

