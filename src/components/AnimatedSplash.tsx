"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Handshake } from "lucide-react"; // Using this as the final handshake state

// Replace this with your actual Logo Image import
// import Logo from "@/assets/logo.png"; 

interface SplashProps {
  onComplete: () => void;
}

const AnimatedSplash: React.FC<SplashProps> = ({ onComplete }) => {
  const [stage, setStage] = useState<"enter" | "shake" | "logo">("enter");

  useEffect(() => {
    // Sequence Timings
    const shakeTimer = setTimeout(() => setStage("shake"), 800); // Hands meet
    const logoTimer = setTimeout(() => setStage("logo"), 2000); // Show Logo
    const finishTimer = setTimeout(() => onComplete(), 3500); // Remove Splash

    return () => {
      clearTimeout(shakeTimer);
      clearTimeout(logoTimer);
      clearTimeout(finishTimer);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[9999] bg-background flex flex-col items-center justify-center overflow-hidden">
      <AnimatePresence mode="wait">
        
        {/* PHASE 1 & 2: HANDS MEETING & SHAKING */}
        {stage !== "logo" && (
          <motion.div 
            className="relative flex items-center justify-center"
            exit={{ opacity: 0, scale: 1.5 }}
            transition={{ duration: 0.5 }}
          >
            {/* Left Hand (The Helper) */}
            <motion.div
              initial={{ x: -200, opacity: 0 }}
              animate={
                stage === "enter" 
                  ? { x: -40, opacity: 1 } // Slide in
                  : { x: -40, rotate: [0, -5, 5, 0] } // Shake
              }
              transition={
                stage === "enter"
                  ? { type: "spring", stiffness: 100, damping: 15 }
                  : { repeat: 2, duration: 0.3 }
              }
              className="absolute"
            >
              {/* SVG Graphic for Left Hand */}
              <svg width="100" height="100" viewBox="0 0 24 24" fill="currentColor" className="text-secondary-neon w-32 h-32">
                <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0" />
                <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2" />
                <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8" />
                <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.24a3 3 0 0 1 .84-5.22 2.96 2.96 0 0 1 3.83.65l.63.74" />
              </svg>
            </motion.div>

            {/* Right Hand (The Receiver) */}
            <motion.div
              initial={{ x: 200, opacity: 0 }}
              animate={
                stage === "enter" 
                  ? { x: 40, opacity: 1, scaleX: -1 } // Slide in (Mirrored)
                  : { x: 40, scaleX: -1, rotate: [0, -5, 5, 0] } // Shake
              }
              transition={
                stage === "enter"
                  ? { type: "spring", stiffness: 100, damping: 15 }
                  : { repeat: 2, duration: 0.3 }
              }
              className="absolute"
            >
              {/* SVG Graphic for Right Hand (Using same SVG, mirrored via CSS) */}
              <svg width="100" height="100" viewBox="0 0 24 24" fill="currentColor" className="text-foreground w-32 h-32">
                <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0" />
                <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2" />
                <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8" />
                <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.24a3 3 0 0 1 .84-5.22 2.96 2.96 0 0 1 3.83.65l.63.74" />
              </svg>
            </motion.div>
          </motion.div>
        )}

        {/* PHASE 3: LOGO REVEAL */}
        {stage === "logo" && (
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="flex flex-col items-center gap-4"
          >
            {/* REPLACE THIS WITH YOUR LOGO IMAGE */}
            <div className="h-32 w-32 bg-secondary-neon rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(0,243,255,0.4)]">
                <Handshake className="h-16 w-16 text-background" />
            </div>
            
            <div className="text-center">
                <motion.h1 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-4xl font-black italic tracking-tighter uppercase"
                >
                    NATPE <span className="text-secondary-neon">THUNAI</span>
                </motion.h1>
                <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-xs text-muted-foreground uppercase tracking-[0.5em] mt-2"
                >
                    Friendship is Aid
                </motion.p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AnimatedSplash;