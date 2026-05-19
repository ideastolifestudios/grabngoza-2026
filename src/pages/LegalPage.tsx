'use client';
import { useEffect } from 'react';
import { motion } from 'motion/react';
import SEO from '../components/SEO';

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


export default LegalPage;
