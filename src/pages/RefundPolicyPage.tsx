'use client';
import { useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import SEO from '../components/SEO';

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
            <Link href="/helpdesk" className="underline font-semibold ml-1">Help Desk</Link>.
          </p>
        </footer>
      </motion.div>
    </div>
  );
};


export default RefundPolicyPage;
