import { useEffect } from 'react';
import { motion } from 'motion/react';
import SEO from '../components/SEO';

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


export default OurStoryPage;
