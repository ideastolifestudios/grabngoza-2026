import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  Search,
  ShoppingCart,
  CreditCard,
  User,
  Lock,
  Package,
  Bell,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';

// ─── Toast ───────────────────────────────────────────────────────────────────
const useToast = () => {
  const [toast, setToast] = React.useState<{ msg: string; type: 'success' | 'info' } | null>(null);
  const show = (msg: string, type: 'success' | 'info' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  };
  return { toast, show };
};

const ToastBadge = ({ toast }: { toast: { msg: string; type: string } | null }) => {
  if (!toast) return null;
  return (
    <motion.div
      key={toast.msg}
      initial={{ opacity: 0, y: 60 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 60 }}
      className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 bg-black text-white border border-white/10"
    >
      <CheckCircle2 size={15} />
      <span className="text-[10px] font-black uppercase tracking-widest">{toast.msg}</span>
    </motion.div>
  );
};

// ─── Steps ────────────────────────────────────────────────────────────────────
const STEPS = [
  {
    number: '01',
    icon: Search,
    title: 'Browse Products',
    desc: "Explore our full collection and discover items you love. Use filters, categories, and search to find exactly what you are looking for.",
    tip: "Tip: use the category filters at the top for faster discovery.",
  },
  {
    number: '02',
    icon: ShoppingCart,
    title: 'Add to Cart',
    desc: "Select your preferred quantity and any available options, then add the product to your cart. Your cart saves automatically.",
    tip: null,
  },
  {
    number: '03',
    icon: ChevronRight,
    title: 'Proceed to Checkout',
    desc: "Open your cart via the bag icon in the top-right corner and tap Checkout to begin the secure checkout process.",
    tip: null,
  },
  {
    number: '04',
    icon: User,
    title: 'Enter Your Details',
    desc: "Provide your delivery address, contact number, and email address accurately. Double-check your details before continuing.",
    tip: "Tip: signing in saves your details for future orders.",
  },
  {
    number: '05',
    icon: Lock,
    title: 'Complete Secure Payment',
    desc: "Pay safely and securely using Yoco — supporting Visa, Mastercard, Apple Pay, and Google Pay. All transactions are encrypted.",
    tip: null,
  },
  {
    number: '06',
    icon: CheckCircle2,
    title: 'Order Confirmation',
    desc: "Once payment is successful your order is automatically confirmed. You will receive a confirmation to the email address you provided.",
    tip: null,
  },
  {
    number: '07',
    icon: Package,
    title: 'Processing & Delivery',
    desc: "Your order is picked, packed, and prepared for delivery or collection. Processing typically takes 1-2 business days.",
    tip: null,
  },
  {
    number: '08',
    icon: Bell,
    title: 'Stay Updated',
    desc: "You will receive updates regarding your order status, processing progress, and delivery tracking as your order moves through the system.",
    tip: "Tip: check your spam folder if you do not see updates in your inbox.",
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────
const HowToOrderPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast, show } = useToast();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className="min-h-screen bg-[#f9f9f8] font-sans">

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-5 md:px-10 h-14 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-black transition-colors group"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
            Back
          </button>
          <Link to="/" className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-900">
            Grab & Go
          </Link>
          <div className="w-16" />
        </div>
      </header>

      {/* Hero headline */}
      <section className="max-w-5xl mx-auto px-5 md:px-10 pt-16 pb-12 md:pt-24 md:pb-16">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-400 mb-4">
            Guide
          </p>
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter text-gray-950 leading-[0.92] mb-6">
            How to<br />Order
          </h1>
          <p className="text-sm text-gray-500 max-w-md leading-relaxed">
            Follow these eight steps to shop securely on Grab & Go — from browsing to your door.
          </p>
        </motion.div>
      </section>

      {/* Steps */}
      <section className="max-w-5xl mx-auto px-5 md:px-10 pb-24">
        <div className="space-y-0">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] }}
                className="flex gap-6 md:gap-10 py-8 border-b border-gray-100 group"
              >
                <div className="flex-shrink-0 w-14 md:w-20">
                  <div className="flex flex-col items-start">
                    <span className="text-[10px] font-black text-gray-300 tabular-nums mb-3">{step.number}</span>
                    <div className="w-9 h-9 rounded-full bg-gray-100 group-hover:bg-gray-950 transition-colors duration-300 flex items-center justify-center">
                      <Icon
                        size={15}
                        className="text-gray-400 group-hover:text-white transition-colors duration-300"
                        strokeWidth={2.5}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex-1 pt-0.5">
                  <h2 className="text-base md:text-lg font-black uppercase tracking-tight text-gray-950 mb-3">
                    {step.title}
                  </h2>
                  <p className="text-sm text-gray-500 leading-relaxed max-w-xl">
                    {step.desc}
                  </p>
                  {step.tip && (
                    <p className="mt-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      {step.tip}
                    </p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.65 }}
          className="mt-16 flex flex-col sm:flex-row items-start sm:items-center gap-4"
        >
          <button
            onClick={() => {
              show('Taking you to the shop!');
              setTimeout(() => navigate('/'), 600);
            }}
            className="inline-flex items-center gap-3 px-8 py-4 bg-gray-950 text-white text-[10px] font-black uppercase tracking-[0.3em] hover:bg-gray-800 active:scale-95 transition-all"
          >
            Start Shopping
            <ChevronRight size={13} />
          </button>
          <Link
            to="/helpdesk"
            className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-black transition-colors underline underline-offset-4"
          >
            Need help? Contact us
          </Link>
        </motion.div>
      </section>

      <ToastBadge toast={toast} />
    </div>
  );
};

export default HowToOrderPage;
