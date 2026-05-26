"use client";

import React, { useState, useMemo } from 'react';
import Link from 'next/link';

// Structured dynamic FAQ Data matching user categories and specifications
const FAQ_DATA = [
  {
    id: 'q1',
    category: 'orders',
    question: 'How quickly will my order be processed?',
    answer: 'Orders are processed within 1-2 business days. Once processed, you will receive a tracking confirmation via email.'
  },
  {
    id: 'q2',
    category: 'orders',
    question: 'Can I modify or cancel my order after placing it?',
    answer: 'Because we work efficiently to pack and dispatch orders, modifications can only be made within 60 minutes of placing the order by reaching out via WhatsApp.'
  },
  {
    id: 'q3',
    category: 'orders',
    question: 'Will I receive an order confirmation?',
    answer: 'Yes, an automated confirmation email containing your order outline and reference code is dispatched immediately upon secure payment authorization.'
  },
  {
    id: 'q4',
    category: 'payments',
    question: 'What payment methods do you accept?',
    answer: 'We support all premium South African payment gateways, including credit/debit cards (Visa, Mastercard), Instant EFT, and trusted secure checkout partners.'
  },
  {
    id: 'q5',
    category: 'payments',
    question: 'How do installment payments work?',
    answer: 'Select your preferred installment framework at checkout to split your purchase total into equal interest-free slices paid over specified monthly durations.'
  },
  {
    id: 'q6',
    category: 'payments',
    question: 'Is my payment information secure?',
    answer: 'Completely. All financial transitions are fully PCI-DSS compliant and encrypted natively via secure tokens; your card parameters are never saved or exposed.'
  },
  {
    id: 'q7',
    category: 'shipping',
    question: 'What are the delivery timeframes?',
    answer: 'Standard local shipping takes 2-5 business days. Express shipping tiers deliver within 1-2 business days depending on regional infrastructure routing.'
  },
  {
    id: 'q8',
    category: 'shipping',
    question: 'Do you ship nationwide?',
    answer: 'Yes, we provide secure trackable courier fulfillment across all provinces and cities within South Africa directly to your door.'
  },
  {
    id: 'q9',
    category: 'shipping',
    question: 'How do I track my order?',
    answer: 'Use our dedicated Track Order route with the unique tracking reference link supplied inside your dispatch confirmation email updates.'
  },
  {
    id: 'q10',
    category: 'returns',
    question: 'What is your return policy?',
    answer: 'We support items returned within 7 days of verified arrival for a standard swap or store credit vouchers. Merchandise must remain unworn with original tags attached.'
  },
  {
    id: 'q11',
    category: 'returns',
    question: 'How do I initiate a return or exchange?',
    answer: 'Head directly to our centralized Returns interface or lodge a request to customer support alongside your original purchase identifier.'
  },
  {
    id: 'q12',
    category: 'returns',
    question: 'How long does a refund take?',
    answer: 'Once your back-couriered package passes quality compliance inspections at our central hub, processing loops take 5-7 business days to clear.'
  },
  {
    id: 'q13',
    category: 'support',
    question: 'What are your support hours?',
    answer: 'Our regular operations are active Monday through Friday, 08:00 to 16:00. Digital live message components operate contextually outside those hours.'
  },
  {
    id: 'q14',
    category: 'support',
    question: 'How quickly will I get a response?',
    answer: 'WhatsApp interactions are typically handled within a few minutes during active operational windows. Traditional email tickets are answered within 24 hours.'
  },
  {
    id: 'q15',
    category: 'support',
    question: 'Do you have a physical store?',
    answer: 'Grab&Go functions exclusively as a high-speed digital streetwear hub, prioritizing fast distribution channels right to your physical doorstep.'
  }
];

const CATEGORIES = [
  { id: 'all', label: '⚡ All' },
  { id: 'orders', label: '🛒 Orders & Speed' },
  { id: 'payments', label: '💳 Payments & Installments' },
  { id: 'shipping', label: '🚚 Shipping & Collection' },
  { id: 'returns', label: '↩️ Returns & Exchanges' },
  { id: 'support', label: '💬 Support & Contact' }
];

export default function HelpCenterPage() {
  // State Management Engine
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);
  
  // Contact Form Controlled State
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    subject: 'Order Issue',
    message: ''
  });

  // Filter Logic execution based on category and search state matches
  const filteredFAQs = useMemo(() => {
    return FAQ_DATA.filter(faq => {
      const matchesCategory = activeCategory === 'all' || faq.category === activeCategory;
      const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, activeCategory]);

  const toggleAccordion = (id: string) => {
    setOpenAccordion(openAccordion === id ? null : id);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Message dispatched successfully! Submitting issue regarding: ${formState.subject}`);
    setFormState({ name: '', email: '', subject: 'Order Issue', message: '' });
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans flex flex-col justify-between">
      
      <div>
        {/* Navigation Layer & Hero Banner */}
        <div className="bg-[#143427] text-white border-b border-[#0f281e]">
          <div className="max-w-7xl mx-auto px-4 pt-4">
            <Link 
              href="/" 
              className="inline-flex items-center text-xs font-bold tracking-widest text-emerald-400 hover:text-emerald-300 uppercase transition-colors"
            >
              ← Back to Navigation
            </Link>
          </div>
          
          <div className="text-center px-4 pt-10 pb-24">
            <div className="text-3xl mb-2">🎯</div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tighter uppercase mb-2">
              Grab&Go Help Center
            </h1>
            <p className="text-emerald-100/70 text-sm md:text-base max-w-xl mx-auto font-medium mb-6">
              Fast answers, multiple support channels, and a team ready to help.
            </p>
            <div className="inline-flex items-center gap-2 bg-[#0d221a] px-4 py-1.5 border border-emerald-900/40 rounded-full">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
              <span className="text-[10px] tracking-widest uppercase font-bold text-gray-300">
                Currently Offline
              </span>
            </div>
          </div>
        </div>

        {/* Support Grid Section Layer (Floating Overlapped Look) */}
        <div className="max-w-6xl mx-auto px-4 -mt-12 relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* WhatsApp Channel */}
          <div className="bg-white border border-gray-200/80 p-6 flex flex-col justify-between hover:border-[#143427] transition-all group">
            <div>
              <div className="text-xl mb-3">💬</div>
              <h3 className="text-xs font-black tracking-wider uppercase text-gray-900">WhatsApp</h3>
              <p className="text-xs text-gray-500 mt-1">Instant reply during active operational windows.</p>
            </div>
            <a href="https://wa.me/27691630778" target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-emerald-600 mt-4 block group-hover:underline">
              Chat Now →
            </a>
          </div>

          {/* Email Channel */}
          <div className="bg-white border border-gray-200/80 p-6 flex flex-col justify-between hover:border-[#143427] transition-all group">
            <div>
              <div className="text-xl mb-3">📧</div>
              <h3 className="text-xs font-black tracking-wider uppercase text-gray-900">Email</h3>
              <p className="text-xs text-gray-500 mt-1">Comprehensive ticket analysis and response loop.</p>
            </div>
            <a href="mailto:support@shopgrabngo.co.za" className="text-xs font-bold text-emerald-600 mt-4 block group-hover:underline">
              Within 24 hours →
            </a>
          </div>

          {/* Phone Channel */}
          <div className="bg-white border border-gray-200/80 p-6 flex flex-col justify-between hover:border-[#143427] transition-all group">
            <div>
              <div className="text-xl mb-3">📞</div>
              <h3 className="text-xs font-black tracking-wider uppercase text-gray-900">Phone</h3>
              <p className="text-xs text-gray-500 mt-1">+27 69 163 0778</p>
            </div>
            <a href="tel:+27691630778" className="text-xs font-bold text-emerald-600 mt-4 block group-hover:underline">
              Call Now →
            </a>
          </div>

          {/* Business Hours */}
          <div className="bg-white border border-gray-200/80 p-6 flex flex-col justify-between">
            <div>
              <div className="text-xl mb-3">🕐</div>
              <h3 className="text-xs font-black tracking-wider uppercase text-gray-900">Business Hours</h3>
              <p className="text-xs text-gray-500 mt-1">Mon–Fri 08:00–16:00</p>
            </div>
            <span className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mt-4 block">
              Leave a Message
            </span>
          </div>

        </div>

        {/* Core FAQ Search & Filter Layout Engine */}
        <div className="max-w-4xl mx-auto px-4 py-16">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-black uppercase tracking-tight text-gray-900">
              Frequently Asked Questions
            </h2>
            <p className="text-xs text-gray-500 uppercase tracking-wider mt-1">
              Search or browse by category to find quick answers.
            </p>
          </div>

          {/* Search bar anchor element */}
          <div className="relative mb-6">
            <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-400">🔍</span>
            <input 
              type="text" 
              placeholder="Search FAQs by query keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-gray-200 pl-10 pr-4 py-3 text-sm font-medium tracking-wide placeholder-gray-400 focus:outline-none focus:border-[#143427] transition-colors"
            />
          </div>

          {/* Category layout selector tabs */}
          <div className="flex flex-wrap gap-2 mb-8 border-b border-gray-200 pb-6">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`text-xs uppercase tracking-wider font-bold px-4 py-2 border transition-all ${
                  activeCategory === cat.id 
                    ? 'bg-[#143427] text-white border-[#143427]' 
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Dynamic Accordion Matrix Container */}
          <div className="space-y-3">
            {filteredFAQs.length > 0 ? (
              filteredFAQs.map((faq) => {
                const isOpen = openAccordion === faq.id;
                return (
                  <div key={faq.id} className="bg-white border border-gray-200/80 transition-all">
                    <button
                      onClick={() => toggleAccordion(faq.id)}
                      className="w-full text-left px-5 py-4 flex justify-between items-center hover:bg-gray-50 transition-colors"
                    >
                      <span className="text-sm font-bold text-gray-900 tracking-tight">{faq.question}</span>
                      <span className="text-lg font-light text-gray-400 ml-4">{isOpen ? '−' : '+'}</span>
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-5 pt-1 border-t border-gray-100 text-xs leading-relaxed text-gray-600 font-medium">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12 bg-white border border-dashed border-gray-200">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400">No matching questions identified.</p>
              </div>
            )}
          </div>
        </div>

        {/* SLA Matrix Specification Table Layout */}
        <div className="bg-white border-t border-b border-gray-200 py-16">
          <div className="max-w-4xl mx-auto px-4">
            <div className="mb-8">
              <h2 className="text-xl font-black uppercase tracking-tight text-gray-900">Still need help?</h2>
              <p className="text-xs text-gray-500 mt-1">
                Fill in the form and our support team will get back to you within one business day. For urgent matters, use WhatsApp for the fastest response.
              </p>
            </div>

            <div className="overflow-x-auto border border-gray-200">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 font-black tracking-widest text-gray-400 uppercase">
                    <th className="p-4">📋 Response Time SLAs</th>
                    <th className="p-4">Target Window</th>
                    <th className="p-4">Availability Context</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium text-gray-600">
                  <tr>
                    <td className="p-4 font-bold text-gray-900">💬 WhatsApp</td>
                    <td className="p-4 text-emerald-600">Within minutes</td>
                    <td className="p-4">Business hours</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-bold text-gray-900">📧 Email</td>
                    <td className="p-4">Within 24 hours</td>
                    <td className="p-4">Business hours</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-bold text-gray-900">📝 Contact Form</td>
                    <td className="p-4">Within 24 hours</td>
                    <td className="p-4">Business hours</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-bold text-gray-900">📞 Phone</td>
                    <td className="p-4 text-emerald-600">Immediate</td>
                    <td className="p-4">Mon–Fri 08:00–16:00</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Interactive Controlled Support Form Interface */}
        <div className="max-w-2xl mx-auto px-4 py-16">
          <div className="text-center mb-8">
            <h3 className="text-lg font-black uppercase tracking-tight text-gray-900">Send us a message</h3>
            <p className="text-[11px] text-gray-500 uppercase tracking-wider mt-1">
              We typically respond within 24 business hours. For urgent issues use WhatsApp.
            </p>
          </div>

          <form onSubmit={handleFormSubmit} className="space-y-4 bg-white p-6 md:p-8 border border-gray-200">
            <div>
              <label className="block text-[10px] font-black tracking-widest uppercase text-gray-700 mb-1">Name *</label>
              <input 
                type="text" 
                required
                value={formState.name}
                onChange={(e) => setFormState({...formState, name: e.target.value})}
                className="w-full bg-gray-50 border border-gray-200 px-4 py-2.5 text-xs font-medium focus:outline-none focus:border-[#143427] transition-colors"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black tracking-widest uppercase text-gray-700 mb-1">Email *</label>
              <input 
                type="email" 
                required
                value={formState.email}
                onChange={(e) => setFormState({...formState, email: e.target.value})}
                className="w-full bg-gray-50 border border-gray-200 px-4 py-2.5 text-xs font-medium focus:outline-none focus:border-[#143427] transition-colors"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black tracking-widest uppercase text-gray-700 mb-1">Subject *</label>
              <select 
                value={formState.subject}
                onChange={(e) => setFormState({...formState, subject: e.target.value})}
                className="w-full bg-gray-50 border border-gray-200 px-4 py-2.5 text-xs font-bold uppercase tracking-wide focus:outline-none focus:border-[#143427] transition-colors"
              >
                <option value="Order Issue">Order Issue</option>
                <option value="Payment Problem">Payment Problem</option>
                <option value="Shipping & Delivery">Shipping & Delivery</option>
                <option value="Return / Exchange">Return / Exchange</option>
                <option value="Technical Support">Technical Support</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-black tracking-widest uppercase text-gray-700 mb-1">Message *</label>
              <textarea 
                rows={5}
                required
                value={formState.message}
                onChange={(e) => setFormState({...formState, message: e.target.value})}
                className="w-full bg-gray-50 border border-gray-200 px-4 py-2.5 text-xs font-medium focus:outline-none focus:border-[#143427] transition-colors"
              />
            </div>

            <button 
              type="submit"
              className="w-full bg-[#143427] hover:bg-[#1b4635] text-white text-xs font-black tracking-widest uppercase py-3 transition-colors duration-150"
            >
              Send Message →
            </button>
          </form>
        </div>

      </div>

      {/* Streetwear Ready To Shop Footer Anchor Area */}
      <div className="bg-[#143427] py-12 text-center px-4">
        <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-wider mb-6">
          READY TO SHOP?
        </h2>
        <div className="flex flex-wrap justify-center gap-4">
          <Link 
            href="/search" 
            className="bg-[#1d4d3a] hover:bg-[#235d46] text-white font-bold text-xs uppercase tracking-wider px-6 py-3 border border-emerald-600/30 transition-colors duration-200"
          >
            SHOP NEW ARRIVALS →
          </Link>
          <Link 
            href="/" 
            className="bg-transparent hover:bg-white/5 text-gray-300 hover:text-white font-bold text-xs uppercase tracking-wider px-6 py-3 border border-gray-500 transition-colors duration-200"
          >
            RETURN HOME
          </Link>
        </div>
      </div>

    </div>
  );
}
