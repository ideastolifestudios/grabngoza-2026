import AdminDashboard from './components/admin/AdminDashboard';
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
    <motion.div
      initial={{ opacity: 0, y: 50, x: '-50%' }}
      animate={{ opacity: 1, y: 0, x: '-50%' }}
      exit={{ opacity: 0, y: 50, x: '-50%' }}
      className={`fixed bottom-10 left-1/2 z-[300] px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 border ${
        type === 'success' ? 'bg-black text-white border-white/10' : 'bg-red-600 text-white border-red-500'
      }`}
    >
      {type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
      <span className="text-[10px] font-black uppercase tracking-widest">{message}</span>
    </motion.div>
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
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
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
      }, 3000); // Show after 3 seconds
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

const Header = ({ 
  cartCount, 
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
  onOpenHowToOrder
}: { 
  cartCount: number, 
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
  onOpenHowToOrder: () => void
}) => {
  const [scrolled, setScrolled] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const debouncedSearch = useDebounce(localSearch, 300);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Hide on scroll down, show on scroll up
      // Only hide if we've scrolled past a certain threshold
      if (currentScrollY > lastScrollY && currentScrollY > 150) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      
      setLastScrollY(currentScrollY);
      setScrolled(currentScrollY > 50);
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
      <motion.header 
        initial={false}
        animate={{ 
          y: isVisible ? 0 : -100,
          opacity: isVisible ? 1 : 0
        }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 ${scrolled ? 'bg-white/95 backdrop-blur-md py-1 border-b border-gray-100 shadow-sm' : 'bg-white py-2'}`}
      >
      <div className="max-w-[1800px] mx-auto px-4 md:px-10 flex items-center justify-between">
        
        {/* Left: Navigation Links */}
        <div className="hidden lg:flex items-center gap-8 flex-1">
        </div>

        {/* Center: Logo */}
        <div className="flex-shrink-0 lg:absolute lg:left-1/2 lg:-translate-x-1/2">
          <Link to="/" className="block group">
            <Logo className="h-6 md:h-8 transition-transform duration-500 group-hover:scale-105" dark />
          </Link>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center justify-end gap-2 md:gap-6 flex-1">
          <button 
            onClick={onOpenWishlist}
            className="p-2 hover:bg-black/5 rounded-full transition-colors text-black hidden sm:block"
            title="Wishlist"
          >
            <Heart size={20} />
          </button>
          <button 
            onClick={onOpenCart} 
            className="relative p-2 hover:bg-black/5 rounded-full transition-colors text-black active:scale-90" 
            title="Cart"
          >
            <ShoppingCart size={22} />
            {cartCount > 0 && (
              <motion.span 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] bg-[#e34234] text-white text-[8px] font-bold rounded-full flex items-center justify-center px-1 shadow-[0_2px_10px_rgba(227,66,52,0.4)]"
              >
                {cartCount}
              </motion.span>
            )}
          </button>

          {!user ? (
            <>
              <button onClick={onOpenAuth} className="p-2 hover:bg-black/5 rounded-full transition-colors text-black hidden sm:flex items-center gap-2">
                <UserIcon size={20} />
                <span className="text-[9px] font-bold uppercase tracking-widest">Login</span>
              </button>
              <button onClick={onOpenMenu} className="p-2 hover:bg-black/5 rounded-full transition-colors flex items-center gap-2 group text-black">
                <Menu size={24} />
              </button>
            </>
          ) : (
            <button onClick={onOpenMenu} className="p-2 hover:bg-black/5 rounded-full transition-colors text-black flex items-center gap-2">
              <div className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center text-[9px] font-bold uppercase ring-2 ring-offset-2 ring-black/5">
                {user.firstName[0]}{user.lastName[0]}
              </div>
            </button>
          )}
        </div>
      </div>
    </motion.header>
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
  setFilterCategory
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
  setFilterCategory: (c: string) => void
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isShopOpen, setIsShopOpen] = useState(true);

  const navLinks = [
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
                              setFilterCategory(link.filter);
                              if (location.pathname !== '/') {
                                navigate('/');
                              }
                            }}
                            className="group py-3 flex items-center justify-between text-lg font-medium text-gray-500 hover:text-black transition-all"
                          >
                            <span>{link.name}</span>
                            <ChevronRight size={16} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Direct Links */}
                <button onClick={() => { onClose(); navigate('/story'); }} className="py-4 text-left text-2xl font-bold tracking-tight border-b border-gray-50 last:border-0">
                  Our Story
                </button>
              </div>

              {/* Membership / Account */}
              <div className="pt-4">
                {!user ? (
                  <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100 space-y-6">
                    <p className="text-xs text-gray-500 font-medium leading-relaxed">
                      Become a Studio Member for the best products and inspiration.
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
                        <span className="text-[8px] opacity-40 uppercase tracking-widest mt-1">Studio Member</span>
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
                      <span>Manage Studio</span>
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

const Hero = () => (
  <section className="relative h-[60vh] md:h-[80vh] flex items-center overflow-hidden bg-white">
    <div className="absolute inset-0 z-0">
      <img 
        src="https://picsum.photos/seed/streetwear-hero/1920/1080" 
        alt="HeroBackground" 
        className="w-full h-full object-cover"
        referrerPolicy="no-referrer"
      />
      <div className="absolute inset-0 bg-black/10" />
    </div>
    
    <div className="absolute bottom-10 right-10 hidden lg:flex flex-col items-end gap-2 opacity-50 text-white">
      <div className="w-[1px] h-24 bg-white/30 relative overflow-hidden">
        <motion.div 
          animate={{ y: [0, 96] }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="absolute top-0 left-0 w-full h-1/2 bg-white"
        />
      </div>
    </div>
  </section>
);


const PAYMENT_LOGOS = {
  visa: "https://res.cloudinary.com/dggitwduo/image/upload/v1775882816/3840px-Visa_Inc._logo__282005_E2_80_932014_29.svg_l80vse.png",
  mastercard: "https://res.cloudinary.com/dggitwduo/image/upload/v1775882837/mastercard_r4oo9o.svg",
  applepay: "https://res.cloudinary.com/dggitwduo/image/upload/v1775882908/Apple_Pay_logo_mrpbqh.svg",
  googlepay: "https://res.cloudinary.com/dggitwduo/image/upload/v1775882943/HArtbyi53u0jnqhnnxkQnMx9dHOERNcprZyKnInd2nrfM7Wd9ivMNTiz7IJP6-mSpwk_iiugzg.png",
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
    .filter(p => p.id !== product.id && ((p.categories || []).some(c => (product.categories || []).includes(c)) || p.isDrop))
    .slice(0, 12);

  const toggleAccordion = (id: string) => {
    setOpenAccordion(openAccordion === id ? null : id);
  };

  const brandInfo = (brands || []).find(b => b.name === product.brand || b.id === product.brandId);

  return (
    <div className="pt-16 md:pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-6">
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
              {/* Wishlist Button */}
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (product) onToggleWishlist(product.id);
                }}
                className={`absolute top-6 right-6 z-30 w-14 h-14 flex items-center justify-center rounded-full shadow-2xl transition-all duration-300 border ${
                  wishlist.includes(product?.id || '') 
                    ? 'bg-black text-white border-black' 
                    : 'bg-white/90 text-black border-transparent hover:bg-black hover:text-white'
                }`}
                title={wishlist.includes(product?.id || '') ? "Remove from Wishlist" : "Add to Wishlist"}
              >
                <motion.div
                  animate={{ scale: wishlist.includes(product?.id || '') ? [1, 1.4, 1] : 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <Heart size={24} fill={wishlist.includes(product?.id || '') ? "currentColor" : "none"} strokeWidth={2.5} />
                </motion.div>
              </motion.button>

              <div className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar h-full">
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
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center border border-black p-1">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-3 py-1 hover:bg-black/5 transition-colors"><Minus size={12} /></button>
                  <span className="px-4 text-xs font-black">{quantity}</span>
                  <button onClick={() => setQuantity(quantity + 1)} className="px-3 py-1 hover:bg-black/5 transition-colors"><Plus size={12} /></button>
                </div>
                <div className="flex gap-4 text-[10px] font-black uppercase tracking-widest">
                  <span className="text-green-600 border-b-2 border-green-600 pb-1">In stock</span>
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
            <div className="space-y-4 mb-6">
              {product.variants?.map(v => (
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
            <div className="space-y-3 mb-6">
              <button 
                onClick={() => {
                  onAddToCart(product, selectedVariants, quantity);
                }}
                disabled={isCartLoading}
                className="w-full h-14 bg-black text-white font-black uppercase text-[11px] tracking-[0.3em] hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-3 relative overflow-hidden"
              >
                {isCartLoading ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <>Add to cart <ShoppingBag size={16} /></>
                )}
              </button>
              <button 
                onClick={() => {
                  onBuyNow(product, selectedVariants);
                }}
                className="w-full h-14 border-2 border-black text-black font-black uppercase text-[11px] tracking-[0.3em] hover:bg-black hover:text-white active:scale-[0.98] transition-all flex items-center justify-center gap-3"
              >
                Buy it now
              </button>
            </div>

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
                      {product.soldBy || product.brand || 'The Studio'}
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
                  onBuyNow={() => {}}
                  searchQuery={searchQuery}
                  isWishlisted={wishlist.includes(p.id)}
                  onToggleWishlist={onToggleWishlist}
                  isLoading={isCartLoading}
                />
              </div>
            ))}
          </div>
        </div>
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
  const navigate = useNavigate();
  const discount = product.originalPrice ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0;

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

        {/* Primary Image */}
        <img 
          src={allImages[0] || null} 
          alt={product.name} 
          onClick={() => navigate(`/product/${product.id}`)}
          onError={(e) => {
            e.currentTarget.src = `https://picsum.photos/seed/${product.id}/800/1000`;
          }}
          className={`w-full h-full object-cover group-hover:scale-105 transition-all duration-1000 ease-out ${allImages.length > 1 ? 'group-hover:opacity-0' : ''}`}
          referrerPolicy="no-referrer"
        />
        
        {/* Secondary Image on Hover */}
        {allImages.length > 1 && (
          <img 
            src={allImages[1] || null} 
            alt={`${product.name} alternate`} 
            onClick={() => navigate(`/product/${product.id}`)}
            onError={(e) => {
              e.currentTarget.src = `https://picsum.photos/seed/${product.id}-alt/800/1000`;
            }}
            className="absolute inset-0 w-full h-full object-cover scale-105 opacity-0 group-hover:opacity-100 group-hover:scale-100 transition-all duration-1000 ease-out"
            referrerPolicy="no-referrer"
          />
        )}

        {discount > 0 && (
          <div className="absolute top-4 left-4 px-2 py-1 bg-red-500 text-white text-[7px] font-bold uppercase tracking-widest z-20">
            -{discount}%
          </div>
        )}

        {/* Quick Add Button (Mobile Persistent, Desktop Hover) */}
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onAddToCart(product, selectedVariants);
          }}
          className={`absolute bottom-0 left-0 right-0 py-4 bg-black text-white text-[9px] font-bold uppercase tracking-[0.2em] z-30 transition-transform duration-300 active:scale-95 md:translate-y-full md:group-hover:translate-y-0 translate-y-0`}
        >
          Quick Add
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

const SocialProof = ({ testimonials }: { testimonials: Testimonial[] }) => (
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
        {(testimonials.length > 0 ? testimonials : []).map((t) => (
          <div key={t.id} className="p-6 md:p-8 bg-gray-50 border border-gray-50 relative overflow-hidden group rounded-xl">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Instagram size={32} className="text-black" />
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

const PartnershipHub = ({ partners }: { partners: Partner[] }) => (
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
            We don't just sell products; we build bridges. Collaborating with micro-influencers and cultural events to bring you exclusive studio-born drops.
          </p>
          <div className="space-y-3 md:space-y-4">
            {(partners.length > 0 ? partners : []).map(p => (
              <div 
                key={p.id} 
                onClick={() => document.getElementById('drops')?.scrollIntoView({ behavior: 'smooth' })}
                className="flex items-center gap-3 md:gap-4 p-2 md:p-3 hover:bg-black/5 transition-colors border-l border-black/10 cursor-pointer group"
              >
                <div className="w-10 h-10 bg-gray-50 flex-shrink-0 flex items-center justify-center overflow-hidden rounded-md">
                   <img 
                     src={p.logo || null} 
                     alt={p.name} 
                     className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" 
                     referrerPolicy="no-referrer" 
                   />
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
        await supportService.subscribeNewsletter(email);
        
        // Send Newsletter Confirmation Email
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
    <footer className="bg-white py-8 md:py-12 px-6 md:px-8 border-t border-gray-50">
      <div className="max-w-7xl mx-auto mb-8 md:mb-10">
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
            <li className="opacity-30 hover:opacity-100 cursor-pointer transition-opacity">
                            <button onClick={() => window.dispatchEvent(new Event('open-how-to-order'))} className="hover:text-black transition-colors cursor-pointer">How to Order</button>
              <Link to="/track-order">Track Order</Link>
            </li>
            <li className="opacity-30 hover:opacity-100 cursor-pointer transition-opacity">
              <Link to="/shipping">Shipping</Link>
            </li>
            <li className="opacity-30 hover:opacity-100 cursor-pointer transition-opacity">
              <Link to="/helpdesk">Help Desk</Link>
            </li>
            <li className="opacity-30 hover:opacity-100 cursor-pointer transition-opacity">
              <Link to="/faq">FAQ</Link>
            </li>
            <li className="opacity-30 hover:opacity-100 cursor-pointer transition-opacity">
              <Link to="/refunds">Returns</Link>
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
    
      <div className="max-w-7xl mx-auto mt-12 md:mt-20 flex flex-col md:flex-row justify-between items-center gap-6 md:gap-8 border-t border-gray-50 pt-6 md:pt-8">
        <p className="text-[7px] font-semibold uppercase tracking-widest opacity-20 text-black">© 2026 Grab & Go</p>
        <div className="flex flex-wrap justify-center items-center gap-4 md:gap-6 transition-all duration-500">
          <img src={PAYMENT_LOGOS.visa} alt="Visa" className="h-5 object-contain" referrerPolicy="no-referrer" />
          <img src={PAYMENT_LOGOS.mastercard} alt="Mastercard" className="h-7 object-contain" referrerPolicy="no-referrer" />
          <img src={PAYMENT_LOGOS.applepay} alt="Apple Pay" className="h-7 object-contain" referrerPolicy="no-referrer" />
          <img src={PAYMENT_LOGOS.googlepay} alt="Google Pay" className="h-7 object-contain" referrerPolicy="no-referrer" />
          <img src={PAYMENT_LOGOS.yoco} alt="Yoco" className="h-5 object-contain" referrerPolicy="no-referrer" />
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
    <div className="pt-24 pb-16 px-6 md:px-12 max-w-3xl mx-auto">
      <SEO 
        title="Our Story | About Grab & Go" 
        description="Discover the vision and journey behind Grab & Go. Premium streetwear curation for the modern South African landscape."
        url="https://grabandgo.co.za/story"
      />
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

const TrackingTimeline = ({ trackingNumber, trackingUrl }: { trackingNumber: string, trackingUrl?: string }) => {
  const [events, setEvents] = useState<any[]>([]);
  const [status, setStatus] = useState<string>('');
  const [loadingEvents, setLoadingEvents] = useState(false);

  useEffect(() => {
    const fetchTracking = async () => {
      setLoadingEvents(true);
      try {
        const res = await fetch(`/api/track-shipment?trackingNumber=${encodeURIComponent(trackingNumber)}`);
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
            className="relative w-full max-w-md bg-white border border-gray-100 shadow-2xl overflow-hidden flex flex-col"
          >
            <div className="p-8 md:p-10 text-center space-y-6">
              <div className="space-y-2">
                <Logo className="h-8 mx-auto" dark />
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-30">Studio Access</p>
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
                                  console.error("Failed to download label");
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

  // Fetch live rates when address is complete
  useEffect(() => {
    if (deliveryMethod !== 'standard' || !address || !city || !province || !postalCode) {
      setShippingRates([]);
      setSelectedRate(null);
      return;
    }
    const timer = setTimeout(async () => {
      setLoadingRates(true);
      try {
        const res = await fetch('/api/get-shipping-rates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            deliveryAddress: { address, city, province, postalCode, country: 'ZA' },
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
    }, 800); // debounce
    return () => clearTimeout(timer);
  }, [address, city, province, postalCode, deliveryMethod, cartItems]);

  const shippingCost = useMemo(() => {
    if (deliveryMethod === 'pickup') return 0;
    if (deliveryMethod === 'international') return 450;
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
        paymentGateway
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
      const response = await fetch('/api/create-yoco-payment', {
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
                           {/* Shipping Rate Selector */}
                          {deliveryMethod === 'standard' && (
                            <div className="mt-4">
                              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2 block">Shipping Service</label>
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
                        </>
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
      <Link to="/" onClick={() => onCategorySelect?.('All')} className="hover:text-black transition-colors">Studio</Link>
      {path.map((item, idx) => (
        <React.Fragment key={idx}>
          <ChevronRight size={8} className="flex-shrink-0" />
          <button 
            onClick={() => onCategorySelect?.(item.name)}
            className={`hover:text-black transition-colors ${idx === path.length - 1 && !product ? 'text-black' : ''}`}
          >
            {item.name}
          </button>
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

const PromoGrid = () => {
  const promos = [
    {
      id: 1,
      title: "Price Drops Up To",
      discount: "80% Off",
      category: "Clothing & More",
      image: "https://picsum.photos/seed/promo1/1000/1000",
      label: "Big Deal Energy",
      ends: "Ends 18 Apr (Sat)",
      color: "bg-[#e34234]",
      shape: "rounded-tl-[100px] rounded-bl-[40px]" // Top-left heavy curve
    },
    {
      id: 2,
      title: "Price Drops Up To",
      discount: "60% Off",
      category: "Sneakers & More",
      image: "https://picsum.photos/seed/promo2/1000/1000",
      label: "Sneaker Scoop",
      ends: "Ends 18 Apr (Sat)",
      color: "bg-black",
      shape: "rounded-tr-[100px] rounded-br-[40px]" // Top-right heavy curve
    },
    {
      id: 3,
      brands: "Superga • Vans",
      title: "Up To 60% Off",
      image: "https://picsum.photos/seed/promo3/1000/1000",
      label: "Vans & Superga",
      ends: "Ends 17 Apr (Fri)",
      color: "bg-black",
      shape: "rounded-bl-[100px]" // Bottom-left heavy curve
    },
    {
      id: 4,
      brands: "Studio Label & Co",
      title: "Up To 60% Off",
      image: "https://picsum.photos/seed/promo4/1000/1000",
      label: "Superbalist & Co",
      ends: "Ends 17 Apr (Fri)",
      color: "bg-[#e34234]",
      shape: "rounded-br-[100px] rounded-tl-[40px]" // Bottom-right + top-left accent
    }
  ];

  return (
    <section className="max-w-[1800px] mx-auto px-4 md:px-10 py-12 md:py-24 overflow-hidden">
      <div className="flex flex-col md:flex-row items-end justify-between mb-12 gap-4">
        <div>
          <h2 className="text-4xl md:text-6xl font-display font-bold uppercase tracking-tighter text-black leading-none">Seasonal<br />Price Drops</h2>
          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-black/30 mt-4">Limited Availability</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
        {promos.map((promo) => (
          <motion.div 
            key={promo.id}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            whileHover={{ y: -5 }}
            className="group cursor-pointer"
          >
            <div className={`relative aspect-square md:aspect-[16/9] flex items-stretch overflow-hidden shadow-2xl ${promo.shape} transition-all duration-500 group-hover:shadow-black/20`}>
              {/* Image Side */}
              <div className="relative w-1/2 h-full bg-gray-100 overflow-hidden">
                <img 
                  src={promo.image} 
                  alt={promo.label} 
                  className="w-full h-full object-cover grayscale transition-all duration-1000 group-hover:grayscale-0 group-hover:scale-110"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/10" />
              </div>

              {/* Info Side */}
              <div className={`w-1/2 h-full flex flex-col justify-center p-6 md:p-12 ${promo.color} text-white relative`}>
                {/* Background Shapes (Image 2 style) */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                
                <div className="relative z-10">
                  {promo.brands && (
                    <p className="text-[10px] md:text-xs font-black uppercase tracking-[0.3em] mb-3 text-white/60">{promo.brands}</p>
                  )}
                  {promo.discount && (
                    <p className="text-6xl md:text-[min(8vw,100px)] font-black uppercase tracking-tighter leading-[0.85] mb-4 drop-shadow-xl">
                      {promo.discount}
                    </p>
                  )}
                  <div className="flex items-center gap-4 mb-2">
                    <div className="w-[1px] h-6 md:h-12 bg-white/30" />
                    <p className="font-black uppercase tracking-tighter leading-none text-sm md:text-xl">
                      {promo.title}
                    </p>
                  </div>
                  {promo.category && (
                    <p className="text-[8px] md:text-[9px] font-bold uppercase tracking-[0.4em] opacity-60 mt-6 pt-4 border-t border-white/10">
                      {promo.category}
                    </p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex justify-between items-end border-b border-gray-100 pb-4">
              <div>
                <h4 className="text-[9px] md:text-[10px] font-bold uppercase tracking-[0.2em] text-black transition-colors group-hover:text-[#e34234]">{promo.label}</h4>
                <p className="text-[8px] md:text-[9px] font-medium uppercase tracking-widest text-black/30 mt-1">{promo.ends}</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all scale-50 group-hover:scale-100 translate-x-4 group-hover:translate-x-0">
                <ChevronRight size={14} />
              </div>
            </div>
          </motion.div>
        ))}
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
        className={`group flex items-center justify-between gap-4 py-2 border-b-2 transition-all duration-300 w-full md:w-56 text-left ${isOpen ? 'border-[#e34234]' : 'border-gray-200 hover:border-black'}`}
      >
        <span className="text-[9px] font-medium uppercase tracking-[0.2em] text-black">
          {label}
        </span>
        <ChevronDown size={14} className={`transition-transform duration-500 ease-out ${isOpen ? 'rotate-180 text-[#e34234]' : 'text-black'}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.98 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="absolute top-full left-0 mt-3 w-[320px] bg-white shadow-[0_30px_60px_-12px_rgba(0,0,0,0.25)] z-[100] p-8 border border-gray-100 rounded-sm"
          >
            <div className="flex items-center justify-between mb-8 pb-8 border-b border-gray-100">
              <div className="flex flex-col gap-1">
                <span className="text-[9px] font-medium uppercase tracking-[0.2em] text-black">
                  {selectedCount} Selected
                </span>
                <span className="text-[11px] text-gray-400 font-medium">
                  {displayValue || 'All'}
                </span>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); onClear(); }}
                className="px-5 py-2.5 border-2 border-black text-[9px] font-medium uppercase tracking-[0.2em] hover:bg-black hover:text-white transition-all transform active:scale-95"
              >
                Clear All
              </button>
            </div>

            <div className="space-y-1 max-h-[340px] overflow-y-auto no-scrollbar pr-2">
              {options.map((option) => {
                const isSelected = value === option.value;
                return (
                  <button
                    key={JSON.stringify(option.value)}
                    onClick={(e) => { e.stopPropagation(); onChange(option.value); onToggle(); }}
                    className="flex items-center gap-5 w-full group text-left py-4 border-b border-gray-50 last:border-0 last:pb-0"
                  >
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${isSelected ? 'border-[#e34234]' : 'border-gray-200 group-hover:border-black'}`}>
                      {isSelected && <div className="w-3 h-3 rounded-full bg-[#e34234] animate-in fade-in zoom-in duration-300" />}
                    </div>
                    <span className={`text-[12px] font-bold uppercase tracking-wide transition-all duration-300 ${isSelected ? 'text-black translate-x-1' : 'text-gray-400 group-hover:text-black group-hover:translate-x-1'}`}>
                      {option.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const HomePage = ({ 
  filteredAndSortedProducts, 
  filterCategory, 
  setFilterCategory, 
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
  partners
}: {
  filteredAndSortedProducts: Product[],
  filterCategory: string,
  setFilterCategory: (c: string) => void,
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
  partners: Partner[]
}) => {
  const [isBarVisible, setIsBarVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 400) {
        setIsBarVisible(false);
      } else {
        setIsBarVisible(true);
      }
      setLastScrollY(currentScrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = () => setActiveDropdown(null);
    if (activeDropdown) {
      window.addEventListener('click', handleClickOutside);
    }
    return () => window.removeEventListener('click', handleClickOutside);
  }, [activeDropdown]);

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
    { value: 100, label: <span>Under <span className="text-[#e34234]">R100</span></span> },
    { value: 200, label: <span>Under <span className="text-[#e34234]">R200</span></span> },
    { value: 400, label: <span>Under <span className="text-[#e34234]">R400</span></span> },
    { value: 600, label: <span>Under <span className="text-[#e34234]">R600</span></span> },
    { value: 800, label: <span>Under <span className="text-[#e34234]">R800</span></span> },
  ];

  const catOptions = [
    { value: 'All', label: 'All Items' },
    ...categories.map(c => ({ value: c.name, label: c.name }))
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

      {/* Category & Filter Bar */}
      <motion.div 
        initial={false}
        animate={{ 
          y: isBarVisible ? 0 : -100,
          opacity: isBarVisible ? 1 : 0
        }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="sticky top-0 z-40 py-4 md:py-6 px-4 md:px-10 bg-white/90 backdrop-blur-xl border-b border-gray-100"
      >
        <div className="max-w-[1800px] mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div className="flex flex-wrap items-center gap-6 md:gap-12 w-full md:w-auto" onClick={e => e.stopPropagation()}>
            <FilterDropdown 
              label="Sort"
              value={sortBy}
              options={sortOptions}
              onChange={setSortBy}
              onClear={() => setSortBy('default')}
              displayValue={sortOptions.find(o => o.value === sortBy)?.label as string}
              isOpen={activeDropdown === 'sort'}
              onToggle={() => setActiveDropdown(activeDropdown === 'sort' ? null : 'sort')}
            />

            <FilterDropdown 
              label="Categories"
              value={filterCategory}
              options={catOptions}
              onChange={setFilterCategory}
              onClear={() => setFilterCategory('All')}
              displayValue={filterCategory}
              isOpen={activeDropdown === 'categories'}
              onToggle={() => setActiveDropdown(activeDropdown === 'categories' ? null : 'categories')}
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
            <div className="flex items-center gap-3">
              <Search size={12} className="opacity-30" />
              <p className="text-[9px] font-medium uppercase tracking-widest opacity-30">
                Results for: "{searchQuery}"
              </p>
            </div>
          )}
        </div>
      </motion.div>

      <PromoGrid />

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
            onClick={() => { setFilterCategory('All'); setSortBy('default'); }}
            className="mt-6 text-[10px] font-black uppercase tracking-widest underline underline-offset-4 hover:opacity-60 transition-opacity"
          >
            Clear All Filters
          </button>
        </div>
      )}

      <SocialProof testimonials={testimonials} />
      <PartnershipHub partners={partners} />
    </main>
  );
};

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
    } catch (err) {
      console.error("Error saving product:", err);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (user?.role !== 'admin') return;
    try {
      await productService.deleteProduct(id);
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      console.error("Error deleting product:", err);
    }
  };

  const handleLoginSuccess = async () => {
    setIsAuthOpen(false);
    setIsProfileLoading(true);
    try {
      const userData = await authService.getCurrentUser();
      setUser(userData);
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
    } catch (error) {
      console.error("Failed to save category:", error);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      await categoryService.deleteCategory(id);
      setCategories(prev => prev.filter(c => c.id !== id));
    } catch (error) {
      console.error("Failed to delete category:", error);
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
    } catch (error) {
      console.error("Failed to save brand:", error);
    }
  };

  const handleDeleteBrand = async (id: string) => {
    try {
      await brandService.deleteBrand(id);
      setBrands(prev => prev.filter(b => b.id !== id));
    } catch (error) {
      console.error("Failed to delete brand:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setIsMenuOpen(false);
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const handleUpdateOrder = async (orderId: string, updates: Partial<Order>) => {
    if (user?.role !== 'admin') return;
    try {
      const updated = await orderService.updateOrder(orderId, updates);
      setOrders(prev => prev.map(o => o.id === orderId ? updated : o));
    } catch (err) {
      console.error("Error updating order:", err);
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
        await orderService.updateOrder(id, { status: 'pending' });

        // 2. Call /api/order-success with the order data to send email + WhatsApp confirmations
        await fetch('/api/order-success', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderData)
        });

        // 3. Clear cart and localStorage
        setCart([]);
        localStorage.removeItem('grab_and_go_cart');
        localStorage.removeItem('grab_go_pending_order');

        // 4. Update UI to success state
        setPaymentStatus('success');
        setIsCheckoutOpen(true);
        
        // Clean up URL
        window.history.replaceState({}, '', '/');
      } catch (err) {
        console.error("Error finalizing payment:", err);
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
    } else if (status === 'cancelled') {
      setPaymentStatus('cancelled');
      setIsCheckoutOpen(true);
      // Clean up URL
      window.history.replaceState({}, '', '/');
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
  const [maxPrice, setMaxPrice] = useState<number>(Infinity);

  const filteredAndSortedProducts = useMemo(() => {
    let result = [...products];
    
    if (filterCategory !== 'All') {
      result = result.filter(p => (p.categories || []).includes(filterCategory));
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
  }, [products, sortBy, filterCategory, searchQuery]);

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
      />
      
      <Routes>
        <Route path="/" element={
          isDataLoading ? (
            <div className="min-h-screen flex items-center justify-center bg-white">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="animate-spin text-black" size={48} />
                <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-30">Loading Studio...</p>
              </div>
            </div>
          ) : (
            <HomePage 
              filteredAndSortedProducts={filteredAndSortedProducts}
              filterCategory={filterCategory}
              setFilterCategory={setFilterCategory}
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
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/legal" element={<LegalPage />} />
        <Route path="/refunds" element={<RefundPolicyPage />} />
        <Route path="/shipping" element={<ShippingPolicyPage />} />
        <Route path="/faq" element={<FAQPage />} />
        <Route path="/helpdesk" element={<HelpDeskPage />} />
        <Route path="/track-order" element={<OrderTrackingPage />} />
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
        onOpenWishlist={() => setIsWishlistOpen(true)}
        onLogout={handleLogout}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenProducts={() => setIsProductsOpen(true)}
        cartCount={cart.length}
        user={user}
        partners={partners}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        setFilterCategory={setFilterCategory}
      />

      <WishlistDrawer 
        isOpen={isWishlistOpen}
        onClose={() => setIsWishlistOpen(false)}
        wishlist={wishlist}
        products={products}
        onAddToCart={(p) => addToCart(p)}
        onToggleWishlist={toggleWishlist}
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
    </div>
  );
}
