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
  | 'SPEED_BOOST' 
  | 'CURVE_SHOT' 
  | 'GHOST_BALL' 
  | 'ENLARGE_PADDLE' 
  | 'SHRINK_PADDLE'
  | 'WOBBLE_SHOT'
  | 'ZIGZAG_SHOT'
  | 'STOP_AND_GO';

export interface AuraStats {
  paddleHeightScale: number; // 1.0 is base
  paddleSpeedScale: number; // 1.0 is base
}

export interface AuraAbility {
  type: AbilityType;
  name: string;
  duration: number; // ms
  cooldown: number; // ms
  description: string;
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
}

export enum GameScreen {
  START = 'START',
  SETTINGS = 'SETTINGS',
  ROLL = 'ROLL',
  BATTLE = 'BATTLE',
  WIN = 'WIN',
  SHOP = 'SHOP'
}