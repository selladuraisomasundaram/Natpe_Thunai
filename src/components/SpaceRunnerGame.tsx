"use client";

import React, { useRef, useEffect, useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const GAME_WIDTH = 300;
const GAME_HEIGHT = 150;
const GROUND_Y = GAME_HEIGHT - 20;
const JUMP_VELOCITY = -8;
const GRAVITY = 0.4;
const OBSTACLE_SPEED = 3;
const OBSTACLE_WIDTH = 10;
const OBSTACLE_HEIGHT = 20;
const ASTRO_SIZE = 20;

const SpaceRunnerGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(true);
  const [isGameRunning, setIsGameRunning] = useState(false);

  const gameRef = useRef({
    astroY: GROUND_Y - ASTRO_SIZE,
    velocityY: 0,
    isJumping: false,
    obstacles: [] as { x: number; y: number }[],
    score: 0,
    lastObstacleTime: 0,
    gameLoopId: 0,
  });

  // Load high score from local storage on mount
  useEffect(() => {
    const savedHighScore = localStorage.getItem('spaceRunnerHighScore');
    if (savedHighScore) {
      setHighScore(parseInt(savedHighScore, 10));
    }
  }, []);

  const saveHighScore = useCallback((newScore: number) => {
    const currentHighScore = parseInt(localStorage.getItem('spaceRunnerHighScore') || '0', 10);
    if (newScore > currentHighScore) {
      localStorage.setItem('spaceRunnerHighScore', newScore.toString());
      setHighScore(newScore);
    }
  }, []);

  const startGame = useCallback(() => {
    if (gameRef.current.gameLoopId) {
      cancelAnimationFrame(gameRef.current.gameLoopId);
    }
    
    gameRef.current = {
      astroY: GROUND_Y - ASTRO_SIZE,
      velocityY: 0,
      isJumping: false,
      obstacles: [],
      score: 0,
      lastObstacleTime: Date.now(),
      gameLoopId: 0,
    };
    setScore(0);
    setIsGameOver(false);
    setIsGameRunning(true);
  }, []);

  const jump = useCallback(() => {
    if (!gameRef.current.isJumping && isGameRunning) {
      gameRef.current.isJumping = true;
      gameRef.current.velocityY = JUMP_VELOCITY;
    }
  }, [isGameRunning]);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        if (isGameOver) {
          startGame();
        } else {
          jump();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isGameOver, startGame, jump]);

  // Game Loop
  useEffect(() => {
    if (!isGameRunning) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const updateGame = () => {
      const { current } = gameRef;

      // 1. Update Astronaut position (Gravity and Jump)
      if (current.isJumping) {
        current.astroY += current.velocityY;
        current.velocityY += GRAVITY;

        if (current.astroY >= GROUND_Y - ASTRO_SIZE) {
          current.astroY = GROUND_Y - ASTRO_SIZE;
          current.isJumping = false;
          current.velocityY = 0;
        }
      }

      // 2. Update Obstacles
      current.obstacles = current.obstacles
        .map(o => ({ ...o, x: o.x - OBSTACLE_SPEED }))
        .filter(o => o.x > -OBSTACLE_WIDTH);

      // 3. Spawn new obstacle
      const now = Date.now();
      if (now - current.lastObstacleTime > 1500 + Math.random() * 1000) {
        current.obstacles.push({ x: GAME_WIDTH, y: GROUND_Y - OBSTACLE_HEIGHT });
        current.lastObstacleTime = now;
      }

      // 4. Check for Collision
      const astroX = 50;
      const astroY = current.astroY;
      const astroBottom = astroY + ASTRO_SIZE;
      const astroRight = astroX + ASTRO_SIZE;

      for (const obstacle of current.obstacles) {
        const obsRight = obstacle.x + OBSTACLE_WIDTH;
        const obsBottom = obstacle.y + OBSTACLE_HEIGHT;

        // Simple AABB collision detection
        if (
          astroRight > obstacle.x &&
          astroX < obsRight &&
          astroBottom > obstacle.y
        ) {
          // Collision detected! Game Over.
          setIsGameRunning(false);
          setIsGameOver(true);
          saveHighScore(current.score);
          return;
        }
      }

      // 5. Update Score
      current.score += 1;
      setScore(current.score);

      // 6. Draw everything
      ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

      // Draw Ground
      ctx.fillStyle = '#222';
      ctx.fillRect(0, GROUND_Y, GAME_WIDTH, 2);

      // Draw Astronaut (Blue square)
      ctx.fillStyle = '#1e40af'; // Primary Blue
      ctx.fillRect(astroX, astroY, ASTRO_SIZE, ASTRO_SIZE);

      // Draw Obstacles (Neon Green squares)
      ctx.fillStyle = '#74e874'; // Secondary Neon
      current.obstacles.forEach(o => {
        ctx.fillRect(o.x, o.y, OBSTACLE_WIDTH, OBSTACLE_HEIGHT);
      });

      animationFrameId = requestAnimationFrame(updateGame);
      current.gameLoopId = animationFrameId;
    };

    animationFrameId = requestAnimationFrame(updateGame);
    gameRef.current.gameLoopId = animationFrameId;

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isGameRunning, saveHighScore]);

  return (
    <div className="flex flex-col items-center space-y-4 p-4 bg-background rounded-lg border border-border shadow-xl">
      <div className="flex justify-between w-full text-sm font-mono text-foreground">
        <span>Score: {score}</span>
        <span>High Score: {highScore}</span>
      </div>
      <div 
        className={cn(
          "relative border-2 border-border bg-gray-50 dark:bg-gray-900",
          isGameOver && "opacity-70"
        )}
        style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}
      >
        <canvas
          ref={canvasRef}
          width={GAME_WIDTH}
          height={GAME_HEIGHT}
          className="block"
        />
        {(isGameOver || !isGameRunning) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm">
            <p className="text-xl font-bold text-secondary-neon mb-2">
              {isGameOver && isGameRunning === false ? 'GAME OVER' : 'SPACE RUNNER'}
            </p>
            <p className="text-sm text-primary-foreground mb-4">
              Press SPACE or click to {isGameOver ? 'Restart' : 'Start'}
            </p>
            <Button 
              onClick={startGame} 
              className="bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90"
            >
              {isGameOver ? 'Restart Game' : 'Start Game'}
            </Button>
          </div>
        )}
      </div>
      <p className="text-xs text-muted-foreground">Use SPACE or ↑ to jump.</p>
    </div>
  );
};

export default SpaceRunnerGame;