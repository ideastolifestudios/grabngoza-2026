// src/utils/shared.ts — Shared utilities and constants
import React from 'react';

export const formatPrice = (amount: number) => {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const Highlight = ({ text, query }: { text: string; query: string }) => {
  if (!query.trim()) return React.createElement('span', null, text);
  
  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')})`, 'gi'));
  return React.createElement(
    'span',
    null,
    ...parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase()
        ? React.createElement('mark', { key: i, className: 'bg-yellow-200 text-black px-0.5 rounded-sm font-bold' }, part)
        : React.createElement('span', { key: i }, part)
    )
  );
};

export const PAYMENT_LOGOS = {
  visa: "https://res.cloudinary.com/dggitwduo/image/upload/v1775882816/3840px-Visa_Inc._logo__282005_E2_80_932014_29.svg_l80vse.png",
  mastercard: "https://res.cloudinary.com/dggitwduo/image/upload/v1775882837/mastercard_r4oo9o.svg",
  applepay: "https://res.cloudinary.com/dggitwduo/image/upload/v1775882908/Apple_Pay_logo_mrpbqh.svg",
  googlepay: "https://upload.wikimedia.org/wikipedia/commons/f/f2/Google_Pay_Logo.svg",
  yoco: "https://res.cloudinary.com/dggitwduo/image/upload/v1775882870/yoco_ekl84d.svg"
};
