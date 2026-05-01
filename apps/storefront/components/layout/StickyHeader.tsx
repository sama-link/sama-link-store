"use client";

import { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/cn";

export default function StickyHeader({ children }: { children: React.ReactNode }) {
  const [isHidden, setIsHidden] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
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
      const currentScrollY = window.scrollY;
      
      // Add subtle shadow when scrolled past the very top
      setIsScrolled(currentScrollY > 10);

      // We wait until the user has scrolled past the topbar + main row (109px)
      if (currentScrollY > 150) {
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
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "relative sticky z-50 bg-surface transition-[top,box-shadow] duration-300 ease-in-out",
        isScrolled ? "shadow-[0_4px_20px_rgba(0,0,0,0.06)]" : ""
      )}
      style={{
        top: isHidden ? (isDesktop ? "-109px" : "-150px") : "0px"
      }}
    >
      {children}
    </header>
  );
}
