import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Instagram, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';

interface IGPost {
  id: string;
  media_url: string;
  permalink: string;
  caption?: string;
  like_count?: number;
  comments_count?: number;
}

// Fallback high-quality feed images matching the site's aesthetic
const FALLBACK_POSTS = [
  {
    id: '1',
    media_url: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?auto=format&fit=crop&q=80&w=800',
    permalink: 'https://www.instagram.com/grabngoza',
    like_count: 1240,
    comments_count: 42
  },
  {
    id: '2',
    media_url: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&q=80&w=800',
    permalink: 'https://www.instagram.com/grabngoza',
    like_count: 852,
    comments_count: 15
  },
  {
    id: '3',
    media_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=800',
    permalink: 'https://www.instagram.com/grabngoza',
    like_count: 2410,
    comments_count: 88
  },
  {
    id: '4',
    media_url: 'https://images.unsplash.com/photo-1511499767390-90342f53fb9a?auto=format&fit=crop&q=80&w=800',
    permalink: 'https://www.instagram.com/grabngoza',
    like_count: 1105,
    comments_count: 23
  },
  {
    id: '5',
    media_url: 'https://images.unsplash.com/photo-1491553895911-0055eca6402d?auto=format&fit=crop&q=80&w=800',
    permalink: 'https://www.instagram.com/grabngoza',
    like_count: 1530,
    comments_count: 34
  }
];

const InstagramFeed: React.FC = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [posts, setPosts] = useState<IGPost[]>(FALLBACK_POSTS);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchIGFeed = async () => {
      const token = (import.meta as any).env.VITE_INSTAGRAM_ACCESS_TOKEN;
      if (!token) return;

      setLoading(true);
      try {
        const response = await fetch(
          `https://graph.instagram.com/me/media?fields=id,media_url,permalink,caption,like_count,comments_count&access_token=${token}`
        );
        const data = await response.json();
        if (data.data) {
          setPosts(data.data.slice(0, 8));
        }
      } catch (error) {
        console.error('Error fetching Instagram feed:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchIGFeed();
  }, []);

  const scrollLeft = () => {
    if (scrollRef.current) scrollRef.current.scrollBy({ left: -300, behavior: 'smooth' });
  };
  const scrollRight = () => {
    if (scrollRef.current) scrollRef.current.scrollBy({ left: 300, behavior: 'smooth' });
  };

  return (
    <section className="py-20 md:py-32 overflow-hidden border-y border-gray-100 bg-white">
      <div className="max-w-[1800px] mx-auto flex flex-col lg:flex-row min-h-[500px]">
        {/* Left Section: Content */}
        <div className="w-full lg:w-1/3 p-10 md:p-16 flex flex-col justify-center border-r border-gray-100">
          <div className="space-y-8">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#06402B]" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#06402B]">
                Live Community Feed
              </span>
            </div>
            
            <div>
              <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-[0.8] mb-6 text-black">
                Customer<br />Love
              </h2>
              <p className="text-xs md:text-sm font-medium text-gray-400 max-w-xs leading-relaxed">
                The collective in motion. Tag <span className="text-black font-extrabold underline decoration-2 underline-offset-4">@grabngoza</span> to be featured.
              </p>
            </div>

            <div className="pt-4">
              <a
                href="https://www.instagram.com/grabngoza"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex flex-col gap-1 group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center transition-transform group-hover:rotate-12">
                    <Instagram size={18} />
                  </div>
                  <span className="text-sm font-black uppercase tracking-widest text-black">@grabngoza</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold ml-13">
                  <span>View on Instagram</span>
                  <ArrowRight size={10} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </a>
            </div>
          </div>
        </div>

        {/* Right Section: Instagram Carousel */}
        <div className="w-full lg:w-2/3 relative bg-zinc-50/50 flex items-center group/carousel">
          <div 
            ref={scrollRef}
            className="flex gap-6 md:gap-8 overflow-x-auto scrollbar-hide px-10 md:px-16 py-16 cursor-grab active:cursor-grabbing snap-x snap-mandatory"
          >
            {posts.map((post) => (
              <motion.a
                key={post.id}
                href={post.permalink}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ y: -8 }}
                className="flex-shrink-0 w-72 md:w-80 group/post relative snap-center block"
              >
                {/* Image Container */}
                <div className="relative rounded-2xl overflow-hidden aspect-square bg-gray-200 shadow-xl shadow-black/5 mb-4">
                  <img 
                    src={post.media_url} 
                    alt={post.caption || "Instagram post"} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover/post:scale-110"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/post:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <Instagram size={32} className="text-white drop-shadow-lg" />
                  </div>
                </div>

                {/* Interaction Stats - Counts only, no icons, unobtrusive */}
                <div className="flex items-center gap-4 px-1 text-[10px] font-black uppercase tracking-widest text-gray-400">
                  <div className="flex items-center gap-1 group-hover/post:text-black transition-colors">
                    <span>{post.like_count?.toLocaleString() || '0'} Likes</span>
                  </div>
                  <div className="flex items-center gap-1 group-hover/post:text-black transition-colors">
                    <span>{post.comments_count?.toLocaleString() || '0'} Comments</span>
                  </div>
                </div>
              </motion.a>
            ))}
            
            <motion.a
              href="https://www.instagram.com/grabngoza"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 w-72 md:w-80 aspect-square rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-center p-8 hover:border-black hover:bg-white transition-all group/join snap-center my-auto h-fit"
            >
              <div className="w-16 h-16 rounded-full bg-white border border-gray-100 flex items-center justify-center mb-4 group-hover/join:bg-black group-hover/join:text-white transition-all shadow-sm group-hover/join:shadow-lg">
                <ArrowRight size={24} />
              </div>
              <h3 className="text-xs font-black uppercase tracking-widest text-black mb-1">Follow The Culture</h3>
              <p className="text-[9px] font-medium text-gray-400">@grabngoza</p>
            </motion.a>
          </div>

          {/* Navigation Arrows */}
          <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
            <button 
              onClick={scrollLeft}
              className="w-12 h-12 rounded-full bg-white border border-gray-100 shadow-xl flex items-center justify-center text-black pointer-events-auto hover:bg-black hover:text-white transition-all opacity-0 group-hover/carousel:opacity-100 translate-x-[-10px] group-hover/carousel:translate-x-0"
            >
              <ChevronLeft size={24} />
            </button>
          </div>
          <div className="absolute inset-y-0 right-6 flex items-center pointer-events-none">
            <button 
              onClick={scrollRight}
              className="w-12 h-12 rounded-full bg-white border border-gray-100 shadow-xl flex items-center justify-center text-black pointer-events-auto hover:bg-black hover:text-white transition-all opacity-0 group-hover/carousel:opacity-100 translate-x-[10px] group-hover/carousel:translate-x-0"
            >
              <ChevronRight size={24} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default InstagramFeed;
