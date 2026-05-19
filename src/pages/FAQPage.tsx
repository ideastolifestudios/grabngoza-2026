import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import SEO from '../components/SEO';

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


export default FAQPage;
