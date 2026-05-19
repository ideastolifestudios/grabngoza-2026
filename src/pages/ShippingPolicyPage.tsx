import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import SEO from '../components/SEO';

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


export default ShippingPolicyPage;
