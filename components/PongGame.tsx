import React, { useEffect, useRef, useState } from 'react';
import { Aura, PlayerState, PlayerControls } from '../types';
import { 
  GAME_WIDTH, GAME_HEIGHT, PADDLE_WIDTH, BASE_PADDLE_HEIGHT, 
  BALL_SIZE, BASE_PADDLE_SPEED, BASE_BALL_SPEED, DAMAGE_PER_HIT, MAX_HP
} from '../constants';
import { Zap } from 'lucide-react';
import { playHitSound, playAbilitySound } from '../services/audioService';

interface PongGameProps {
  p1Data: PlayerState;
  p2Data: PlayerState;
  p1Controls: PlayerControls;
  p2Controls: PlayerControls;
  onGameEnd: (winnerId: 1 | 2) => void;
}

// Particle system helper
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}

const PongGame: React.FC<PongGameProps> = ({ p1Data, p2Data, p1Controls, p2Controls, onGameEnd }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Mutable Game State
  const gameState = useRef({
    p1: { 
      y: GAME_HEIGHT / 2 - BASE_PADDLE_HEIGHT / 2, 
      hp: MAX_HP, 
      cooldown: 0,
      abilityActiveUntil: 0,
      ...p1Data
    },
    p2: { 
      y: GAME_HEIGHT / 2 - BASE_PADDLE_HEIGHT / 2, 
      hp: MAX_HP, 
      cooldown: 0,
      abilityActiveUntil: 0,
      ...p2Data
    },
    ball: { 
      x: GAME_WIDTH / 2, 
      y: GAME_HEIGHT / 2, 
      dx: BASE_BALL_SPEED, 
      dy: BASE_BALL_SPEED * (Math.random() > 0.5 ? 1 : -1),
      speedMultiplier: 1,
      frozen: false,
      frozenTimer: 0,
      trail: [] as {x: number, y: number}[]
    },
    particles: [] as Particle[],
    keys: {} as Record<string, boolean>,
    lastTime: 0,
    shake: 0
  });

  // UI State
  const [hudState, setHudState] = useState({
    p1Hp: MAX_HP,
    p2Hp: MAX_HP,
    p1Cooldown: 0,
    p2Cooldown: 0,
    p1AbilityActive: false,
    p2AbilityActive: false
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { gameState.current.keys[e.code] = true; };
    const handleKeyUp = (e: KeyboardEvent) => { gameState.current.keys[e.code] = false; };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const spawnParticles = (x: number, y: number, color: string, count: number, speed = 8) => {
      for (let i = 0; i < count; i++) {
        gameState.current.particles.push({
          x, y,
          vx: (Math.random() - 0.5) * speed,
          vy: (Math.random() - 0.5) * speed,
          life: 1.0,
          color,
          size: Math.random() * 4 + 2
        });
      }
    };

    const resetBall = (direction: 1 | -1) => {
      const state = gameState.current;
      state.ball.x = GAME_WIDTH / 2;
      state.ball.y = GAME_HEIGHT / 2;
      state.ball.dx = BASE_BALL_SPEED * direction;
      state.ball.dy = BASE_BALL_SPEED * (Math.random() * 2 - 1);
      state.ball.speedMultiplier = 1;
      state.ball.frozen = false;
      state.ball.trail = [];
      state.shake = 15;
    };

    const activateAbility = (player: 'p1' | 'p2', now: number) => {
      const state = gameState.current;
      const p = state[player];
      if (!p.aura) return;

      if (now > p.cooldown) {
        playAbilitySound();
        p.abilityActiveUntil = now + p.aura.ability.duration;
        p.cooldown = now + p.aura.ability.cooldown;
      }
    };

    const update = (timestamp: number) => {
      const state = gameState.current;
      const dt = timestamp - state.lastTime;
      state.lastTime = timestamp;

      // --- INPUTS ---
      // P1
      const p1Speed = BASE_PADDLE_SPEED * (state.p1.aura?.stats.paddleSpeedScale || 1);
      if (state.keys[p1Controls.up]) state.p1.y = Math.max(0, state.p1.y - p1Speed);
      if (state.keys[p1Controls.down]) state.p1.y = Math.min(GAME_HEIGHT - (BASE_PADDLE_HEIGHT * (state.p1.aura?.stats.paddleHeightScale || 1)), state.p1.y + p1Speed);
      if (state.keys[p1Controls.action]) activateAbility('p1', timestamp);

      // P2
      const p2Speed = BASE_PADDLE_SPEED * (state.p2.aura?.stats.paddleSpeedScale || 1);
      if (state.keys[p2Controls.up]) state.p2.y = Math.max(0, state.p2.y - p2Speed);
      if (state.keys[p2Controls.down]) state.p2.y = Math.min(GAME_HEIGHT - (BASE_PADDLE_HEIGHT * (state.p2.aura?.stats.paddleHeightScale || 1)), state.p2.y + p2Speed);
      if (state.keys[p2Controls.action]) activateAbility('p2', timestamp);

      // --- ABILITIES & PHYSICS ---
      const p1Active = timestamp < state.p1.abilityActiveUntil;
      const p2Active = timestamp < state.p2.abilityActiveUntil;
      
      const inP1Zone = state.ball.x < GAME_WIDTH / 2;
      // Ability adheres to the paddle that hit it last or active on current side? 
      // Standard Pong physics usually implies the last hitter imparts the spin.
      // But for visual clarity, let's say: if the ball is in your zone AND your ability is active, the BALL reacts.
      
      const activeAura = inP1Zone ? state.p1.aura : state.p2.aura;
      const isAbilityActive = inP1Zone ? p1Active : p2Active;

      // Handle Frozen Ball (Stop and Go)
      if (state.ball.frozen) {
          if (timestamp > state.ball.frozenTimer) {
              state.ball.frozen = false;
              state.ball.speedMultiplier *= 1.5; // Launch
          } else {
              // jitter
              state.ball.x += (Math.random() - 0.5) * 2;
              state.ball.y += (Math.random() - 0.5) * 2;
              draw(ctx, state, 0, 0, inP1Zone, activeAura, isAbilityActive, timestamp); // force draw updates
              if (state.p1.hp > 0 && state.p2.hp > 0) requestAnimationFrame(update);
              return; 
          }
      }

      let speedMod = 1.0;
      let curveY = 0;
      let wobbleY = 0;
      let zigzagY = 0;
      
      if (isAbilityActive && activeAura) {
         if (activeAura.ability.type === 'SPEED_BOOST') speedMod = 1.8;
         if (activeAura.ability.type === 'CURVE_SHOT') curveY = inP1Zone ? 0.35 : -0.35;
         if (activeAura.ability.type === 'WOBBLE_SHOT') wobbleY = Math.sin(timestamp / 50) * 8;
         if (activeAura.ability.type === 'ZIGZAG_SHOT') {
             if (Math.floor(timestamp / 200) % 2 === 0) zigzagY = 5; else zigzagY = -5;
         }
      }

      state.ball.x += state.ball.dx * state.ball.speedMultiplier * speedMod;
      state.ball.y += (state.ball.dy + curveY + zigzagY) * state.ball.speedMultiplier * speedMod;
      
      // Apply pure wobble to visual Y without affecting physics trajectory persistently
      const visualBallY = state.ball.y + wobbleY;

      // Store trail
      if (Math.random() > 0.5 && isAbilityActive) {
          state.ball.trail.push({x: state.ball.x, y: visualBallY});
          if (state.ball.trail.length > 20) state.ball.trail.shift();
      } else if (!isAbilityActive) {
          state.ball.trail = [];
      }

      // Walls
      if (state.ball.y <= 0 || state.ball.y >= GAME_HEIGHT) {
        state.ball.dy *= -1;
      }

      // Collisions
      const p1HScale = state.p1.aura?.stats.paddleHeightScale || 1;
      const p2HScale = state.p2.aura?.stats.paddleHeightScale || 1;

      // Dynamic height adjustments based on Ability
      let p1H = BASE_PADDLE_HEIGHT * p1HScale;
      let p2H = BASE_PADDLE_HEIGHT * p2HScale;

      if (p1Active) {
          if (state.p1.aura?.ability.type === 'ENLARGE_PADDLE') p1H *= 1.5;
          if (state.p1.aura?.ability.type === 'SHRINK_PADDLE') p1H *= 0.5;
      }
      if (p2Active) {
          if (state.p2.aura?.ability.type === 'ENLARGE_PADDLE') p2H *= 1.5;
          if (state.p2.aura?.ability.type === 'SHRINK_PADDLE') p2H *= 0.5;
      }

      // P1 Hit
      if (
        state.ball.x <= PADDLE_WIDTH &&
        state.ball.x >= 0 &&
        visualBallY >= state.p1.y &&
        visualBallY <= state.p1.y + p1H
      ) {
        state.ball.dx = Math.abs(state.ball.dx);
        state.ball.speedMultiplier += 0.05;
        state.ball.x = PADDLE_WIDTH + 1;
        const hitPoint = visualBallY - (state.p1.y + p1H / 2);
        state.ball.dy = hitPoint * 0.15;
        
        if (state.p1.aura) playHitSound(state.p1.aura.tier);
        spawnParticles(state.ball.x, visualBallY, state.p1.aura?.hex || '#fff', 15);

        // Apply hit effects
        if (p1Active && state.p1.aura?.ability.type === 'STOP_AND_GO') {
            state.ball.frozen = true;
            state.ball.frozenTimer = timestamp + 500; // Freeze 0.5s
        }
      }

      // P2 Hit
      if (
        state.ball.x >= GAME_WIDTH - PADDLE_WIDTH &&
        state.ball.x <= GAME_WIDTH &&
        visualBallY >= state.p2.y &&
        visualBallY <= state.p2.y + p2H
      ) {
        state.ball.dx = -Math.abs(state.ball.dx);
        state.ball.speedMultiplier += 0.05;
        state.ball.x = GAME_WIDTH - PADDLE_WIDTH - 1;
        const hitPoint = visualBallY - (state.p2.y + p2H / 2);
        state.ball.dy = hitPoint * 0.15;

        if (state.p2.aura) playHitSound(state.p2.aura.tier);
        spawnParticles(state.ball.x, visualBallY, state.p2.aura?.hex || '#fff', 15);

         // Apply hit effects
         if (p2Active && state.p2.aura?.ability.type === 'STOP_AND_GO') {
            state.ball.frozen = true;
            state.ball.frozenTimer = timestamp + 500;
        }
      }

      // Scoring
      if (state.ball.x < 0) {
        state.p1.hp -= DAMAGE_PER_HIT;
        resetBall(1);
        if (state.p1.hp <= 0) onGameEnd(2);
      } else if (state.ball.x > GAME_WIDTH) {
        state.p2.hp -= DAMAGE_PER_HIT;
        resetBall(-1);
        if (state.p2.hp <= 0) onGameEnd(1);
      }

      // Particles Update
      for (let i = state.particles.length - 1; i >= 0; i--) {
        const p = state.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.03;
        if (p.life <= 0) state.particles.splice(i, 1);
      }

      // UI Sync
      if (Math.random() < 0.1) {
        setHudState({
          p1Hp: state.p1.hp,
          p2Hp: state.p2.hp,
          p1Cooldown: Math.max(0, state.p1.cooldown - timestamp),
          p2Cooldown: Math.max(0, state.p2.cooldown - timestamp),
          p1AbilityActive: p1Active,
          p2AbilityActive: p2Active
        });
      }

      draw(ctx, state, p1H, p2H, inP1Zone, activeAura, isAbilityActive, timestamp);

      if (state.p1.hp > 0 && state.p2.hp > 0) {
        animationFrameId = requestAnimationFrame(update);
      }
    };

    const draw = (
      c: CanvasRenderingContext2D, 
      state: any, 
      p1H: number, 
      p2H: number,
      inP1Zone: boolean,
      activeAura: Aura | null,
      isAbilityActive: boolean,
      time: number
    ) => {
      c.fillStyle = '#0f172a';
      c.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

      // --- ARENA FLOOR EFFECTS ---
      const drawZoneEffect = (x: number, w: number, aura: Aura, isActive: boolean) => {
          if (isActive) {
              // Active Floor Pattern
              c.save();
              c.globalCompositeOperation = 'lighter';
              c.fillStyle = aura.hex;
              c.globalAlpha = 0.15;
              c.fillRect(x, 0, w, GAME_HEIGHT);
              
              // Animated Stripes
              c.strokeStyle = aura.hex;
              c.lineWidth = 2;
              c.globalAlpha = 0.3;
              c.beginPath();
              const offset = (time / 10) % 50;
              for (let i = -50; i < GAME_HEIGHT + 50; i += 50) {
                  c.moveTo(x, i + offset);
                  c.lineTo(x + w, i + offset - 50);
              }
              c.stroke();
              c.restore();
          } else {
              // Passive Glow
              const grd = c.createLinearGradient(x + (w === GAME_WIDTH/2 ? w : 0), 0, x + (w === GAME_WIDTH/2 ? 0 : w), 0);
              grd.addColorStop(0, aura.hex + '22');
              grd.addColorStop(1, 'transparent');
              c.fillStyle = grd;
              c.fillRect(x, 0, w, GAME_HEIGHT);
          }
      };

      if (state.p1.aura) drawZoneEffect(0, GAME_WIDTH / 2, state.p1.aura, state.p1.abilityActiveUntil > time);
      if (state.p2.aura) drawZoneEffect(GAME_WIDTH / 2, GAME_WIDTH / 2, state.p2.aura, state.p2.abilityActiveUntil > time);

      // Center Line
      c.strokeStyle = '#334155';
      c.setLineDash([10, 10]);
      c.beginPath();
      c.moveTo(GAME_WIDTH / 2, 0);
      c.lineTo(GAME_WIDTH / 2, GAME_HEIGHT);
      c.stroke();
      c.setLineDash([]);

      // Shake
      if (state.shake > 0) {
        c.save();
        c.translate((Math.random() - 0.5) * state.shake, (Math.random() - 0.5) * state.shake);
        state.shake *= 0.9;
      }

      // Ball Trails
      if (state.ball.trail.length > 0) {
          c.save();
          state.ball.trail.forEach((pos: any, i: number) => {
             const ratio = i / state.ball.trail.length;
             c.beginPath();
             c.arc(pos.x, pos.y, BALL_SIZE * ratio, 0, Math.PI * 2);
             c.fillStyle = activeAura?.hex || '#fff';
             c.globalAlpha = ratio * 0.5;
             c.fill();
          });
          c.restore();
      }

      // Particles
      state.particles.forEach((p: Particle) => {
        c.globalAlpha = p.life;
        c.fillStyle = p.color;
        c.beginPath();
        c.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        c.fill();
        c.globalAlpha = 1.0;
      });

      // --- PADDLES ---
      const drawPaddle = (x: number, y: number, h: number, aura: Aura | null, isActive: boolean) => {
        c.save();
        
        // Base Paddle
        c.fillStyle = aura?.hex || '#fff';
        c.fillRect(x, y, PADDLE_WIDTH, h);

        // Active Shield Effect
        if (isActive && aura) {
            c.strokeStyle = aura.hex;
            c.lineWidth = 3;
            c.shadowColor = aura.hex;
            c.shadowBlur = 20;
            
            // Pulsing Outline
            const pulse = Math.sin(time / 100) * 5;
            c.strokeRect(x - 5 - pulse, y - 5 - pulse, PADDLE_WIDTH + 10 + pulse*2, h + 10 + pulse*2);
            
            // Inner Core
            c.fillStyle = '#ffffff';
            c.globalAlpha = 0.5;
            c.fillRect(x + 5, y + 5, PADDLE_WIDTH - 10, h - 10);
        }
        c.restore();
      };
      
      drawPaddle(0, state.p1.y, p1H, state.p1.aura, state.p1.abilityActiveUntil > time);
      drawPaddle(GAME_WIDTH - PADDLE_WIDTH, state.p2.y, p2H, state.p2.aura, state.p2.abilityActiveUntil > time);

      // --- BALL ---
      // Re-calculate visual wobble for draw time
      let visualY = state.ball.y;
      if (isAbilityActive && activeAura?.ability.type === 'WOBBLE_SHOT') {
          visualY += Math.sin(time / 50) * 8;
      }

      const ballColor = activeAura?.hex || '#ffffff';
      c.fillStyle = ballColor;
      c.shadowColor = ballColor;
      c.shadowBlur = isAbilityActive ? 30 : 10;

      if (isAbilityActive && activeAura?.ability.type === 'GHOST_BALL') {
        // Ghost Flicker
        if (Math.floor(time / 50) % 2 === 0) {
           c.beginPath();
           c.arc(state.ball.x, visualY, BALL_SIZE, 0, Math.PI * 2);
           c.fill();
        }
      } else {
        c.beginPath();
        c.arc(state.ball.x, visualY, BALL_SIZE, 0, Math.PI * 2);
        c.fill();
        
        // Shiny Core
        c.fillStyle = '#fff';
        c.shadowBlur = 0;
        c.beginPath();
        c.arc(state.ball.x - 3, visualY - 3, BALL_SIZE / 3, 0, Math.PI * 2);
        c.fill();
      }

      if (state.shake > 0) c.restore();
    };

    animationFrameId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animationFrameId);
  }, [p1Data, p2Data, onGameEnd]);

  const HealthBar = ({ hp, max, colorClass }: { hp: number, max: number, colorClass: string }) => (
     <div className="w-full h-6 bg-gray-800 rounded-full border-2 border-gray-700 overflow-hidden relative shadow-lg">
        <div 
           className={`h-full transition-all duration-300 ${colorClass}`} 
           style={{ width: `${Math.max(0, (hp / max) * 100)}%` }}
        />
        <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white drop-shadow-md">
           {Math.max(0, hp)} / {max}
        </div>
     </div>
  );

  return (
    <div className="relative flex flex-col items-center justify-center w-full h-full bg-slate-900 p-4">
      {/* HUD */}
      <div className="w-full max-w-[800px] flex justify-between items-start mb-4 font-display">
        {/* P1 Stats */}
        <div className="flex flex-col items-start w-72 space-y-2">
           <HealthBar hp={hudState.p1Hp} max={MAX_HP} colorClass="bg-gradient-to-r from-red-600 to-orange-500" />
           <div className="flex items-center gap-2 text-sm bg-black/40 p-2 rounded border border-white/10 w-full justify-between">
             <span className="text-gray-400">{p1Data.aura?.ability.name}</span>
             {hudState.p1Cooldown > 0 ? (
               <span className="text-red-400 font-mono">{(hudState.p1Cooldown / 1000).toFixed(1)}s</span>
             ) : (
               <span className="text-green-400 font-bold flex items-center gap-1 animate-pulse"><Zap size={12}/> READY</span>
             )}
           </div>
        </div>

        <div className="text-center">
            <div className="text-4xl font-black text-white/10 tracking-widest">VS</div>
        </div>

        {/* P2 Stats */}
        <div className="flex flex-col items-end w-72 space-y-2">
           <HealthBar hp={hudState.p2Hp} max={MAX_HP} colorClass="bg-gradient-to-l from-blue-600 to-cyan-500" />
           <div className="flex items-center gap-2 text-sm bg-black/40 p-2 rounded border border-white/10 w-full justify-between flex-row-reverse">
             <span className="text-gray-400">{p2Data.aura?.ability.name}</span>
             {hudState.p2Cooldown > 0 ? (
               <span className="text-red-400 font-mono">{(hudState.p2Cooldown / 1000).toFixed(1)}s</span>
             ) : (
               <span className="text-green-400 font-bold flex items-center gap-1 animate-pulse"><Zap size={12}/> READY</span>
             )}
           </div>
        </div>
      </div>

      <div className="relative border-4 border-slate-700 rounded-lg overflow-hidden shadow-2xl bg-black">
         <canvas 
            ref={canvasRef} 
            width={GAME_WIDTH} 
            height={GAME_HEIGHT}
            className="w-full max-w-[800px] h-auto block"
         />
      </div>

      <div className="mt-4 text-gray-500 text-sm font-mono flex gap-8">
        <span>P1: {p1Controls.action} (Ability)</span>
        <span>P2: {p2Controls.action} (Ability)</span>
      </div>
    </div>
  );
};

export default PongGame;