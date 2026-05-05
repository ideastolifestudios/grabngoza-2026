import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Send, Loader2, CheckCircle2, Mail, AlertCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supportService } from '../services/api';
import { emailService } from '../services/emailService';
import SEO from '../components/SEO';

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


export default HelpDeskPage;
