"use client";

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Trophy, Play, RotateCcw, Zap, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

// --- CONFIGURATION ---
const CFG = {
  GRAVITY_SPACE: 0.4,
  GRAVITY_GRID: 0.8,
  JUMP_FORCE: -7,
  FLIP_FORCE: 12, // For gravity flipping
  SPEED_START: 5,
  SPEED_MAX: 12,
  PLAYER_SIZE: 24,
  SPAWN_RATE: 100,
  MODE_SWITCH_SCORE: 5, // Switch dimensions every 5 points approx
};

// --- TYPES ---
type GameMode = 'SPACE' | 'GRID'; // SPACE = Fly, GRID = Gravity Flip

interface Entity {
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
}

interface Obstacle extends Entity {
  passed: boolean;
  type: 'WALL' | 'SPIKE';
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}

interface GlitchCore extends Entity {
  active: boolean;
  rotation: number;
}

// --- ENGINE STATE ---
type EngineState = {
  mode: GameMode;
  player: { 
    x: number; 
    y: number; 
    vy: number; 
    grounded: boolean; 
    gravityDir: 1 | -1; // 1 = down, -1 = up (for Grid mode)
    rotation: number;
  };
  obstacles: Obstacle[];
  particles: Particle[];
  core: GlitchCore | null; // The dimension switching item
  stars: { x: number; y: number; s: number; v: number }[]; // Background
  score: number;
  speed: number;
  frames: number;
  running: boolean;
  gameOver: boolean;
  width: number;
  height: number;
  shake: number; // Screen shake intensity
};

const CosmicDashGame = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const reqRef = useRef<number>();

  // UI State
  const [uiState, setUiState] = useState<'MENU' | 'PLAYING' | 'GAME_OVER'>('MENU');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [currentMode, setCurrentMode] = useState<GameMode>('SPACE');

  // Game Engine Ref (Mutable)
  const engine = useRef<EngineState>({
    mode: 'SPACE',
    player: { x: 60, y: 0, vy: 0, grounded: false, gravityDir: 1, rotation: 0 },
    obstacles: [],
    particles: [],
    core: null,
    stars: [],
    score: 0,
    speed: CFG.SPEED_START,
    frames: 0,
    running: false,
    gameOver: false,
    width: 0,
    height: 0,
    shake: 0,
  });

  // --- INITIALIZATION ---
  useEffect(() => {
    const saved = localStorage.getItem('cosmic_hs');
    if (saved) setHighScore(parseInt(saved));

    const handleResize = () => {
      if (containerRef.current && canvasRef.current) {
        const { clientWidth: w, clientHeight: h } = containerRef.current;
        const dpr = window.devicePixelRatio || 1;
        
        canvasRef.current.width = w * dpr;
        canvasRef.current.height = h * dpr;
        canvasRef.current.style.width = `${w}px`;
        canvasRef.current.style.height = `${h}px`;
        
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) ctx.scale(dpr, dpr);

        engine.current.width = w;
        engine.current.height = h;
        
        // Init Background Stars
        if (engine.current.stars.length === 0) {
          for(let i=0; i<60; i++) {
            engine.current.stars.push({
              x: Math.random() * w,
              y: Math.random() * h,
              s: Math.random() * 2 + 0.5,
              v: Math.random() * 0.5 + 0.1
            });
          }
        }
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- HELPER: PARTICLES ---
  const explode = (x: number, y: number, color: string, count = 15) => {
    for(let i=0; i<count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 5 + 2;
      engine.current.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1.0,
        color,
        size: Math.random() * 3 + 1
      });
    }
  };

  // --- GAME LOGIC ---
  const startLoop = () => {
    if (reqRef.current) cancelAnimationFrame(reqRef.current);
    reqRef.current = requestAnimationFrame(loop);
  };

  const resetGame = useCallback(() => {
    const st = engine.current;
    st.mode = 'SPACE';
    setCurrentMode('SPACE');
    st.player = { x: 60, y: st.height / 2, vy: 0, grounded: false, gravityDir: 1, rotation: 0 };
    st.obstacles = [];
    st.particles = [];
    st.core = null;
    st.score = 0;
    st.speed = CFG.SPEED_START;
    st.frames = 0;
    st.running = true;
    st.gameOver = false;
    st.shake = 0;
    
    setScore(0);
    setUiState('PLAYING');
    
    // Ensure loop is running
    startLoop();
  }, []);

  const switchMode = () => {
    const st = engine.current;
    st.mode = st.mode === 'SPACE' ? 'GRID' : 'SPACE';
    st.shake = 20; // Big screen shake
    st.speed += 0.5; // Speed up
    setCurrentMode(st.mode);
    
    // Visual flare
    explode(st.player.x, st.player.y, '#ffffff', 30);
    
    // Reset physics for new mode
    st.player.vy = 0;
    st.player.gravityDir = 1; 
    
    // Clear obstacles nearby to prevent cheap deaths
    st.obstacles = st.obstacles.filter(o => o.x > st.width * 0.8);
  };

  const handleInput = useCallback(() => {
    const st = engine.current;
    if (!st.running) return;

    if (st.mode === 'SPACE') {
      // Flappy mechanics
      st.player.vy = CFG.JUMP_FORCE;
      explode(st.player.x, st.player.y + 10, '#00f3ff', 5); // Thruster effect
    } else {
      // Gravity Flip mechanics
      st.player.gravityDir *= -1; // Flip direction
      st.player.vy = 0; // Reset velocity for instant snap feel
      explode(st.player.x, st.player.y + (st.player.gravityDir === 1 ? -10 : 10), '#ff00ff', 5);
    }
  }, []);

  // --- MAIN LOOP ---
  const loop = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const st = engine.current;

    if (!canvas || !ctx) return;

    // 1. UPDATE PHYSICS
    if (st.running && !st.gameOver) {
      st.frames++;
      
      // Screen Shake Decay
      if (st.shake > 0) st.shake *= 0.9;
      if (st.shake < 0.5) st.shake = 0;

      // Player Movement
      const gravity = st.mode === 'SPACE' ? CFG.GRAVITY_SPACE : (CFG.GRAVITY_GRID * st.player.gravityDir);
      st.player.vy += gravity;
      st.player.y += st.player.vy;

      // Mode Specific Constraints
      if (st.mode === 'SPACE') {
        st.player.rotation = Math.min(Math.PI/4, Math.max(-Math.PI/4, st.player.vy * 0.1));
        // Death check
        if (st.player.y < 0 || st.player.y > st.height) die();
      } else {
        // GRID Mode: Floor/Ceiling Clamping
        st.player.rotation += 0.1; // Rolling effect
        if (st.player.y < 0) {
          st.player.y = 0;
          st.player.vy = 0;
        } else if (st.player.y + CFG.PLAYER_SIZE > st.height) {
          st.player.y = st.height - CFG.PLAYER_SIZE;
          st.player.vy = 0;
        }
      }

      // Spawning Obstacles
      if (st.frames % CFG.SPAWN_RATE === 0) {
        spawnObstacle();
      }

      // Spawning Glitch Core (Mode Switcher)
      if (st.score > 0 && st.score % CFG.MODE_SWITCH_SCORE === 0 && !st.core && st.frames % 20 === 0) {
        st.core = {
          x: st.width + 100,
          y: st.height / 2 - 15,
          w: 30,
          h: 30,
          color: '#ffffff',
          active: true,
          rotation: 0
        };
      }

      // Update Obstacles
      st.obstacles.forEach(obs => {
        obs.x -= st.speed;
        // Collision
        if (AABB(st.player, obs)) die();
        // Score
        if (!obs.passed && obs.x + obs.w < st.player.x) {
          obs.passed = true;
          st.score++;
          setScore(st.score);
        }
      });

      // Update Core
      if (st.core) {
        st.core.x -= st.speed;
        st.core.rotation += 0.1;
        if (AABB(st.player, st.core)) {
          st.core = null;
          switchMode();
        } else if (st.core.x < -50) {
          st.core = null; // Missed it
        }
      }

      // Cleanup
      st.obstacles = st.obstacles.filter(o => o.x + o.w > -100);
    }

    // 2. DRAWING
    // Clear & Shake
    ctx.save();
    ctx.clearRect(0, 0, st.width, st.height);
    
    if (st.shake > 0) {
      const dx = (Math.random() - 0.5) * st.shake;
      const dy = (Math.random() - 0.5) * st.shake;
      ctx.translate(dx, dy);
    }

    // Background
    drawBackground(ctx, st);

    // Player
    drawPlayer(ctx, st);

    // Obstacles
    st.obstacles.forEach(obs => {
      ctx.fillStyle = obs.color;
      ctx.shadowBlur = 10;
      ctx.shadowColor = obs.color;
      ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
      ctx.shadowBlur = 0;
    });

    // Core
    if (st.core) {
      ctx.save();
      ctx.translate(st.core.x + 15, st.core.y + 15);
      ctx.rotate(st.core.rotation);
      ctx.fillStyle = '#fff';
      ctx.shadowBlur = 20;
      ctx.shadowColor = '#fff';
      ctx.beginPath();
      ctx.moveTo(0, -15);
      ctx.lineTo(15, 15);
      ctx.lineTo(-15, 15);
      ctx.fill();
      ctx.restore();
    }

    // Particles
    st.particles.forEach((p, i) => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.02;
      if (p.life <= 0) st.particles.splice(i, 1);
      
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI*2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    ctx.restore();

    if (st.running) {
      reqRef.current = requestAnimationFrame(loop);
    }
  };

  const drawBackground = (ctx: CanvasRenderingContext2D, st: EngineState) => {
    // Gradient changes based on mode
    const grad = ctx.createLinearGradient(0, 0, 0, st.height);
    if (st.mode === 'SPACE') {
      grad.addColorStop(0, '#020617');
      grad.addColorStop(1, '#1e1b4b');
    } else {
      grad.addColorStop(0, '#2a0a18'); // Reddish dark for grid mode
      grad.addColorStop(1, '#000000');
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, st.width, st.height);

    // Draw Stars
    ctx.fillStyle = '#fff';
    st.stars.forEach(s => {
      s.x -= s.v * (st.running ? (st.speed * 0.5) : 0.2);
      if (s.x < 0) s.x = st.width;
      ctx.globalAlpha = Math.random() * 0.5 + 0.2;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.s, 0, Math.PI*2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Draw Grid Lines in GRID mode
    if (st.mode === 'GRID') {
      ctx.strokeStyle = 'rgba(255, 0, 255, 0.2)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      // Moving floor lines
      const offset = (st.frames * st.speed) % 50;
      for(let i=0; i<st.width + 50; i+=50) {
        ctx.moveTo(i - offset, 0);
        ctx.lineTo(i - offset, st.height);
      }
      // Horizontal lines
      ctx.moveTo(0, 50); ctx.lineTo(st.width, 50);
      ctx.moveTo(0, st.height - 50); ctx.lineTo(st.width, st.height - 50);
      ctx.stroke();
    }
  };

  const drawPlayer = (ctx: CanvasRenderingContext2D, st: EngineState) => {
    const { player } = st;
    ctx.save();
    ctx.translate(player.x + CFG.PLAYER_SIZE/2, player.y + CFG.PLAYER_SIZE/2);
    ctx.rotate(player.rotation);
    
    // Mode specific Player Look
    if (st.mode === 'SPACE') {
      ctx.fillStyle = '#00f3ff'; // Cyan
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#00f3ff';
    } else {
      ctx.fillStyle = '#ff00ff'; // Magenta
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#ff00ff';
    }

    ctx.fillRect(-CFG.PLAYER_SIZE/2, -CFG.PLAYER_SIZE/2, CFG.PLAYER_SIZE, CFG.PLAYER_SIZE);
    
    // Inner Core
    ctx.fillStyle = '#fff';
    ctx.fillRect(-5, -5, 10, 10);
    
    ctx.restore();
  };

  const spawnObstacle = () => {
    const st = engine.current;
    
    if (st.mode === 'SPACE') {
      // Flappy Bird Style Pipes
      const gap = 160;
      const minH = 50;
      const topH = Math.random() * (st.height - gap - (minH*2)) + minH;
      
      st.obstacles.push({
        x: st.width, y: 0, w: 50, h: topH,
        color: '#3b82f6', passed: false, type: 'WALL'
      });
      st.obstacles.push({
        x: st.width, y: topH + gap, w: 50, h: st.height - (topH + gap),
        color: '#3b82f6', passed: false, type: 'WALL'
      });
    } else {
      // Grid Runner Spikes (Floor or Ceiling)
      const onFloor = Math.random() > 0.5;
      const h = Math.random() * 60 + 40;
      st.obstacles.push({
        x: st.width,
        y: onFloor ? st.height - h : 0,
        w: 40,
        h: h,
        color: '#ef4444',
        passed: false,
        type: 'SPIKE'
      });
    }
  };

  const AABB = (r1: any, r2: any) => {
    // Small padding to be forgiving
    const p = 6; 
    return (
      r1.x + p < r2.x + r2.w &&
      r1.x + CFG.PLAYER_SIZE - p > r2.x &&
      r1.y + p < r2.y + r2.h &&
      r1.y + CFG.PLAYER_SIZE - p > r2.y
    );
  };

  const die = () => {
    const st = engine.current;
    st.gameOver = true;
    st.running = false;
    st.shake = 30; // Massive shake
    explode(st.player.x, st.player.y, '#ffffff', 50); // Big Boom
    setUiState('GAME_OVER');
    
    if (st.score > highScore) {
      setHighScore(st.score);
      localStorage.setItem('cosmic_hs', st.score.toString());
    }
  };

  // --- INPUT HANDLING ---
  useEffect(() => {
    const kd = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        // FIX: Replaced complex nested checks with straightforward logic
        // If playing, input; otherwise, reset.
        if (uiState === 'PLAYING') {
            handleInput();
        } else {
            resetGame();
        }
      }
    };
    window.addEventListener('keydown', kd);
    return () => window.removeEventListener('keydown', kd);
  }, [uiState, handleInput, resetGame]);

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-[100dvh] bg-black overflow-hidden select-none"
      onMouseDown={(e) => { e.preventDefault(); if(uiState === 'PLAYING') handleInput(); else resetGame(); }}
      onTouchStart={(e) => { e.preventDefault(); if(uiState === 'PLAYING') handleInput(); else resetGame(); }}
    >
      {/* Background/Game Layer */}
      <canvas ref={canvasRef} className="block w-full h-full" />

      {/* HUD Layer */}
      <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-start pointer-events-none">
        <div className={cn(
          "flex items-center gap-3 px-4 py-2 rounded-full border backdrop-blur-md transition-colors duration-500",
          currentMode === 'SPACE' ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-400" : "bg-magenta-500/20 border-magenta-500/50 text-magenta-400"
        )}>
          <Activity className="w-5 h-5 animate-pulse" />
          <span className="font-black tracking-widest text-sm">
            DIMENSION: {currentMode}
          </span>
        </div>

        <div className="text-right">
          <div className="text-xs font-bold text-slate-400 mb-1 flex items-center justify-end gap-1">
            <Trophy className="w-3 h-3" /> BEST: {highScore}
          </div>
          <div className="text-7xl font-black italic text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)] tabular-nums leading-none">
            {score}
          </div>
        </div>
      </div>

      {/* Main Menu */}
      {uiState === 'MENU' && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm animate-in zoom-in-95">
          <h1 className="text-6xl md:text-8xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-white to-pink-500 drop-shadow-2xl mb-4">
            NEON<br/>SHIFT
          </h1>
          <Button 
            onClick={(e) => { e.stopPropagation(); resetGame(); }}
            className="px-10 py-8 bg-white hover:bg-slate-200 text-black rounded-full font-black text-xl tracking-widest shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:scale-105 transition-all"
          >
            <Play className="w-6 h-6 mr-2 fill-black" /> INITIALIZE
          </Button>
          <div className="mt-8 text-center text-slate-400 text-xs font-mono uppercase tracking-widest space-y-1">
            <p>Space Mode: Tap to Fly</p>
            <p>Grid Mode: Tap to Flip Gravity</p>
            <p className="text-yellow-400 animate-pulse mt-2">Catch the Core to Switch Dimensions</p>
          </div>
        </div>
      )}

      {/* Game Over */}
      {uiState === 'GAME_OVER' && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-red-950/40 backdrop-blur-md animate-in fade-in zoom-in-90">
          <div className="bg-black/80 border border-white/10 p-8 rounded-3xl text-center shadow-2xl max-w-sm w-[90%]">
            <h2 className="text-4xl font-black text-red-500 mb-1">SYNC LOST</h2>
            <p className="text-xs text-slate-500 uppercase tracking-widest mb-6">Reality Collapse Imminent</p>
            
            <div className="text-6xl font-black text-white mb-8">{score}</div>
            
            <Button 
              onClick={(e) => { e.stopPropagation(); resetGame(); }}
              className="w-full py-6 bg-white hover:bg-slate-200 text-black font-bold rounded-xl"
            >
              <RotateCcw className="w-5 h-5 mr-2" /> REBOOT
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CosmicDashGame;