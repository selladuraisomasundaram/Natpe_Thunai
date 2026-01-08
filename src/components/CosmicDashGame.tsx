"use client";

import React, { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Zap, Trophy, Play, RotateCcw, AlertTriangle } from 'lucide-react';

// --- TACTICAL CONFIGURATION ---
const CONSTANTS = {
  ASPECT_RATIO: 16 / 9,
  GRAVITY: 0.7, // Heavier gravity for snappier jumps
  JUMP_FORCE: -11, // Stronger initial jump
  DOUBLE_JUMP_FORCE: -9, // Strategic second jump
  BASE_SPEED: 6, // Faster start
  MAX_SPEED: 18, // Higher skill ceiling
  SPEED_INCREMENT: 0.002, // Aggressive ramp up
  GROUND_HEIGHT_RATIO: 0.85,
  PLAYER_SIZE: 20, // Slightly smaller hitbox for precision
  OBSTACLE_WIDTH: 25,
};

// --- TYPES ---
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}

interface Obstacle {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'SPIKE' | 'DRONE' | 'WALL';
  passed: boolean;
}

const CosmicDashGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameState, setGameState] = useState<'IDLE' | 'PLAYING' | 'GAME_OVER'>('IDLE');
  const [dimensions, setDimensions] = useState({ width: 320, height: 180 });

  // Mutable Game State
  const game = useRef({
    playerY: 0,
    velocity: 0,
    isGrounded: false,
    jumpCount: 0,
    rotation: 0,
    obstacles: [] as Obstacle[],
    particles: [] as Particle[],
    speed: CONSTANTS.BASE_SPEED,
    score: 0,
    distance: 0,
    lastSpawnX: 0, // Track spawn by distance, not time
    shake: 0,
    frameId: 0,
    stars: [] as { x: number; y: number; size: number; speed: number }[],
    speedLines: [] as { x: number; y: number; len: number; speed: number }[],
  });

  // --- INITIALIZATION ---
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const w = containerRef.current.offsetWidth;
        const h = w / CONSTANTS.ASPECT_RATIO;
        setDimensions({ width: w, height: h });
        initBackground(w, h);
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    
    const saved = localStorage.getItem('cosmicHighScore');
    if (saved) setHighScore(parseInt(saved));

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const initBackground = (w: number, h: number) => {
    game.current.stars = Array.from({ length: 30 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      size: Math.random() * 2,
      speed: Math.random() * 0.5 + 0.1
    }));
    game.current.speedLines = Array.from({ length: 10 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      len: Math.random() * 20 + 10,
      speed: Math.random() * 10 + 5
    }));
  };

  // --- GAMEPLAY MECHANICS ---

  const spawnParticles = (x: number, y: number, count: number, color: string, speedMult = 1) => {
    for (let i = 0; i < count; i++) {
      game.current.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 6 * speedMult,
        vy: (Math.random() - 0.5) * 6 * speedMult,
        life: 1.0,
        color,
        size: Math.random() * 3 + 1
      });
    }
  };

  const spawnObstaclePattern = (groundY: number, width: number) => {
    const g = game.current;
    // Minimum distance between obstacles based on speed
    const minGap = 200 + (g.speed * 10); 
    
    if (g.distance - g.lastSpawnX < minGap) return;

    const patternId = Math.random();
    let obstaclesToAdd: Obstacle[] = [];
    const spawnX = width + 50;

    // Tactical Patterns
    if (patternId < 0.3) {
      // 1. The Classic Spike (Ground)
      obstaclesToAdd.push({
        id: Date.now(), x: spawnX, y: groundY - 40, width: 25, height: 40, type: 'SPIKE', passed: false
      });
    } else if (patternId < 0.6) {
      // 2. The Low Drone (Requires Jump)
      obstaclesToAdd.push({
        id: Date.now(), x: spawnX, y: groundY - 55, width: 30, height: 20, type: 'DRONE', passed: false
      });
    } else if (patternId < 0.8) {
      // 3. The "Gate" (High Drone + Ground Spike) - Requires precise short hop
      obstaclesToAdd.push({
        id: Date.now(), x: spawnX, y: groundY - 30, width: 20, height: 30, type: 'SPIKE', passed: false
      });
      obstaclesToAdd.push({
        id: Date.now() + 1, x: spawnX, y: groundY - 110, width: 20, height: 40, type: 'WALL', passed: false
      });
    } else {
      // 4. The "Staircase" (Double Jump Test)
      obstaclesToAdd.push({
        id: Date.now(), x: spawnX, y: groundY - 30, width: 25, height: 30, type: 'SPIKE', passed: false
      });
      obstaclesToAdd.push({
        id: Date.now() + 1, x: spawnX + 180, y: groundY - 70, width: 30, height: 20, type: 'DRONE', passed: false
      });
      // Update lastSpawnX to account for the second part of the pattern
      g.lastSpawnX = g.distance + 180; 
    }

    g.obstacles.push(...obstaclesToAdd);
    if (g.lastSpawnX < g.distance) g.lastSpawnX = g.distance;
  };

  const resetGame = () => {
    const groundY = dimensions.height * CONSTANTS.GROUND_HEIGHT_RATIO;
    game.current = {
      ...game.current,
      playerY: groundY - CONSTANTS.PLAYER_SIZE,
      velocity: 0,
      obstacles: [],
      particles: [],
      score: 0,
      distance: 0,
      speed: CONSTANTS.BASE_SPEED,
      lastSpawnX: 0,
      shake: 0,
      jumpCount: 0,
    };
    setScore(0);
    setGameState('PLAYING');
  };

  const jump = () => {
    if (gameState !== 'PLAYING') return;
    const g = game.current;

    if (g.jumpCount < 2) {
      const force = g.jumpCount === 0 ? CONSTANTS.JUMP_FORCE : CONSTANTS.DOUBLE_JUMP_FORCE;
      g.velocity = force;
      g.jumpCount++;
      g.rotation = g.jumpCount === 1 ? -0.2 : -6.28; // Spin animation on double jump
      
      // Visual feedback
      spawnParticles(
        dimensions.width * 0.15 + 10, 
        g.playerY + 20, 
        5, 
        g.jumpCount === 1 ? '#00f3ff' : '#ff00ff'
      );
    }
  };

  // --- RENDER LOOP ---
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const loop = () => {
      const { width, height } = dimensions;
      const groundLevel = height * CONSTANTS.GROUND_HEIGHT_RATIO;
      const g = game.current;

      // 1. Clear & Shake
      ctx.clearRect(0, 0, width, height);
      ctx.save();
      if (g.shake > 0) {
        ctx.translate((Math.random() - 0.5) * g.shake, (Math.random() - 0.5) * g.shake);
        g.shake *= 0.9;
        if (g.shake < 0.5) g.shake = 0;
      }

      // 2. Background (Cyberpunk)
      ctx.fillStyle = '#050510';
      ctx.fillRect(0, 0, width, height);

      // Speed Lines (Anime Effect)
      if (g.speed > 10) {
        ctx.strokeStyle = `rgba(255, 255, 255, ${(g.speed - 10) / 20})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        g.speedLines.forEach(line => {
          line.x -= line.speed * (g.speed/5);
          if (line.x < -line.len) {
            line.x = width + Math.random() * 100;
            line.y = Math.random() * height;
          }
          ctx.moveTo(line.x, line.y);
          ctx.lineTo(line.x + line.len, line.y);
        });
        ctx.stroke();
      }

      // Stars
      ctx.fillStyle = '#fff';
      g.stars.forEach(s => {
        if (gameState === 'PLAYING') s.x -= s.speed * (g.speed / 4);
        if (s.x < 0) s.x = width;
        ctx.fillRect(s.x, s.y, s.size, s.size);
      });

      // Floor
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, groundLevel, width, height - groundLevel);
      // Neon Horizon Line
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#00f3ff';
      ctx.strokeStyle = '#00f3ff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, groundLevel);
      ctx.lineTo(width, groundLevel);
      ctx.stroke();
      ctx.shadowBlur = 0;

      if (gameState === 'PLAYING') {
        // --- PHYSICS ---
        g.velocity += CONSTANTS.GRAVITY;
        g.playerY += g.velocity;
        g.distance += g.speed;

        // Ground Logic
        if (g.playerY >= groundLevel - CONSTANTS.PLAYER_SIZE) {
          g.playerY = groundLevel - CONSTANTS.PLAYER_SIZE;
          g.velocity = 0;
          g.isGrounded = true;
          g.jumpCount = 0;
          // Smooth rotation reset
          g.rotation = g.rotation * 0.8;
        } else {
          g.isGrounded = false;
          // Rotate while falling
          if(g.jumpCount === 1) g.rotation += 0.05; 
          else g.rotation += 0.15; // Fast spin on double jump
        }

        // Difficulty Scaling
        if (g.speed < CONSTANTS.MAX_SPEED) g.speed += CONSTANTS.SPEED_INCREMENT;
        g.score += g.speed * 0.01;
        setScore(Math.floor(g.score));

        spawnObstaclePattern(groundLevel, width);

        // --- OBSTACLES & COLLISION ---
        const pX = width * 0.15;
        // Hitbox is slightly smaller than visual size for fairness
        const hitboxMargin = 4; 

        for (let i = g.obstacles.length - 1; i >= 0; i--) {
          const obs = g.obstacles[i];
          obs.x -= g.speed;

          // Draw Obstacle
          ctx.fillStyle = obs.type === 'DRONE' ? '#ff00ff' : '#ff3333';
          ctx.shadowBlur = 10;
          ctx.shadowColor = ctx.fillStyle;
          
          if (obs.type === 'DRONE') {
            // Drone Shape
            ctx.beginPath();
            ctx.arc(obs.x + obs.width/2, obs.y + obs.height/2, obs.width/2, 0, Math.PI*2);
            ctx.fill();
            // Engine pulse
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(obs.x + obs.width/2, obs.y + obs.height/2, 4, 0, Math.PI*2);
            ctx.fill();
          } else {
            // Spike/Wall Shape
            ctx.beginPath();
            ctx.moveTo(obs.x, obs.y + obs.height);
            ctx.lineTo(obs.x + obs.width/2, obs.y);
            ctx.lineTo(obs.x + obs.width, obs.y + obs.height);
            ctx.fill();
          }
          ctx.shadowBlur = 0;

          // Collision Check (AABB)
          if (
            pX + CONSTANTS.PLAYER_SIZE - hitboxMargin > obs.x + hitboxMargin &&
            pX + hitboxMargin < obs.x + obs.width - hitboxMargin &&
            g.playerY + CONSTANTS.PLAYER_SIZE - hitboxMargin > obs.y + hitboxMargin &&
            g.playerY + hitboxMargin < obs.y + obs.height - hitboxMargin
          ) {
            setGameState('GAME_OVER');
            g.shake = 15;
            spawnParticles(pX, g.playerY, 20, '#ff0000', 1.5);
            if (g.score > highScore) {
              setHighScore(Math.floor(g.score));
              localStorage.setItem('cosmicHighScore', Math.floor(g.score).toString());
            }
          }

          if (obs.x + obs.width < 0) g.obstacles.splice(i, 1);
        }
      }

      // --- DRAW PLAYER ---
      const pX = width * 0.15;
      ctx.save();
      ctx.translate(pX + CONSTANTS.PLAYER_SIZE/2, g.playerY + CONSTANTS.PLAYER_SIZE/2);
      ctx.rotate(g.rotation);

      // Dash Shadow (Ghost Trail)
      if (gameState === 'PLAYING' && g.speed > 10) {
        ctx.fillStyle = `rgba(0, 243, 255, 0.3)`;
        ctx.fillRect(-CONSTANTS.PLAYER_SIZE/2 - 10, -CONSTANTS.PLAYER_SIZE/2, CONSTANTS.PLAYER_SIZE, CONSTANTS.PLAYER_SIZE);
      }

      // Player Body
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#00f3ff';
      ctx.fillStyle = '#000';
      ctx.strokeStyle = '#00f3ff';
      ctx.lineWidth = 2;
      ctx.fillRect(-CONSTANTS.PLAYER_SIZE/2, -CONSTANTS.PLAYER_SIZE/2, CONSTANTS.PLAYER_SIZE, CONSTANTS.PLAYER_SIZE);
      ctx.stroke();
      
      // Player Core
      ctx.fillStyle = g.jumpCount === 2 ? '#ff00ff' : '#fff'; // Core turns pink on double jump
      ctx.fillRect(-4, -4, 8, 8);
      
      ctx.restore();

      // --- PARTICLES ---
      g.particles.forEach((p, idx) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.04;
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI*2);
        ctx.fill();
        if(p.life <= 0) g.particles.splice(idx, 1);
      });
      ctx.globalAlpha = 1;

      ctx.restore();
      g.frameId = requestAnimationFrame(loop);
    };

    const frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, [dimensions, gameState, highScore]);

  // --- CONTROLS ---
  useEffect(() => {
    const handleInput = (e: any) => {
      e.preventDefault();
      if (gameState === 'IDLE' || gameState === 'GAME_OVER') {
        if (gameState === 'GAME_OVER') resetGame();
        else setGameState('PLAYING');
      } else {
        jump();
      }
    };

    const c = canvasRef.current;
    if(c) {
      c.addEventListener('touchstart', handleInput, { passive: false });
      c.addEventListener('mousedown', handleInput);
    }
    window.addEventListener('keydown', (e) => {
      if(e.code === 'Space' || e.code === 'ArrowUp') handleInput(e);
    });

    return () => {
      if(c) {
        c.removeEventListener('touchstart', handleInput);
        c.removeEventListener('mousedown', handleInput);
      }
      window.removeEventListener('keydown', handleInput);
    };
  }, [gameState]);

  return (
    <div ref={containerRef} className="w-full max-w-md mx-auto p-4 flex flex-col items-center gap-4">
      {/* HUD */}
      <div className="flex w-full justify-between items-center text-sm font-bold font-mono tracking-wider text-cyan-400">
        <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-yellow-400" />
            <span className="text-yellow-400">HI: {highScore}</span>
        </div>
        <div className="flex items-center gap-2 bg-slate-900/80 px-4 py-1 rounded-full border border-cyan-500/50 shadow-[0_0_10px_rgba(0,243,255,0.2)]">
            <Zap className="w-4 h-4 text-cyan-400" />
            <span>{score.toString().padStart(5, '0')}</span>
        </div>
      </div>

      {/* GAME CANVAS */}
      <div 
        className={cn(
            "relative w-full rounded-xl overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.5)] border-2",
            gameState === 'GAME_OVER' ? "border-red-500/50" : "border-cyan-500/30"
        )}
        style={{ height: dimensions.height }}
      >
        <canvas
            ref={canvasRef}
            width={dimensions.width}
            height={dimensions.height}
            className="block touch-none cursor-pointer"
        />

        {/* START OVERLAY */}
        {gameState === 'IDLE' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-[2px] animate-in fade-in duration-300">
                <h2 className="text-4xl font-black italic text-transparent bg-clip-text bg-gradient-to-br from-cyan-300 to-blue-600 mb-2 drop-shadow-[0_4px_0_rgba(0,0,0,0.5)]">
                    COSMIC DASH
                </h2>
                <div className="animate-pulse flex items-center gap-2 text-white font-mono text-xs bg-cyan-500/20 px-4 py-2 rounded border border-cyan-500/30">
                    <Play className="w-3 h-3" /> TAP / SPACE TO START
                </div>
            </div>
        )}

        {/* GAME OVER OVERLAY */}
        {gameState === 'GAME_OVER' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm z-10 animate-in zoom-in-95 duration-200">
                <div className="flex items-center gap-2 text-red-500 mb-2">
                    <AlertTriangle className="w-8 h-8" />
                    <h2 className="text-3xl font-black tracking-widest">CRITICAL FAILURE</h2>
                </div>
                
                <div className="flex flex-col items-center gap-1 mb-6 font-mono">
                    <span className="text-slate-400 text-xs uppercase tracking-widest">System Distance</span>
                    <span className="text-3xl text-white font-bold">{score}</span>
                </div>
                
                <Button 
                    onClick={resetGame}
                    className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold gap-2 shadow-[0_0_20px_rgba(0,243,255,0.4)] transition-all hover:scale-105 active:scale-95"
                >
                    <RotateCcw className="w-4 h-4" /> REBOOT SYSTEM
                </Button>
            </div>
        )}
      </div>

      <div className="flex justify-between w-full px-2 text-[10px] text-slate-500 font-mono uppercase">
        <span>Tap: Jump</span>
        <span>Double Tap: Boost</span>
      </div>
    </div>
  );
};

export default CosmicDashGame;