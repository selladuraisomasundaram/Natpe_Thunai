"use client";

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Play, RotateCcw, Compass, MapPin } from 'lucide-react';

// --- CONFIGURATION ---
const CFG = {
  PLAYER_RADIUS: 8,
  NODE_RADIUS_MIN: 25,
  NODE_RADIUS_MAX: 45,
  ORBIT_SPEED_BASE: 0.025, // Slower start for readability
  FLY_SPEED: 16,           // Slightly slower for better collision detection
  SNAP_DISTANCE: 40,       // Massive increase to forgiveness/magnetic pull
  SPAWN_DISTANCE_Y: 170,   // Nodes are slightly closer
};

// --- TYPES ---
interface Node {
  id: number;
  x: number;
  y: number;
  radius: number;
  speed: number;
  direction: 1 | -1;
  visited: boolean;
  color: string;
  pulsePhase: number; // Added for visual enhancement
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

type EngineState = {
  player: {
    x: number;
    y: number;
    angle: number;
    state: 'ORBITING' | 'FLYING';
    vx: number;
    vy: number;
    currentNodeId: number;
  };
  nodes: Node[];
  particles: Particle[];
  stars: { x: number; y: number; s: number; alpha: number }[];
  score: number;
  cameraY: number;
  targetCameraY: number;
  running: boolean;
  gameOver: boolean;
  width: number;
  height: number;
  colorTheme: string;
};

const CosmicJourneyGame = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const reqRef = useRef<number>();

  const [uiState, setUiState] = useState<'MENU' | 'PLAYING' | 'GAME_OVER'>('MENU');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);

  const engine = useRef<EngineState>({
    player: { x: 0, y: 0, angle: 0, state: 'ORBITING', vx: 0, vy: 0, currentNodeId: 0 },
    nodes: [],
    particles: [],
    stars: [],
    score: 0,
    cameraY: 0,
    targetCameraY: 0,
    running: false,
    gameOver: false,
    width: 0,
    height: 0,
    colorTheme: '#00f3ff'
  });

  // --- INITIALIZATION ---
  useEffect(() => {
    const saved = localStorage.getItem('journey_hs');
    if (saved) setHighScore(parseInt(saved, 10));

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
        
        if (engine.current.stars.length === 0) {
          for(let i=0; i<100; i++) {
            engine.current.stars.push({
              x: Math.random() * w,
              y: Math.random() * h,
              s: Math.random() * 1.5 + 0.5,
              alpha: Math.random()
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
  const explode = (x: number, y: number, color: string, count = 20, speedMult = 1) => {
    for(let i=0; i<count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (Math.random() * 4 + 1) * speedMult;
      engine.current.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1.0,
        color,
        size: Math.random() * 2 + 1
      });
    }
  };

  // --- GAME LOGIC ---
  const generateNode = (yPos: number, id: number, startNode = false) => {
    const st = engine.current;
    const padding = 70; // Increased padding to prevent edge spawns
    const xPos = startNode ? st.width / 2 : Math.random() * (st.width - padding * 2) + padding;
    const radius = startNode ? 35 : Math.random() * (CFG.NODE_RADIUS_MAX - CFG.NODE_RADIUS_MIN) + CFG.NODE_RADIUS_MIN;
    
    const colors = ['#00f3ff', '#ff00ff', '#00ffaa', '#ffaa00'];
    const color = colors[id % colors.length];

    // Cap the speed increase so the game remains playable
    const speedCap = Math.min(id * 0.0005, 0.02);

    st.nodes.push({
      id,
      x: xPos,
      y: yPos,
      radius,
      speed: CFG.ORBIT_SPEED_BASE + (Math.random() * 0.01) + speedCap,
      direction: Math.random() > 0.5 ? 1 : -1,
      visited: startNode,
      color,
      pulsePhase: Math.random() * Math.PI * 2
    });
  };

  const startLoop = () => {
    if (reqRef.current) cancelAnimationFrame(reqRef.current);
    reqRef.current = requestAnimationFrame(loop);
  };

  const resetGame = useCallback(() => {
    const st = engine.current;
    
    st.nodes = [];
    const startY = st.height * 0.75;
    generateNode(startY, 0, true);
    generateNode(startY - CFG.SPAWN_DISTANCE_Y, 1);
    generateNode(startY - CFG.SPAWN_DISTANCE_Y * 2, 2);

    const startNode = st.nodes[0];

    st.player = { 
      x: startNode.x, 
      y: startNode.y - startNode.radius, 
      angle: -Math.PI / 2, 
      state: 'ORBITING', 
      vx: 0, 
      vy: 0, 
      currentNodeId: 0 
    };
    
    st.particles = [];
    st.score = 0;
    st.cameraY = 0;
    st.targetCameraY = 0;
    st.running = true;
    st.gameOver = false;
    st.colorTheme = startNode.color;
    
    setScore(0);
    setUiState('PLAYING');
    startLoop();
  }, []);

  const handleInput = useCallback(() => {
    const st = engine.current;
    if (!st.running || st.gameOver || st.player.state !== 'ORBITING') return;

    const node = st.nodes.find(n => n.id === st.player.currentNodeId);
    if (!node) return;

    const dx = st.player.x - node.x;
    const dy = st.player.y - node.y;
    
    const length = Math.hypot(dx, dy);
    let tvx = -dy / length;
    let tvy = dx / length;

    if (node.direction === -1) {
        tvx = dy / length;
        tvy = -dx / length;
    }

    st.player.vx = tvx * CFG.FLY_SPEED;
    st.player.vy = tvy * CFG.FLY_SPEED;
    st.player.state = 'FLYING';
    
    explode(st.player.x, st.player.y, '#ffffff', 10, 0.5);
  }, []);

  const die = () => {
    const st = engine.current;
    st.gameOver = true;
    st.running = false;
    explode(st.player.x, st.player.y, '#ff0044', 50, 2);
    setUiState('GAME_OVER');
    
    if (st.score > highScore) {
      setHighScore(st.score);
      localStorage.setItem('journey_hs', st.score.toString());
    }
  };

  // --- MAIN LOOP ---
  const loop = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const st = engine.current;

    if (!canvas || !ctx) return;

    // 1. UPDATE PHYSICS & LOGIC
    if (st.running && !st.gameOver) {
      
      if (st.player.state === 'ORBITING') {
        const node = st.nodes.find(n => n.id === st.player.currentNodeId);
        if (node) {
          st.player.angle += node.speed * node.direction;
          const orbitDist = node.radius + CFG.PLAYER_RADIUS + 4;
          st.player.x = node.x + Math.cos(st.player.angle) * orbitDist;
          st.player.y = node.y + Math.sin(st.player.angle) * orbitDist;
        }
      } else {
        // Flying
        st.player.x += st.player.vx;
        st.player.y += st.player.vy;

        // Leave a trail
        if (Math.random() > 0.4) {
            st.particles.push({
                x: st.player.x, y: st.player.y,
                vx: (Math.random() - 0.5) * 1, vy: (Math.random() - 0.5) * 1, 
                life: 1, color: st.colorTheme, size: Math.random() * 3 + 1
            });
        }

        // Check Collisions with Nodes
        let snapped = false;
        for (const node of st.nodes) {
          if (node.id === st.player.currentNodeId) continue;
          
          const dist = Math.hypot(st.player.x - node.x, st.player.y - node.y);
          if (dist < node.radius + CFG.PLAYER_RADIUS + CFG.SNAP_DISTANCE) {
            st.player.state = 'ORBITING';
            st.player.currentNodeId = node.id;
            st.player.angle = Math.atan2(st.player.y - node.y, st.player.x - node.x);
            st.colorTheme = node.color;
            snapped = true;
            
            // Visual flare for hitting
            explode(st.player.x, st.player.y, node.color, 20, 1.5);

            if (!node.visited) {
              node.visited = true;
              st.score++;
              setScore(st.score);
              
              st.targetCameraY -= CFG.SPAWN_DISTANCE_Y;
              
              const highestNode = st.nodes[st.nodes.length - 1];
              generateNode(highestNode.y - CFG.SPAWN_DISTANCE_Y, highestNode.id + 1);
            }
            break;
          }
        }

        // Off-screen death detection
        const screenY = st.player.y - st.cameraY;
        if (!snapped && (
            st.player.x < 0 || st.player.x > st.width || 
            screenY > st.height || screenY < -300 
        )) {
            die();
        }
      }

      st.cameraY += (st.targetCameraY - st.cameraY) * 0.1;
      st.nodes = st.nodes.filter(n => (n.y - st.cameraY) < st.height + 150);
    }

    // 2. DRAWING
    ctx.save();
    ctx.clearRect(0, 0, st.width, st.height);

    const grad = ctx.createLinearGradient(0, 0, 0, st.height);
    grad.addColorStop(0, '#020617');
    grad.addColorStop(1, '#0a001a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, st.width, st.height);

    ctx.fillStyle = '#fff';
    st.stars.forEach(s => {
      s.alpha += (Math.random() - 0.5) * 0.05;
      if(s.alpha < 0.2) s.alpha = 0.2;
      if(s.alpha > 1) s.alpha = 1;
      
      ctx.globalAlpha = s.alpha;
      const starY = (s.y - (st.cameraY * s.s * 0.2)) % st.height;
      const finalY = starY < 0 ? starY + st.height : starY;
      
      ctx.beginPath();
      ctx.arc(s.x, finalY, s.s, 0, Math.PI*2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    ctx.save();
    ctx.translate(0, -st.cameraY);

    // Draw Nodes
    const time = Date.now() / 1000;
    st.nodes.forEach(node => {
      node.pulsePhase += 0.05;
      const pulse = Math.sin(node.pulsePhase) * 3;

      ctx.beginPath();
      ctx.arc(node.x, node.y, node.radius, 0, Math.PI*2);
      ctx.fillStyle = '#050510';
      ctx.fill();
      
      ctx.lineWidth = 3;
      ctx.strokeStyle = node.visited ? '#333' : node.color;
      ctx.shadowBlur = node.visited ? 0 : 15 + pulse;
      ctx.shadowColor = node.color;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Draw active objective target ring
      if (!node.visited && node.id === st.player.currentNodeId + 1) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.radius + CFG.SNAP_DISTANCE, 0, Math.PI*2);
          ctx.strokeStyle = node.color;
          ctx.globalAlpha = 0.2 + (Math.sin(node.pulsePhase) * 0.1);
          ctx.lineWidth = 1;
          ctx.setLineDash([4, 4]);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.globalAlpha = 1;
      }

      if (!node.visited || node.id === st.player.currentNodeId) {
          const indicatorAngle = (time * node.speed * 60 * node.direction);
          ctx.beginPath();
          ctx.arc(node.x + Math.cos(indicatorAngle) * (node.radius-5), 
                  node.y + Math.sin(indicatorAngle) * (node.radius-5), 
                  3, 0, Math.PI*2);
          ctx.fillStyle = node.color;
          ctx.fill();
      }
    });

    // Draw Particles
    st.particles.forEach((p, i) => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.03;
      if (p.life <= 0) st.particles.splice(i, 1);
      
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI*2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Draw Player and Aiming Guide
    if (!st.gameOver) {
        ctx.beginPath();
        ctx.arc(st.player.x, st.player.y, CFG.PLAYER_RADIUS, 0, Math.PI*2);
        ctx.fillStyle = '#ffffff';
        ctx.shadowBlur = 20;
        ctx.shadowColor = st.colorTheme;
        ctx.fill();
        ctx.shadowBlur = 0;
        
        // Massive UI Fix: Trajectory Aiming Line
        if (st.player.state === 'ORBITING') {
            const node = st.nodes.find(n => n.id === st.player.currentNodeId);
            if (node) {
                const dx = st.player.x - node.x;
                const dy = st.player.y - node.y;
                const length = Math.hypot(dx, dy);
                let tvx = -dy / length;
                let tvy = dx / length;
                if (node.direction === -1) {
                    tvx = dy / length;
                    tvy = -dx / length;
                }
                
                // Draw Trajectory Laser
                ctx.beginPath();
                ctx.moveTo(st.player.x, st.player.y);
                ctx.lineTo(st.player.x + tvx * 300, st.player.y + tvy * 300);
                ctx.strokeStyle = 'rgba(255,255,255,0.2)';
                ctx.lineWidth = 2;
                ctx.setLineDash([5, 10]);
                ctx.stroke();
                ctx.setLineDash([]);

                // Draw base arrow
                ctx.beginPath();
                ctx.moveTo(st.player.x + tvx * 15, st.player.y + tvy * 15);
                ctx.lineTo(st.player.x + tvx * 5 + tvy * 5, st.player.y + tvy * 5 - tvx * 5);
                ctx.lineTo(st.player.x + tvx * 5 - tvy * 5, st.player.y + tvy * 5 + tvx * 5);
                ctx.fillStyle = '#ffffff';
                ctx.fill();
            }
        }
    }

    ctx.restore();
    ctx.restore();

    if (st.running || st.particles.length > 0) {
      reqRef.current = requestAnimationFrame(loop);
    }
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-[100dvh] bg-black overflow-hidden select-none touch-none"
      onMouseDown={(e) => { e.preventDefault(); if(uiState === 'PLAYING') handleInput(); }}
      onTouchStart={(e) => { e.preventDefault(); if(uiState === 'PLAYING') handleInput(); }}
    >
      <canvas ref={canvasRef} className="block w-full h-full" />

      {/* HUD Layer */}
      <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-start pointer-events-none">
        <div className="flex items-center gap-2 px-4 py-2 rounded-full border bg-white/5 border-white/10 text-white/70 backdrop-blur-md">
          <Compass className="w-4 h-4" />
          <span className="font-bold tracking-widest text-xs uppercase">
            Guiding Home
          </span>
        </div>

        <div className="text-right">
          <div className="text-xs font-bold text-white/50 mb-1 flex items-center justify-end gap-1 uppercase tracking-wider">
            <MapPin className="w-3 h-3" /> Best: {highScore} LY
          </div>
          <div className="text-5xl font-black text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] tabular-nums tracking-tighter">
            {score}<span className="text-lg text-white/50 tracking-normal ml-1">LY</span>
          </div>
        </div>
      </div>

      {/* Main Menu */}
      {uiState === 'MENU' && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in">
          <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-white/40 drop-shadow-2xl mb-2 text-center leading-tight tracking-tighter">
            JOURNEY<br/>HOME
          </h1>
          <p className="text-white/50 text-sm tracking-widest uppercase mb-10 font-medium">Find your way back</p>
          
          <Button 
            onClick={(e) => { e.stopPropagation(); resetGame(); }}
            className="px-12 py-8 bg-white hover:bg-slate-200 text-black rounded-full font-black text-xl tracking-widest shadow-[0_0_40px_rgba(255,255,255,0.2)] hover:scale-105 transition-all"
          >
            <Play className="w-6 h-6 mr-2 fill-black" /> START
          </Button>
          
          <div className="mt-12 text-center text-white/40 text-xs uppercase tracking-widest space-y-2">
            <p className="flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" /> Tap when the laser aligns
            </p>
            <p className="flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-magenta-400 animate-pulse" /> Enter the target's gravity well
            </p>
          </div>
        </div>
      )}

      {/* Game Over */}
      {uiState === 'GAME_OVER' && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in zoom-in-95">
          <div className="text-center max-w-sm w-[90%]">
            <h2 className="text-3xl font-black text-white mb-2 tracking-tighter">DRIFTING IN SPACE</h2>
            <p className="text-sm text-white/50 uppercase tracking-widest mb-8">Connection Lost</p>
            
            <div className="text-7xl font-black text-white mb-2">{score}</div>
            <p className="text-white/40 text-xs uppercase tracking-widest mb-10">Lightyears traveled</p>
            
            <Button 
              onClick={(e) => { e.stopPropagation(); resetGame(); }}
              className="w-full py-7 bg-white hover:bg-slate-200 text-black font-black text-lg tracking-widest rounded-2xl shadow-[0_0_30px_rgba(255,255,255,0.15)] hover:scale-[1.02] transition-transform"
            >
              <RotateCcw className="w-5 h-5 mr-2" /> TRY AGAIN
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CosmicJourneyGame;