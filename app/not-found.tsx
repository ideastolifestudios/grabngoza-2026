import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 py-24">
      <p className="text-brand-accent text-[10px] tracking-[0.3em] uppercase font-bold mb-4">404</p>
      <h1 className="text-brand-text text-[48px] lg:text-[72px] font-extrabold uppercase leading-none tracking-tight mb-4">
        PAGE NOT<br />FOUND
      </h1>
      <p className="text-brand-muted text-sm max-w-sm mb-8">
        The page you&apos;re looking for doesn&apos;t exist. It may have moved, or the URL might be wrong.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-4">
        <Link href="/" className="bg-brand-primary text-white text-[11px] tracking-[0.18em] uppercase font-bold px-8 py-4 hover:bg-brand-accent transition-colors">
          Go Home
        </Link>
        <Link href="/collections/all" className="border border-brand-border text-brand-text text-[11px] tracking-[0.18em] uppercase font-bold px-8 py-4 hover:border-brand-primary transition-colors">
          Shop All
        </Link>
      </div>
    </div>
  );
}