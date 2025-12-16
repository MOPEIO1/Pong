export enum RarityTier {
  DOGWATER = 'DOGWATER',
  COMMON = 'COMMON',
  UNCOMMON = 'UNCOMMON',
  RARE = 'RARE',
  EPIC = 'EPIC',
  LEGENDARY = 'LEGENDARY',
  MYTHIC = 'MYTHIC',
  GODLY = 'GODLY'
}

export type AbilityType = 
  | 'SPEED' 
  | 'CURVE' 
  | 'GHOST' 
  | 'SIZE' 
  | 'PHYSICS' 
  | 'TIME' 
  | 'CONTROL'
  | 'TELEPORT'
  | 'LUCK'
  | 'SPECIAL'
  | 'DOGWATER';

export interface AbilityEffects {
  // Ball Modifiers (Applied by Last Hitter)
  speedMultiplier?: number; // 1.5 = +50% speed
  curveStrength?: number; // 0.1 to 1.0 (Y-axis force)
  invisible?: boolean; // Opacity 0
  ghost?: boolean; // Flicker / Opacity 0.5
  chaosBounce?: boolean; // Randomize reflection angles
  teleport?: 'RANDOM' | 'FORWARD' | 'EDGE' | 'path_correction'; // Jumps
  gravity?: number; // Constant Y-force (arcs)
  visualTrail?: 'FADE' | 'ECHO' | 'TWIN' | 'FIRE'; // Cosmetic
  
  // Paddle Modifiers (Applied by Owner)
  paddleScale?: number; // 1.5 = Bigger, 0.5 = Smaller
  paddleSpeed?: number; // 1.2 = Faster Movement, 0.5 = Slow (Lag)
  enemyPaddleScale?: number; // Affects opponent
  enemyPaddleSpeed?: number; // 0.0 = Freeze opponent
  freezeDuration?: number; // ms to stop ball on hit
  stickyDuration?: number; // ms to hold ball on paddle
  magnetStrength?: number; // Pulls ball towards paddle center
  autoAlign?: number; // 0.0 to 1.0 strength of auto-movement
  
  // Control Flags
  reverseInput?: boolean; // Self Debuff (Dogwater)
  reverseEnemyInput?: boolean; // Attack (Reverse Opponent)
  
  // Global / Meta
  timeWarpFactor?: number; // Global speed scale (e.g. 0.5 for slow mo)
  phaseWall?: boolean; // Wrap around screen or bounce weirdly
  luckBoost?: number; // Passive luck increase
  scoreMultiplier?: number; // 2x points
  duplicateBall?: boolean; // Spawns a temp fake ball? (Visual only for now)
}

export interface AuraStats {
  paddleHeightScale: number; // Removed passive buffs, kept for type compatibility but set to 1.0
  paddleSpeedScale: number; 
}

export interface AuraAbility {
  type: AbilityType;
  name: string;
  duration: number; // ms
  cooldown: number; // ms
  description: string;
  effects: AbilityEffects;
}

export interface Aura {
  id: string;
  name: string;
  chance: number; // 1 in X
  tier: RarityTier;
  color: string; // Tailwind class for text
  hex: string; // Hex code for canvas rendering
  glowColor: string; // Hex for glow effects
  stats: AuraStats;
  ability: AuraAbility;
}

export interface InventoryItem {
  id: string; // unique instance id for removal
  aura: Aura;
  aiLore?: string;
  count?: number;
}

export interface ShopItem {
  id: string;
  aura: Aura;
  price: number;
  sold: boolean;
  soldTo?: 1 | 2;
}

export interface PlayerControls {
  up: string;
  down: string;
  action: string; // Roll / Ability
  ready: string; // Lock in (Menu only)
}

export interface PlayerState {
  id: 1 | 2;
  hp: number;
  maxHp: number;
  aura: Aura | null;
  isReady: boolean;
  rollsRemaining: number;
  luck: number;
  coins: number;
  inventory: InventoryItem[];
  cooldown: number; // timestamp when ability is ready
}

export enum GameScreen {
  START = 'START',
  SETTINGS = 'SETTINGS',
  ROLL = 'ROLL',
  BATTLE = 'BATTLE',
  WIN = 'WIN',
  SHOP = 'SHOP',
  DICTIONARY = 'DICTIONARY'
}