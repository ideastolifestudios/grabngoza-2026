'use client';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';

const NotFoundPage = () => {
  const router = useRouter();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
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
          onClick={() => router.push('/')}
          className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white text-[10px] font-semibold uppercase tracking-wider hover:opacity-90 transition-opacity"
        >
          <ArrowRight className="rotate-180" size={16} /> Back to Shop
        </button>
      </motion.div>
    </div>
  );
};
export default NotFoundPage;
