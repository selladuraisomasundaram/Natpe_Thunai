"use client";

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Play, RotateCcw, Compass, MapPin, Crosshair, Shield, ChevronLeft } from 'lucide-react';

// ==========================================
// SHARED UTILITIES
// ==========================================

interface Particle {
  x: number; y: number; vx: number; vy: number; life: number; color: string; size: number;
}

const explode = (arr: Particle[], x: number, y: number, color: string, count = 20, speedMult = 1) => {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = (Math.random() * 4 + 1) * speedMult;
    arr.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 1.0, color, size: Math.random() * 2 + 1 });
  }
};

const drawParticles = (ctx: CanvasRenderingContext2D, particles: Particle[]) => {
  particles.forEach((p, i) => {
    p.x += p.vx; p.y += p.vy; p.life -= 0.03;
    if (p.life <= 0) particles.splice(i, 1);
    ctx.globalAlpha = Math.max(0, p.life);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
};

// ==========================================
// GAME 1: COSMIC JOURNEY (Orbital Jumper)
// ==========================================
const GameJourney = ({ onExit }: { onExit: () => void }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reqRef = useRef<number>();
  const [uiState, setUiState] = useState<'PLAYING' | 'GAME_OVER'>('PLAYING');
  const [score, setScore] = useState(0);

  const CFG = { P_RAD: 8, FLY_SPEED: 16, SNAP_DIST: 40, SPAWN_Y: 170 };

  const engine = useRef({
    player: { x: 0, y: 0, angle: 0, state: 'ORBITING' as 'ORBITING' | 'FLYING', vx: 0, vy: 0, nodeId: 0 },
    nodes: [] as any[], particles: [] as Particle[], stars: [] as any[],
    cameraY: 0, targetCamY: 0, w: 0, h: 0, running: true, color: '#00f3ff'
  });

  const init = useCallback((w: number, h: number) => {
    const st = engine.current;
    st.w = w; st.h = h; st.nodes = []; st.particles = []; st.cameraY = 0; st.targetCamY = 0; st.score = 0;
    
    const genNode = (y: number, id: number, start = false) => {
      st.nodes.push({
        id, x: start ? w/2 : Math.random() * (w - 140) + 70, y, 
        rad: start ? 35 : Math.random() * 20 + 25, 
        speed: 0.025 + Math.min(id * 0.0005, 0.02),
        dir: Math.random() > 0.5 ? 1 : -1, visited: start, 
        color: ['#00f3ff', '#ff00ff', '#00ffaa'][id % 3], pulse: Math.random() * 10
      });
    };

    const startY = h * 0.75;
    genNode(startY, 0, true); genNode(startY - CFG.SPAWN_Y, 1); genNode(startY - CFG.SPAWN_Y * 2, 2);
    st.player = { x: st.nodes[0].x, y: st.nodes[0].y - st.nodes[0].rad, angle: -Math.PI/2, state: 'ORBITING', vx: 0, vy: 0, nodeId: 0 };
    st.color = st.nodes[0].color;
    st.running = true;
    setScore(0); setUiState('PLAYING');
  }, [CFG.SPAWN_Y]);

  const handleInput = () => {
    const st = engine.current;
    if (!st.running || st.player.state !== 'ORBITING') return;
    const n = st.nodes.find(x => x.id === st.player.nodeId);
    if (!n) return;
    const dx = st.player.x - n.x, dy = st.player.y - n.y;
    const len = Math.hypot(dx, dy);
    let tvx = -dy/len, tvy = dx/len;
    if (n.dir === -1) { tvx = dy/len; tvy = -dx/len; }
    st.player.vx = tvx * CFG.FLY_SPEED; st.player.vy = tvy * CFG.FLY_SPEED;
    st.player.state = 'FLYING';
    explode(st.particles, st.player.x, st.player.y, '#fff', 10, 0.5);
  };

  const loop = useCallback(() => {
    const ctx = canvasRef.current?.getContext('2d');
    const st = engine.current;
    if (!ctx) return;

    if (st.running) {
      if (st.player.state === 'ORBITING') {
        const n = st.nodes.find(x => x.id === st.player.nodeId);
        if (n) {
          st.player.angle += n.speed * n.dir;
          st.player.x = n.x + Math.cos(st.player.angle) * (n.rad + CFG.P_RAD + 4);
          st.player.y = n.y + Math.sin(st.player.angle) * (n.rad + CFG.P_RAD + 4);
        }
      } else {
        st.player.x += st.player.vx; st.player.y += st.player.vy;
        if (Math.random() > 0.4) st.particles.push({ x: st.player.x, y: st.player.y, vx: 0, vy: 0, life: 1, color: st.color, size: 2 });
        
        let snapped = false;
        for (const n of st.nodes) {
          if (n.id === st.player.nodeId) continue;
          if (Math.hypot(st.player.x - n.x, st.player.y - n.y) < n.rad + CFG.P_RAD + CFG.SNAP_DIST) {
            st.player.state = 'ORBITING'; st.player.nodeId = n.id; st.color = n.color; snapped = true;
            explode(st.particles, st.player.x, st.player.y, n.color, 15, 1.5);
            if (!n.visited) {
              n.visited = true; setScore(s => s + 1); st.targetCamY -= CFG.SPAWN_Y;
              st.nodes.push({
                id: n.id + 2, x: Math.random() * (st.w - 140) + 70, y: n.y - CFG.SPAWN_Y * 2, rad: Math.random() * 20 + 25, 
                speed: 0.025 + Math.min((n.id+2) * 0.0005, 0.02), dir: Math.random() > 0.5 ? 1 : -1, visited: false, 
                color: ['#00f3ff', '#ff00ff', '#00ffaa'][(n.id+2) % 3], pulse: 0
              });
            }
            break;
          }
        }
        if (!snapped && (st.player.x < 0 || st.player.x > st.w || st.player.y - st.cameraY > st.h || st.player.y - st.cameraY < -300)) {
          st.running = false; explode(st.particles, st.player.x, st.player.y, '#ff0044', 40, 2); setUiState('GAME_OVER');
        }
      }
      st.cameraY += (st.targetCamY - st.cameraY) * 0.1;
      st.nodes = st.nodes.filter(n => (n.y - st.cameraY) < st.h + 100);
    }

    ctx.clearRect(0, 0, st.w, st.h);
    const grad = ctx.createLinearGradient(0, 0, 0, st.h);
    grad.addColorStop(0, '#020617'); grad.addColorStop(1, '#0a001a');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, st.w, st.h);

    ctx.save(); ctx.translate(0, -st.cameraY);
    st.nodes.forEach(n => {
      n.pulse += 0.05;
      ctx.beginPath(); ctx.arc(n.x, n.y, n.rad, 0, Math.PI*2); ctx.fillStyle = '#050510'; ctx.fill();
      ctx.lineWidth = 3; ctx.strokeStyle = n.visited ? '#333' : n.color; 
      ctx.shadowBlur = n.visited ? 0 : 15 + Math.sin(n.pulse)*3; ctx.shadowColor = n.color; ctx.stroke(); ctx.shadowBlur = 0;
      
      if (!n.visited && n.id === st.player.nodeId + 1) { // Target Ring
        ctx.beginPath(); ctx.arc(n.x, n.y, n.rad + CFG.SNAP_DIST, 0, Math.PI*2);
        ctx.strokeStyle = n.color; ctx.globalAlpha = 0.3; ctx.setLineDash([4, 4]); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1;
      }
    });

    drawParticles(ctx, st.particles);

    if (st.running) {
      ctx.beginPath(); ctx.arc(st.player.x, st.player.y, CFG.P_RAD, 0, Math.PI*2);
      ctx.fillStyle = '#fff'; ctx.shadowBlur = 15; ctx.shadowColor = st.color; ctx.fill(); ctx.shadowBlur = 0;
      
      if (st.player.state === 'ORBITING') {
        const n = st.nodes.find(x => x.id === st.player.nodeId);
        if (n) {
          const dx = st.player.x - n.x, dy = st.player.y - n.y;
          const len = Math.hypot(dx, dy);
          let tvx = -dy/len, tvy = dx/len;
          if (n.dir === -1) { tvx = dy/len; tvy = -dx/len; }
          ctx.beginPath(); ctx.moveTo(st.player.x, st.player.y); ctx.lineTo(st.player.x + tvx*300, st.player.y + tvy*300);
          ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.setLineDash([5, 10]); ctx.stroke(); ctx.setLineDash([]);
        }
      }
    }
    ctx.restore();

    reqRef.current = requestAnimationFrame(loop);
  }, [CFG]);

  useEffect(() => {
    const cvs = canvasRef.current;
    if (cvs) {
      cvs.width = window.innerWidth; cvs.height = window.innerHeight;
      init(window.innerWidth, window.innerHeight);
      reqRef.current = requestAnimationFrame(loop);
    }
    return () => cancelAnimationFrame(reqRef.current!);
  }, [init, loop]);

  return (
    <div className="absolute inset-0 z-10" onPointerDown={handleInput}>
      <canvas ref={canvasRef} className="block w-full h-full touch-none" />
      <div className="absolute top-6 left-6 right-6 flex justify-between pointer-events-none">
        <Button variant="ghost" className="text-white/50 pointer-events-auto" onClick={onExit}><ChevronLeft /> Back</Button>
        <div className="text-right text-4xl font-black text-white">{score} LY</div>
      </div>
      {uiState === 'GAME_OVER' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md">
          <h2 className="text-3xl font-black text-white mb-6">LOST IN SPACE</h2>
          <div className="text-7xl font-black text-cyan-400 mb-8">{score}</div>
          <Button className="w-64 py-6 bg-white text-black font-black text-lg" onClick={() => init(engine.current.w, engine.current.h)}><RotateCcw className="mr-2" /> REBOOT</Button>
        </div>
      )}
    </div>
  );
};

// ==========================================
// GAME 2: NEON DRIFT (Relative Dodging)
// ==========================================
const GameDrift = ({ onExit }: { onExit: () => void }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reqRef = useRef<number>();
  const [uiState, setUiState] = useState<'PLAYING' | 'GAME_OVER'>('PLAYING');
  const [score, setScore] = useState(0);

  const engine = useRef({
    w: 0, h: 0, running: true, score: 0, frames: 0,
    player: { x: 0, y: 0, baseR: 12 },
    input: { isDown: false, startX: 0, pStartX: 0 },
    asteroids: [] as any[], particles: [] as Particle[]
  });

  const init = useCallback((w: number, h: number) => {
    const st = engine.current;
    st.w = w; st.h = h; st.running = true; st.score = 0; st.frames = 0;
    st.player = { x: w/2, y: h - 120, baseR: 12 };
    st.asteroids = []; st.particles = [];
    setScore(0); setUiState('PLAYING');
  }, []);

  const loop = useCallback(() => {
    const ctx = canvasRef.current?.getContext('2d');
    const st = engine.current;
    if (!ctx) return;

    if (st.running) {
      st.frames++;
      if (st.frames % 10 === 0) st.score += 1; setScore(st.score);
      
      const difficulty = Math.min(st.frames / 1000, 3);
      if (st.frames % Math.max(20 - Math.floor(difficulty * 5), 8) === 0) {
        st.asteroids.push({
          x: Math.random() * st.w, y: -50,
          vy: Math.random() * 4 + 4 + difficulty,
          r: Math.random() * 20 + 15,
          color: Math.random() > 0.8 ? '#ff0055' : '#444' // Red ones are faster later
        });
      }

      st.asteroids.forEach((a, i) => {
        a.y += a.vy;
        if (Math.hypot(st.player.x - a.x, st.player.y - a.y) < st.player.baseR + a.r - 4) {
          st.running = false; explode(st.particles, st.player.x, st.player.y, '#00f3ff', 50, 2); setUiState('GAME_OVER');
        }
        if (a.y > st.h + 50) st.asteroids.splice(i, 1);
      });
      
      // Engine exhaust
      if (Math.random() > 0.2) st.particles.push({ x: st.player.x + (Math.random()-0.5)*10, y: st.player.y + 10, vx: 0, vy: Math.random()*2+2, life: 1, color: '#00f3ff', size: 3 });
    }

    ctx.clearRect(0, 0, st.w, st.h);
    const grad = ctx.createLinearGradient(0, 0, 0, st.h);
    grad.addColorStop(0, '#000000'); grad.addColorStop(1, '#001122');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, st.w, st.h);

    st.asteroids.forEach(a => {
      ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, Math.PI*2);
      ctx.fillStyle = a.color; ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.globalAlpha = 0.1; ctx.lineWidth = 2; ctx.stroke(); ctx.globalAlpha = 1;
    });

    drawParticles(ctx, st.particles);

    if (st.running) {
      ctx.beginPath(); ctx.moveTo(st.player.x, st.player.y - 15); ctx.lineTo(st.player.x + 12, st.player.y + 10); ctx.lineTo(st.player.x - 12, st.player.y + 10);
      ctx.fillStyle = '#00f3ff'; ctx.shadowBlur = 20; ctx.shadowColor = '#00f3ff'; ctx.fill(); ctx.shadowBlur = 0;
    }

    reqRef.current = requestAnimationFrame(loop);
  }, []);

  useEffect(() => {
    const cvs = canvasRef.current;
    if (cvs) {
      cvs.width = window.innerWidth; cvs.height = window.innerHeight;
      init(window.innerWidth, window.innerHeight);
      reqRef.current = requestAnimationFrame(loop);
    }
    return () => cancelAnimationFrame(reqRef.current!);
  }, [init, loop]);

  const onPointerDown = (e: React.PointerEvent) => {
    engine.current.input.isDown = true;
    engine.current.input.startX = e.clientX;
    engine.current.input.pStartX = engine.current.player.x;
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const st = engine.current;
    if (st.input.isDown && st.running) {
      const delta = e.clientX - st.input.startX;
      // 1.5x sensitivity multiplier for mobile comfort
      st.player.x = Math.max(15, Math.min(st.w - 15, st.input.pStartX + delta * 1.5)); 
    }
  };
  const onPointerUp = () => { engine.current.input.isDown = false; };

  return (
    <div className="absolute inset-0 z-10" onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}>
      <canvas ref={canvasRef} className="block w-full h-full touch-none" />
      <div className="absolute top-6 left-6 right-6 flex justify-between pointer-events-none">
        <Button variant="ghost" className="text-white/50 pointer-events-auto" onClick={onExit}><ChevronLeft /> Back</Button>
        <div className="text-right text-4xl font-black text-white">{Math.floor(score/10)}M</div>
      </div>
      {uiState === 'GAME_OVER' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md">
          <h2 className="text-3xl font-black text-white mb-6">HULL BREACH</h2>
          <div className="text-7xl font-black text-cyan-400 mb-8">{Math.floor(score/10)}M</div>
          <Button className="w-64 py-6 bg-white text-black font-black text-lg pointer-events-auto" onClick={() => init(engine.current.w, engine.current.h)}><RotateCcw className="mr-2" /> REBOOT</Button>
        </div>
      )}
    </div>
  );
};

// ==========================================
// GAME 3: SYNC DEFENDER (Radial Shield)
// ==========================================
const GameDefend = ({ onExit }: { onExit: () => void }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reqRef = useRef<number>();
  const [uiState, setUiState] = useState<'PLAYING' | 'GAME_OVER'>('PLAYING');
  const [score, setScore] = useState(0);

  const engine = useRef({
    w: 0, h: 0, cx: 0, cy: 0, running: true,
    shieldAngle: 0, shieldDir: 1, shieldRadius: 60,
    enemies: [] as any[], particles: [] as Particle[]
  });

  const init = useCallback((w: number, h: number) => {
    const st = engine.current;
    st.w = w; st.h = h; st.cx = w/2; st.cy = h/2; st.running = true;
    st.enemies = []; st.particles = []; st.shieldAngle = 0; st.shieldDir = 1;
    setScore(0); setUiState('PLAYING');
  }, []);

  const spawnEnemy = useCallback(() => {
    const st = engine.current;
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.max(st.w, st.h) / 2 + 50;
    st.enemies.push({
      x: st.cx + Math.cos(angle) * dist, y: st.cy + Math.sin(angle) * dist,
      vx: -Math.cos(angle) * 3, vy: -Math.sin(angle) * 3,
      angle: angle // for drawing trail
    });
  }, []);

  const loop = useCallback(() => {
    const ctx = canvasRef.current?.getContext('2d');
    const st = engine.current;
    if (!ctx) return;

    if (st.running) {
      st.shieldAngle += 0.08 * st.shieldDir;
      if (Math.random() < 0.02 + (score * 0.001)) spawnEnemy();

      const sx1 = st.cx + Math.cos(st.shieldAngle) * st.shieldRadius;
      const sy1 = st.cy + Math.sin(st.shieldAngle) * st.shieldRadius;
      const sx2 = st.cx + Math.cos(st.shieldAngle + Math.PI) * st.shieldRadius;
      const sy2 = st.cy + Math.sin(st.shieldAngle + Math.PI) * st.shieldRadius;

      st.enemies.forEach((e, i) => {
        e.x += e.vx; e.y += e.vy;
        
        // Hit Core
        if (Math.hypot(e.x - st.cx, e.y - st.cy) < 20) {
          st.running = false; explode(st.particles, st.cx, st.cy, '#fff', 60, 3); setUiState('GAME_OVER');
        }
        
        // Hit Shield Nodes
        if (Math.hypot(e.x - sx1, e.y - sy1) < 25 || Math.hypot(e.x - sx2, e.y - sy2) < 25) {
          st.enemies.splice(i, 1); setScore(s => s + 1);
          explode(st.particles, e.x, e.y, '#ff00ff', 15, 1.5);
        }
      });
    }

    ctx.clearRect(0, 0, st.w, st.h);
    const grad = ctx.createLinearGradient(0, 0, 0, st.h);
    grad.addColorStop(0, '#1a001a'); grad.addColorStop(1, '#050005');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, st.w, st.h);

    if (st.running) {
      // Core
      ctx.beginPath(); ctx.arc(st.cx, st.cy, 20, 0, Math.PI*2); ctx.fillStyle = '#fff'; ctx.shadowBlur = 20; ctx.shadowColor = '#fff'; ctx.fill(); ctx.shadowBlur = 0;
      
      // Shield Ring Line
      ctx.beginPath(); ctx.arc(st.cx, st.cy, st.shieldRadius, 0, Math.PI*2); ctx.strokeStyle = 'rgba(255,0,255,0.1)'; ctx.lineWidth = 2; ctx.stroke();

      // Shield Nodes
      const sPos = [
        { x: st.cx + Math.cos(st.shieldAngle) * st.shieldRadius, y: st.cy + Math.sin(st.shieldAngle) * st.shieldRadius },
        { x: st.cx + Math.cos(st.shieldAngle + Math.PI) * st.shieldRadius, y: st.cy + Math.sin(st.shieldAngle + Math.PI) * st.shieldRadius }
      ];
      sPos.forEach(p => {
        ctx.beginPath(); ctx.arc(p.x, p.y, 12, 0, Math.PI*2); ctx.fillStyle = '#ff00ff'; ctx.shadowBlur = 15; ctx.shadowColor = '#ff00ff'; ctx.fill(); ctx.shadowBlur = 0;
      });
    }

    st.enemies.forEach(e => {
      ctx.beginPath(); ctx.arc(e.x, e.y, 8, 0, Math.PI*2); ctx.fillStyle = '#ff3333'; ctx.fill();
    });

    drawParticles(ctx, st.particles);
    reqRef.current = requestAnimationFrame(loop);
  }, [score, spawnEnemy]);

  useEffect(() => {
    const cvs = canvasRef.current;
    if (cvs) {
      cvs.width = window.innerWidth; cvs.height = window.innerHeight;
      init(window.innerWidth, window.innerHeight);
      reqRef.current = requestAnimationFrame(loop);
    }
    return () => cancelAnimationFrame(reqRef.current!);
  }, [init, loop]);

  return (
    <div className="absolute inset-0 z-10" onPointerDown={() => { engine.current.shieldDir *= -1; }}>
      <canvas ref={canvasRef} className="block w-full h-full touch-none" />
      <div className="absolute top-6 left-6 right-6 flex justify-between pointer-events-none">
        <Button variant="ghost" className="text-white/50 pointer-events-auto" onClick={onExit}><ChevronLeft /> Back</Button>
        <div className="text-right text-4xl font-black text-white">{score}</div>
      </div>
      {uiState === 'GAME_OVER' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md">
          <h2 className="text-3xl font-black text-white mb-6">SYNC BROKEN</h2>
          <div className="text-7xl font-black text-magenta-400 mb-8">{score}</div>
          <Button className="w-64 py-6 bg-white text-black font-black text-lg pointer-events-auto" onClick={() => init(engine.current.w, engine.current.h)}><RotateCcw className="mr-2" /> REBOOT</Button>
        </div>
      )}
    </div>
  );
};

// ==========================================
// MAIN SHELL
// ==========================================
const CosmicArcade = () => {
  const [activeGame, setActiveGame] = useState<'MENU' | 'JOURNEY' | 'DRIFT' | 'DEFEND'>('MENU');

  if (activeGame === 'JOURNEY') return <GameJourney onExit={() => setActiveGame('MENU')} />;
  if (activeGame === 'DRIFT') return <GameDrift onExit={() => setActiveGame('MENU')} />;
  if (activeGame === 'DEFEND') return <GameDefend onExit={() => setActiveGame('MENU')} />;

  return (
    <div className="relative w-full h-[100dvh] bg-[#020617] text-white flex flex-col items-center justify-center overflow-hidden">
      {/* Background Decor */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-[#020617] to-[#020617]"></div>
      
      <div className="z-10 text-center w-full max-w-md px-6">
        <h1 className="text-5xl font-black tracking-tighter mb-2">NEON<span className="text-cyan-400">ARCADE</span></h1>
        <p className="text-slate-400 text-sm uppercase tracking-widest mb-12">Select Simulation</p>

        <div className="space-y-4">
          <Button 
            onClick={() => setActiveGame('JOURNEY')}
            className="w-full py-8 bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-500/30 rounded-2xl justify-start px-6 transition-all"
          >
            <Compass className="w-8 h-8 text-cyan-400 mr-4" />
            <div className="text-left">
              <div className="text-lg font-bold text-white tracking-wider">JOURNEY HOME</div>
              <div className="text-xs text-cyan-400/70 uppercase">Orbital Target Leap</div>
            </div>
          </Button>

          <Button 
            onClick={() => setActiveGame('DRIFT')}
            className="w-full py-8 bg-blue-950/40 hover:bg-blue-900/60 border border-blue-500/30 rounded-2xl justify-start px-6 transition-all"
          >
            <Crosshair className="w-8 h-8 text-blue-400 mr-4" />
            <div className="text-left">
              <div className="text-lg font-bold text-white tracking-wider">NEON DRIFT</div>
              <div className="text-xs text-blue-400/70 uppercase">Swipe Evasion</div>
            </div>
          </Button>

          <Button 
            onClick={() => setActiveGame('DEFEND')}
            className="w-full py-8 bg-fuchsia-950/40 hover:bg-fuchsia-900/60 border border-fuchsia-500/30 rounded-2xl justify-start px-6 transition-all"
          >
            <Shield className="w-8 h-8 text-fuchsia-400 mr-4" />
            <div className="text-left">
              <div className="text-lg font-bold text-white tracking-wider">SYNC DEFENDER</div>
              <div className="text-xs text-fuchsia-400/70 uppercase">Radial Core Protect</div>
            </div>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CosmicArcade;