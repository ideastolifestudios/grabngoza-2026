"use client";
import { useState, useEffect, useCallback } from "react";

declare global {
  interface Window {
    YocoSDK: new (config: { publicKey: string }) => {
      showPopup: (options: {
        amountInCents: number;
        currency: string;
        name: string;
        description: string;
        callback: (result: { id?: string; error?: { message: string } }) => void;
      }) => void;
    };
  }
}

export function useYoco() {
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.YocoSDK) { setReady(true); return; }

    const script = document.createElement("script");
    script.src = "https://js.yoco.com/sdk/v1/yoco-sdk-web.js";
    script.async = true;
    script.onload = () => setReady(true);
    script.onerror = () => setError("Failed to load payment system. Please refresh.");
    document.head.appendChild(script);

    return () => {
      try { document.head.removeChild(script); } catch {}
    };
  }, []);

  const initiatePayment = useCallback(
    (amountInCents: number, description: string): Promise<string> => {
      return new Promise((resolve, reject) => {
        if (!ready || !window.YocoSDK) {
          reject(new Error("Payment system not ready"));
          return;
        }
        setLoading(true);
        setError(null);

        const publicKey = process.env.NEXT_PUBLIC_YOCO_PUBLIC_KEY || "";
        const yoco = new window.YocoSDK({ publicKey });

        yoco.showPopup({
          amountInCents,
          currency: "ZAR",
          name: "Grab & Go",
          description,
          callback: (result) => {
            setLoading(false);
            if (result.error) {
              setError(result.error.message);
              reject(new Error(result.error.message));
            } else if (result.id) {
              resolve(result.id);
            } else {
              reject(new Error("Payment was cancelled"));
            }
          },
        });
      });
    },
    [ready]
  );

  return { ready, loading, error, initiatePayment };
}