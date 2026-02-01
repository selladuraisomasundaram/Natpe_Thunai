"use client";

import React, { useEffect, useState, useRef } from "react";
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
      const timer = setTimeout(() => setStage("reveal"), 1800); // Wait for SVG drawing
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
            <p className="animate-pulse">> {bootText}</p>
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
            {/* THE ICON: WIREFRAME HANDSHAKE */}
            {/* This SVG animates the path stroke to look like it's being drawn by a laser */}
            <div className="relative w-40 h-40">
                {/* Glow Effect behind icon */}
                <div className="absolute inset-0 bg-secondary-neon/20 blur-[60px] rounded-full animate-pulse" />
                
                <svg viewBox="0 0 200 200" className="w-full h-full text-secondary-neon drop-shadow-[0_0_8px_rgba(0,243,255,0.8)]">
                    {/* Hand 1 (Left) */}
                    <motion.path 
                        d="M 40 100 L 80 100 L 100 80 L 100 60"
                        fill="transparent"
                        stroke="currentColor"
                        strokeWidth="4"
                        strokeLinecap="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1, ease: "easeInOut" }}
                    />
                    <motion.path 
                        d="M 40 120 L 80 120 L 100 140"
                        fill="transparent"
                        stroke="currentColor"
                        strokeWidth="4"
                        strokeLinecap="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1, delay: 0.2, ease: "easeInOut" }}
                    />
                    
                    {/* Hand 2 (Right - Interlocking) */}
                    <motion.path 
                        d="M 160 100 L 120 100 L 100 120 L 100 140"
                        fill="transparent"
                        stroke="white" 
                        strokeWidth="4"
                        strokeLinecap="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1, delay: 0.1, ease: "easeInOut" }}
                    />
                    <motion.path 
                        d="M 160 80 L 120 80 L 100 60"
                        fill="transparent"
                        stroke="white"
                        strokeWidth="4"
                        strokeLinecap="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1, delay: 0.3, ease: "easeInOut" }}
                    />

                    {/* Connection Nodes (The Dots) */}
                    <motion.circle cx="100" cy="100" r="6" fill="currentColor"
                        initial={{ scale: 0 }}
                        animate={{ scale: [0, 1.5, 1] }}
                        transition={{ delay: 1.2, duration: 0.5 }}
                    />
                    
                    {/* Orbiting Ring */}
                    <motion.circle cx="100" cy="100" r="70" 
                        fill="transparent" stroke="currentColor" strokeWidth="1" strokeDasharray="10 10" opacity="0.3"
                        initial={{ rotate: 0, scale: 0.8, opacity: 0 }}
                        animate={{ rotate: 360, scale: 1, opacity: 0.3 }}
                        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                    />
                </svg>
            </div>

            {/* THE TEXT: DECODING EFFECT */}
            <div className="text-center h-16">
                <motion.h1 
                    className="text-4xl md:text-5xl font-black tracking-widest text-white"
                    style={{ fontFamily: "'Orbitron', sans-serif" }} // Using the specific font here
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