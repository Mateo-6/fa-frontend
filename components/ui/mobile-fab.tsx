"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export function useHideOnScrollDown(threshold = 24) {
  const [visible, setVisible] = React.useState(true);

  React.useEffect(() => {
    let lastY = window.scrollY;
    let ticking = false;

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        setVisible(y <= lastY || y < threshold);
        lastY = y;
        ticking = false;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);

  return visible;
}

interface MobileFabProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
}

export function MobileFab({ label, className, children, ...props }: MobileFabProps) {
  const visible = useHideOnScrollDown();

  return (
    <button
      {...props}
      aria-label={label}
      className={cn(
        "fixed bottom-6 right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-glass transition-all duration-200 ease-out hover:brightness-110 hover:shadow-accent-glow active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-ground-deep lg:hidden",
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-16 opacity-0",
        className
      )}
    >
      {children}
    </button>
  );
}