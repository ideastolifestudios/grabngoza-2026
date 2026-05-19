"use client";
import { useState, useEffect } from "react";

interface Props { targetDate: Date; label?: string; }

export default function CountdownTimer({ targetDate, label }: Props) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    const calc = () => {
      const diff = targetDate.getTime() - Date.now();
      if (diff <= 0) { setExpired(true); return; }
      setTimeLeft({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    };
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [targetDate]);

  if (expired) return null;

  return (
    <div className="flex flex-col items-center gap-2">
      {label && <p className="text-[10px] tracking-[0.25em] uppercase font-bold text-brand-accent">{label}</p>}
      <div className="flex items-center gap-2">
        {Object.entries(timeLeft).map(([unit, val]) => (
          <div key={unit} className="flex flex-col items-center">
            <div className="bg-brand-primary text-white w-14 h-14 flex items-center justify-center font-extrabold text-xl tabular-nums">
              {String(val).padStart(2, "0")}
            </div>
            <span className="text-[9px] tracking-[0.18em] uppercase text-brand-muted mt-1">{unit}</span>
          </div>
        ))}
      </div>
    </div>
  );
}