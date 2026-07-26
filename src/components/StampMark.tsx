"use client";

import { useEffect, useRef, useState } from "react";

type StampMarkProps = {
  filled: boolean;
  index: number;
};

export default function StampMark({ filled, index }: StampMarkProps) {
  const [justFilled, setJustFilled] = useState(false);
  const prevFilled = useRef(filled);
  const mountedRef = useRef(false);

  useEffect(() => {
    if (mountedRef.current && filled && !prevFilled.current) {
      setJustFilled(true);
      const timeout = setTimeout(() => setJustFilled(false), 450);
      prevFilled.current = filled;
      return () => clearTimeout(timeout);
    }
    prevFilled.current = filled;
    mountedRef.current = true;
  }, [filled]);

  const entranceStyle = { animationDelay: `${index * 35}ms` };

  if (filled) {
    return (
      <div
        className={`aspect-square w-full animate-stamp-enter bg-primary ${
          justFilled ? "animate-stamp-pop" : ""
        }`}
        style={{ ...entranceStyle, borderRadius: "42% 58% 63% 37% / 41% 44% 56% 59%" }}
        aria-hidden="true"
      />
    );
  }

  return (
    <div
      className="aspect-square w-full animate-stamp-enter rounded-full border-2 border-dashed border-muted-soft"
      style={entranceStyle}
      aria-hidden="true"
    />
  );
}
