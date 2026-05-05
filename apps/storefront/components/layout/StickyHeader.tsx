"use client";

import { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/cn";

export default function StickyHeader({ children }: { children: React.ReactNode }) {
  const [isHidden, setIsHidden] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isDesktop, setIsDesktop] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
    handleResize(); // Initial check
    window.addEventListener("resize", handleResize, { passive: true });
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (document.body.style.overflow === "hidden") return;
      const currentScrollY = window.scrollY;
      
      // Calculate progress from 0 to 150px (0 = top, 1 = scrolled 150px or more)
      const progress = Math.min(Math.max(currentScrollY / 150, 0), 1);
      setScrollProgress(progress);

      // We wait until the user has scrolled past the main row (72px)
      if (currentScrollY > 100) {
        if (currentScrollY > lastScrollY.current && currentScrollY - lastScrollY.current > 4) {
          // Scrolling down
          setIsHidden(true);
        } else if (currentScrollY < lastScrollY.current && lastScrollY.current - currentScrollY > 4) {
          // Scrolling up
          setIsHidden(false);
        }
      } else {
        // At the top
        setIsHidden(false);
      }
      
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Initial check
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-[top] duration-300 ease-in-out",
      )}
      style={{
        // Hide the first row (72px) when scrolling down, keep the second row visible on desktop
        top: isHidden ? (isDesktop ? "-72px" : "-72px") : "0px"
      }}
    >
      {/* Background Layers */}
      <div 
        className="absolute -inset-x-0 top-0 h-[calc(100%+32px)] w-full pointer-events-none"
        style={{
          maskImage: "linear-gradient(to bottom, black calc(100% - 32px), transparent 100%)",
          WebkitMaskImage: "linear-gradient(to bottom, black calc(100% - 32px), transparent 100%)",
          transform: "translateZ(0)",
          willChange: "transform"
        }}
      >
        {/* Base frosted glass gradient: Solid at the top, fading to transparent at the bottom */}
        <div className="absolute inset-0 w-full h-full bg-gradient-to-b from-surface to-transparent backdrop-blur-[8px]" />
        
        {/* Solid background that fades in on scroll (white in light, navy in dark) */}
        <div 
          className={cn(
            "absolute inset-0 w-full h-full bg-surface transition-shadow duration-300",
            scrollProgress > 0 ? "shadow-[0_4px_20px_rgba(0,0,0,0.06)]" : ""
          )}
          style={{ opacity: scrollProgress }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </header>
  );
}