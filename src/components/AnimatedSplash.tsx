"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface SplashProps {
  onComplete: () => void;
}

const AnimatedSplash: React.FC<SplashProps> = ({ onComplete }) => {
  const [stage, setStage] = useState<"boot" | "construct" | "reveal" | "exit">("boot");
  const [decodedText, setDecodedText] = useState("............");
  
  // Configuration
  const APP_NAME = "NATPE THUNAI";
  const BOOT_SEQUENCE = [
    "INITIALIZING KERNEL...",
    "LOADING MODULES...",
    "ESTABLISHING UPLINK...",
    "ACCESS GRANTED."
  ];
  const [bootText, setBootText] = useState(BOOT_SEQUENCE[0]);

  // --- LOGIC: SEQUENCE CONTROLLER ---
  useEffect(() => {
    let currentStep = 0;

    // 1. Boot Text Sequence
    const bootInterval = setInterval(() => {
      currentStep++;
      if (currentStep < BOOT_SEQUENCE.length) {
        setBootText(BOOT_SEQUENCE[currentStep]);
      } else {
        clearInterval(bootInterval);
        setStage("construct");
      }
    }, 400); // Speed of boot text

    return () => clearInterval(bootInterval);
  }, []);

  // 2. Transition from Construct to Reveal
  useEffect(() => {
    if (stage === "construct") {
      const timer = setTimeout(() => setStage("reveal"), 1800); 
      return () => clearTimeout(timer);
    }
  }, [stage]);

  // 3. Text Decoding Effect (The "Matrix" Reveal)
  useEffect(() => {
    if (stage === "reveal") {
      let iterations = 0;
      const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&";
      
      const interval = setInterval(() => {
        setDecodedText(prev => 
          APP_NAME.split("")
            .map((letter, index) => {
              if (index < iterations) {
                return APP_NAME[index];
              }
              return letters[Math.floor(Math.random() * 26)];
            })
            .join("")
        );

        if (iterations >= APP_NAME.length) {
          clearInterval(interval);
          // Wait a bit after text finishes, then exit
          setTimeout(() => {
             setStage("exit");
             setTimeout(onComplete, 800); // Give time for exit animation
          }, 1200);
        }
        
        iterations += 1 / 3; // Speed of decoding
      }, 30);

      return () => clearInterval(interval);
    }
  }, [stage, onComplete]);

  return (
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center overflow-hidden cursor-none select-none">
      
      {/* Inject Cyberpunk Font */}
      <style>
        {`@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&display=swap');`}
      </style>

      {/* --- BACKGROUND GRID (Subtle movement) --- */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
        <div className="absolute w-full h-full bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>

      <AnimatePresence mode="wait">
        
        {/* --- STAGE 1: BOOT SEQUENCE --- */}
        {stage === "boot" && (
          <motion.div
            key="boot"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20 }}
            className="z-10 font-mono text-xs text-secondary-neon/70 tracking-widest"
          >
            {/* FIXED: Replaced '>' with '&gt;' to fix syntax error */}
            <p className="animate-pulse">&gt; {bootText}</p>
          </motion.div>
        )}

        {/* --- STAGE 2 & 3: MAIN VISUAL --- */}
        {(stage === "construct" || stage === "reveal") && (
          <motion.div 
            key="main"
            className="z-10 flex flex-col items-center gap-8 relative"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.5, opacity: 0, filter: "blur(10px)" }}
            transition={{ duration: 0.5 }}
          >
            {/* THE ICON: LOGO REACTOR */}
            <div className="relative w-48 h-48 flex items-center justify-center">
                {/* Glow Effect behind icon */}
                <div className="absolute inset-0 bg-secondary-neon/20 blur-[60px] rounded-full animate-pulse" />
                
                {/* Rotating Tech Rings (SVG Overlay) */}
                <svg viewBox="0 0 200 200" className="absolute w-full h-full text-secondary-neon drop-shadow-[0_0_8px_rgba(0,243,255,0.8)] z-20 pointer-events-none">
                    {/* Outer Dashed Ring */}
                    <motion.circle cx="100" cy="100" r="85" 
                        fill="transparent" stroke="currentColor" strokeWidth="1" strokeDasharray="10 5" opacity="0.5"
                        initial={{ rotate: 0, scale: 0.8, opacity: 0 }}
                        animate={{ rotate: 360, scale: 1, opacity: 0.5 }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    />
                    
                    {/* Inner Solid Ring Segment */}
                    <motion.circle cx="100" cy="100" r="75" 
                        fill="transparent" stroke="currentColor" strokeWidth="2" strokeDasharray="60 400"
                        initial={{ rotate: 360 }}
                        animate={{ rotate: 0 }}
                        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                    />
                </svg>

                {/* THE LOGO IMAGE */}
                <motion.div
                    className="relative z-10 w-32 h-32 rounded-full overflow-hidden border-2 border-secondary-neon/50 shadow-[0_0_20px_rgba(0,243,255,0.2)] bg-black"
                    initial={{ scale: 0, rotate: -90, filter: "grayscale(100%)" }}
                    animate={{ scale: 1, rotate: 0, filter: "grayscale(0%)" }}
                    transition={{ 
                        type: "spring", 
                        stiffness: 100, 
                        damping: 20,
                        duration: 1.5 
                    }}
                >
                    <img 
                        src="/app-logo.png" 
                        alt="Natpe Thunai Logo" 
                        className="w-full h-full object-cover"
                    />
                    {/* Scanning overlay effect */}
                    <motion.div 
                        className="absolute inset-0 bg-gradient-to-b from-transparent via-secondary-neon/20 to-transparent w-full h-full"
                        animate={{ top: ["-100%", "100%"] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    />
                </motion.div>
            </div>

            {/* THE TEXT: DECODING EFFECT */}
            <div className="text-center h-16">
                <motion.h1 
                    className="text-3xl md:text-5xl font-black tracking-widest text-white"
                    style={{ fontFamily: "'Orbitron', sans-serif" }} 
                >
                    {decodedText}
                </motion.h1>
                
                {stage === "reveal" && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="flex items-center justify-center gap-2 mt-3"
                    >
                        <span className="h-[1px] w-8 bg-secondary-neon/50" />
                        <span className="text-[10px] text-secondary-neon uppercase tracking-[0.4em] font-medium">
                            System Online
                        </span>
                        <span className="h-[1px] w-8 bg-secondary-neon/50" />
                    </motion.div>
                )}
            </div>

          </motion.div>
        )}
      </AnimatePresence>

      {/* --- PROGRESS BAR (Bottom) --- */}
      <div className="absolute bottom-10 w-48 h-1 bg-gray-900 rounded-full overflow-hidden">
        <motion.div 
            className="h-full bg-secondary-neon shadow-[0_0_10px_rgba(0,243,255,0.8)]"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 3.5, ease: "circOut" }}
        />
      </div>

    </div>
  );
};

export default AnimatedSplash;