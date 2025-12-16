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

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
  type?: 'fire' | 'ice' | 'void' | 'mud' | 'spark';
}

interface FloatingText {
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  size: number;
}

interface VisualEffect {
    type: 'PORTAL' | 'SHOCKWAVE' | 'BEAM';
    x: number;
    y: number;
    tx?: number; // Target X for beam
    ty?: number; // Target Y for beam
    life: number;
    color: string;
}

const PongGame: React.FC<PongGameProps> = ({ p1Data, p2Data, p1Controls, p2Controls, onGameEnd }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const gameState = useRef({
    p1: { 
      y: GAME_HEIGHT / 2 - BASE_PADDLE_HEIGHT / 2, 
      hp: MAX_HP, 
      cooldown: 0,
      abilityActiveUntil: 0,
      ...p1Data,
      holdingBall: false,
      holdTimer: 0
    },
    p2: { 
      y: GAME_HEIGHT / 2 - BASE_PADDLE_HEIGHT / 2, 
      hp: MAX_HP, 
      cooldown: 0,
      abilityActiveUntil: 0,
      ...p2Data,
      holdingBall: false,
      holdTimer: 0
    },
    ball: { 
      x: GAME_WIDTH / 2, 
      y: GAME_HEIGHT / 2, 
      dx: BASE_BALL_SPEED, 
      dy: BASE_BALL_SPEED * (Math.random() > 0.5 ? 1 : -1),
      speedMultiplier: 1,
      frozen: false,
      frozenTimer: 0,
      lastHitter: 0 as 0 | 1 | 2, // 0 = nobody, 1 = p1, 2 = p2
      trail: [] as {x: number, y: number, color?: string, size: number}[]
    },
    particles: [] as Particle[],
    floatingTexts: [] as FloatingText[],
    visualEffects: [] as VisualEffect[],
    keys: {} as Record<string, boolean>,
    lastTime: 0,
    shake: 0
  });

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

    const spawnParticles = (x: number, y: number, color: string, count: number, speed = 8, type?: Particle['type']) => {
      for (let i = 0; i < count; i++) {
        gameState.current.particles.push({
          x, y,
          vx: (Math.random() - 0.5) * speed,
          vy: (Math.random() - 0.5) * speed,
          life: 1.0,
          color,
          size: Math.random() * 4 + 2,
          type
        });
      }
    };

    const spawnText = (x: number, y: number, text: string, color: string, size: number = 20) => {
        gameState.current.floatingTexts.push({ x, y, text, color, life: 1.0, size });
    };

    const spawnVisualEffect = (type: VisualEffect['type'], x: number, y: number, color: string, tx?: number, ty?: number) => {
        gameState.current.visualEffects.push({ type, x, y, tx, ty, color, life: 1.0 });
    }

    const resetBall = (direction: 1 | -1) => {
      const state = gameState.current;
      state.ball.x = GAME_WIDTH / 2;
      state.ball.y = GAME_HEIGHT / 2;
      state.ball.dx = BASE_BALL_SPEED * direction;
      state.ball.dy = BASE_BALL_SPEED * (Math.random() * 2 - 1);
      state.ball.speedMultiplier = 1;
      state.ball.frozen = false;
      state.ball.lastHitter = 0;
      state.ball.trail = [];
      state.shake = 20; // TRIGGER SHAKE ON RESET
      state.p1.holdingBall = false;
      state.p2.holdingBall = false;
    };

    const activateAbility = (player: 'p1' | 'p2', now: number) => {
      const state = gameState.current;
      const p = state[player];
      if (!p.aura) return;

      if (now > p.cooldown) {
        playAbilitySound();
        p.abilityActiveUntil = now + p.aura.ability.duration;
        p.cooldown = now + p.aura.ability.cooldown;
        
        // Show activation text
        const x = player === 'p1' ? 100 : GAME_WIDTH - 100;
        spawnText(x, p.y, p.aura.ability.name.toUpperCase() + "!", p.aura.hex, 30);
        spawnVisualEffect('SHOCKWAVE', player === 'p1' ? 0 : GAME_WIDTH, p.y + BASE_PADDLE_HEIGHT/2, p.aura.hex);
        state.shake = 10;
      }
    };

    const update = (timestamp: number) => {
      const state = gameState.current;
      state.lastTime = timestamp;

      // Shake Decay
      if (state.shake > 0) state.shake *= 0.9;
      if (state.shake < 0.5) state.shake = 0;

      // --- 1. RESOLVE ACTIVE ABILITIES ---
      const p1Active = timestamp < state.p1.abilityActiveUntil;
      const p2Active = timestamp < state.p2.abilityActiveUntil;
      const p1Eff = p1Active ? state.p1.aura?.ability.effects : null;
      const p2Eff = p2Active ? state.p2.aura?.ability.effects : null;

      const lastHitterEffects = state.ball.lastHitter === 1 ? p1Eff : (state.ball.lastHitter === 2 ? p2Eff : null);
      
      // --- 2. INPUT & PADDLE MOVEMENT ---
      
      const p1Reversed = (p1Eff?.reverseInput) || (p2Eff?.reverseEnemyInput);
      const p2Reversed = (p2Eff?.reverseInput) || (p1Eff?.reverseEnemyInput);

      // P1 Calculations
      let p1Speed = BASE_PADDLE_SPEED; 
      if (p1Eff?.paddleSpeed) p1Speed *= p1Eff.paddleSpeed;
      if (p2Eff?.enemyPaddleSpeed !== undefined) p1Speed *= p2Eff.enemyPaddleSpeed;

      let p1HScale = 1.0; 
      if (p1Eff?.paddleScale) p1HScale *= p1Eff.paddleScale;
      if (p2Eff?.enemyPaddleScale) p1HScale *= p2Eff.enemyPaddleScale;
      const p1H = BASE_PADDLE_HEIGHT * p1HScale;

      // P2 Calculations
      let p2Speed = BASE_PADDLE_SPEED;
      if (p2Eff?.paddleSpeed) p2Speed *= p2Eff.paddleSpeed;
      if (p1Eff?.enemyPaddleSpeed !== undefined) p2Speed *= p1Eff.enemyPaddleSpeed;

      let p2HScale = 1.0; 
      if (p2Eff?.paddleScale) p2HScale *= p2Eff.paddleScale;
      if (p1Eff?.enemyPaddleScale) p2HScale *= p1Eff.enemyPaddleScale;
      const p2H = BASE_PADDLE_HEIGHT * p2HScale;

      // P1 Input
      if (p1Eff?.autoAlign) {
          const center = state.p1.y + p1H/2;
          const diff = state.ball.y - center;
          if (Math.abs(diff) > 10) {
              state.p1.y += Math.sign(diff) * p1Speed * p1Eff.autoAlign;
          }
      } else {
          let u = p1Reversed ? state.keys[p1Controls.down] : state.keys[p1Controls.up];
          let d = p1Reversed ? state.keys[p1Controls.up] : state.keys[p1Controls.down];
          if (u) state.p1.y -= p1Speed;
          if (d) state.p1.y += p1Speed;
      }
      state.p1.y = Math.max(0, Math.min(GAME_HEIGHT - p1H, state.p1.y));
      if (state.keys[p1Controls.action]) activateAbility('p1', timestamp);

      // P2 Input
      if (p2Eff?.autoAlign) {
          const center = state.p2.y + p2H/2;
          const diff = state.ball.y - center;
          if (Math.abs(diff) > 10) {
              state.p2.y += Math.sign(diff) * p2Speed * p2Eff.autoAlign;
          }
      } else {
          let u = p2Reversed ? state.keys[p2Controls.down] : state.keys[p2Controls.up];
          let d = p2Reversed ? state.keys[p2Controls.up] : state.keys[p2Controls.down];
          if (u) state.p2.y -= p2Speed;
          if (d) state.p2.y += p2Speed;
      }
      state.p2.y = Math.max(0, Math.min(GAME_HEIGHT - p2H, state.p2.y));
      if (state.keys[p2Controls.action]) activateAbility('p2', timestamp);


      // --- 3. BALL LOGIC ---

      if (state.ball.frozen) {
         if (timestamp > state.ball.frozenTimer) {
             state.ball.frozen = false;
             state.ball.speedMultiplier *= 1.5; 
             spawnText(state.ball.x, state.ball.y, "RELEASE!", "#fff");
             spawnVisualEffect('SHOCKWAVE', state.ball.x, state.ball.y, '#0ff');
         } else {
             state.ball.x += (Math.random() - 0.5) * 2;
             state.ball.y += (Math.random() - 0.5) * 2;
             draw(ctx, state, p1H, p2H, p1Eff, p2Eff, lastHitterEffects, timestamp, p1Reversed, p2Reversed);
             if (state.p1.hp > 0 && state.p2.hp > 0) requestAnimationFrame(update);
             return;
         }
      }

      if (state.p1.holdingBall) {
          if (timestamp > state.p1.holdTimer) state.p1.holdingBall = false;
          else {
              state.ball.x = PADDLE_WIDTH + BALL_SIZE + 2;
              state.ball.y = state.p1.y + p1H / 2;
              draw(ctx, state, p1H, p2H, p1Eff, p2Eff, lastHitterEffects, timestamp, p1Reversed, p2Reversed);
              if (state.p1.hp > 0 && state.p2.hp > 0) requestAnimationFrame(update);
              return;
          }
      }
      if (state.p2.holdingBall) {
          if (timestamp > state.p2.holdTimer) state.p2.holdingBall = false;
          else {
              state.ball.x = GAME_WIDTH - PADDLE_WIDTH - BALL_SIZE - 2;
              state.ball.y = state.p2.y + p2H / 2;
              draw(ctx, state, p1H, p2H, p1Eff, p2Eff, lastHitterEffects, timestamp, p1Reversed, p2Reversed);
              if (state.p1.hp > 0 && state.p2.hp > 0) requestAnimationFrame(update);
              return;
          }
      }

      let speedMod = 1.0;
      let curveY = 0;
      let gravity = 0;
      
      if (p1Eff?.timeWarpFactor) speedMod *= p1Eff.timeWarpFactor;
      if (p2Eff?.timeWarpFactor) speedMod *= p2Eff.timeWarpFactor;

      if (lastHitterEffects) {
          if (lastHitterEffects.speedMultiplier) speedMod *= lastHitterEffects.speedMultiplier;
          
          if (lastHitterEffects.curveStrength) {
              const dir = state.ball.lastHitter === 1 ? 1 : -1;
              // Amplify curve for visibility: Multiplier 2.0
              curveY += (lastHitterEffects.curveStrength * 2.5) * dir;
          }
          if (lastHitterEffects.gravity) {
              gravity = lastHitterEffects.gravity;
          }
          if (lastHitterEffects.teleport === 'RANDOM' && Math.random() < 0.015) {
             const oldX = state.ball.x; const oldY = state.ball.y;
             state.ball.y = Math.random() * GAME_HEIGHT;
             spawnParticles(oldX, oldY, '#f0f', 5);
             spawnVisualEffect('PORTAL', oldX, oldY, '#f0f');
             spawnVisualEffect('PORTAL', state.ball.x, state.ball.y, '#f0f');
             spawnText(state.ball.x, state.ball.y, "WARP", "#f0f");
          }
      }

      // Magnet Physics & Visuals
      if (state.ball.dx < 0 && p1Eff?.magnetStrength) {
         const center = state.p1.y + p1H/2;
         const dy = center - state.ball.y;
         state.ball.dy += dy * 0.02 * p1Eff.magnetStrength; // Increased force
         
         // Visual for Magnet Pull
         if (Math.random() < 0.3) {
             spawnVisualEffect('BEAM', PADDLE_WIDTH, center, state.p1.aura?.hex || '#0ff', state.ball.x, state.ball.y);
             spawnParticles(state.ball.x, state.ball.y, state.p1.aura?.hex || '#0ff', 1, 3, 'spark');
         }
      }
      if (state.ball.dx > 0 && p2Eff?.magnetStrength) {
         const center = state.p2.y + p2H/2;
         const dy = center - state.ball.y;
         state.ball.dy += dy * 0.02 * p2Eff.magnetStrength;
         
         if (Math.random() < 0.3) {
             spawnVisualEffect('BEAM', GAME_WIDTH - PADDLE_WIDTH, center, state.p2.aura?.hex || '#0ff', state.ball.x, state.ball.y);
             spawnParticles(state.ball.x, state.ball.y, state.p2.aura?.hex || '#0ff', 1, 3, 'spark');
         }
      }

      state.ball.dy += gravity;
      state.ball.x += state.ball.dx * state.ball.speedMultiplier * speedMod;
      state.ball.y += (state.ball.dy + curveY) * state.ball.speedMultiplier * speedMod;

      if (lastHitterEffects?.visualTrail || state.ball.speedMultiplier > 1.3 || lastHitterEffects?.curveStrength) {
          state.ball.trail.push({
            x: state.ball.x, 
            y: state.ball.y, 
            color: state.ball.lastHitter === 1 ? state.p1.aura?.hex : state.p2.aura?.hex,
            size: BALL_SIZE
          });
          if (state.ball.trail.length > 25) state.ball.trail.shift();
      } else {
          state.ball.trail = [];
      }

      // Wall & Phase Logic
      if (state.ball.y <= 0 || state.ball.y >= GAME_HEIGHT) {
          const hasPhase = p1Eff?.phaseWall || p2Eff?.phaseWall;
          if (hasPhase) {
              if (state.ball.y <= 0) {
                   state.ball.y = GAME_HEIGHT - 1;
                   spawnVisualEffect('PORTAL', state.ball.x, 0, '#fff');
                   spawnVisualEffect('PORTAL', state.ball.x, GAME_HEIGHT, '#fff');
              } else {
                   state.ball.y = 1;
                   spawnVisualEffect('PORTAL', state.ball.x, GAME_HEIGHT, '#fff');
                   spawnVisualEffect('PORTAL', state.ball.x, 0, '#fff');
              }
              spawnParticles(state.ball.x, state.ball.y, '#fff', 8);
          } else {
              state.ball.dy *= -1;
              state.shake = 5;
              if (lastHitterEffects?.chaosBounce) {
                  state.ball.dy = (Math.random() * 10) - 5;
                  spawnText(state.ball.x, state.ball.y, "CHAOS", "#f00");
                  spawnVisualEffect('SHOCKWAVE', state.ball.x, state.ball.y, '#f00');
              }
          }
      }

      const checkHit = (px: number, py: number, ph: number) => {
          return (
              state.ball.x < px + PADDLE_WIDTH &&
              state.ball.x + BALL_SIZE > px &&
              state.ball.y < py + ph &&
              state.ball.y + BALL_SIZE > py
          );
      };

      if (state.ball.dx < 0 && checkHit(0, state.p1.y, p1H)) {
          state.ball.dx = Math.abs(state.ball.dx);
          state.ball.speedMultiplier += 0.05;
          state.ball.x = PADDLE_WIDTH + 1;
          state.ball.lastHitter = 1;
          state.shake = 10 * state.ball.speedMultiplier;

          const hitPoint = state.ball.y - (state.p1.y + p1H / 2);
          state.ball.dy = hitPoint * 0.15;
          if (state.p1.aura) playHitSound(state.p1.aura.tier);
          spawnParticles(state.ball.x, state.ball.y, state.p1.aura?.hex || '#fff', 15);
          spawnVisualEffect('SHOCKWAVE', state.ball.x, state.ball.y, state.p1.aura?.hex || '#fff');

          if (p1Eff) {
              if (p1Eff.freezeDuration) { 
                  state.ball.frozen = true; 
                  state.ball.frozenTimer = timestamp + p1Eff.freezeDuration; 
                  spawnText(state.ball.x, state.ball.y, "FREEZE", "#0ff");
                  spawnParticles(state.ball.x, state.ball.y, '#0ff', 20, 3, 'ice');
              }
              if (p1Eff.stickyDuration) { 
                  state.p1.holdingBall = true; 
                  state.p1.holdTimer = timestamp + p1Eff.stickyDuration;
                  spawnText(state.ball.x, state.ball.y, "CATCH", "#fb0");
              }
              if (p1Eff.teleport === 'EDGE') { 
                  state.ball.x = GAME_WIDTH * 0.8; 
                  spawnParticles(PADDLE_WIDTH, state.ball.y, '#fff', 10);
                  spawnVisualEffect('PORTAL', state.ball.x, state.ball.y, '#f0f');
                  spawnText(state.ball.x, state.ball.y, "TELEPORT", "#f0f");
              }
          }
      }

      if (state.ball.dx > 0 && checkHit(GAME_WIDTH - PADDLE_WIDTH, state.p2.y, p2H)) {
          state.ball.dx = -Math.abs(state.ball.dx);
          state.ball.speedMultiplier += 0.05;
          state.ball.x = GAME_WIDTH - PADDLE_WIDTH - 1;
          state.ball.lastHitter = 2;
          state.shake = 10 * state.ball.speedMultiplier;

          const hitPoint = state.ball.y - (state.p2.y + p2H / 2);
          state.ball.dy = hitPoint * 0.15;
          if (state.p2.aura) playHitSound(state.p2.aura.tier);
          spawnParticles(state.ball.x, state.ball.y, state.p2.aura?.hex || '#fff', 15);
          spawnVisualEffect('SHOCKWAVE', state.ball.x, state.ball.y, state.p2.aura?.hex || '#fff');

          if (p2Eff) {
            if (p2Eff.freezeDuration) { 
                state.ball.frozen = true; 
                state.ball.frozenTimer = timestamp + p2Eff.freezeDuration; 
                spawnText(state.ball.x, state.ball.y, "FREEZE", "#0ff");
                spawnParticles(state.ball.x, state.ball.y, '#0ff', 20, 3, 'ice');
            }
            if (p2Eff.stickyDuration) { 
                state.p2.holdingBall = true; 
                state.p2.holdTimer = timestamp + p2Eff.stickyDuration; 
                spawnText(state.ball.x, state.ball.y, "CATCH", "#fb0");
            }
            if (p2Eff.teleport === 'EDGE') { 
                state.ball.x = GAME_WIDTH * 0.2; 
                spawnParticles(GAME_WIDTH - PADDLE_WIDTH, state.ball.y, '#fff', 10);
                spawnVisualEffect('PORTAL', state.ball.x, state.ball.y, '#f0f');
                spawnText(state.ball.x, state.ball.y, "TELEPORT", "#f0f");
            }
        }
      }

      if (state.ball.x < 0) {
        let damage = DAMAGE_PER_HIT;
        if (state.ball.lastHitter === 2 && p2Eff?.scoreMultiplier) damage *= p2Eff.scoreMultiplier;
        
        state.p1.hp -= damage;
        resetBall(1);
        if (state.p1.hp <= 0) onGameEnd(2);
      } else if (state.ball.x > GAME_WIDTH) {
        let damage = DAMAGE_PER_HIT;
        if (state.ball.lastHitter === 1 && p1Eff?.scoreMultiplier) damage *= p1Eff.scoreMultiplier;

        state.p2.hp -= damage;
        resetBall(-1);
        if (state.p2.hp <= 0) onGameEnd(1);
      }

      // Particles
      for (let i = state.particles.length - 1; i >= 0; i--) {
        const p = state.particles[i];
        p.x += p.vx; p.y += p.vy; p.life -= 0.03;
        if (p.life <= 0) state.particles.splice(i, 1);
      }

      // Floating Texts
      for (let i = state.floatingTexts.length - 1; i >= 0; i--) {
          const t = state.floatingTexts[i];
          t.y -= 1; // Float up
          t.life -= 0.02;
          if (t.life <= 0) state.floatingTexts.splice(i, 1);
      }

      // Visual Effects
      for (let i = state.visualEffects.length - 1; i >= 0; i--) {
          const v = state.visualEffects[i];
          v.life -= 0.1; // Fast fade
          if (v.life <= 0) state.visualEffects.splice(i, 1);
      }

      if (Math.random() < 0.1) {
        setHudState({
          p1Hp: state.p1.hp, p2Hp: state.p2.hp,
          p1Cooldown: Math.max(0, state.p1.cooldown - timestamp),
          p2Cooldown: Math.max(0, state.p2.cooldown - timestamp),
          p1AbilityActive: p1Active, p2AbilityActive: p2Active
        });
      }

      draw(ctx, state, p1H, p2H, p1Eff, p2Eff, lastHitterEffects, timestamp, p1Reversed, p2Reversed);

      if (state.p1.hp > 0 && state.p2.hp > 0) {
        animationFrameId = requestAnimationFrame(update);
      }
    };

    const draw = (
      c: CanvasRenderingContext2D, 
      state: any, 
      p1H: number, 
      p2H: number,
      p1Eff: any,
      p2Eff: any,
      lastHitterEff: any,
      time: number,
      p1Rev: boolean,
      p2Rev: boolean
    ) => {
      // Clear
      c.fillStyle = '#0f172a';
      c.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

      c.save(); // Start Global Transform

      // Screen Shake
      if (state.shake > 0) {
        const dx = (Math.random() - 0.5) * state.shake;
        const dy = (Math.random() - 0.5) * state.shake;
        c.translate(dx, dy);
      }

      // Time Warp Global Effect
      if (p1Eff?.timeWarpFactor || p2Eff?.timeWarpFactor) {
          c.fillStyle = 'rgba(76, 29, 149, 0.2)'; // Deep purple tint
          c.fillRect(0,0, GAME_WIDTH, GAME_HEIGHT);
          
          // Draw grid
          c.strokeStyle = 'rgba(167, 139, 250, 0.2)';
          c.lineWidth = 1;
          const gridSize = 50 + Math.sin(time/500)*10;
          for(let i=0; i<GAME_WIDTH; i+=gridSize) { c.beginPath(); c.moveTo(i,0); c.lineTo(i, GAME_HEIGHT); c.stroke(); }
          for(let i=0; i<GAME_HEIGHT; i+=gridSize) { c.beginPath(); c.moveTo(0,i); c.lineTo(GAME_WIDTH, i); c.stroke(); }
      }

      // Auras background
      if (state.p1.aura) { c.fillStyle = state.p1.aura.hex + '11'; c.fillRect(0, 0, GAME_WIDTH/2, GAME_HEIGHT); }
      if (state.p2.aura) { c.fillStyle = state.p2.aura.hex + '11'; c.fillRect(GAME_WIDTH/2, 0, GAME_WIDTH/2, GAME_HEIGHT); }
      c.strokeStyle = '#334155'; c.setLineDash([10, 10]); c.beginPath(); c.moveTo(GAME_WIDTH / 2, 0); c.lineTo(GAME_WIDTH / 2, GAME_HEIGHT); c.stroke(); c.setLineDash([]);

      // Particles
      state.particles.forEach((p: Particle) => {
        c.globalAlpha = p.life; 
        c.fillStyle = p.color; 
        c.beginPath(); 
        
        if (p.type === 'ice') {
            c.rect(p.x, p.y, p.size, p.size);
        } else if (p.type === 'spark') {
            c.moveTo(p.x, p.y - p.size); c.lineTo(p.x + p.size, p.y); c.lineTo(p.x, p.y + p.size); c.lineTo(p.x - p.size, p.y);
        } else {
            c.arc(p.x, p.y, p.size, 0, Math.PI * 2); 
        }
        c.fill(); 
        c.globalAlpha = 1.0;
      });

      // Visual Effects (Portals, Shockwaves, Beams)
      state.visualEffects.forEach((v: VisualEffect) => {
          c.globalAlpha = v.life;
          if (v.type === 'SHOCKWAVE') {
              c.strokeStyle = v.color;
              c.lineWidth = 6 * v.life;
              c.beginPath(); c.arc(v.x, v.y, 200 * (1-v.life), 0, Math.PI*2); c.stroke();
          }
          if (v.type === 'PORTAL') {
              c.strokeStyle = v.color;
              c.lineWidth = 2;
              c.beginPath(); c.ellipse(v.x, v.y, 30, 80 * v.life, 0, 0, Math.PI*2); c.stroke();
              c.fillStyle = v.color; c.globalAlpha = v.life * 0.3; c.fill();
          }
          if (v.type === 'BEAM' && v.tx !== undefined && v.ty !== undefined) {
             c.strokeStyle = v.color;
             c.lineWidth = 2 + Math.random() * 4;
             c.beginPath(); c.moveTo(v.x, v.y); c.lineTo(v.tx, v.ty); c.stroke();
             // Glow
             c.shadowColor = v.color; c.shadowBlur = 15; c.stroke(); c.shadowBlur = 0;
          }
          c.globalAlpha = 1.0;
      });

      // Trail
      if (state.ball.trail.length > 1) {
        c.save();
        // Draw Ribbon
        c.beginPath();
        c.moveTo(state.ball.trail[0].x, state.ball.trail[0].y);
        for (let i = 1; i < state.ball.trail.length; i++) {
             // Quadratic Bezier for smoothness? Or just line to
             c.lineTo(state.ball.trail[i].x, state.ball.trail[i].y);
        }
        
        // Gradient for trail
        const gradient = c.createLinearGradient(
            state.ball.trail[0].x, state.ball.trail[0].y, 
            state.ball.trail[state.ball.trail.length-1].x, state.ball.trail[state.ball.trail.length-1].y
        );
        gradient.addColorStop(0, 'transparent');
        gradient.addColorStop(1, state.ball.trail[state.ball.trail.length-1].color || '#fff');
        
        c.lineCap = 'round';
        c.lineJoin = 'round';
        c.lineWidth = BALL_SIZE * 0.8;
        c.strokeStyle = gradient;
        c.stroke();
        c.restore();
      }

      // --- PADDLE DRAWING WITH EFFECTS ---
      
      const drawPaddle = (x: number, y: number, w: number, h: number, color: string, isActive: boolean, eff: any, isReversed: boolean, playerIdx: 1 | 2) => {
         // Active Duration Bar
         const pData = playerIdx === 1 ? state.p1 : state.p2;
         if (isActive) {
             const remaining = Math.max(0, pData.abilityActiveUntil - time);
             const total = pData.aura?.ability.duration || 1000;
             const ratio = remaining / total;
             c.fillStyle = '#333'; c.fillRect(x, y - 10, w, 6);
             c.fillStyle = pData.aura?.hex || '#fff'; c.fillRect(x, y - 10, w * ratio, 6);
         }

         // Base Paddle
         c.fillStyle = color;
         c.fillRect(x, y, w, h);

         // Active Outline
         if (isActive) {
             c.strokeStyle = '#fff'; c.lineWidth = 2; c.strokeRect(x, y, w, h);
         }

         // --- ABILITY OVERLAYS ---
         
         // Magnet (Rings)
         if (isActive && eff?.magnetStrength) {
             c.strokeStyle = color; c.lineWidth = 1.5;
             const cx = x + w/2; const cy = y + h/2;
             c.beginPath(); c.arc(cx, cy, 40 + Math.sin(time/100)*10, -Math.PI/2, Math.PI/2, x > GAME_WIDTH/2); c.stroke();
             c.beginPath(); c.arc(cx, cy, 60 + Math.sin(time/100)*10, -Math.PI/2, Math.PI/2, x > GAME_WIDTH/2); c.stroke();
         }

         // Sticky (Slime)
         if (isActive && eff?.stickyDuration) {
             c.fillStyle = '#84cc16'; // Lime green
             for(let i=0; i<w; i+=5) {
                 c.beginPath(); c.arc(x+i, y+h, 3, 0, Math.PI); c.fill();
             }
         }

         // Frozen (Ice Block)
         if (eff?.paddleSpeed === 0) {
             c.fillStyle = 'rgba(100, 200, 255, 0.5)';
             c.fillRect(x-5, y-5, w+10, h+10);
             c.strokeStyle = '#fff'; c.lineWidth = 1;
             c.strokeRect(x-5, y-5, w+10, h+10);
         }

         // Slow / Mud (Dogwater)
         if (eff?.paddleSpeed && eff.paddleSpeed < 0.8 && eff.paddleSpeed > 0) {
             c.fillStyle = '#5c4033'; // Mud brown
             c.beginPath(); c.arc(x+w/2, y+h, 10, 0, Math.PI, true); c.fill();
             // Drips
             if (time % 20 < 10) c.fillRect(x+5, y+h, 2, 10);
             if (time % 30 < 15) c.fillRect(x+w-5, y+h, 2, 8);
         }

         // Confusion (Spiral) for Reverse
         if (isReversed) {
             const cx = x + w/2;
             const cy = y - 30;
             c.save();
             c.translate(cx, cy);
             c.rotate(time / 200);
             c.strokeStyle = '#f0f'; c.lineWidth = 3;
             c.beginPath();
             for(let i=0; i<20; i++) {
                 const angle = 0.5 * i;
                 const r = 1 + i;
                 c.lineTo(r * Math.cos(angle), r * Math.sin(angle));
             }
             c.stroke();
             c.restore();

             // "???" Text
             c.fillStyle = "#fff"; c.font = "bold 20px monospace";
             c.fillText("???", x + (x > GAME_WIDTH/2 ? -40 : w+10), y + h/2);
         }
      }

      drawPaddle(0, state.p1.y, PADDLE_WIDTH, p1H, state.p1.aura?.hex || '#fff', hudState.p1AbilityActive, p1Eff, p1Rev, 1);
      drawPaddle(GAME_WIDTH - PADDLE_WIDTH, state.p2.y, PADDLE_WIDTH, p2H, state.p2.aura?.hex || '#fff', hudState.p2AbilityActive, p2Eff, p2Rev, 2);


      // Floating Text
      state.floatingTexts.forEach((t: FloatingText) => {
          c.globalAlpha = t.life;
          c.fillStyle = t.color;
          c.font = `bold ${t.size}px monospace`;
          c.shadowColor = 'black'; c.shadowBlur = 2;
          c.fillText(t.text, t.x, t.y);
          c.shadowBlur = 0;
          c.globalAlpha = 1.0;
      });

      // Ball
      let ballOpacity = 1.0;
      let ballColor = '#ffffff';
      let showIce = false;
      let showFire = false;
      let showVoid = false;

      if (state.ball.lastHitter === 1) ballColor = state.p1.aura?.hex || '#fff';
      if (state.ball.lastHitter === 2) ballColor = state.p2.aura?.hex || '#fff';
      
      // Effect Checking for Ball
      if (state.ball.frozen) {
          ballColor = '#00ffff';
          showIce = true;
      }
      if (state.ball.speedMultiplier > 1.3 || (lastHitterEff?.speedMultiplier && lastHitterEff.speedMultiplier > 1.2)) {
          showFire = true;
          ballColor = '#fb923c'; // Orange
      }
      if (lastHitterEff?.chaosBounce) {
          showVoid = true;
      }

      if (lastHitterEff?.invisible) {
          const distToP1 = Math.abs(state.ball.x - PADDLE_WIDTH);
          const distToP2 = Math.abs(state.ball.x - (GAME_WIDTH - PADDLE_WIDTH));
          const closest = Math.min(distToP1, distToP2);
          if (closest < 150) ballOpacity = 1.0 - (closest / 150); else ballOpacity = 0;
      } else if (lastHitterEff?.ghost) {
          ballOpacity = (Math.sin(time / 50) + 1) / 2 * 0.6 + 0.2;
      }

      c.save();
      c.globalAlpha = ballOpacity;
      c.fillStyle = ballColor;
      c.shadowColor = ballColor;
      c.shadowBlur = showFire ? 40 : 20;
      
      // Draw ball
      c.beginPath(); c.arc(state.ball.x, state.ball.y, BALL_SIZE, 0, Math.PI * 2); c.fill();
      
      // Ice Overlay
      if (showIce) {
          c.strokeStyle = '#fff'; c.lineWidth = 1;
          c.beginPath(); c.moveTo(state.ball.x-6, state.ball.y-6); c.lineTo(state.ball.x+6, state.ball.y+6); c.stroke();
          c.beginPath(); c.moveTo(state.ball.x+6, state.ball.y-6); c.lineTo(state.ball.x-6, state.ball.y+6); c.stroke();
          c.beginPath(); c.moveTo(state.ball.x, state.ball.y-8); c.lineTo(state.ball.x, state.ball.y+8); c.stroke();
      }

      // Fire Overlay particles
      if (showFire && Math.random() < 0.3) {
           spawnParticles(state.ball.x, state.ball.y, '#f59e0b', 2, 2, 'fire');
      }

      // Void/Chaos Overlay
      if (showVoid) {
          c.strokeStyle = '#000'; c.lineWidth = 2;
          c.beginPath(); c.arc(state.ball.x, state.ball.y, BALL_SIZE - 2, 0, Math.PI*2); c.stroke();
      }

      c.restore();

      c.restore(); // Restore Global Transform (Shake)

      // UI Warnings
      if (p1Rev) {
          c.fillStyle = '#ef4444'; c.font = 'bold 20px monospace'; 
          c.fillText("⚠ P1: CONFUSED", 20, GAME_HEIGHT - 30);
      }
      if (p2Rev) {
          c.fillStyle = '#ef4444'; c.font = 'bold 20px monospace'; 
          c.fillText("⚠ P2: CONFUSED", GAME_WIDTH - 200, GAME_HEIGHT - 30);
      }
    };

    animationFrameId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animationFrameId);
  }, [p1Data, p2Data, onGameEnd]);

  const HealthBar = ({ hp, max, colorClass }: { hp: number, max: number, colorClass: string }) => (
    <div className="w-full h-6 bg-gray-800 rounded-full border-2 border-gray-700 overflow-hidden relative shadow-lg">
       <div className={`h-full transition-all duration-300 ${colorClass}`} style={{ width: `${Math.max(0, (hp / max) * 100)}%` }} />
       <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white drop-shadow-md">{Math.max(0, hp)} / {max}</div>
    </div>
 );

 return (
   <div className="relative flex flex-col items-center justify-center w-full h-full bg-slate-900 p-4">
     <div className="w-full max-w-[800px] flex justify-between items-start mb-4 font-display">
       <div className="flex flex-col items-start w-72 space-y-2">
          <HealthBar hp={hudState.p1Hp} max={MAX_HP} colorClass="bg-gradient-to-r from-red-600 to-orange-500" />
          <div className="flex items-center gap-2 text-sm bg-black/40 p-2 rounded border border-white/10 w-full justify-between">
            <span className="text-gray-400 max-w-[150px] truncate">{p1Data.aura?.ability.name}</span>
            {hudState.p1Cooldown > 0 ? <span className="text-red-400 font-mono">{(hudState.p1Cooldown / 1000).toFixed(1)}s</span> : <span className="text-green-400 font-bold flex items-center gap-1 animate-pulse"><Zap size={12}/> READY</span>}
          </div>
       </div>
       <div className="text-center"><div className="text-4xl font-black text-white/10 tracking-widest">VS</div></div>
       <div className="flex flex-col items-end w-72 space-y-2">
          <HealthBar hp={hudState.p2Hp} max={MAX_HP} colorClass="bg-gradient-to-l from-blue-600 to-cyan-500" />
          <div className="flex items-center gap-2 text-sm bg-black/40 p-2 rounded border border-white/10 w-full justify-between flex-row-reverse">
            <span className="text-gray-400 max-w-[150px] truncate">{p2Data.aura?.ability.name}</span>
            {hudState.p2Cooldown > 0 ? <span className="text-red-400 font-mono">{(hudState.p2Cooldown / 1000).toFixed(1)}s</span> : <span className="text-green-400 font-bold flex items-center gap-1 animate-pulse"><Zap size={12}/> READY</span>}
          </div>
       </div>
     </div>
     <div className="relative border-4 border-slate-700 rounded-lg overflow-hidden shadow-2xl bg-black">
        <canvas ref={canvasRef} width={GAME_WIDTH} height={GAME_HEIGHT} className="w-full max-w-[800px] h-auto block" />
     </div>
     <div className="mt-4 text-gray-500 text-sm font-mono flex gap-8">
       <span>P1: {p1Controls.action} (Ability)</span>
       <span>P2: {p2Controls.action} (Ability)</span>
     </div>
   </div>
 );
};

export default PongGame;