"use client";
import { PAYMENT_LOGOS } from "./utils/shared";

import dynamic from "next/dynamic";
const CartDrawer = dynamic(() => import("./components/CartDrawer"), { ssr: false });
const HybridCheckoutModal = dynamic(() => import("./components/HybridCheckoutModal"), { ssr: false });
const OrdersDrawer = dynamic(() => import("./components/OrdersDrawer"), { ssr: false });
const ProductManagementDrawer = dynamic(() => import("./components/ProductManagementDrawer"), { ssr: false });
const AuthModal = dynamic(() => import("./components/AuthModal"), { ssr: false });
const EmailProductModal = dynamic(() => import("./components/EmailProductModal"), { ssr: false });
const CategoryManagementDrawer = dynamic(() => import("./components/CategoryManagementDrawer"), { ssr: false });
const BrandManagementDrawer = dynamic(() => import("./components/BrandManagementDrawer"), { ssr: false });
const InstagramFeed = dynamic(() => import("./components/InstagramFeed"), { ssr: false });
const ChatWidget = dynamic(() => import("./components/ChatWidget"), { ssr: false });
import Logo from "./components/Logo";
import { formatPrice } from "./utils/format";
import { optimizeCloudinaryUrl } from "./utils/image";
// import './sentryClient';
// import AdminDashboard from './components/admin/AdminDashboard';
// import ReturnRequestPage from './pages/ReturnRequestPage';
// import HowToOrderPage from './pages/HowToOrderPage';
// import { isOrderReturnable } from './services/returnService';
import React, { useState, useEffect, useRef, useMemo, Component } from 'react';
import Link from 'next/link';
import { useRouter, useParams, usePathname } from 'next/navigation';
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
  { id: 'bg-jnb-001', name: 'PUDO Locker – Sandton City', address: 'Shop L23, Sandton City Mall, 83 Rivonia Rd', suburb: 'Sandton', city: 'Johannesburg', province: 'Gauteng', postal_code: '2196', lat: -26.1084, lng: 28.0553, type: 'locker' },
  { id: 'bg-jnb-002', name: 'PUDO Counter – Rosebank Mall', address: 'Shop 14, The Zone @ Rosebank, Oxford Rd', suburb: 'Rosebank', city: 'Johannesburg', province: 'Gauteng', postal_code: '2196', lat: -26.1343, lng: 28.0445, type: 'counter' },
  { id: 'bg-cpt-001', name: 'PUDO Locker – V&A Waterfront', address: 'Ground Floor, Victoria Wharf', suburb: 'Waterfront', city: 'Cape Town', province: 'Western Cape', postal_code: '8001', lat: -33.9035, lng: 18.4376, type: 'locker' },
  { id: 'bg-cpt-002', name: 'PUDO Counter – Cavendish Square', address: 'Lower Ground, Cavendish Square, Dreyer St', suburb: 'Claremont', city: 'Cape Town', province: 'Western Cape', postal_code: '7708', lat: -33.9733, lng: 18.4583, type: 'counter' },
  { id: 'bg-dbn-001', name: 'PUDO Locker – Gateway', address: 'Upper Level, Gateway Theatre, 1 Palm Blvd', suburb: 'Umhlanga', city: 'Durban', province: 'KwaZulu-Natal', postal_code: '4319', lat: -29.7206, lng: 31.0372, type: 'locker' },
  { id: 'bg-pta-001', name: 'PUDO Counter – Menlyn Park', address: 'Menlyn Park Shopping Centre, Atterbury Rd', suburb: 'Menlyn', city: 'Pretoria', province: 'Gauteng', postal_code: '0181', lat: -25.7482, lng: 28.2844, type: 'counter' },
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