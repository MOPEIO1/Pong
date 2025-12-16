
import { Aura, RarityTier, PlayerControls, AbilityType, AuraAbility, ShopItem, AbilityEffects } from './types';

// Game Physics Constants
export const GAME_WIDTH = 800;
export const GAME_HEIGHT = 600;
export const PADDLE_WIDTH = 20;
export const BASE_PADDLE_HEIGHT = 100;
export const BALL_SIZE = 12;
export const BASE_PADDLE_SPEED = 7;
export const BASE_BALL_SPEED = 5; 
export const MAX_HP = 100;
export const DAMAGE_PER_HIT = 25;
export const ROLLS_PER_GAME = 5;
export const COINS_PER_MATCH = 5;
export const SHOP_REFRESH_MS = 10 * 60 * 1000; // 10 Minutes
export const SHOP_SIZE = 6;

export const DEFAULT_CONTROLS_P1: PlayerControls = { up: 'KeyW', down: 'KeyS', action: 'KeyE', ready: 'KeyA' };
export const DEFAULT_CONTROLS_P2: PlayerControls = { up: 'ArrowUp', down: 'ArrowDown', action: 'KeyP', ready: 'ArrowRight' };

export const TIER_COLOR_MAP: Record<RarityTier, string> = {
    [RarityTier.DOGWATER]: 'border-amber-900 shadow-amber-900/50 bg-amber-950/50',
    [RarityTier.COMMON]: 'border-gray-500 shadow-gray-500/50',
    [RarityTier.UNCOMMON]: 'border-green-500 shadow-green-500/50',
    [RarityTier.RARE]: 'border-blue-500 shadow-blue-500/50',
    [RarityTier.EPIC]: 'border-purple-500 shadow-purple-500/50',
    [RarityTier.LEGENDARY]: 'border-yellow-500 shadow-yellow-500/50',
    [RarityTier.MYTHIC]: 'border-pink-500 shadow-pink-500/50 ring-2 ring-pink-400',
    [RarityTier.GODLY]: 'border-white shadow-white/50 ring-4 ring-white/50 animate-pulse',
};

export const TIER_ORDER: Record<RarityTier, number> = {
    [RarityTier.DOGWATER]: 0, [RarityTier.COMMON]: 1, [RarityTier.UNCOMMON]: 2,
    [RarityTier.RARE]: 3, [RarityTier.EPIC]: 4, [RarityTier.LEGENDARY]: 5,
    [RarityTier.MYTHIC]: 6, [RarityTier.GODLY]: 7,
};

export const getTierColor = (tier: RarityTier): string => TIER_COLOR_MAP[tier] || 'border-gray-500';

// --- ABILITY DEFINITIONS ---
const ABILITY_POOL: Record<string, { type: AbilityType, desc: string, effects: AbilityEffects }> = {
  // TIME & SPACE
  "Time Warp": { type: 'TIME', desc: "Moves in slow motion.", effects: { timeWarpFactor: 0.3 } },
  "Freeze Ball": { type: 'TIME', desc: "Freezes in midair on hit.", effects: { freezeDuration: 1200 } },
  "Stop And Go": { type: 'TIME', desc: "Pauses then launches.", effects: { freezeDuration: 500 } },
  "Phase Shift": { type: 'PHYSICS', desc: "Passes through walls.", effects: { phaseWall: true } },
  "Teleport Ball": { type: 'TELEPORT', desc: "Randomly teleports.", effects: { teleport: 'RANDOM' } },
  "Warp Ball": { type: 'TELEPORT', desc: "Teleports vertically.", effects: { teleport: 'RANDOM' } },
  "Teleport Spike": { type: 'TELEPORT', desc: "Teleports to goal line.", effects: { teleport: 'EDGE' } },
  "Gravity Shift": { type: 'PHYSICS', desc: "Arcs due to gravity.", effects: { gravity: 0.6 } },
  "Gravity Flip": { type: 'PHYSICS', desc: "Arcs upwards.", effects: { gravity: -0.6 } },
  "Gravity Echo": { type: 'PHYSICS', desc: "Arcs back to center.", effects: { gravity: 0.3 } },
  
  // PADDLE & CONTROL
  "Magnet Ball": { type: 'CONTROL', desc: "Curves toward paddle.", effects: { magnetStrength: 0.8 } },
  "Magnet Paddle": { type: 'CONTROL', desc: "Pulls ball to center.", effects: { magnetStrength: 0.6 } },
  "Sticky Ball": { type: 'CONTROL', desc: "Sticks to paddle.", effects: { stickyDuration: 800 } },
  "Sticky Paddle": { type: 'CONTROL', desc: "Catches ball briefly.", effects: { stickyDuration: 1200 } },
  "Sticky Glide": { type: 'CONTROL', desc: "Sticks + Auto-guides.", effects: { stickyDuration: 500, autoAlign: 0.5 } },
  "Reverse Controls": { type: 'CONTROL', desc: "Inverts opponent inputs.", effects: { reverseEnemyInput: true } },
  "Reverse Paddle": { type: 'CONTROL', desc: "Inverts opponent movement.", effects: { reverseEnemyInput: true } },
  "Enlarge Paddle": { type: 'SIZE', desc: "Paddle grows massive.", effects: { paddleScale: 1.6 } },
  "Extended Paddle": { type: 'SIZE', desc: "Paddle gets longer.", effects: { paddleScale: 1.3 } },
  "Shrink Paddle": { type: 'SIZE', desc: "Shrinks opponent.", effects: { enemyPaddleScale: 0.7 } },
  "Tiny Paddle": { type: 'SIZE', desc: "Shrinks opponent tiny.", effects: { enemyPaddleScale: 0.5 } },
  "Auto Return": { type: 'CONTROL', desc: "Paddle auto-aligns.", effects: { autoAlign: 0.8 } },
  "Rapid Return": { type: 'CONTROL', desc: "Fast auto-alignment.", effects: { autoAlign: 1.2 } },
  "Auto Align": { type: 'CONTROL', desc: "Perfect auto-aim.", effects: { autoAlign: 1.5 } },
  "Paddle Boost": { type: 'SPEED', desc: "Paddle moves +30% faster.", effects: { paddleSpeed: 1.3 } },
  "Quick Paddle": { type: 'SPEED', desc: "Paddle moves +50% faster.", effects: { paddleSpeed: 1.5 } },
  "Freeze Paddle": { type: 'CONTROL', desc: "Freezes opponent paddle.", effects: { enemyPaddleSpeed: 0 } },
  
  // BALL MOVEMENT
  "Curve Shot": { type: 'CURVE', desc: "Curves in air.", effects: { curveStrength: 0.3 } },
  "Curve Master": { type: 'CURVE', desc: "Extreme curve.", effects: { curveStrength: 0.7 } },
  "Zigzag Shot": { type: 'CURVE', desc: "Moves in jagged angles.", effects: { chaosBounce: true, curveStrength: 0.2 } },
  "Chaos Bounce": { type: 'PHYSICS', desc: "Unpredictable bounces.", effects: { chaosBounce: true } },
  "Speed Surge": { type: 'SPEED', desc: "Ball Speed +30%.", effects: { speedMultiplier: 1.3 } },
  "Double Speed": { type: 'SPEED', desc: "Ball Speed +100%.", effects: { speedMultiplier: 2.0 } },
  "Critical Strike": { type: 'SPEED', desc: "Return speed +50%.", effects: { speedMultiplier: 1.5 } },
  "Slow Ball": { type: 'SPEED', desc: "Slows ball speed (Control).", effects: { speedMultiplier: 0.6 } },
  "Omni Bounce": { type: 'PHYSICS', desc: "Perfect unpredictable angles.", effects: { chaosBounce: true } },
  
  // VISUALS / GHOST
  "Invisible Power": { type: 'GHOST', desc: "Completely invisible.", effects: { invisible: true } },
  "Ghost Ball": { type: 'GHOST', desc: "Flickers in and out.", effects: { ghost: true } },
  "Shadow Ball": { type: 'GHOST', desc: "Fades to shadow.", effects: { ghost: true, visualTrail: 'FADE' } },
  "Trail Fade": { type: 'GHOST', desc: "Leaves fading trail.", effects: { visualTrail: 'FADE' } },
  "Double Trail": { type: 'GHOST', desc: "Leaves double trail.", effects: { visualTrail: 'TWIN' } },
  
  // META / LUCK
  "Luck Boost": { type: 'LUCK', desc: "Increases luck.", effects: { luckBoost: 0.5 } },
  "Luck Transcendence": { type: 'LUCK', desc: "Extreme luck boost.", effects: { luckBoost: 3.0 } },
  "Lucky Score": { type: 'LUCK', desc: "Double points.", effects: { scoreMultiplier: 2 } },
  "Lucky Strike": { type: 'LUCK', desc: "Chance for bonus.", effects: { luckBoost: 1.0, scoreMultiplier: 1.5 } },

  // SPECIAL
  "Mirror Spin": { type: 'SPECIAL', desc: "Spawns visual clone.", effects: { visualTrail: 'TWIN' } },
  "Paddle Push": { type: 'SPECIAL', desc: "Knocks ball hard.", effects: { speedMultiplier: 1.4 } },
  "Echo Spin": { type: 'SPECIAL', desc: "Retraces path.", effects: { visualTrail: 'ECHO' } },
  
  // DOGWATER (Debuffs)
  "DOGWATER_SHRINK": { type: 'DOGWATER', desc: "Your paddle shrinks.", effects: { paddleScale: 0.6 } },
  "DOGWATER_SLOW": { type: 'DOGWATER', desc: "Your PADDLE moves slower.", effects: { paddleSpeed: 0.6 } },
  "DOGWATER_LAG": { type: 'DOGWATER', desc: "Extreme input lag (Slow Paddle).", effects: { paddleSpeed: 0.4 } },
  "DOGWATER_REVERSE": { type: 'DOGWATER', desc: "Your controls reversed.", effects: { reverseInput: true } }
};

// --- DATA LISTS (300+ Entries) ---

const GODLY_TITLES = [
  { name: "The Absolute", hex: "#FFFFFF", glow: "#000000", abilityKey: "Invisible Power" },
  { name: "Prime Origin", hex: "#FFD700", glow: "#FFA500", abilityKey: "Time Warp" },
  { name: "Eternal Singularity", hex: "#000000", glow: "#4B0082", abilityKey: "Chaos Bounce" },
  { name: "Omniversal Will", hex: "#E6E6FA", glow: "#FF00FF", abilityKey: "Teleport Spike" },
  { name: "Final Authority", hex: "#8B0000", glow: "#FF0000", abilityKey: "Stop And Go" }
];

const MYTHIC_TITLES = [ 
    "Worldrender", "Celestial Arbiter", "Fatebreaker", "Astral Sovereign", "Void Paragon", "Starbound Monarch", "Timelost King", "Reality Flayer", "Apex Seraph", "Chrono Tyrant", 
    "Infinite Judge", "Cosmic Executioner", "Heavenfall", "Black Sun Emperor", "Zenith Architect", "Astral Cataclysm", "Paradox Incarnate", "Empyrean Wrath", "Singularity Herald", "Godshard Ascendant",
    "Omni Bounce", "Phase Shift", "Teleport Guide", "Critical Warp", "Gravity Flip"
];

const LEGENDARY_TITLES = [ 
    "Celestial", "Voidwalker", "Eclipse Bearer", "Astral Knight", "Starforged", "Heavenbound", "Night Sovereign", "Sunpiercer", "Graviton Lord", "Storm Herald", 
    "Radiant Tyrant", "Void Tactician", "Cosmic Ronin", "Nebula Reaper", "Aetherbound", "Darkflare", "Void Emperor", "Chrono Vanguard", "Skybreaker", "Starfall", 
    "Void Pulse", "Astral Mirage", "Solar Exarch", "Dark Horizon", "Cosmic Duelist", "Abyss Sentinel", "Void Catalyst", "Astral Overlord", "Radiance Breaker", "Dark Ascendant", 
    "Stellar Monk", "Voidstorm", "Cosmic Edge", "Solar Revenant", "Void Navigator", "Astral Warden", "Eclipse Vanguard", "Starbreaker", "Voidbound Champion", "Astral Apex",
    "Time Warp", "Luck Transcendence", "Invisible Power", "Auto Align", "Curve Master", "Teleport Ball", "Ghost Ball", "Magnet Ball", "Freeze Paddle", "Double Speed"
];

const EPIC_TITLES = [ 
    "Stormcaller", "Frostbrand", "Shadowstep", "Pyroclast", "Lunar Veil", "Thunderstride", "Ironclad", "Windreaver", "Grim Sentinel", "Starflare", 
    "Void Echo", "Solarwing", "Nightfang", "Glacierheart", "Voltaic", "Ebonstrike", "Skyshard", "Moonbreaker", "Pyrewraith", "Celestium", 
    "Emberstorm", "Shatterfang", "Radiant Pulse", "Voidspike", "Frostfang", "Blazeheart", "Stormwraith", "Luminarch", "Shadowflare", "Thunderclap", 
    "Nightveil", "Astral Fang", "Flamebound", "Winterborne", "Gravitus", "Starwarden", "Voidflare", "Skyfang", "Solarflare", "Obsidian Edge", 
    "Emberwing", "Frostnova", "Nightstorm", "Thunderfang", "Shadowheart", "Pyrofang", "Moonshadow", "Skyreaper", "Starborne", "Gravestone", 
    "Voidreaper", "Stormfang", "Emberstrike", "Frostveil", "Nightflare", "Luminflare", "Shadowspire", "Skybreaker", "Solarborne", "Obsidian Fang", 
    "Pyrowraith", "Moonstrike", "Frostflare", "Emberveil", "Thunderveil", "Voidfang", "Starflare", "Skyveil", "Shadowfang", "Flameflare",
    "Speed Surge", "Sticky Glide", "Reverse Paddle", "Critical Strike", "Gravity Shift", "Chaos Bounce", "Shadow Ball", "Mirror Spin", "Lucky Score", "Rapid Return"
];

const RARE_TITLES = [ 
    "Ember Knight", "Frost Sentinel", "Shadow Archer", "Skyblade", "Lunar Sentinel", "Thunder Warden", "Ironfang", "Windblade", "Grimblade", "Starbound", 
    "Void Knight", "Solar Warden", "Night Stalker", "Glacier Knight", "Voltstrike", "Ebon Warden", "Skywarden", "Moonblade", "Pyre Knight", "Celestial Guard", 
    "Ember Warden", "Shatterblade", "Radiant Fang", "Void Sentinel", "Frostguard", "Blaze Warden", "Storm Knight", "Lumin Guard", "Shadow Sentinel", "Thunder Knight", 
    "Night Guard", "Astral Warden", "Flame Sentinel", "Winterguard", "Gravitus Knight", "Star Warden", "Void Knight", "Sky Warden", "Solar Knight", "Obsidian Guard", 
    "Emberblade", "Frost Knight", "Night Warden", "Thunderblade", "Shadow Guard", "Pyrowarden", "Moon Warden", "Sky Sentinel", "Star Knight", "Gravestone Warden", 
    "Voidblade", "Storm Warden", "Ember Guard", "Frost Warden", "Nightblade", "Lumin Knight", "Shadowblade", "Sky Knight", "Solar Warden", "Obsidian Warden", 
    "Pyroblade", "Moon Knight", "Frostblade", "Ember Knight", "Thunder Warden", "Void Warden", "Starblade", "Skyblade", "Shadow Knight", "Flame Warden", 
    "Night Fang", "Frost Fang", "Ember Fang", "Sky Fang", "Void Fang", "Solar Fang", "Shadow Fang", "Thunder Fang", "Moon Fang", "Star Fang",
    "Sticky Ball", "Curve Shot", "Zigzag Shot", "Paddle Push", "Enlarge Paddle", "Shrink Paddle", "Lucky Strike", "Auto Return", "Magnet Paddle", "Gravity Echo"
];

const UNCOMMON_TITLES = [ 
    "Flamebearer", "Icebreaker", "Shadowmend", "Skywarden", "Moonstriker", "Thunderborn", "Ironclaw", "Windstalker", "Grimshadow", "Starwatcher", 
    "Voidwalker", "Solarchaser", "Nightprowler", "Glacierborn", "Voltshard", "Ebonyfang", "Skyrunner", "Moonwatcher", "Pyrestalker", "Celestguard", 
    "Emberstorm", "Shatterfang", "Radiantfang", "Voidmender", "Frostfang", "Blazeguard", "Stormhunter", "Luminblade", "Shadowhunter", "Thunderstrike", 
    "Nightwarden", "Astralblade", "Flameshard", "Winterfang", "Gravblade", "Starhunter", "Voidhunter", "Skyhunter", "Solarguard", "Obsidianfang", 
    "Emberblade", "Frostblade", "Nightblade", "Thunderfang", "Shadowfang", "Pyroblade", "Moonblade", "Frostfang", "Emberfang", "Skyfang",
    "Slow Ball", "Extended Paddle", "Tiny Paddle", "Double Trail", "Luck Boost", "Quick Paddle", "Paddle Boost"
];

const COMMON_TITLES = [ 
    "Flame Adept", "Ice Adept", "Shadow Adept", "Sky Adept", "Moon Adept", "Thunder Adept", "Iron Adept", "Wind Adept", "Grim Adept", "Star Adept", 
    "Void Adept", "Solar Adept", "Night Adept", "Glacier Adept", "Volt Adept", "Ebony Adept", "Sky Adept", "Moon Adept", "Pyre Adept", "Celestial Adept", 
    "Ember Adept", "Shatter Adept", "Radiant Adept", "Frost Adept", "Storm Adept",
    "Trail Fade", "Echo Spin", "Minor Curve", "Minor Speed", "Ball Glow", "Sticky Hit"
];

const DOGWATER_TITLES = [ 
    "Wetstick", "Mudball", "Pebblebop", "Tiny Twig", "Soggy Sock", "Halfbrick", "Dustcloud", "Squishy", "Flopshard", "Crumpled Leaf",
    "Lag Paddle", "Sticky Paddle Fail", "Reverse Control Fail", "Slow Paddle", "Shrinking Paddle"
];

// --- GENERATOR LOGIC ---
const FALLBACK_KEYS = Object.keys(ABILITY_POOL).filter(k => !k.includes("DOGWATER"));

const getAbilityForTitle = (name: string, tier: RarityTier): AuraAbility => {
  const n = name.toLowerCase();
  let key = "";

  // 1. Precise Keyword Matching
  if (n.includes("time") || n.includes("chrono")) key = "Time Warp";
  else if (n.includes("freeze") && n.includes("paddle")) key = "Freeze Paddle";
  else if (n.includes("freeze") || n.includes("ice") || n.includes("glacier")) key = "Freeze Ball";
  else if (n.includes("stop") || n.includes("halt")) key = "Stop And Go";
  else if (n.includes("phase") || n.includes("pass")) key = "Phase Shift";
  else if (n.includes("teleport") || n.includes("warp")) key = "Teleport Ball";
  else if (n.includes("spike") || n.includes("edge")) key = "Teleport Spike";
  else if (n.includes("gravity") && n.includes("echo")) key = "Gravity Echo";
  else if (n.includes("gravity") && n.includes("flip")) key = "Gravity Flip";
  else if (n.includes("gravity")) key = "Gravity Shift";
  else if (n.includes("arc") || n.includes("curve") && n.includes("master")) key = "Curve Master";
  else if (n.includes("curve")) key = "Curve Shot";
  else if (n.includes("zigzag") || n.includes("shock")) key = "Zigzag Shot";
  else if (n.includes("chaos") || n.includes("random") || n.includes("omni")) key = "Chaos Bounce";
  else if (n.includes("magnet") && n.includes("paddle")) key = "Magnet Paddle";
  else if (n.includes("magnet") || n.includes("pull")) key = "Magnet Ball";
  else if (n.includes("sticky") && n.includes("glide")) key = "Sticky Glide";
  else if (n.includes("sticky")) key = "Sticky Ball";
  else if (n.includes("return") && n.includes("rapid")) key = "Rapid Return";
  else if (n.includes("return") || n.includes("align")) key = "Auto Return";
  else if (n.includes("reverse") && n.includes("paddle")) key = "Reverse Paddle";
  else if (n.includes("reverse") || n.includes("invert")) key = "Reverse Controls";
  else if (n.includes("large") || n.includes("giant") || n.includes("titan")) key = "Enlarge Paddle";
  else if (n.includes("extend") || n.includes("long")) key = "Extended Paddle";
  else if (n.includes("shrink") || n.includes("tiny")) key = "Shrink Paddle";
  else if (n.includes("double") && n.includes("speed")) key = "Double Speed";
  else if (n.includes("speed") || n.includes("surge") || n.includes("flash")) key = "Speed Surge";
  else if (n.includes("slow") && n.includes("ball")) key = "Slow Ball";
  else if (n.includes("critical") || n.includes("crit")) key = "Critical Strike";
  else if (n.includes("invisible") || n.includes("hidden") || n.includes("absolute")) key = "Invisible Power";
  else if (n.includes("ghost") || n.includes("spirit")) key = "Ghost Ball";
  else if (n.includes("shadow") || n.includes("shade")) key = "Shadow Ball";
  else if (n.includes("trail") && n.includes("fade")) key = "Trail Fade";
  else if (n.includes("luck") && n.includes("transcend")) key = "Luck Transcendence";
  else if (n.includes("luck") || n.includes("fortune")) key = "Luck Boost";
  else if (n.includes("score") || n.includes("point")) key = "Lucky Score";
  else if (n.includes("mirror") || n.includes("clone")) key = "Mirror Spin";
  else if (n.includes("push") || n.includes("force")) key = "Paddle Push";
  else if (n.includes("echo")) key = "Echo Spin";
  else if (n.includes("quick")) key = "Quick Paddle";
  else if (n.includes("boost") && n.includes("paddle")) key = "Paddle Boost";

  // Dogwater specific
  if (tier === RarityTier.DOGWATER) {
      if (n.includes("stick")) key = "DOGWATER_SHRINK";
      else if (n.includes("lag")) key = "DOGWATER_LAG";
      else if (n.includes("reverse")) key = "DOGWATER_REVERSE";
      else key = "DOGWATER_SLOW";
  }

  // Fallback
  if (!key) {
      let hash = 0;
      for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
      key = FALLBACK_KEYS[Math.abs(hash) % FALLBACK_KEYS.length];
  }

  const def = ABILITY_POOL[key] || ABILITY_POOL["Speed Surge"];

  // RARITY SCALING
  const tierMult = {
      [RarityTier.DOGWATER]: 0.5,
      [RarityTier.COMMON]: 1.0,
      [RarityTier.UNCOMMON]: 1.1,
      [RarityTier.RARE]: 1.25,
      [RarityTier.EPIC]: 1.5,
      [RarityTier.LEGENDARY]: 1.75,
      [RarityTier.MYTHIC]: 2.5,
      [RarityTier.GODLY]: 4.0,
  }[tier];

  return {
    type: def.type,
    name: key,
    description: def.desc,
    effects: def.effects,
    duration: Math.min(10000, 1500 * tierMult), 
    cooldown: Math.max(2000, 12000 / tierMult) 
  };
};

const determineVisuals = (name: string, tier: RarityTier): { hex: string, glow: string } => {
    const n = name.toLowerCase();
    let hex = '#FFFFFF';
    let glow = '#FFFFFF';

    if (n.includes('fire') || n.includes('pyro') || n.includes('ember') || n.includes('sun')) { hex = '#ef4444'; glow = '#f87171'; }
    else if (n.includes('water') || n.includes('ice') || n.includes('blue') || n.includes('frost')) { hex = '#3b82f6'; glow = '#60a5fa'; }
    else if (n.includes('void') || n.includes('dark') || n.includes('shadow') || n.includes('black')) { hex = '#9333ea'; glow = '#a855f7'; }
    else if (n.includes('nature') || n.includes('leaf') || n.includes('green') || n.includes('acid')) { hex = '#22c55e'; glow = '#4ade80'; }
    else if (n.includes('gold') || n.includes('light') || n.includes('divine') || n.includes('star')) { hex = '#eab308'; glow = '#facc15'; }
    else if (n.includes('blood') || n.includes('crimson') || n.includes('red')) { hex = '#dc2626'; glow = '#ef4444'; }
    else {
        let hash = 0;
        for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
        const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
        hex = '#' + '00000'.substring(0, 6 - c.length) + c;
        glow = hex;
    }
    if (tier === RarityTier.DOGWATER) { hex = '#78350f'; glow = '#92400e'; }
    if (tier === RarityTier.GODLY && name === "The Absolute") { hex = '#ffffff'; glow = '#ffffff'; }
    return { hex, glow };
};

const createAura = (name: string, tier: RarityTier, chance: number, predef?: {abilityKey: string, hex: string, glow: string}): Aura => {
  let ability = getAbilityForTitle(name, tier);
  let visuals = determineVisuals(name, tier);
  if (predef) {
      const def = ABILITY_POOL[predef.abilityKey];
      ability = {
          type: def.type, name: predef.abilityKey, description: def.desc, effects: def.effects,
          duration: 4000, cooldown: 8000
      };
      visuals = { hex: predef.hex, glow: predef.glow };
  }
  let textColor = 'text-white';
  if (visuals.hex.toLowerCase().includes('f') && visuals.hex.toLowerCase().includes('00')) textColor = 'text-yellow-400';
  
  return {
    id: name.toLowerCase().replace(/\s/g, '-'),
    name, chance, tier, color: textColor,
    hex: visuals.hex, glowColor: visuals.glow,
    stats: { paddleHeightScale: 1.0, paddleSpeedScale: 1.0 },
    ability
  };
};

const generatedAuras: Aura[] = [];
GODLY_TITLES.forEach(g => generatedAuras.push(createAura(g.name, RarityTier.GODLY, 100000, { abilityKey: g.abilityKey, hex: g.hex, glow: g.glow })));
MYTHIC_TITLES.forEach(n => generatedAuras.push(createAura(n, RarityTier.MYTHIC, 10000)));
LEGENDARY_TITLES.forEach(n => generatedAuras.push(createAura(n, RarityTier.LEGENDARY, 1000)));
EPIC_TITLES.forEach(n => generatedAuras.push(createAura(n, RarityTier.EPIC, 100)));
RARE_TITLES.forEach(n => generatedAuras.push(createAura(n, RarityTier.RARE, 20)));
UNCOMMON_TITLES.forEach(n => generatedAuras.push(createAura(n, RarityTier.UNCOMMON, 8)));
COMMON_TITLES.forEach(n => generatedAuras.push(createAura(n, RarityTier.COMMON, 4)));
DOGWATER_TITLES.forEach(n => generatedAuras.push(createAura(n, RarityTier.DOGWATER, 2)));

export const AURAS = generatedAuras;

export const getRandomAura = (luck: number = 1.0): Aura => {
  // Determine minimum allowed tier based on luck threshold
  let minTierVal = 0;
  if (luck >= 10.0) minTierVal = TIER_ORDER[RarityTier.LEGENDARY]; // 5
  else if (luck >= 5.0) minTierVal = TIER_ORDER[RarityTier.EPIC]; // 4

  // Filter aura pool
  const validAuras = AURAS.filter(a => TIER_ORDER[a.tier] >= minTierVal);
  
  // Calculate tier chances
  const tierChances: Partial<Record<RarityTier, number>> = {};
  validAuras.forEach(a => { if (!tierChances[a.tier]) tierChances[a.tier] = a.chance; });
  
  // Sort tiers by Rarity (Highest to Lowest)
  // Note: chance is '1 in X', so higher X is rarer.
  const tiers = Object.keys(tierChances) as RarityTier[];
  tiers.sort((a, b) => (tierChances[b] || 0) - (tierChances[a] || 0));

  const rand = Math.random();
  for (const tier of tiers) {
    const chanceOneInX = tierChances[tier] || 1;
    // Luck multiplies the PROBABILITY (so 1/1000 becomes 1/100 with 10x luck)
    const probability = Math.min(1, (1 / chanceOneInX) * luck);
    if (rand < probability) {
      const pool = validAuras.filter(a => a.tier === tier);
      if (pool.length > 0) return pool[Math.floor(Math.random() * pool.length)];
    }
  }
  
  // Fallback Logic (Guaranteed minimum)
  // Identify the lowest allowed tier available in validAuras
  let lowestTier = RarityTier.COMMON;
  let minValFound = 999;
  
  const presentTiers = Array.from(new Set(validAuras.map(a => a.tier)));
  presentTiers.forEach(t => {
      if (TIER_ORDER[t] < minValFound) {
          minValFound = TIER_ORDER[t];
          lowestTier = t;
      }
  });

  const fallbackPool = validAuras.filter(a => a.tier === lowestTier);
  return fallbackPool.length > 0 
    ? fallbackPool[Math.floor(Math.random() * fallbackPool.length)]
    : AURAS[0]; // Absolute fallback should never happen
};

export const getShopPrice = (tier: RarityTier): number => {
    switch (tier) {
      case RarityTier.DOGWATER: return 5; case RarityTier.COMMON: return 10;
      case RarityTier.UNCOMMON: return 25; case RarityTier.RARE: return 50;
      case RarityTier.EPIC: return 150; case RarityTier.LEGENDARY: return 500;
      case RarityTier.MYTHIC: return 2500; case RarityTier.GODLY: return 10000;
      default: return 10;
    }
};

export const generateShopItems = (): ShopItem[] => {
    const items: ShopItem[] = [];
    const highTierPool = AURAS.filter(a => [RarityTier.RARE, RarityTier.EPIC, RarityTier.LEGENDARY, RarityTier.MYTHIC].includes(a.tier));
    for (let i = 0; i < 2; i++) {
        const aura = highTierPool[Math.floor(Math.random() * highTierPool.length)];
        items.push({ id: `shop-${Date.now()}-${i}`, aura, price: getShopPrice(aura.tier), sold: false });
    }
    const SHOP_LUCK = 8.0; 
    for (let i = 2; i < SHOP_SIZE; i++) {
      const aura = getRandomAura(SHOP_LUCK);
      items.push({ id: `shop-${Date.now()}-${i}`, aura, price: getShopPrice(aura.tier), sold: false });
    }
    return items.sort(() => Math.random() - 0.5);
};
