import React, { useState, useEffect, useRef, useMemo } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useParams, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShoppingBag, 
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
  Ruler,
  Plus,
  Minus,
  Trash2,
  Mail,
  Send,
  Loader2,
  Info,
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
  Globe
} from 'lucide-react';
import { TESTIMONIALS, PARTNERS } from './constants';
import { Product, CartItem, User, Order, OrderStatus, ProductVariant, ShippingMethod } from './types';
import { auth, db } from './firebase';
import { 
  onAuthStateChanged, 
  signOut, 
  signInWithPopup, 
  GoogleAuthProvider,
  FacebookAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  where, 
  orderBy,
  getDoc
} from 'firebase/firestore';

// --- Constants & Utils ---

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

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

class ErrorBoundary extends React.Component<any, any> {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      let errorMessage = "Something went wrong.";
      try {
        const parsed = JSON.parse(this.state.error.message);
        if (parsed.error) errorMessage = parsed.error;
      } catch (e) {
        errorMessage = this.state.error.message || errorMessage;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
          <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl text-center">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle size={32} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 font-display uppercase tracking-tight">Application Error</h2>
            <p className="text-gray-600 mb-8 text-sm leading-relaxed">{errorMessage}</p>
            <button 
              onClick={() => window.location.reload()}
              className="w-full py-4 bg-black text-white font-bold uppercase tracking-widest text-xs hover:bg-gray-900 transition-colors"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }
    return (this as any).props.children;
  }
}

const formatPrice = (amount: number) => {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// --- Components ---

const WelcomePopup = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');

  useEffect(() => {
    const hasSeenPopup = localStorage.getItem('grab-go-welcome-popup');
    if (!hasSeenPopup) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 3000); // Show after 3 seconds
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem('grab-go-welcome-popup', 'true');
  };

  const handleClaim = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, you'd send the email to a newsletter service
    alert('Welcome to the family! Use code FIRST10 at checkout for 10% off.');
    handleClose();
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
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-4xl bg-white overflow-hidden flex flex-col md:flex-row shadow-2xl"
          >
            <button 
              onClick={handleClose}
              className="absolute top-4 right-4 z-10 p-2 hover:bg-black/5 rounded-full transition-colors text-black"
            >
              <X size={24} />
            </button>

            <div className="w-full md:w-1/2 h-64 md:h-auto relative">
              <img 
                src="https://picsum.photos/seed/welcome/800/1000?grayscale" 
                alt="Welcome" 
                className="w-full h-full object-cover grayscale"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-black/10" />
            </div>

            <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col justify-center text-center">
              <h2 className="text-xl md:text-2xl font-semibold uppercase tracking-tight mb-4 text-black">
                Be the First to Know.
              </h2>
              <p className="text-xs md:text-sm text-gray-500 mb-6 leading-relaxed">
                Every time you buy, you become a humanitarian. Stay in the loop for exclusive drops, impact updates, and <span className="font-semibold text-black">10% off your first purchase</span>.
              </p>

              <form onSubmit={handleClaim} className="space-y-3">
                <input 
                  type="email" 
                  placeholder="Email address" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-gray-100 rounded-sm px-4 py-3 text-xs focus:ring-1 focus:ring-black focus:outline-none transition-all"
                />
                <button 
                  type="submit"
                  className="w-full py-3 bg-black text-white text-[10px] font-semibold uppercase tracking-widest rounded-sm hover:opacity-90 transition-opacity"
                >
                  Claim discount
                </button>
              </form>

              <button 
                onClick={handleClose}
                className="mt-4 text-[10px] font-semibold uppercase tracking-widest text-gray-400 hover:text-black transition-colors"
              >
                No, thanks
              </button>

              <p className="mt-6 text-[8px] text-gray-400 leading-tight uppercase tracking-wider">
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
      src="https://lh3.googleusercontent.com/d/1XP5_on-4-KRIfs0EpPZtjWQhNRix6WzN" 
      alt="Grab & Go" 
      className={`${className} object-contain ${filterClass}`}
      onError={() => setError(true)}
      referrerPolicy="no-referrer"
    />
  );
};

const Header = ({ 
  cartCount, 
  onOpenCart, 
  onOpenOrders, 
  onOpenProducts,
  onOpenMenu,
  user, 
  onOpenAuth,
  onLogout,
  searchQuery,
  setSearchQuery,
  products
}: { 
  cartCount: number, 
  onOpenCart: () => void, 
  onOpenOrders: () => void,
  onOpenProducts: () => void,
  onOpenMenu: () => void,
  user: User | null,
  onOpenAuth: () => void,
  onLogout: () => void,
  searchQuery: string,
  setSearchQuery: (q: string) => void,
  products: Product[]
}) => {
  const [scrolled, setScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const debouncedSearch = useDebounce(localSearch, 300);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
        p.category.toLowerCase().includes(localSearch.toLowerCase()) ||
        p.brand?.toLowerCase().includes(localSearch.toLowerCase())
      )
      .slice(0, 5);
  }, [products, localSearch]);

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'bg-white/90 backdrop-blur-md py-2 shadow-sm' : 'bg-white py-4'}`}>
      <div className="max-w-[1800px] mx-auto px-4 md:px-10 flex items-center justify-between transition-all duration-500">
        
        {/* Left: Logo */}
        <div className="flex-shrink-0">
          <Link to="/" className="block group">
            <Logo className="h-8 md:h-12 transition-transform duration-500 group-hover:scale-105" dark />
          </Link>
        </div>

        {/* Center: Search (Desktop) */}
        <div className="hidden md:flex flex-grow max-w-md mx-8 relative">
          <div className="relative w-full group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-black transition-colors" size={16} />
            <input 
              type="text" 
              placeholder="SEARCH PRODUCTS..."
              value={localSearch}
              onChange={(e) => {
                setLocalSearch(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              className="w-full bg-gray-50 border border-transparent focus:border-black/10 focus:bg-white px-10 py-2 text-[10px] font-black uppercase tracking-widest outline-none transition-all"
            />
            {localSearch && (
              <button 
                onClick={() => {
                  setLocalSearch('');
                  setSearchQuery('');
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Suggestions Dropdown */}
          <AnimatePresence>
            {showSuggestions && suggestions.length > 0 && (
              <>
                <div 
                  className="fixed inset-0 z-[-1]" 
                  onClick={() => setShowSuggestions(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 shadow-2xl rounded-xl overflow-hidden z-50"
                >
                  <div className="p-2 border-b border-gray-50">
                    <span className="text-[8px] font-black uppercase tracking-widest text-gray-400 px-3">Suggestions</span>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto">
                    {suggestions.map((product) => (
                      <button
                        key={product.id}
                        onClick={() => {
                          navigate(`/product/${product.id}`);
                          setShowSuggestions(false);
                          setLocalSearch('');
                          setSearchQuery('');
                        }}
                        className="w-full flex items-center gap-4 p-3 hover:bg-gray-50 transition-colors text-left group"
                      >
                        <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                          <img 
                            src={product.image || undefined} 
                            alt={product.name} 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div className="flex-grow min-w-0">
                          <div className="text-[10px] font-black uppercase tracking-widest text-black truncate">
                            <Highlight text={product.name} query={localSearch} />
                          </div>
                          <div className="text-[8px] font-bold uppercase tracking-widest text-gray-400">
                            {product.category}
                          </div>
                        </div>
                        <div className="text-[10px] font-black text-black">
                          R{product.price}
                        </div>
                      </button>
                    ))}
                  </div>
                  <button 
                    onClick={() => setShowSuggestions(false)}
                    className="w-full p-3 text-[8px] font-black uppercase tracking-widest text-center bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    View all results
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 md:gap-4">
          {/* Mobile Search Toggle */}
          <button 
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className="md:hidden p-2 hover:bg-black/5 rounded-full transition-colors text-black"
            title="Search"
          >
            <Search size={22} />
          </button>

          <button 
            onClick={onOpenCart} 
            className="relative p-2 hover:bg-black/5 rounded-full transition-colors text-black" 
            title="Cart"
          >
            <ShoppingBag size={22} />
            {cartCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-black text-white text-[8px] font-black rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>

          {user?.role === 'admin' && (
            <button 
              onClick={onOpenProducts}
              className="p-2 hover:bg-black/5 rounded-full transition-colors text-black"
              title="Manage Products"
            >
              <Database size={22} />
            </button>
          )}

          {!user && (
            <button 
              onClick={onOpenAuth}
              className="p-2 hover:bg-black/5 rounded-full transition-colors text-black hidden sm:flex items-center gap-2"
              title="Login"
            >
              <UserIcon size={22} />
              <span className="text-[10px] font-black uppercase tracking-widest">Login</span>
            </button>
          )}

          <button 
            onClick={onOpenMenu} 
            className="p-2 hover:bg-black/5 rounded-full transition-colors flex items-center gap-2 group text-black"
          >
            <span className="text-[10px] font-black uppercase tracking-widest hidden sm:block group-hover:opacity-60 transition-opacity">Menu</span>
            <Menu size={28} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isSearchOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden bg-white border-t border-gray-50 overflow-hidden relative"
          >
            <div className="p-4">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input 
                  autoFocus
                  type="text" 
                  placeholder="SEARCH PRODUCTS..."
                  value={localSearch}
                  onChange={(e) => {
                    setLocalSearch(e.target.value);
                    setShowSuggestions(true);
                  }}
                  className="w-full bg-gray-50 border border-transparent focus:border-black/10 focus:bg-white px-10 py-3 text-[10px] font-black uppercase tracking-widest outline-none transition-all"
                />
                {localSearch && (
                  <button 
                    onClick={() => {
                      setLocalSearch('');
                      setSearchQuery('');
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Mobile Suggestions */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="mt-4 border-t border-gray-50 pt-4">
                  <span className="text-[8px] font-black uppercase tracking-widest text-gray-400 mb-2 block">Suggestions</span>
                  <div className="space-y-2">
                    {suggestions.map((product) => (
                      <button
                        key={product.id}
                        onClick={() => {
                          navigate(`/product/${product.id}`);
                          setShowSuggestions(false);
                          setIsSearchOpen(false);
                          setLocalSearch('');
                          setSearchQuery('');
                        }}
                        className="w-full flex items-center gap-3 p-2 hover:bg-gray-50 transition-colors text-left"
                      >
                        <div className="w-8 h-8 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                          <img 
                            src={product.image || undefined} 
                            alt={product.name} 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div className="flex-grow min-w-0">
                          <div className="text-[10px] font-black uppercase tracking-widest text-black truncate">
                            <Highlight text={product.name} query={localSearch} />
                          </div>
                          <div className="text-[8px] font-bold uppercase tracking-widest text-gray-400">
                            {product.category}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

const Sidebar = ({ 
  isOpen, 
  onClose, 
  onOpenOrders, 
  onOpenAuth, 
  onLogout, 
  onOpenCart,
  onOpenProducts,
  cartCount,
  user
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  onOpenOrders: () => void, 
  onOpenAuth: () => void, 
  onLogout: () => void, 
  onOpenCart: () => void,
  onOpenProducts: () => void,
  cartCount: number,
  user: User | null
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const navLinks = [
    { name: 'NEW ARRIVALS', id: 'drops' },
    { name: 'APPAREL', id: 'drops' },
    { name: 'ACCESSORIES', id: 'drops' },
    { name: 'FOOTWEAR', id: 'drops' }
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
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[80]" 
          />
          <motion.div 
            initial={{ x: '100%' }} 
            animate={{ x: 0 }} 
            exit={{ x: '100%' }} 
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-sm bg-black text-white border-l border-white/10 z-[90] p-8 md:p-12 flex flex-col"
          >
            <div className="flex justify-between items-center mb-12">
              <Logo className="h-6" light />
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X size={24} className="text-white" />
              </button>
            </div>

            <nav className="flex-grow overflow-y-auto pr-4 custom-scrollbar space-y-12">
              {/* Main Navigation */}
              <div className="flex flex-col gap-6">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-30 mb-2">Navigation</p>
                {navLinks.map((link) => (
                  <button 
                    key={link.name}
                    onClick={() => {
                      onClose();
                      if (location.pathname !== '/') {
                        navigate('/');
                        setTimeout(() => document.getElementById(link.id)?.scrollIntoView({ behavior: 'smooth' }), 100);
                      } else {
                        document.getElementById(link.id)?.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                    className="text-2xl font-black uppercase tracking-tighter text-left hover:text-white/60 transition-all"
                  >
                    {link.name}
                  </button>
                ))}
              </div>

              {/* Utility Icons Section */}
              <div className="flex flex-col gap-6 pt-8 border-t border-white/10">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-30 mb-2">Utilities</p>
                <div className="grid grid-cols-3 gap-4">
                  <button 
                    onClick={() => { onClose(); onOpenCart(); }}
                    className="relative p-4 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center transition-colors"
                    title="Cart"
                  >
                    <ShoppingBag size={20} />
                    {cartCount > 0 && (
                      <span className="absolute top-2 right-2 w-4 h-4 bg-white text-black text-[8px] font-black rounded-full flex items-center justify-center">
                        {cartCount}
                      </span>
                    )}
                  </button>
                  <button className="p-4 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center transition-colors" title="Location">
                    <MapPin size={20} />
                  </button>
                  {user?.role === 'admin' && (
                    <button 
                      onClick={() => { onClose(); onOpenProducts(); }}
                      className="p-4 bg-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center transition-colors"
                      title="Admin"
                    >
                      <Settings size={20} />
                    </button>
                  )}
                </div>
              </div>

              {/* Account Section */}
              <div className="flex flex-col gap-4 pt-8 border-t border-white/10">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-30 mb-2">Account</p>
                <button 
                  onClick={() => { onClose(); onOpenOrders(); }}
                  className="text-sm font-bold uppercase tracking-widest text-left text-white/60 hover:text-white transition-colors"
                >
                  Track Order
                </button>
                {user ? (
                  <button 
                    onClick={() => { onClose(); onLogout(); }}
                    className="flex items-center gap-3 text-red-400 font-bold uppercase tracking-widest text-xs mt-2"
                  >
                    <LogOut size={16} /> Logout ({user.firstName})
                  </button>
                ) : (
                  <button 
                    onClick={() => { onClose(); onOpenAuth(); }}
                    className="flex items-center gap-3 text-white font-bold uppercase tracking-widest text-xs mt-2"
                  >
                    <UserIcon size={16} /> Login / Sign Up
                  </button>
                )}
              </div>

              {/* Info Links */}
              <div className="flex flex-col gap-3 pt-8 border-t border-white/10">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-30 mb-2">Information</p>
                <Link to="/helpdesk" onClick={onClose} className="text-xs font-bold uppercase tracking-widest text-white/60 hover:text-white transition-colors">Help Desk</Link>
                <Link to="/returns" onClick={onClose} className="text-xs font-bold uppercase tracking-widest text-white/60 hover:text-white transition-colors">Returns</Link>
                <Link to="/faq" onClick={onClose} className="text-xs font-bold uppercase tracking-widest text-white/60 hover:text-white transition-colors">FAQ</Link>
                <Link to="/story" onClick={onClose} className="text-xs font-bold uppercase tracking-widest text-white/60 hover:text-white transition-colors">Our Story</Link>
                <Link to="/shipping" onClick={onClose} className="text-xs font-bold uppercase tracking-widest text-white/60 hover:text-white transition-colors">Shipping</Link>
                <Link to="/refunds" onClick={onClose} className="text-xs font-bold uppercase tracking-widest text-white/60 hover:text-white transition-colors">Returns</Link>
              </div>
            </nav>

            <div className="mt-auto pt-8 border-t border-white/10 flex justify-between items-center">
              <div className="flex gap-6 text-white/40">
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors"><Instagram size={20} /></a>
                <a href="https://wa.me/27691630778" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors"><MessageSquare size={20} /></a>
                <a href="https://github.com/ideastolifestudios/Grab-Go-ZA" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors"><Globe size={20} /></a>
              </div>
              <p className="text-[8px] font-mono uppercase tracking-widest opacity-20">Grab & Go Studio © 2026</p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

const Hero = () => (
  <section className="relative h-[85vh] md:h-screen flex items-center justify-center overflow-hidden bg-white">
    <div className="absolute inset-0 z-0">
      <img 
        src="https://picsum.photos/seed/streetwear/1920/1080?grayscale" 
        alt="Hero" 
        className="w-full h-full object-cover opacity-20"
        referrerPolicy="no-referrer"
      />
    </div>
    
    <div className="relative z-10 text-center px-4 md:px-6 max-w-3xl mx-auto">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        <h1 className="text-3xl md:text-5xl font-semibold uppercase tracking-tight mb-4 md:mb-6 text-black leading-[1.1]">
          Command<br />Presence
        </h1>
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6">
          <button 
            onClick={() => document.getElementById('drops')?.scrollIntoView({ behavior: 'smooth' })}
            className="w-full md:w-auto px-8 py-3 bg-black text-white font-semibold uppercase text-[10px] tracking-wider hover:opacity-90 transition-opacity"
          >
            Shop Collection
          </button>
          <p className="text-[10px] font-semibold uppercase tracking-wider opacity-40 text-black">
            Studio Born • South Africa
          </p>
        </div>
      </motion.div>
    </div>

    <div className="absolute bottom-6 md:bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 md:gap-4 opacity-30">
      <div className="w-[1px] h-8 md:h-12 bg-black animate-bounce" />
      <span className="text-[8px] font-black uppercase tracking-[0.5em] text-black">Scroll</span>
    </div>
  </section>
);


const ProductDetailContent = ({ 
  product, 
  allProducts,
  onAddToCart,
  onBuyNow,
  onEmailDetails,
  searchQuery = ''
}: { 
  product: Product | null; 
  allProducts: Product[];
  onAddToCart: (p: Product, variants?: Record<string, string>, quantity?: number) => void;
  onBuyNow: (p: Product, variants?: Record<string, string>) => void;
  onEmailDetails: (p: Product) => void;
  searchQuery?: string;
}) => {
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);
  const navigate = useNavigate();
  const relatedScrollRef = useRef<HTMLDivElement>(null);

  const scrollRelated = (direction: 'left' | 'right') => {
    if (relatedScrollRef.current) {
      const { scrollLeft, clientWidth } = relatedScrollRef.current;
      const scrollAmount = clientWidth * 0.8;
      const scrollTo = direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount;
      relatedScrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

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
    .filter(p => p.id !== product.id && (p.category === product.category || p.isDrop))
    .slice(0, 12);

  const toggleAccordion = (id: string) => {
    setOpenAccordion(openAccordion === id ? null : id);
  };

  const AccordionItem = ({ id, title, icon: Icon, children }: { id: string, title: string, icon: any, children: React.ReactNode }) => (
    <div className="border-b border-gray-100">
      <button 
        onClick={() => toggleAccordion(id)}
        className="w-full py-4 flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em] hover:opacity-100 transition-opacity"
      >
        <div className="flex items-center gap-3 opacity-60">
          <Icon size={14} />
          <span>{title}</span>
        </div>
        <Plus size={14} className={`transition-transform duration-300 ${openAccordion === id ? 'rotate-45' : ''}`} />
      </button>
      <AnimatePresence>
        {openAccordion === id && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="pb-6 text-[10px] leading-relaxed opacity-50 uppercase tracking-widest">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <div className="pt-20 md:pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row gap-10 lg:gap-20">
          {/* Left: Image Gallery */}
          <div className="w-full md:w-[55%] flex flex-col gap-6">
            {/* Breadcrumbs (Mobile) */}
            <div className="md:hidden flex items-center gap-2 text-[10px] text-gray-400 uppercase tracking-widest overflow-x-auto whitespace-nowrap">
              <Link to="/">Studio</Link> <ChevronRight size={8} /> 
              <span>{product.category}</span> <ChevronRight size={8} /> 
              <span className="text-black">{product.name}</span>
            </div>

            <div className="relative aspect-[4/5] bg-gray-50 overflow-hidden group">
              <div className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar h-full">
                {allImages.map((img, idx) => (
                  <div key={idx} className="min-w-full h-full snap-center">
                    <img 
                      src={img || undefined} 
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
                  <img src={img || undefined} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </button>
              ))}
            </div>
          </div>

          {/* Right: Info */}
          <div className="w-full md:w-[45%] flex flex-col">
            {/* Breadcrumbs (Desktop) */}
            <div className="hidden md:flex items-center gap-2 text-[10px] text-gray-400 uppercase tracking-widest mb-8">
              <Link to="/">Studio</Link> <ChevronRight size={8} /> 
              <span>{product.category}</span> <ChevronRight size={8} /> 
              <span className="text-black">{product.name}</span>
            </div>

            <div className="mb-8">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center border border-black p-1">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-3 py-1 hover:bg-black/5 transition-colors"><Minus size={12} /></button>
                  <span className="px-4 text-xs font-black">{quantity}</span>
                  <button onClick={() => setQuantity(quantity + 1)} className="px-3 py-1 hover:bg-black/5 transition-colors"><Plus size={12} /></button>
                </div>
                <div className="flex gap-4 text-[10px] font-black uppercase tracking-widest">
                  <span className="text-green-600 border-b-2 border-green-600 pb-1">In stock</span>
                  <span className="text-green-600/50 flex items-center gap-1"><Clock size={12} /> Limited stock</span>
                </div>
              </div>

              <h1 className="text-xl md:text-2xl font-bold uppercase tracking-tighter mb-1 leading-tight">{product.name}</h1>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-30 mb-6">{product.brand || 'Studio Born'}</p>
              
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
            <div className="space-y-8 mb-10">
              {product.variants?.map(v => (
                <div key={v.id} className="space-y-4">
                  <div className="flex justify-between items-baseline">
                    <label className="text-[10px] font-black uppercase tracking-widest opacity-40">
                      {v.name} <span className="text-black font-black ml-2">{selectedVariants[v.name]}</span>
                    </label>
                    {v.name.toLowerCase() === 'size' && (
                      <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest underline decoration-gray-300 hover:decoration-black transition-all">
                        <Ruler size={14} /> View size guide
                      </button>
                    )}
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
                            ${isColor ? 'w-12 rounded-sm' : 'px-4'}
                          `}
                        >
                          {isColor ? (
                            <div className="w-8 h-8 rounded-sm bg-gray-200" style={{ backgroundColor: opt.toLowerCase() }} />
                          ) : opt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="space-y-2 mb-8">
              <button 
                onClick={() => {
                  onAddToCart(product, selectedVariants, quantity);
                }}
                className="w-full h-12 md:h-14 bg-black text-white font-bold uppercase text-[10px] tracking-[0.3em] hover:bg-zinc-800 transition-all flex items-center justify-center gap-3"
              >
                Add to cart
              </button>
              <button 
                onClick={() => {
                  onBuyNow(product, selectedVariants);
                }}
                className="w-full h-12 md:h-14 border-2 border-black text-black font-bold uppercase text-[10px] tracking-[0.3em] hover:bg-black hover:text-white transition-all flex items-center justify-center gap-3"
              >
                Buy it now
              </button>
              <button 
                onClick={() => {
                  const msg = encodeURIComponent(`Hi, I'm interested in the ${product.name} (R${product.price}). Can I get more details?`);
                  window.open(`https://wa.me/${process.env.WHATSAPP_NUMBER || '27000000000'}?text=${msg}`, '_blank');
                }}
                className="w-full h-12 md:h-14 bg-[#25D366] text-white font-bold uppercase text-[10px] tracking-[0.3em] hover:opacity-90 transition-all flex items-center justify-center gap-3"
              >
                <MessageSquare size={16} />
                WhatsApp Inquiry
              </button>
            </div>

            <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest opacity-40 mb-10">
              <Truck size={14} />
              <span>Ships in 5-10 Business days</span>
            </div>

            {/* Payment Icons */}
            <div className="flex flex-wrap gap-3 mb-12 opacity-60">
              <div className="px-3 py-1 border border-gray-200 rounded text-[8px] font-black uppercase tracking-widest">Visa</div>
              <div className="px-3 py-1 border border-gray-200 rounded text-[8px] font-black uppercase tracking-widest">Mastercard</div>
              <div className="px-3 py-1 border border-gray-200 rounded text-[8px] font-black uppercase tracking-widest">Apple Pay</div>
              <div className="px-3 py-1 border border-gray-200 rounded text-[8px] font-black uppercase tracking-widest">Google Pay</div>
            </div>

            {/* Accordions */}
            <div className="space-y-1 mb-16">
              <AccordionItem id="features" title="Features & Care" icon={Star}>
                Premium heavyweight cotton. Hand wash cold. Hang dry only. Studio-born quality guaranteed.
              </AccordionItem>
              <AccordionItem id="size" title="Size & Fit" icon={Info}>
                True to size. Oversized boxy fit. Model is 185cm wearing size L.
              </AccordionItem>
              <AccordionItem id="shipping" title="Shipping & Pickup" icon={Truck}>
                Nationwide delivery. Free shipping on orders over {formatPrice(1500)}.
              </AccordionItem>
              <AccordionItem id="payments" title="Payments & Installments" icon={CreditCard}>
                Secure payments via Paystack. 6 interest-free installments available.
              </AccordionItem>
              <AccordionItem id="returns" title="Returns" icon={RotateCcw}>
                14-day return policy. Items must be unworn and in original packaging.
              </AccordionItem>
            </div>

            {/* Sold By */}
            <div className="space-y-4 pt-8 border-t border-gray-100">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Sold by</p>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                <div className="h-12 sm:h-10 px-4 border border-gray-100 flex items-center justify-center rounded-sm bg-white">
                  {product.soldByLogo ? (
                    <img src={product.soldByLogo || undefined} alt={product.soldBy} className="h-6 object-contain" referrerPolicy="no-referrer" />
                  ) : (
                    <span className="font-bold text-xs uppercase tracking-widest">{product.soldBy || 'Studio'}</span>
                  )}
                </div>
                <button className="h-12 sm:h-10 px-6 border border-[#4B48FF] text-[#4B48FF] text-[10px] font-bold uppercase tracking-widest rounded-sm hover:bg-[#4B48FF] hover:text-white transition-all flex items-center justify-center gap-2">
                  <MapPin size={14} /> Check in-store availability
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Pairs Well With */}
        <div className="mt-12 md:mt-16 pt-12 md:pt-16 border-t border-gray-100">
          <div className="flex justify-between items-center mb-6 md:mb-8">
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
                  onBuyNow={() => {}}
                  searchQuery={searchQuery}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const ProductCard = ({ product, onAddToCart, onEmailDetails, onBuyNow, searchQuery = '' }: { product: Product, onAddToCart: (p: Product, variants?: Record<string, string>) => void, onEmailDetails: (p: Product) => void, onBuyNow: (p: Product, variants?: Record<string, string>) => void, searchQuery?: string, key?: string }) => {
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [isLiked, setIsLiked] = useState(false);
  const allImages = useMemo(() => [product.image, ...(product.images || [])], [product.image, product.images]);
  const navigate = useNavigate();

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
      whileHover={{ 
        y: -5,
        transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] }
      }}
      viewport={{ once: true }}
      className="group cursor-pointer relative bg-white border border-gray-50 md:border-transparent rounded-xl md:rounded-none overflow-hidden md:overflow-visible"
    >
      <div className="aspect-[3/4] overflow-hidden bg-gray-50 mb-3 relative shadow-sm group-hover:shadow-xl transition-all duration-500">
        {/* Action Icons - Visible on mobile, hover on desktop */}
        <div className="absolute left-3 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-30 md:opacity-0 md:group-hover:opacity-100 transition-all duration-300 md:translate-x-[-10px] md:group-hover:translate-x-0">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart(product, selectedVariants);
            }}
            className="w-10 h-10 md:w-8 md:h-8 bg-white text-black flex items-center justify-center rounded-full shadow-lg hover:bg-black hover:text-white transition-all duration-300"
            title="Add to Cart"
          >
            <ShoppingBag size={16} className="md:w-3.5 md:h-3.5" />
          </button>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onEmailDetails(product);
            }}
            className="w-10 h-10 md:w-8 md:h-8 bg-white text-black flex items-center justify-center rounded-full shadow-lg hover:bg-black hover:text-white transition-all duration-300"
            title="Share via Email"
          >
            <Mail size={16} className="md:w-3.5 md:h-3.5" />
          </button>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              const msg = encodeURIComponent(`Hi, I'm interested in the ${product.name} (R${product.price}). Can I get more details?`);
              window.open(`https://wa.me/${process.env.WHATSAPP_NUMBER || '27000000000'}?text=${msg}`, '_blank');
            }}
            className="w-10 h-10 md:w-8 md:h-8 bg-white text-black flex items-center justify-center rounded-full shadow-lg hover:bg-[#25D366] hover:text-white transition-all duration-300"
            title="WhatsApp Inquiry"
          >
            <MessageSquare size={16} className="md:w-3.5 md:h-3.5" />
          </button>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setIsLiked(!isLiked);
            }}
            className={`w-10 h-10 md:w-8 md:h-8 flex items-center justify-center rounded-full shadow-lg transition-all duration-300 ${isLiked ? 'bg-red-500 text-white' : 'bg-white text-black hover:bg-red-50 text-red-500'}`}
            title="Like"
          >
            <Heart size={16} className="md:w-3.5 md:h-3.5" fill={isLiked ? "currentColor" : "none"} />
          </button>
        </div>

        {/* Primary Image */}
        <img 
          src={allImages[0] || undefined} 
          alt={product.name} 
          onClick={() => navigate(`/product/${product.id}`)}
          className={`w-full h-full object-cover grayscale md:grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-1000 ease-out ${allImages.length > 1 ? 'group-hover:opacity-0' : ''}`}
          referrerPolicy="no-referrer"
        />
        
        {/* Secondary Image on Hover */}
        {allImages.length > 1 && (
          <img 
            src={allImages[1] || undefined} 
            alt={`${product.name} alternate`} 
            onClick={() => navigate(`/product/${product.id}`)}
            className="absolute inset-0 w-full h-full object-cover grayscale md:grayscale group-hover:grayscale-0 scale-105 opacity-0 group-hover:opacity-100 group-hover:scale-100 transition-all duration-1000 ease-out"
            referrerPolicy="no-referrer"
          />
        )}

        {product.isDrop && (
          <div className="absolute top-4 left-4 px-2 py-0.5 bg-black text-white text-[7px] font-black uppercase tracking-[0.2em] z-20">
            Drop
          </div>
        )}
        
        <motion.div 
          initial="hidden"
          whileHover="visible"
          className="absolute inset-0 bg-black/5 pointer-events-none transition-opacity z-10"
        >
          {product.soldByLogo && (
            <motion.div 
              variants={{
                hidden: { opacity: 0, x: -10 },
                visible: { opacity: 1, x: 0 }
              }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
              className="absolute bottom-4 left-4 flex flex-col items-start gap-1"
            >
              <img 
                src={product.soldByLogo || undefined} 
                alt={product.soldBy || 'Brand'} 
                className="h-4 w-auto object-contain bg-white/10 p-0.5 rounded"
                referrerPolicy="no-referrer"
              />
            </motion.div>
          )}
        </motion.div>
      </div>

      <div className="p-3 md:p-0">
        <div className="flex justify-between items-start mb-1">
          <h3 className="text-[9px] md:text-[10px] font-semibold uppercase tracking-wider text-black truncate pr-4">
            <Highlight text={product.name} query={searchQuery} />
          </h3>
          <span className="text-[9px] md:text-[10px] font-semibold text-black">{formatPrice(product.price)}</span>
        </div>
        <p className="text-[7px] md:text-[8px] font-semibold uppercase tracking-wider opacity-20 text-black">{product.category}</p>
        
        {/* Mobile Add to Cart Button */}
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onAddToCart(product, selectedVariants);
          }}
          className="w-full mt-3 py-3 bg-black text-white text-[8px] font-black uppercase tracking-widest md:hidden active:scale-95 transition-transform"
        >
          Add to Cart
        </button>
      </div>
    </motion.div>
  );
};

const SocialProof = () => (
  <section className="py-12 md:py-20 px-4 md:px-6 border-y border-gray-50">
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 md:mb-12 gap-4 md:gap-6">
        <div>
          <h2 className="text-xl md:text-3xl font-semibold uppercase tracking-tight mb-1 md:mb-2 text-black">Customer Love</h2>
          <p className="text-xs md:text-sm opacity-50 text-black">Real vibes from the community.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2 md:-space-x-3">
            {[1,2,3,4].map(i => (
              <div key={i} className="w-8 h-8 md:w-10 md:h-10 rounded-full border border-white bg-gray-50 overflow-hidden">
                <img src={`https://picsum.photos/seed/user${i}/100/100`} alt="user" referrerPolicy="no-referrer" />
              </div>
            ))}
          </div>
          <div className="text-[10px] md:text-xs font-semibold uppercase tracking-wider text-black">
            <span className="block">500+ Grabs</span>
            <span className="opacity-40">This Month</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {TESTIMONIALS.map((t) => (
          <div key={t.id} className="p-6 md:p-8 bg-gray-50 border border-gray-50 relative overflow-hidden group rounded-xl">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              {t.type === 'whatsapp' ? <MessageSquare size={32} className="text-black" /> : <Instagram size={32} className="text-black" />}
            </div>
            <div className="flex items-center gap-2 mb-3 md:mb-4">
              <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-black text-white flex items-center justify-center font-semibold text-[10px]">
                {t.user[0]}
              </div>
              <div>
                <h4 className="font-semibold text-[10px] md:text-xs text-black">{t.user}</h4>
                <p className="text-[8px] md:text-[9px] opacity-40 font-mono text-black">{t.handle}</p>
              </div>
            </div>
            <p className="text-sm md:text-base font-normal leading-relaxed italic text-black/80">"{t.content}"</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const PartnershipHub = () => (
  <section id="collabs" className="py-12 md:py-20 px-4 md:px-6">
    <div className="max-w-7xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
        <div>
          <h2 className="text-3xl md:text-5xl font-semibold uppercase tracking-tight mb-4 md:mb-6 text-black">
            The Culture<br />Collective
          </h2>
          <p className="text-sm md:text-lg opacity-60 mb-6 md:mb-8 leading-relaxed text-black">
            We don't just sell products; we build bridges. Collaborating with micro-influencers and cultural events to bring you exclusive studio-born drops.
          </p>
          <div className="space-y-3 md:space-y-4">
            {PARTNERS.map(p => (
              <div 
                key={p.id} 
                onClick={() => document.getElementById('drops')?.scrollIntoView({ behavior: 'smooth' })}
                className="flex items-center gap-3 md:gap-4 p-2 md:p-3 hover:bg-black/5 transition-colors border-l border-black/10 cursor-pointer group"
              >
                <div className="w-10 h-10 md:w-12 md:h-12 bg-gray-50 flex-shrink-0 flex items-center justify-center overflow-hidden rounded-md">
                   <img src={p.logo || undefined} alt={p.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" referrerPolicy="no-referrer" />
                </div>
                <div>
                  <h4 className="font-semibold uppercase tracking-wider text-[10px] md:text-xs text-black">{p.name}</h4>
                  <p className="text-[9px] md:text-[10px] opacity-40 text-black">{p.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="relative aspect-square">
          <img 
            src="https://picsum.photos/seed/culture/1000/1000" 
            alt="Culture" 
            className="w-full h-full object-cover grayscale rounded-2xl"
            referrerPolicy="no-referrer"
          />
          <div className="absolute -bottom-3 -right-3 md:-bottom-6 md:-right-6 w-24 h-24 md:w-32 md:h-32 bg-black text-white p-4 md:p-6 flex flex-col justify-center items-center text-center rounded-xl shadow-xl">
            <span className="text-xl md:text-3xl font-semibold">2026</span>
            <span className="text-[8px] md:text-[9px] font-semibold uppercase tracking-wider">Season Drop</span>
          </div>
        </div>
      </div>
    </div>
  </section>
);

const Footer = () => {
  const [subscribed, setSubscribed] = useState(false);
  const [email, setEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      try {
        const response = await fetch('/api/newsletter/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
        
        if (response.ok) {
          setSubscribed(true);
          setEmail('');
          setTimeout(() => setSubscribed(false), 5000);
        }
      } catch (err) {
        console.error('Newsletter error:', err);
      }
    }
  };

  return (
    <footer className="bg-white py-12 md:py-20 px-6 md:px-8 border-t border-gray-50">
      <div className="max-w-7xl mx-auto mb-12 md:mb-16">
        <div className="max-w-md">
          <h3 className="text-lg md:text-xl font-semibold uppercase tracking-tight mb-2 text-black">Join the Grab & Go Fam</h3>
          <p className="text-[10px] md:text-xs text-gray-400 uppercase tracking-wider mb-6">Get 10% off your first drop. No spam, just fresh gear.</p>
          
          <AnimatePresence mode="wait">
            {subscribed ? (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-2 text-emerald-500 py-2"
              >
                <CheckCircle2 size={16} />
                <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest">Welcome to the family! Check your inbox soon.</span>
              </motion.div>
            ) : (
              <form className="flex gap-2" onSubmit={handleSubmit}>
                <input 
                  type="email" 
                  placeholder="Email address" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-grow border-b border-gray-100 py-2 text-[10px] md:text-xs focus:border-black outline-none transition-all uppercase tracking-wider font-semibold"
                />
                <button 
                  type="submit"
                  className="px-4 py-2 bg-black text-white text-[9px] font-semibold uppercase tracking-wider hover:opacity-90 transition-opacity"
                >
                  Join
                </button>
              </form>
            )}
          </AnimatePresence>
        </div>
      </div>

    <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-8 md:gap-12">
      <div className="space-y-4 md:space-y-6">
        <Logo className="h-6 md:h-8" dark />
        <div className="flex gap-4">
          <motion.a 
            whileHover={{ scale: 1.1 }}
            href="https://www.instagram.com/grabngoza" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-black opacity-30 hover:opacity-100 transition-opacity"
          >
            <Instagram size={16} />
          </motion.a>
          <motion.a 
            whileHover={{ scale: 1.1 }}
            href="https://www.facebook.com/grabngoza" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-black opacity-30 hover:opacity-100 transition-opacity"
          >
            <Facebook size={16} />
          </motion.a>
          <motion.a 
            whileHover={{ scale: 1.1 }}
            href="https://wa.me/27691630778" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-black opacity-30 hover:opacity-100 transition-opacity"
          >
            <Phone size={16} />
          </motion.a>
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6 md:gap-12 w-full md:w-auto">
        <div className="space-y-3 md:space-y-4">
          <h4 className="text-[9px] font-semibold uppercase tracking-wider opacity-20 text-black">Shop</h4>
          <ul className="space-y-1 md:space-y-2 text-[9px] font-semibold uppercase tracking-wider text-black">
            <li onClick={() => { document.getElementById('drops')?.scrollIntoView({ behavior: 'smooth' }); }} className="opacity-30 hover:opacity-100 cursor-pointer transition-opacity">All Products</li>
            <li onClick={() => { document.getElementById('drops')?.scrollIntoView({ behavior: 'smooth' }); }} className="opacity-30 hover:opacity-100 cursor-pointer transition-opacity">New Arrivals</li>
            <li onClick={() => { document.getElementById('drops')?.scrollIntoView({ behavior: 'smooth' }); }} className="opacity-30 hover:opacity-100 cursor-pointer transition-opacity">Bundles</li>
          </ul>
        </div>
        
        <div className="space-y-3 md:space-y-4">
          <h4 className="text-[9px] font-semibold uppercase tracking-wider opacity-20 text-black">Support</h4>
          <ul className="space-y-1 md:space-y-2 text-[9px] font-semibold uppercase tracking-wider text-black">
            <li onClick={() => window.dispatchEvent(new CustomEvent('open-orders'))} className="opacity-30 hover:opacity-100 cursor-pointer transition-opacity">Track Order</li>
            <li className="opacity-30 hover:opacity-100 cursor-pointer transition-opacity">
              <Link to="/shipping">Shipping</Link>
            </li>
            <li className="opacity-30 hover:opacity-100 cursor-pointer transition-opacity">
              <Link to="/helpdesk">Help Desk</Link>
            </li>
            <li className="opacity-30 hover:opacity-100 cursor-pointer transition-opacity">
              <Link to="/returns">Self-Service Returns</Link>
            </li>
            <li className="opacity-30 hover:opacity-100 cursor-pointer transition-opacity">
              <Link to="/faq">FAQ</Link>
            </li>
            <li className="opacity-30 hover:opacity-100 cursor-pointer transition-opacity">
              <Link to="/refunds">Returns</Link>
            </li>
            <li className="opacity-30 hover:opacity-100 cursor-pointer transition-opacity">
              <a href="https://wa.me/27691630778" target="_blank" rel="noopener noreferrer">WhatsApp</a>
            </li>
          </ul>
        </div>

        <div className="space-y-3 md:space-y-4 hidden md:block text-black">
          <h4 className="text-[9px] font-semibold uppercase tracking-wider opacity-20">Legal</h4>
          <ul className="space-y-1 md:space-y-2 text-[9px] font-semibold uppercase tracking-wider">
            <li>
              <Link to="/story" className="opacity-30 hover:opacity-100 cursor-pointer transition-opacity">Our Story</Link>
            </li>
            <li>
              <Link to="/legal" className="opacity-30 hover:opacity-100 cursor-pointer transition-opacity">Privacy</Link>
            </li>
            <li>
              <Link to="/legal" className="opacity-30 hover:opacity-100 cursor-pointer transition-opacity">Terms</Link>
            </li>
            <li>
              <Link to="/refunds" className="opacity-30 hover:opacity-100 cursor-pointer transition-opacity">Refunds</Link>
            </li>
          </ul>
        </div>
      </div>
    </div>
    
    <div className="max-w-7xl mx-auto mt-12 md:mt-20 flex flex-col md:flex-row justify-between items-center gap-4 md:gap-6 border-t border-gray-50 pt-6 md:pt-8">
      <p className="text-[7px] font-semibold uppercase tracking-widest opacity-20 text-black">© 2026 Grab & Go Studio</p>
      <div className="flex gap-4 md:gap-6 opacity-10 text-black">
        <CreditCard size={14} />
        <Truck size={14} />
        <Zap size={14} />
      </div>
    </div>
  </footer>
  );
};

// Recipe 1: Technical Dashboard / Data Grid
// Mood: Professional, precise, information-dense.
const SystemHealthDashboard = () => {
  const systems = [
    {
      name: 'WhatsApp Business API',
      status: 'error',
      message: 'Session Expired (16-Mar-26)',
      icon: MessageSquare,
      action: 'https://developers.facebook.com/apps/',
      actionLabel: 'Update Token'
    },
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
          <div className="border border-[#141414] p-6">
            <h3 className="font-serif italic text-xl mb-4">Critical Alert: WhatsApp API</h3>
            <p className="text-sm leading-relaxed mb-4">
              The Meta Cloud API access token has expired. This prevents the system from sending order confirmations and status updates via WhatsApp.
            </p>
            <div className="bg-red-500/10 border border-red-500 p-4 rounded">
              <h4 className="font-bold text-xs uppercase tracking-widest mb-2 text-red-700 flex items-center gap-2">
                <AlertCircle size={14} /> Resolution Steps
              </h4>
              <ol className="text-xs space-y-2 text-red-900 list-decimal list-inside">
                <li>Log in to the Meta for Developers portal.</li>
                <li>Navigate to your App &gt; WhatsApp &gt; Configuration.</li>
                <li>Generate a new Permanent Access Token.</li>
                <li>Update the <code className="bg-red-500/20 px-1">WHATSAPP_ACCESS_TOKEN</code> in your environment variables.</li>
                <li>Restart the server to apply changes.</li>
              </ol>
            </div>
          </div>

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
  if (user?.role !== 'admin') return null;

  return (
    <motion.div 
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      className="bg-red-600 text-white py-2 px-4 text-center relative z-[60]"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-3">
        <AlertTriangle size={14} className="animate-pulse" />
        <span className="text-[10px] font-black uppercase tracking-[0.2em]">
          Critical System Alert: WhatsApp Session Expired. Notifications Offline.
        </span>
        <Link 
          to="/admin/system" 
          className="text-[10px] font-black uppercase tracking-[0.2em] underline ml-2 hover:opacity-80 transition-opacity"
        >
          View Diagnostics
        </Link>
      </div>
    </motion.div>
  );
};

const SelfServiceReturnsPage = () => {
  const [step, setStep] = useState<'lookup' | 'select' | 'confirm' | 'success'>('lookup');
  const [orderId, setOrderId] = useState('');
  const [email, setEmail] = useState('');
  const [order, setOrder] = useState<Order | null>(null);
  const [selectedItems, setSelectedItems] = useState<Record<string, { quantity: number, reason: string }>>({});
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [returnId, setReturnId] = useState('');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/orders/lookup?orderId=${orderId}&email=${email}`);
      
      let data;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1) {
        data = await response.json();
      } else {
        const text = await response.text();
        throw new Error(text || `Server error: ${response.status}`);
      }

      if (data.success) {
        setOrder(data.order);
        setStep('select');
      } else {
        setError(data.error || 'Order not found or not eligible for return');
      }
    } catch (err: any) {
      console.error('Order lookup error:', err);
      setError(err.message || 'Failed to lookup order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleItem = (productId: string) => {
    if (selectedItems[productId]) {
      const newItems = { ...selectedItems };
      delete newItems[productId];
      setSelectedItems(newItems);
    } else {
      const item = order?.items.find(i => i.id === productId);
      if (item) {
        setSelectedItems({
          ...selectedItems,
          [productId]: { quantity: 1, reason: 'Size too small' }
        });
      }
    }
  };

  const updateItem = (productId: string, field: 'quantity' | 'reason', value: any) => {
    setSelectedItems({
      ...selectedItems,
      [productId]: { ...selectedItems[productId], [field]: value }
    });
  };

  const handleSubmitReturn = async () => {
    setLoading(true);
    setError('');

    const items = Object.entries(selectedItems).map(([productId, data]) => {
      const orderItem = order?.items.find(i => i.id === productId);
      const itemData = data as { quantity: number, reason: string };
      return {
        productId,
        name: orderItem?.name,
        quantity: itemData.quantity,
        reason: itemData.reason,
        selectedVariants: orderItem?.selectedVariants
      };
    });

    try {
      const response = await fetch('/api/returns/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order?.id,
          email: order?.email,
          items,
          notes
        }),
      });

      let data;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1) {
        data = await response.json();
      } else {
        const text = await response.text();
        throw new Error(text || `Server error: ${response.status}`);
      }

      if (data.success) {
        setReturnId(data.returnId);
        setStep('success');
      } else {
        setError(data.error || 'Failed to submit return request');
      }
    } catch (err: any) {
      console.error('Return submission error:', err);
      setError(err.message || 'Failed to submit return request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const returnReasons = [
    "Size too small",
    "Size too large",
    "Changed my mind",
    "Defective/Damaged",
    "Incorrect item received",
    "Not as described"
  ];

  return (
    <div className="min-h-screen pt-32 pb-20 px-6 bg-white">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-display font-bold uppercase tracking-tighter mb-4">Returns</h1>
          <p className="text-sm text-gray-500 uppercase tracking-widest">Self-Service Return System</p>
        </div>

        {step === 'lookup' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-50 p-8 rounded-2xl border border-gray-100 max-w-md mx-auto"
          >
            <h2 className="text-xl font-bold uppercase tracking-tight mb-6 text-center">Find Your Order</h2>
            <form onSubmit={handleLookup} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Order ID</label>
                <input 
                  type="text" 
                  placeholder="e.g. ORD-123456"
                  required
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-md px-4 py-3 text-xs focus:ring-1 focus:ring-black outline-none transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Email Address</label>
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-md px-4 py-3 text-xs focus:ring-1 focus:ring-black outline-none transition-all"
                />
              </div>

              {error && (
                <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest text-center">{error}</p>
              )}

              <button 
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-black text-white text-[10px] font-black uppercase tracking-[0.2em] hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : "Find Order"}
              </button>
            </form>
            <p className="mt-6 text-[10px] text-gray-400 text-center uppercase tracking-widest leading-relaxed">
              Returns are accepted within 14 days of delivery for unworn items in original packaging.
            </p>
          </motion.div>
        )}

        {step === 'select' && order && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-8"
          >
            <div className="flex justify-between items-end border-b border-gray-100 pb-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Order {order.id}</p>
                <h2 className="text-xl font-bold uppercase tracking-tight">Select Items to Return</h2>
              </div>
              <button 
                onClick={() => setStep('lookup')}
                className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-black transition-colors"
              >
                Change Order
              </button>
            </div>

            <div className="space-y-4">
              {order.items.map((item) => (
                <div 
                  key={item.id}
                  className={`p-6 border rounded-2xl transition-all ${selectedItems[item.id] ? 'border-black bg-gray-50' : 'border-gray-100 hover:border-gray-200'}`}
                >
                  <div className="flex gap-6">
                    <div className="w-20 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      <img src={item.image || undefined} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <div className="flex-1 space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-sm font-bold uppercase tracking-tight">{item.name}</h3>
                          {item.selectedVariants && (
                            <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-1">
                              {Object.entries(item.selectedVariants).map(([k, v]) => `${k}: ${v}`).join(' | ')}
                            </p>
                          )}
                        </div>
                        <button 
                          onClick={() => toggleItem(item.id)}
                          className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all ${selectedItems[item.id] ? 'bg-black border-black text-white' : 'border-gray-200 text-transparent'}`}
                        >
                          <Check size={14} />
                        </button>
                      </div>

                      {selectedItems[item.id] && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200"
                        >
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Quantity</label>
                            <select 
                              value={selectedItems[item.id].quantity}
                              onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value))}
                              className="w-full bg-white border border-gray-200 rounded-md px-3 py-2 text-[10px] font-bold uppercase tracking-widest outline-none"
                            >
                              {[...Array(item.quantity)].map((_, i) => (
                                <option key={i+1} value={i+1}>{i+1}</option>
                              ))}
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Reason</label>
                            <select 
                              value={selectedItems[item.id].reason}
                              onChange={(e) => updateItem(item.id, 'reason', e.target.value)}
                              className="w-full bg-white border border-gray-200 rounded-md px-3 py-2 text-[10px] font-bold uppercase tracking-widest outline-none"
                            >
                              {returnReasons.map(reason => (
                                <option key={reason} value={reason}>{reason}</option>
                              ))}
                            </select>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-4 pt-8 border-t border-gray-100">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Additional Notes (Optional)</label>
                <textarea 
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Tell us more about the reason for your return..."
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-xs focus:ring-1 focus:ring-black outline-none transition-all resize-none"
                />
              </div>

              <button 
                onClick={() => setStep('confirm')}
                disabled={Object.keys(selectedItems).length === 0}
                className="w-full py-4 bg-black text-white text-[10px] font-black uppercase tracking-[0.2em] hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                Review Return Request
              </button>
            </div>
          </motion.div>
        )}

        {step === 'confirm' && order && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-50 p-8 rounded-2xl border border-gray-100 space-y-8"
          >
            <div className="text-center">
              <h2 className="text-xl font-bold uppercase tracking-tight mb-2">Confirm Return</h2>
              <p className="text-[10px] text-gray-400 uppercase tracking-widest">Please review your return details</p>
            </div>

            <div className="space-y-4">
              {Object.entries(selectedItems).map(([productId, data]) => {
                const item = order.items.find(i => i.id === productId);
                const itemData = data as { quantity: number, reason: string };
                return (
                  <div key={productId} className="flex justify-between items-center py-3 border-b border-gray-200 last:border-0">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-tight">{item?.name}</p>
                      <p className="text-[10px] text-gray-400 uppercase tracking-widest">{itemData.reason}</p>
                    </div>
                    <p className="text-xs font-mono">QTY: {itemData.quantity}</p>
                  </div>
                );
              })}
            </div>

            {notes && (
              <div className="p-4 bg-white rounded-lg border border-gray-200">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Notes</p>
                <p className="text-xs text-gray-600 italic">"{notes}"</p>
              </div>
            )}

            <div className="space-y-3 pt-4">
              {error && (
                <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest text-center">{error}</p>
              )}
              <button 
                onClick={handleSubmitReturn}
                disabled={loading}
                className="w-full py-4 bg-black text-white text-[10px] font-black uppercase tracking-[0.2em] hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : "Submit Return Request"}
              </button>
              <button 
                onClick={() => setStep('select')}
                disabled={loading}
                className="w-full py-4 bg-transparent text-black text-[10px] font-black uppercase tracking-[0.2em] hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                Back to Selection
              </button>
            </div>
          </motion.div>
        )}

        {step === 'success' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-8 py-12"
          >
            <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={40} />
            </div>
            <div>
              <h2 className="text-3xl font-bold uppercase tracking-tighter mb-2">Request Submitted</h2>
              <p className="text-sm text-gray-500 uppercase tracking-widest">Return ID: {returnId}</p>
            </div>
            <div className="max-w-md mx-auto bg-gray-50 p-8 rounded-2xl border border-gray-100 text-left space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-widest">What's Next?</h3>
              <ol className="space-y-4 text-xs text-gray-500 list-decimal pl-4">
                <li>Our team will review your request within 24-48 hours.</li>
                <li>Once approved, you'll receive a return shipping label via email.</li>
                <li>Pack your items securely and drop them off at the nearest courier point.</li>
                <li>Refunds are processed within 5-7 business days of receiving the items.</li>
              </ol>
            </div>
            <Link 
              to="/"
              className="inline-block py-4 px-12 bg-black text-white text-[10px] font-black uppercase tracking-[0.2em] hover:opacity-90 transition-opacity"
            >
              Back to Shop
            </Link>
          </motion.div>
        )}
      </div>
    </div>
  );
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
      const response = await fetch('/api/helpdesk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      let data;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1) {
        data = await response.json();
      } else {
        const text = await response.text();
        throw new Error(text || `Server error: ${response.status}`);
      }

      if (data.success) {
        setStatus('success');
        setFormData({ name: '', email: '', subject: '', message: '' });
      } else {
        throw new Error(data.error || 'Failed to send message');
      }
    } catch (err: any) {
      console.error('HelpDesk error:', err);
      setStatus('error');
      setErrorMessage(err.message || 'Failed to send message. Please try again.');
    }
  };

  return (
    <div className="min-h-screen pt-32 pb-20 px-6 bg-white">
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

            <div className="grid grid-cols-2 gap-4">
              <a href="https://wa.me/27691630778" target="_blank" rel="noopener noreferrer" className="p-6 border border-gray-100 rounded-2xl flex flex-col items-center text-center hover:bg-gray-50 transition-colors group">
                <div className="w-10 h-10 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <MessageSquare size={20} />
                </div>
                <h3 className="text-[10px] font-bold uppercase tracking-widest mb-1">WhatsApp</h3>
                <p className="text-[8px] text-gray-400 uppercase tracking-wider">Instant Support</p>
              </a>
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
                  a: "We accept returns within 14 days of delivery. Exchanges are accepted within 30 days. Items must be in original condition."
                },
                {
                  q: "How can I track my order?",
                  a: "Once shipped, you'll receive a tracking number via email and WhatsApp. You can also track it in your account dashboard."
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
          a: "• Refunds: Must be requested within 14 days of delivery.\n• Exchanges: Must be requested within 30 days of purchase or delivery."
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
            <a href="https://wa.me/27691630778" target="_blank" rel="noopener noreferrer" className="underline font-semibold ml-1">WhatsApp</a>.
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
            <li><span className="font-semibold">Availability:</span> The pickup option is automatically made available during your checkout if the specific location has stock of the product you are viewing.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold uppercase tracking-tight border-b border-gray-100 pb-2">3. Real-Time Tracking & Trust</h2>
          <p className="text-sm leading-relaxed text-gray-500">Building trust through transparency is core to our mission.</p>
          <ul className="space-y-2 text-sm text-gray-500 list-disc pl-5">
            <li><span className="font-semibold">Hybrid Updates:</span> Once your order is processed through our Website + WhatsApp hybrid checkout, you will receive instant branded confirmations.</li>
            <li><span className="font-semibold">Stay Informed:</span> You will receive continuous tracking updates via WhatsApp, SMS, or Email. These updates, powered by Zoho automation, allow you to track your order every step of the way.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold uppercase tracking-tight border-b border-gray-100 pb-2">4. Returns & Exchanges</h2>
          <ul className="space-y-2 text-sm text-gray-500 list-disc pl-5">
            <li><span className="font-semibold">Flexibility:</span> You can choose to return your online orders either in-store or online.</li>
            <li><span className="font-semibold">Support:</span> We uphold the Consumer Goods and Services Code to ensure a "premium experience" that feels secure and stylish.</li>
          </ul>
        </section>

        <footer className="pt-8 border-t border-gray-50 text-center">
          <p className="text-sm text-gray-500">
            For any further assistance, please contact our support team through our integrated 
            <a href="https://wa.me/27691630778" target="_blank" rel="noopener noreferrer" className="underline font-semibold ml-1">WhatsApp channel</a>.
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
            <li><span className="font-semibold">Log in to your account:</span> Enter your email on our site to receive a six-digit verification code.</li>
            <li><span className="font-semibold">Select your order:</span> Choose the specific order and items you wish to return.</li>
            <li><span className="font-semibold">Submit Request:</span> Select a reason for the return and submit. Once approved, you will receive an email with shipping instructions.</li>
            <li><span className="font-semibold">Finalisation:</span> After the product is returned and inspected, we will reach out via our "WhatsApp/Zoho" automation flow to finalise your refund or exchange.</li>
          </ol>
        </section>

        <footer className="pt-8 border-t border-gray-50 text-center">
          <p className="text-sm text-gray-500">
            For any further assistance, please contact our support team through our integrated 
            <a href="https://wa.me/27691630778" target="_blank" rel="noopener noreferrer" className="underline font-semibold ml-1">WhatsApp channel</a>.
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
            <li>All payment info processed via iKhokha or EFT remains confidential and secure.</li>
            <li>You may request access to your data or request deletion at any time.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold uppercase tracking-tight border-b border-gray-100 pb-2">3. Online Shopping Terms & Conditions</h2>
          <ul className="space-y-2 text-sm text-gray-500 list-disc pl-5">
            <li>Orders are placed via WhatsApp and confirmed with proof of payment.</li>
            <li>Items are sold on a first-pay, first-serve basis.</li>
            <li>Prices are final unless a discount or promo is explicitly offered.</li>
            <li>We accept EFT, iKhokha card payments, or cash (on collection only).</li>
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
            <li>Customers can request basic assistance in other languages via WhatsApp.</li>
            <li>For any further clarification, contact us on WhatsApp or via email.</li>
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
    <div className="pt-24 pb-16 px-6 md:px-12 max-w-3xl mx-auto">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-12"
      >
        <header className="text-center space-y-3">
          <h1 className="text-2xl md:text-4xl font-semibold uppercase tracking-tight">Our Story</h1>
          <p className="text-[10px] font-semibold uppercase tracking-wider opacity-30 italic">Born in a design studio. Built for the streets.</p>
        </header>

        <div className="space-y-6 text-base md:text-lg leading-relaxed text-black/80 font-normal">
          <p>
            Grab & Go ZA is a ready-to-wear streetwear brand designed by <span className="font-semibold">IDEAS TO LIFE Studios</span>, 
            a creative house known for bold visuals and meaningful design & print solutions. 
          </p>
          
          <p>
            After years of producing various custom gear/clothing for others, we flipped the script and created something for the fast movers - 
            no approvals, no waiting & best of all <span className="font-semibold underline">100% South African products</span>.
          </p>

          <p>
            We design and drop retail-ready merch that’s crafted, limited, and always on point. Each piece is made with intention - 
            from the fit and feel, to the colorways and artwork. 
          </p>

          <p className="text-xl md:text-2xl font-semibold uppercase tracking-tight pt-6 border-t border-gray-50">
            What you see is what you get. 
          </p>
          
          <p>
            No endless back-and-forth. Just fresh, finished fashion that’s ready to move when you are.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-8">
          <div className="aspect-[4/5] bg-gray-50 overflow-hidden grayscale hover:grayscale-0 transition-all duration-700 rounded-lg">
            <img 
              src="https://picsum.photos/seed/studio/800/1000" 
              alt="Studio" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="aspect-[4/5] bg-gray-50 overflow-hidden grayscale hover:grayscale-0 transition-all duration-700 rounded-lg">
            <img 
              src="https://picsum.photos/seed/street/800/1000" 
              alt="Street" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const NotFoundPage = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <h1 className="text-6xl md:text-8xl font-semibold leading-none tracking-tight opacity-5">404</h1>
        <div className="space-y-2">
          <h2 className="text-xl md:text-2xl font-semibold uppercase tracking-tight">Lost in the Studio?</h2>
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
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Email auth failed:", err);
      if (err.code === 'auth/operation-not-allowed') {
        setError('Email/Password login is disabled. Please enable it in the Firebase Console (Authentication > Sign-in method).');
      } else if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Invalid email or password. If you had an account on the old version of the app, you may need to Sign Up again for this new version.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many failed attempts. This account has been temporarily disabled. Please try again later or reset your password.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('An account with this email already exists.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password should be at least 6 characters.');
      } else {
        setError(err.message || 'Authentication failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Google login failed:", err);
      if (err.code === 'auth/popup-closed-by-user') {
        // User closed the popup, don't show an error
        return;
      }
      if (err.code === 'auth/operation-not-allowed') {
        setError('Google login is disabled. Please enable it in the Firebase Console.');
      } else {
        setError(err.message || 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFacebookLogin = async () => {
    setLoading(true);
    setError('');
    const provider = new FacebookAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Facebook login failed:", err);
      if (err.code === 'auth/popup-closed-by-user') return;
      if (err.code === 'auth/operation-not-allowed') {
        setError('Facebook login is disabled. Please enable it in the Firebase Console.');
      } else {
        setError(err.message || 'Login failed');
      }
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
            className="relative w-full max-w-md bg-white border border-gray-100 shadow-2xl overflow-hidden flex flex-col"
          >
            <div className="p-8 md:p-10 text-center space-y-6">
              <div className="space-y-2">
                <Logo className="h-8 mx-auto" dark />
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-30">Studio Access</p>
              </div>

              <div className="space-y-2">
                <h2 className="text-xl font-display font-bold uppercase tracking-tighter">
                  {mode === 'login' ? 'Welcome Back' : 'Create Account'}
                </h2>
                <p className="text-xs text-gray-500 leading-relaxed">
                  {mode === 'login' 
                    ? 'Sign in to track your orders and manage your studio profile.' 
                    : 'Join the studio to save your details and track your orders.'}
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
  const [testingWhatsApp, setTestingWhatsApp] = useState<string | null>(null);

  const handleTestWhatsApp = async (order: Order) => {
    if (!order.phone) {
      alert("No phone number associated with this order.");
      return;
    }
    
    setTestingWhatsApp(order.id);
    try {
      const msg = `Hi ${order.firstName}, this is a test message from Grab & Go for order #${order.id.slice(0, 8).toUpperCase()}. Tracking: ${order.trackingNumber || 'Pending'}`;
      const res = await fetch('/api/test/whatsapp', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('grab_and_go_token')}`
        },
        body: JSON.stringify({ phone: order.phone, message: msg })
      });
      
      const data = await res.json();
      if (res.ok && data.success) {
        alert(`Test WhatsApp sent successfully! ${data.demo ? '(Demo Mode)' : ''}`);
      } else {
        alert(`Failed to send test WhatsApp: ${data.error || data.details || 'Unknown error'}`);
      }
    } catch (err) {
      console.error("WhatsApp test error:", err);
      alert("An error occurred while sending the test message.");
    } finally {
      setTestingWhatsApp(null);
    }
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'pending': return 'bg-yellow-50 text-yellow-600';
      case 'preparing': return 'bg-blue-50 text-blue-600';
      case 'ready': return 'bg-emerald-50 text-emerald-600';
      case 'completed': return 'bg-gray-50 text-gray-400';
      case 'cancelled': return 'bg-red-50 text-red-600';
      default: return 'bg-gray-50 text-black';
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
                        {order.status}
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
                    {(order.trackingNumber || order.trackingUrl) && (
                      <div className="pt-4 border-t border-gray-100 space-y-3">
                        <div className="flex justify-between items-end">
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest opacity-50 mb-1">Tracking Number</p>
                            <p className="text-xs font-mono">{order.trackingNumber || 'N/A'}</p>
                          </div>
                          {order.trackingUrl && (
                            <a 
                              href={order.trackingUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 px-4 py-2 bg-black text-white text-[10px] font-black uppercase tracking-widest hover:bg-black/80 transition-colors"
                            >
                              Track Order <ExternalLink size={12} />
                            </a>
                          )}
                        </div>
                        {user.role === 'admin' && order.labelUrl && (
                          <button 
                            onClick={async () => {
                              try {
                                const res = await fetch(`/api/orders/${order.id}/label`, {
                                  headers: { 'Authorization': `Bearer ${localStorage.getItem('grab_and_go_token')}` }
                                });
                                if (res.ok) {
                                  const blob = await res.blob();
                                  const url = window.URL.createObjectURL(blob);
                                  const a = document.createElement('a');
                                  a.href = url;
                                  a.download = `shipping-label-${order.id}.pdf`;
                                  document.body.appendChild(a);
                                  a.click();
                                  a.remove();
                                } else {
                                  alert("Failed to download label");
                                }
                              } catch (err) {
                                console.error("Label download error:", err);
                              }
                            }}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-black text-black text-[10px] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all"
                          >
                            Download Shipping Label <Package size={12} />
                          </button>
                        )}

                        {user.role === 'admin' && (
                          <button 
                            onClick={() => handleTestWhatsApp(order)}
                            disabled={testingWhatsApp === order.id}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-emerald-600 text-emerald-600 text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all disabled:opacity-50"
                          >
                            {testingWhatsApp === order.id ? <Loader2 className="animate-spin" size={12} /> : <MessageSquare size={12} />}
                            Send Test WhatsApp
                          </button>
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

const ProductManagementDrawer = ({ 
  isOpen, 
  onClose, 
  products,
  onSave,
  onDelete,
  token
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  products: Product[],
  onSave: (p: Partial<Product>) => Promise<void>,
  onDelete: (id: string) => Promise<void>,
  token: string | null
}) => {
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredProducts = useMemo(() => {
    return products.filter(p => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.brand?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [products, searchQuery]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    setIsSaving(true);
    await onSave(editingProduct);
    setIsSaving(false);
    setEditingProduct(null);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (res.ok) {
        const { imageUrl } = await res.json();
        setEditingProduct(prev => prev ? { ...prev, image: imageUrl } : null);
      }
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setIsUploading(false);
    }
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
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-black/30" size={16} />
                <input 
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-100 pl-12 pr-4 py-3 text-xs font-bold uppercase tracking-widest focus:border-black outline-none transition-all text-black"
                />
              </div>
              <button 
                onClick={() => setEditingProduct({ name: '', price: 0, category: 'Apparel', image: '', description: '', variants: [] })}
                className="w-full py-4 border border-dashed border-gray-200 hover:border-black/20 transition-colors flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest text-black"
              >
                <Plus size={16} /> Add New Product
              </button>
            </div>

            <div className="flex-grow overflow-y-auto space-y-4 pr-4 custom-scrollbar">
              {filteredProducts.map((product) => (
                <div key={product.id} className="p-4 border border-gray-50 bg-gray-50/30 flex gap-4 items-center text-black group">
                  <img src={product.image || undefined} alt={product.name} className="w-12 h-16 object-cover grayscale" />
                  <div className="flex-grow">
                    <h4 className="text-sm font-bold uppercase tracking-tight">{product.name}</h4>
                    <p className="text-[10px] opacity-50 uppercase tracking-widest">{formatPrice(product.price)} • {product.category}</p>
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
                    className="relative w-full max-w-lg bg-white border border-gray-100 shadow-2xl p-6 text-black"
                  >
                    <h3 className="text-xl font-display font-bold uppercase tracking-tighter mb-6">
                      {editingProduct.id ? 'Edit Product' : 'New Product'}
                    </h3>
                    <form onSubmit={handleSave} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-widest opacity-50">Name</label>
                          <input 
                            type="text" 
                            required
                            value={editingProduct.name}
                            onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                            className="w-full bg-gray-50 border border-gray-100 px-4 py-2 text-sm focus:border-black outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-widest opacity-50">Brand</label>
                          <input 
                            type="text" 
                            placeholder="e.g. Anatomy"
                            value={editingProduct.brand || ''}
                            onChange={(e) => setEditingProduct({ ...editingProduct, brand: e.target.value })}
                            className="w-full bg-gray-50 border border-gray-100 px-4 py-2 text-sm focus:border-black outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-widest opacity-50">Price (R)</label>
                          <input 
                            type="number" 
                            required
                            value={editingProduct.price}
                            onChange={(e) => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })}
                            className="w-full bg-gray-50 border border-gray-100 px-4 py-2 text-sm focus:border-black outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-widest opacity-50">Original Price (R)</label>
                          <input 
                            type="number" 
                            value={editingProduct.originalPrice || ''}
                            onChange={(e) => setEditingProduct({ ...editingProduct, originalPrice: Number(e.target.value) })}
                            className="w-full bg-gray-50 border border-gray-100 px-4 py-2 text-sm focus:border-black outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-widest opacity-50">Sold By</label>
                          <input 
                            type="text" 
                            placeholder="e.g. Sportscene"
                            value={editingProduct.soldBy || ''}
                            onChange={(e) => setEditingProduct({ ...editingProduct, soldBy: e.target.value })}
                            className="w-full bg-gray-50 border border-gray-100 px-4 py-2 text-sm focus:border-black outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-widest opacity-50">Sold By Logo URL</label>
                          <input 
                            type="text" 
                            placeholder="Logo URL"
                            value={editingProduct.soldByLogo || ''}
                            onChange={(e) => setEditingProduct({ ...editingProduct, soldByLogo: e.target.value })}
                            className="w-full bg-gray-50 border border-gray-100 px-4 py-2 text-sm focus:border-black outline-none"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-widest opacity-50">Category</label>
                          <select 
                            value={editingProduct.category}
                            onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                            className="w-full bg-gray-50 border border-gray-100 px-4 py-2 text-sm focus:border-black outline-none appearance-none"
                          >
                            <option value="Apparel">Apparel</option>
                            <option value="Accessories">Accessories</option>
                            <option value="Bundles">Bundles</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-widest opacity-50">Weight (kg)</label>
                          <input 
                            type="number" 
                            step="0.1"
                            value={editingProduct.weight || ''}
                            onChange={(e) => setEditingProduct({ ...editingProduct, weight: Number(e.target.value) })}
                            className="w-full bg-gray-50 border border-gray-100 px-4 py-2 text-sm focus:border-black outline-none"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-widest opacity-50">Product Image</label>
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
                          className={`relative border-2 border-dashed border-gray-200 p-8 transition-all flex flex-col items-center justify-center gap-4 group/drop ${isUploading ? 'opacity-50 pointer-events-none' : 'hover:border-black/20 cursor-pointer'}`}
                          onClick={() => fileInputRef.current?.click()}
                        >
                          {editingProduct.image ? (
                            <div className="relative w-32 aspect-[4/5] shadow-xl">
                              <img src={editingProduct.image || undefined} alt="Preview" className="w-full h-full object-cover grayscale group-hover/drop:grayscale-0 transition-all" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/drop:opacity-100 transition-opacity flex items-center justify-center">
                                <p className="text-[8px] font-black uppercase text-white">Change Image</p>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover/drop:text-black transition-colors">
                                <Upload size={20} />
                              </div>
                              <div className="text-center">
                                <p className="text-[10px] font-black uppercase tracking-widest">Drag & Drop Image</p>
                                <p className="text-[8px] opacity-40 uppercase tracking-widest mt-1">or click to browse</p>
                              </div>
                            </>
                          )}
                          {isUploading && (
                            <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
                              <Loader2 className="animate-spin text-black" size={24} />
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
                        <div className="mt-2">
                          <label className="text-[8px] font-bold uppercase tracking-widest opacity-30">Or use URL</label>
                          <input 
                            type="text" 
                            placeholder="https://image-url.com/photo.jpg"
                            value={editingProduct.image}
                            onChange={(e) => setEditingProduct({ ...editingProduct, image: e.target.value })}
                            className="w-full bg-gray-50 border border-gray-100 px-4 py-2 text-[10px] font-mono focus:border-black outline-none mt-1"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-widest opacity-50">Additional Images (Comma separated URLs)</label>
                        <textarea 
                          placeholder="https://image1.jpg, https://image2.jpg"
                          value={editingProduct.images?.join(', ') || ''}
                          onChange={(e) => setEditingProduct({ ...editingProduct, images: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                          className="w-full bg-gray-50 border border-gray-100 px-4 py-2 text-sm focus:border-black outline-none h-16 resize-none text-black"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-widest opacity-50">Description</label>
                        <textarea 
                          required
                          value={editingProduct.description}
                          onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                          className="w-full bg-gray-50 border border-gray-100 px-4 py-2 text-sm focus:border-black outline-none h-24 resize-none text-black"
                        />
                      </div>

                      {/* Variants Section */}
                      <div className="space-y-4 pt-4 border-t border-gray-100">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] font-bold uppercase tracking-widest opacity-50">Variants (e.g. Size, Color)</label>
                          <button 
                            type="button"
                            onClick={addVariant}
                            className="text-[10px] font-bold uppercase tracking-widest text-black hover:opacity-70 flex items-center gap-1"
                          >
                            <Plus size={12} /> Add Variant
                          </button>
                        </div>
                        
                        <div className="space-y-4">
                          {editingProduct.variants?.map((variant) => (
                            <div key={variant.id} className="p-4 bg-gray-50 border border-gray-100 space-y-3">
                              <div className="flex gap-2 items-center">
                                <input 
                                  type="text"
                                  placeholder="Variant Name (e.g. Size)"
                                  value={variant.name}
                                  onChange={(e) => updateVariant(variant.id, { name: e.target.value })}
                                  className="flex-grow bg-white border border-gray-100 px-3 py-1.5 text-xs focus:border-black outline-none text-black"
                                />
                                <button 
                                  type="button"
                                  onClick={() => removeVariant(variant.id)}
                                  className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                              
                              <div className="flex flex-wrap gap-2">
                                {variant.options.map((opt) => (
                                  <span key={opt} className="px-2 py-1 bg-gray-100 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 text-black">
                                    {opt}
                                    <button 
                                      type="button"
                                      onClick={() => removeOption(variant.id, opt)}
                                      className="hover:text-red-500"
                                    >
                                      <X size={10} />
                                    </button>
                                  </span>
                                ))}
                                <input 
                                  type="text"
                                  placeholder="Add option..."
                                  className="bg-transparent border-b border-gray-100 px-2 py-1 text-[10px] outline-none focus:border-black w-24 text-black"
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
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-4 pt-4">
                        <button 
                          type="button"
                          onClick={() => setEditingProduct(null)}
                          className="flex-grow py-3 border border-gray-100 font-bold uppercase tracking-widest text-xs text-black"
                        >
                          Cancel
                        </button>
                        <button 
                          type="submit"
                          disabled={isSaving}
                          className="flex-grow py-3 bg-black text-white font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2"
                        >
                          {isSaving ? <Loader2 className="animate-spin" size={16} /> : 'Save Product'}
                        </button>
                      </div>
                    </form>
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
  onCheckout 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  cartItems: CartItem[],
  onUpdateQuantity: (id: string, delta: number, variants?: Record<string, string>) => void,
  onRemove: (id: string, variants?: Record<string, string>) => void,
  onCheckout: () => void
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

            <div className="flex-grow overflow-y-auto space-y-6 pr-2 custom-scrollbar">
            {cartItems.length === 0 ? (
              <div className="text-center py-20 opacity-30 text-black">
                <ShoppingBag size={48} className="mx-auto mb-4" />
                <p className="uppercase tracking-widest text-sm font-bold">Your bag is empty</p>
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
                        <p className="text-[10px] opacity-50 uppercase tracking-widest mt-1">{item.category}</p>
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
                          className="p-1 hover:bg-gray-50 transition-colors"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="w-8 text-center text-xs font-mono font-bold">{item.quantity}</span>
                        <button 
                          onClick={() => onUpdateQuantity(item.id, 1, item.selectedVariants)}
                          className="p-1 hover:bg-gray-50 transition-colors"
                        >
                          <Plus size={12} />
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
  const [demoMessage, setDemoMessage] = useState<string | null>(null);
  const [paymentGateway, setPaymentGateway] = useState<'ikhokha' | 'yoco'>('ikhokha');

  const shippingCost = useMemo(() => {
    if (deliveryMethod === 'pickup') return 0;
    if (deliveryMethod === 'international') return 450; // Flat rate for now
    return 100; // standard
  }, [deliveryMethod]);

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
      const pendingOrder: Order = {
        id: Math.random().toString(36).substr(2, 9).toUpperCase(),
        userId: user?.id,
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
        date: new Date().toISOString(),
        status: 'pending',
        paymentGateway
      };
      localStorage.setItem('grab_and_go_pending_order', JSON.stringify(pendingOrder));

      const endpoint = paymentGateway === 'ikhokha' ? '/api/checkout/ikhokha' : '/api/create-yoco-payment';
      const body = paymentGateway === 'ikhokha' ? {
        amount: finalTotal,
        externalId: pendingOrder.id,
        customerName: `${firstName} ${lastName}`,
        customerEmail: email,
        returnUrl: `${window.location.origin}/order-success?id=${pendingOrder.id}`,
        cancelUrl: `${window.location.origin}/checkout`,
        order: pendingOrder
      } : {
        amount: finalTotal,
        currency: 'ZAR',
        metadata: { orderId: pendingOrder.id },
        order: pendingOrder
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.error("Non-JSON response received:", text);
        throw new Error(`Server error: Received ${response.status} ${response.statusText}. Please check server logs.`);
      }

      const data = await response.json();

      if (data.success) {
        if (data.demo) {
          // In demo mode, we just simulate success
          console.log("[DEMO] Simulating payment success...");
          
          // Trigger the same success logic as real payment
          const pendingStr = localStorage.getItem('grab_and_go_pending_order');
          if (pendingStr) {
            const pending = JSON.parse(pendingStr);
            try {
              const emailRes = await fetch('/api/send-order-confirmation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: pending.email, order: pending }),
              });
              const emailData = await emailRes.json();
              
              if (emailData.demo) {
                setDemoMessage("Order Simulated! NOTE: Real emails and WhatsApp alerts are DISABLED because API keys are not configured in Secrets. Check the Server Logs to see the content.");
              } else {
                setDemoMessage("Order Simulated! Confirmation email and WhatsApp alert have been sent.");
              }
              onPaymentStatusChange('success');
            } catch (err) {
              console.error("Failed to send confirmation email:", err);
              setDemoMessage("Order Simulated! (But email notification failed - check console)");
              onPaymentStatusChange('success');
            }
          }
        } else {
          // Real redirect
          window.location.href = data.checkoutUrl || data.redirectUrl;
        }
      } else {
        throw new Error(data.details || data.error || 'Payment failed to initialize');
      }
    } catch (err: any) {
      setPaymentError(err.message || 'Payment initialization failed');
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
              <p className="text-xs md:text-sm text-gray-500 max-w-md mb-6 px-4">Thank you for your order. We've sent a confirmation email to {email} and a WhatsApp alert to {phone}.</p>
              
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

              {demoMessage && (
                <div className="mb-6 md:mb-8 p-4 bg-yellow-50 border border-yellow-100 rounded-lg max-w-md mx-4">
                  <p className="text-[8px] md:text-[10px] font-bold uppercase tracking-widest text-yellow-700">{demoMessage}</p>
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
                          onClick={() => {
                            setDeliveryMethod('standard');
                            setCountry('South Africa');
                          }}
                          className={`flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 py-3 md:py-4 text-[10px] md:text-xs font-bold transition-all ${deliveryMethod === 'standard' ? 'bg-gray-50 shadow-inner' : 'bg-white hover:bg-gray-50'}`}
                        >
                          <Truck size={14} className="md:w-4 md:h-4" /> Standard
                        </button>
                        <button 
                          onClick={() => {
                            setDeliveryMethod('pickup');
                            setCountry('South Africa');
                          }}
                          className={`flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 py-3 md:py-4 text-[10px] md:text-xs font-bold transition-all ${deliveryMethod === 'pickup' ? 'bg-gray-50 shadow-inner' : 'bg-white hover:bg-gray-50'}`}
                        >
                          <MapPin size={14} className="md:w-4 md:h-4" /> Pickup
                        </button>
                        <button 
                          onClick={() => setDeliveryMethod('international')}
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
                            type="text" 
                            placeholder="Address" 
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            required
                            className="w-full border border-gray-200 rounded-md px-4 py-3 text-sm focus:ring-2 focus:ring-black focus:outline-none transition-all" 
                          />
                          
                          <div className="grid grid-cols-3 gap-4">
                            <input 
                              type="text" 
                              placeholder="City" 
                              value={city}
                              onChange={(e) => setCity(e.target.value)}
                              required
                              className="col-span-1 w-full border border-gray-200 rounded-md px-4 py-3 text-sm focus:ring-2 focus:ring-black focus:outline-none transition-all" 
                            />
                            <input 
                              type="text" 
                              placeholder="Province" 
                              value={province}
                              onChange={(e) => setProvince(e.target.value)}
                              required
                              className="col-span-1 w-full border border-gray-200 rounded-md px-4 py-3 text-sm focus:ring-2 focus:ring-black focus:outline-none transition-all" 
                            />
                            <input 
                              type="text" 
                              placeholder="Postal code" 
                              value={postalCode}
                              onChange={(e) => setPostalCode(e.target.value)}
                              required
                              className="col-span-1 w-full border border-gray-200 rounded-md px-4 py-3 text-sm focus:ring-2 focus:ring-black focus:outline-none transition-all" 
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
                        </>
                      ) : (
                        <div className="space-y-4">
                          <p className="text-xs text-gray-500 mb-2">Pickup your order directly from our studio in Cape Town (No shipping fee).</p>
                          <div className="p-4 border border-gray-200 rounded-md bg-gray-50">
                            <p className="text-sm font-bold mb-1">Grab & Go Studio</p>
                            <p className="text-[10px] text-gray-500 uppercase tracking-widest">123 Studio Lane, Woodstock, Cape Town</p>
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
                      <button 
                        onClick={() => setPaymentGateway('ikhokha')}
                        className={`w-full p-4 border rounded-md flex items-center justify-between transition-all ${paymentGateway === 'ikhokha' ? 'border-black bg-gray-50' : 'border-gray-200 hover:border-black'}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-6 bg-black rounded flex items-center justify-center text-[8px] text-white font-bold">iK PAY</div>
                          <span className="text-sm font-medium">iKhokha iK Pay</span>
                        </div>
                        {paymentGateway === 'ikhokha' && <CheckCircle2 size={16} />}
                      </button>

                      <button 
                        onClick={() => setPaymentGateway('yoco')}
                        className={`w-full p-4 border rounded-md flex items-center justify-between transition-all ${paymentGateway === 'yoco' ? 'border-black bg-gray-50' : 'border-gray-200 hover:border-black'}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-6 bg-blue-600 rounded flex items-center justify-center text-[8px] text-white font-bold uppercase">Yoco</div>
                          <span className="text-sm font-medium">Yoco Secure Checkout</span>
                        </div>
                        {paymentGateway === 'yoco' && <CheckCircle2 size={16} />}
                      </button>
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
                          Pay R{finalTotal} with {paymentGateway === 'ikhokha' ? 'iKhokha' : 'Yoco'} <ArrowRight size={20} />
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
                          <p className="text-[8px] md:text-[10px] text-gray-500 uppercase tracking-widest truncate">{item.category}</p>
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
                      <div className="flex items-center gap-1 text-gray-600">
                        Shipping <Info size={12} className="opacity-50" />
                      </div>
                      <span className="text-gray-500">
                        {shippingCost === 0 ? 'Free' : formatPrice(shippingCost)}
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
      const response = await fetch('/api/send-product-details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, product }),
      });

      let data;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        throw new Error(`Server returned non-JSON response: ${text.slice(0, 100)}`);
      }

      if (response.ok) {
        setStatus('success');
        setTimeout(() => {
          onClose();
          setStatus('idle');
          setEmail('');
        }, 2000);
      } else {
        setStatus('error');
        setErrorDetails(data.details || data.error || 'Failed to send');
      }
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
                <p className="text-[10px] text-gray-500 uppercase tracking-widest truncate">{product.category}</p>
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

const HomePage = ({ 
  filteredAndSortedProducts, 
  filterCategory, 
  setFilterCategory, 
  sortBy, 
  setSortBy, 
  scrollProducts, 
  productScrollRef, 
  addToCart, 
  handleBuyNow,
  onEmailDetails,
  searchQuery
}: {
  filteredAndSortedProducts: Product[],
  filterCategory: string,
  setFilterCategory: (c: string) => void,
  sortBy: string,
  setSortBy: (s: any) => void,
  scrollProducts: (d: 'left' | 'right') => void,
  productScrollRef: React.RefObject<HTMLDivElement | null>,
  addToCart: (p: Product, v?: Record<string, string>, q?: number) => void,
  handleBuyNow: (p: Product, v?: Record<string, string>) => void,
  onEmailDetails: (p: Product) => void,
  searchQuery: string
}) => (
  <main className="bg-white text-black">
    <Hero />
    
    <section id="drops" className="py-16 md:py-20 px-6 max-w-7xl mx-auto overflow-hidden">
      <div className="flex flex-col md:flex-row justify-between items-baseline mb-12 md:mb-16 gap-8">
        <h2 className="text-[8vw] md:text-[4vw] font-display font-bold uppercase tracking-tighter leading-none text-black">
          Featured<br />Drops
        </h2>
        
        <div className="flex flex-col md:flex-row gap-8 items-start md:items-center w-full md:w-auto">
          <div className="flex gap-6 overflow-x-auto pb-4 md:pb-0 no-scrollbar w-full md:w-auto">
            {['All', 'Apparel', 'Accessories', 'Bundles'].map(cat => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`text-[10px] font-black uppercase tracking-[0.3em] transition-all whitespace-nowrap ${filterCategory === cat ? 'opacity-100 underline underline-offset-8 text-black' : 'opacity-30 hover:opacity-50 text-black'}`}
              >
                {cat}
              </button>
            ))}
          </div>
          
          <div className="flex items-center gap-3 border-b border-black/10 pb-2 ml-auto md:ml-0">
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-[10px] font-black uppercase tracking-[0.3em] outline-none cursor-pointer appearance-none pr-4 text-black"
            >
              <option value="default" className="bg-white">Sort: Default</option>
              <option value="price-low" className="bg-white">Price: Low to High</option>
              <option value="price-high" className="bg-white">Price: High to Low</option>
            </select>
            <ChevronDown size={12} className="opacity-30 text-black" />
          </div>
        </div>
      </div>
      
      <div className="relative group">
        {/* Navigation Buttons */}
        <div className="absolute top-1/2 -translate-y-1/2 -left-4 z-30 opacity-0 group-hover:opacity-100 transition-opacity hidden md:block">
          <button 
            onClick={() => scrollProducts('left')}
            className="w-12 h-12 bg-black text-white flex items-center justify-center rounded-full shadow-2xl hover:scale-110 transition-transform"
          >
            <ChevronLeft size={24} />
          </button>
        </div>
        <div className="absolute top-1/2 -translate-y-1/2 -right-4 z-30 opacity-0 group-hover:opacity-100 transition-opacity hidden md:block">
          <button 
            onClick={() => scrollProducts('right')}
            className="w-12 h-12 bg-black text-white flex items-center justify-center rounded-full shadow-2xl hover:scale-110 transition-transform"
          >
            <ChevronRight size={24} />
          </button>
        </div>

        <div 
          ref={productScrollRef}
          className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar gap-4 md:gap-8 pb-12 -mx-6 px-6 md:mx-0 md:px-0 scroll-smooth"
        >
          {filteredAndSortedProducts.map(product => (
            <div key={product.id} className="min-w-[45vw] md:min-w-[30vw] lg:min-w-[22vw] snap-center">
              <ProductCard 
                product={product} 
                onAddToCart={addToCart} 
                onEmailDetails={onEmailDetails}
                onBuyNow={handleBuyNow}
                searchQuery={searchQuery}
              />
            </div>
          ))}
        </div>
        
        {/* Carousel Indicators */}
        <div className="flex justify-center gap-2 mt-4">
          {filteredAndSortedProducts.map((_, idx) => (
            <div key={idx} className="w-1 h-1 rounded-full bg-black/10" />
          ))}
        </div>
      </div>
      
      {filteredAndSortedProducts.length === 0 && (
        <div className="py-20 text-center opacity-30 uppercase tracking-widest text-sm font-bold text-black">
          No products found
        </div>
      )}
    </section>

    {/* Ever-scrolling Grid Section */}
    <section className="py-16 px-6 border-t border-gray-100">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h2 className="text-2xl md:text-3xl font-display font-bold uppercase tracking-tighter mb-2 text-black">Explore More</h2>
            <p className="text-[10px] opacity-40 uppercase tracking-widest text-black">Curated for your style</p>
          </div>
          <div className="flex gap-4">
            <button className="p-3 border border-black/10 rounded-full hover:bg-black hover:text-white transition-all text-black">
              <Filter size={18} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
          {filteredAndSortedProducts.map(product => (
            <ProductCard 
              key={`grid-${product.id}`}
              product={product} 
              onAddToCart={addToCart} 
              onEmailDetails={onEmailDetails}
              onBuyNow={handleBuyNow}
            />
          ))}
        </div>

        <div className="mt-24 text-center">
          <button className="px-12 py-6 border border-black/10 text-[10px] font-black uppercase tracking-[0.3em] hover:bg-black hover:text-white transition-all text-black">
            Load More
          </button>
        </div>
      </div>
    </section>
  </main>
);

const ProductPage = ({ 
  products, 
  addToCart, 
  handleBuyNow,
  onEmailDetails,
  searchQuery
}: { 
  products: Product[], 
  addToCart: (p: Product, v?: Record<string, string>, q?: number) => void, 
  handleBuyNow: (p: Product, v?: Record<string, string>) => void,
  onEmailDetails: (p: Product) => void,
  searchQuery: string
}) => {
  const { id } = useParams();
  const product = products.find(p => p.id === id);
  return <ProductDetailContent product={product || null} allProducts={products} onAddToCart={addToCart} onBuyNow={handleBuyNow} onEmailDetails={onEmailDetails} searchQuery={searchQuery} />;
};

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AppContent />
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
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isOrdersOpen, setIsOrdersOpen] = useState(false);
  const [isProductsOpen, setIsProductsOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'success' | 'cancelled' | 'processing' | null>(null);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const productScrollRef = useRef<HTMLDivElement>(null);

  // --- Firebase Auth Listener ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Fetch user profile from Firestore
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          const isAdminEmail = firebaseUser.email === 'cbrprints22@gmail.com';
          
          if (userDoc.exists()) {
            const userData = userDoc.data() as User;
            // If it's the admin email but role is not admin, update it
            if (isAdminEmail && userData.role !== 'admin') {
              const updatedUser = { ...userData, role: 'admin' as const };
              await setDoc(doc(db, 'users', firebaseUser.uid), updatedUser, { merge: true });
              setUser(updatedUser);
            } else {
              setUser(userData);
            }
          } else {
            // Create user profile if it doesn't exist
            const newUser: User = {
              id: firebaseUser.uid,
              email: firebaseUser.email || '',
              firstName: firebaseUser.displayName?.split(' ')[0] || 'User',
              lastName: firebaseUser.displayName?.split(' ')[1] || '',
              role: isAdminEmail ? 'admin' : 'user'
            };
            await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
            setUser(newUser);
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
        }
      } else {
        setUser(null);
      }
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  // --- Firestore Products Listener ---
  useEffect(() => {
    const q = query(collection(db, 'products'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const productsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      setProducts(productsData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'products');
    });
    return () => unsubscribe();
  }, []);

  // --- Firestore Orders Listener ---
  useEffect(() => {
    if (!isAuthReady) return;
    
    let q;
    if (user?.role === 'admin') {
      q = query(collection(db, 'orders'), orderBy('date', 'desc'));
    } else if (user) {
      q = query(collection(db, 'orders'), where('userId', '==', user.id), orderBy('date', 'desc'));
    } else {
      setOrders([]);
      return;
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
      setOrders(ordersData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'orders');
    });
    return () => unsubscribe();
  }, [user, isAuthReady]);

  const scrollProducts = (direction: 'left' | 'right') => {
    if (productScrollRef.current) {
      const { scrollLeft, clientWidth } = productScrollRef.current;
      const scrollAmount = clientWidth * 0.8;
      const scrollTo = direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount;
      productScrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  const handleSaveProduct = async (productData: Partial<Product>) => {
    if (user?.role !== 'admin') return;
    try {
      if (productData.id) {
        const { id, ...data } = productData;
        await updateDoc(doc(db, 'products', id), data);
      } else {
        const newDocRef = doc(collection(db, 'products'));
        await setDoc(newDocRef, { ...productData, id: newDocRef.id });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'products');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (user?.role !== 'admin') return;
    try {
      await deleteDoc(doc(db, 'products', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `products/${id}`);
    }
  };

  const handleLoginSuccess = () => {
    setIsAuthOpen(false);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setIsMenuOpen(false);
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const handleUpdateOrder = async (orderId: string, updates: Partial<Order>) => {
    if (user?.role !== 'admin') return;
    try {
      await updateDoc(doc(db, 'orders', orderId), updates);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  useEffect(() => {
    // API Health Check
    fetch('/api/health')
      .then(res => res.json())
      .then(data => console.log("[API] Health check successful:", data))
      .catch(err => console.error("[API] Health check failed:", err));

    const params = new URLSearchParams(window.location.search);
    const status = params.get('status');
    const orderId = params.get('id');

    if (status === 'success' || (orderId && window.location.pathname === '/order-success')) {
      setPaymentStatus('success');
      setIsCheckoutOpen(true);
      
      // Handle order confirmation
      const pendingStr = localStorage.getItem('grab_and_go_pending_order');
      if (pendingStr) {
        const pending = JSON.parse(pendingStr);
        
        // 1. Save to history (Email was already sent by the server during payment creation)
        const confirmedOrder = { ...pending, status: 'confirmed' };
        setOrders(prev => {
          const newOrders = [confirmedOrder, ...prev];
          localStorage.setItem('grab_and_go_orders', JSON.stringify(newOrders));
          return newOrders;
        });

        // 3. Clear cart and pending
        setCart([]);
        localStorage.removeItem('grab_and_go_cart');
        localStorage.removeItem('grab_and_go_pending_order');
      }
    } else if (status === 'cancelled') {
      setPaymentStatus('cancelled');
      setIsCheckoutOpen(true);
    }

    const handleOpenOrders = () => setIsOrdersOpen(true);
    const handleOpenCart = () => setIsCartOpen(true);
    const handleOpenMenu = () => setIsMenuOpen(true);
    const handleSelectProduct = (e: any) => setSelectedProduct(e.detail);
    
    window.addEventListener('open-orders', handleOpenOrders);
    window.addEventListener('open-cart', handleOpenCart);
    window.addEventListener('open-menu', handleOpenMenu);
    window.addEventListener('select-product', handleSelectProduct);
    
    return () => {
      window.removeEventListener('open-orders', handleOpenOrders);
      window.removeEventListener('open-cart', handleOpenCart);
      window.removeEventListener('open-menu', handleOpenMenu);
      window.removeEventListener('select-product', handleSelectProduct);
    };
  }, []);
  const [lastAdded, setLastAdded] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'price-low' | 'price-high' | 'default'>('default');
  const [filterCategory, setFilterCategory] = useState<string>('All');

  const filteredAndSortedProducts = useMemo(() => {
    let result = [...products];
    
    if (filterCategory !== 'All') {
      result = result.filter(p => p.category === filterCategory);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(query) || 
        p.description.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query)
      );
    }
    
    if (sortBy === 'price-low') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-high') {
      result.sort((a, b) => b.price - a.price);
    }
    
    return result;
  }, [products, sortBy, filterCategory, searchQuery]);

  useEffect(() => {
    localStorage.setItem('grab_and_go_cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product: Product, selectedVariants?: Record<string, string>, quantity: number = 1) => {
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
    setLastAdded(product.name);
    setTimeout(() => setLastAdded(null), 3000);
    setIsCartOpen(true);
  };

  const updateQuantity = (productId: string, delta: number, variants?: Record<string, string>) => {
    setCart(prev => prev.map(item => {
      if (item.id === productId && JSON.stringify(item.selectedVariants || {}) === JSON.stringify(variants || {})) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (productId: string, variants?: Record<string, string>) => {
    setCart(prev => prev.filter(item => 
      !(item.id === productId && JSON.stringify(item.selectedVariants || {}) === JSON.stringify(variants || {}))
    ));
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
    <div className="min-h-screen bg-white">
      <SystemAlertBanner user={user} />
      <WelcomePopup />
      
      <Header 
        cartCount={cartCount} 
        onOpenCart={() => setIsCartOpen(true)} 
        onOpenOrders={() => setIsOrdersOpen(true)}
        onOpenProducts={() => setIsProductsOpen(true)}
        onOpenMenu={() => setIsMenuOpen(true)}
        user={user}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={handleLogout}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        products={products}
      />
      
      <Routes>
        <Route path="/" element={
          <HomePage 
            filteredAndSortedProducts={filteredAndSortedProducts}
            filterCategory={filterCategory}
            setFilterCategory={setFilterCategory}
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
          />
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
          />
        } />
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
        <Route path="/legal" element={<LegalPage />} />
        <Route path="/refunds" element={<RefundPolicyPage />} />
        <Route path="/shipping" element={<ShippingPolicyPage />} />
        <Route path="/faq" element={<FAQPage />} />
        <Route path="/helpdesk" element={<HelpDeskPage />} />
        <Route path="/returns" element={<SelfServiceReturnsPage />} />
        <Route path="/story" element={<OurStoryPage />} />
        <Route path="/admin/system" element={user?.role === 'admin' ? <SystemHealthDashboard /> : <NotFoundPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>

      <EmailProductModal 
        isOpen={isSendingEmail} 
        onClose={() => {
          setIsSendingEmail(false);
          setSelectedProduct(null);
        }} 
        product={selectedProduct} 
      />

      <Footer />

      <Sidebar 
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onOpenOrders={() => setIsOrdersOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={handleLogout}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenProducts={() => setIsProductsOpen(true)}
        cartCount={cart.length}
        user={user}
      />

      <CartDrawer 
        isOpen={isCartOpen} 
        onClose={() => setIsCartOpen(false)} 
        cartItems={cart}
        onUpdateQuantity={updateQuantity}
        onRemove={removeFromCart}
        onCheckout={handleCheckout}
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

      <ProductManagementDrawer
        isOpen={isProductsOpen}
        onClose={() => setIsProductsOpen(false)}
        products={products}
        onSave={handleSaveProduct}
        onDelete={handleDeleteProduct}
        token={null}
      />

      <AuthModal 
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={handleLoginSuccess}
      />
    </div>
  );
}
