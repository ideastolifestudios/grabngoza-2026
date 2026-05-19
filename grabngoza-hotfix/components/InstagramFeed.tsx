"use client";
import { useEffect, useState } from "react";
import Image from "next/image";

interface IGPost { id: string; media_url: string; permalink: string; }

export default function InstagramFeed() {
  const [posts, setPosts] = useState<IGPost[]>([]);

  useEffect(() => {
    // Guard: do nothing if token isn't configured
    const token = process.env.NEXT_PUBLIC_INSTAGRAM_ACCESS_TOKEN;
    if (!token) return;

    fetch(`https://graph.instagram.com/me/media?fields=id,media_url,permalink&access_token=${token}`)
      .then((r) => r.json())
      .then((data) => { if (data?.data) setPosts(data.data.slice(0, 6)); })
      .catch(() => {}); // Silent fail — Instagram is non-critical
  }, []);

  if (posts.length === 0) return null;

  return (
    <section className="py-12 lg:py-16">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        <p className="text-[10px] tracking-[0.3em] uppercase font-bold text-brand-primary mb-6 text-center">@grabngoza</p>
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-2">
          {posts.map((post) => (
            <a key={post.id} href={post.permalink} target="_blank" rel="noopener noreferrer"
              className="relative aspect-square overflow-hidden bg-brand-surface group">
              <Image src={post.media_url} alt="Instagram post" fill sizes="200px"
                className="object-cover transition-transform duration-300 group-hover:scale-105" />
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}