"use client";

import { motion } from "framer-motion";

export default function OrderSuccessIcon() {
  return (
    <div className="relative mb-6">
      {/* Outer glowing aura */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: [0.5, 1.5, 1.2], opacity: [0, 0.8, 0.5] }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="absolute inset-0 rounded-full bg-success/30 blur-2xl"
      />
      
      {/* Ripples */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1.5, opacity: 0 }}
        transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 1 }}
        className="absolute inset-0 rounded-full border-2 border-success/40"
      />
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1.8, opacity: 0 }}
        transition={{ duration: 1.5, delay: 0.5, repeat: Infinity, repeatDelay: 1 }}
        className="absolute inset-0 rounded-full border-2 border-success/20"
      />

      {/* Main circle */}
      <motion.div
        initial={{ scale: 0, rotate: -45 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{
          type: "spring",
          stiffness: 260,
          damping: 20,
          delay: 0.1
        }}
        className="relative flex h-24 w-24 sm:h-28 sm:w-28 items-center justify-center rounded-full bg-success text-white shadow-xl shadow-success/40 ring-8 ring-surface z-10"
      >
        {/* Animated checkmark */}
        <motion.svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-12 w-12 sm:h-14 sm:w-14"
        >
          <motion.path
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.5, delay: 0.4, ease: "easeOut" }}
            d="M20 6 9 17l-5-5"
          />
        </motion.svg>
      </motion.div>
    </div>
  );
}
