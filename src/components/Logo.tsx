import React, { useState } from "react";

const Logo = ({ className = "h-8 w-auto", light = false, dark = false }: { className?: string, light?: boolean, dark?: boolean }) => {
  const [error, setError] = useState(false);

  if (error) {
    return (
      <span className={`font-semibold uppercase tracking-tight ${light ? 'text-white' : 'text-black'} text-sm md:text-base whitespace-nowrap ${className}`}>
        Grab & Go
      </span>
    );
  }

  const filterClass = light ? 'brightness-0 invert' : dark ? 'brightness-0' : '';

  return (
    <img
      src="https://res.cloudinary.com/dggitwduo/image/upload/v1776937297/GRAB_GO_WEB_LOGO_thq4su.png"
      alt="Grab & Go"
      className={`${className} object-contain ${filterClass}`}
      onError={() => setError(true)}
      referrerPolicy="no-referrer"
    />
  );
};

export default Logo;
