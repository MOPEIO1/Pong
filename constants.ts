import { Aura, RarityTier, PlayerControls, AbilityType, AuraAbility, ShopItem } from './types';

// Game Physics Constants
export const GAME_WIDTH = 800;
export const GAME_HEIGHT = 600;
export const PADDLE_WIDTH = 20;
export const BASE_PADDLE_HEIGHT = 100;
export const BALL_SIZE = 12;
export const BASE_PADDLE_SPEED = 7;
export const BASE_BALL_SPEED = 4;
export const MAX_HP = 100;
export const DAMAGE_PER_HIT = 25;
export const ROLLS_PER_GAME = 5;

// Economy Constants
export const COINS_PER_MATCH = 5;
export const SHOP_REFRESH_MS = 20 * 60 * 1000; // 20 minutes
export const SHOP_SIZE = 6;

export const DEFAULT_CONTROLS_P1: PlayerControls = {
  up: 'KeyW',
  down: 'KeyS',
  action: 'KeyE', 
  ready: 'KeyA'   
};

export const DEFAULT_CONTROLS_P2: PlayerControls = {
  up: 'ArrowUp',
  down: 'ArrowDown',
  action: 'KeyP', 
  ready: 'ArrowRight'  
};

// --- DATA LISTS ---
const GODLY_TITLES = [
  { name: "The Absolute", hex: "#FFFFFF", glow: "#000000", ability: "Reality Lock", type: "ENLARGE_PADDLE" },
  { name: "Prime Origin", hex: "#FFD700", glow: "#FFA500", ability: "Big Bang", type: "SPEED_BOOST" },
  { name: "Eternal Singularity", hex: "#000000", glow: "#4B0082", ability: "Event Horizon", type: "CURVE_SHOT" },
  { name: "Omniversal Will", hex: "#E6E6FA", glow: "#FF00FF", ability: "Command", type: "GHOST_BALL" },
  { name: "Final Authority", hex: "#8B0000", glow: "#FF0000", ability: "Verdict", type: "STOP_AND_GO" }
];

const MYTHIC_TITLES = [
  "Worldrender", "Celestial Arbiter", "Fatebreaker", "Astral Sovereign", "Void Paragon",
  "Starbound Monarch", "Timelost King", "Reality Flayer", "Apex Seraph", "Chrono Tyrant",
  "Infinite Judge", "Cosmic Executioner", "Heavenfall", "Black Sun Emperor", "Zenith Architect",
  "Astral Cataclysm", "Paradox Incarnate", "Empyrean Wrath", "Singularity Herald", "Godshard Ascendant"
];

const LEGENDARY_TITLES = [
  "Celestial", "Voidwalker", "Eclipse Bearer", "Astral Knight", "Starforged", "Heavenbound", "Night Sovereign", "Sunpiercer", "Graviton Lord", "Storm Herald",
  "Radiant Tyrant", "Void Tactician", "Cosmic Ronin", "Nebula Reaper", "Aetherbound", "Darkflare", "Void Emperor", "Chrono Vanguard", "Skybreaker", "Starfall",
  "Void Pulse", "Astral Mirage", "Solar Exarch", "Dark Horizon", "Cosmic Duelist", "Abyss Sentinel", "Void Catalyst", "Astral Overlord", "Radiance Breaker", "Dark Ascendant",
  "Stellar Monk", "Voidstorm", "Cosmic Edge", "Solar Revenant", "Void Navigator", "Astral Warden", "Eclipse Vanguard", "Starbreaker", "Voidbound Champion", "Astral Apex"
];

const EPIC_TITLES = [
  "Stormcaller", "Frostbrand", "Shadowstep", "Pyroclast", "Lunar Veil", "Thunderstride", "Ironclad", "Windreaver", "Grim Sentinel", "Starflare",
  "Void Echo", "Solarwing", "Nightfang", "Glacierheart", "Voltaic", "Ebonstrike", "Skyshard", "Moonbreaker", "Pyrewraith", "Celestium",
  "Emberstorm", "Shatterfang", "Radiant Pulse", "Voidspike", "Frostfang", "Blazeheart", "Stormwraith", "Luminarch", "Shadowflare", "Thunderclap",
  "Nightveil", "Astral Fang", "Flamebound", "Winterborne", "Gravitus", "Starwarden", "Voidflare", "Skyfang", "Solarflare", "Obsidian Edge",
  "Emberwing", "Frostnova", "Nightstorm", "Thunderfang", "Shadowheart", "Pyrofang", "Moonshadow", "Skyreaper", "Starborne", "Gravestone",
  "Voidreaper", "Stormfang", "Emberstrike", "Frostveil", "Nightflare", "Luminflare", "Shadowspire", "Skybreaker", "Solarborne", "Obsidian Fang",
  "Pyrowraith", "Moonstrike", "Frostflare", "Emberveil", "Thunderveil", "Voidfang", "Starflare", "Skyveil", "Shadowfang", "Flameflare"
];

const RARE_TITLES = [
  "Ember Knight", "Frost Sentinel", "Shadow Archer", "Skyblade", "Lunar Sentinel", "Thunder Warden", "Ironfang", "Windblade", "Grimblade", "Starbound",
  "Void Knight", "Solar Warden", "Night Stalker", "Glacier Knight", "Voltstrike", "Ebon Warden", "Skywarden", "Moonblade", "Pyre Knight", "Celestial Guard",
  "Ember Warden", "Shatterblade", "Radiant Fang", "Void Sentinel", "Frostguard", "Blaze Warden", "Storm Knight", "Lumin Guard", "Shadow Sentinel", "Thunder Knight",
  "Night Guard", "Astral Warden", "Flame Sentinel", "Winterguard", "Gravitus Knight", "Star Warden", "Void Knight", "Sky Warden", "Solar Knight", "Obsidian Guard",
  "Emberblade", "Frost Knight", "Night Warden", "Thunderblade", "Shadow Guard", "Pyrowarden", "Moon Warden", "Sky Sentinel", "Star Knight", "Gravestone Warden",
  "Voidblade", "Storm Warden", "Ember Guard", "Frost Warden", "Nightblade", "Lumin Knight", "Shadowblade", "Sky Knight", "Solar Warden", "Obsidian Warden",
  "Pyroblade", "Moon Knight", "Frostblade", "Ember Knight", "Thunder Warden", "Void Warden", "Starblade", "Skyblade", "Shadow Knight", "Flame Warden",
  "Night Fang", "Frost Fang", "Ember Fang", "Sky Fang", "Void Fang", "Solar Fang", "Shadow Fang", "Thunder Fang", "Moon Fang", "Star Fang"
];

const UNCOMMON_TITLES = [
  "Flamebearer", "Icebreaker", "Shadowmend", "Skywarden", "Moonstriker", "Thunderborn", "Ironclaw", "Windstalker", "Grimshadow", "Starwatcher",
  "Voidwalker", "Solarchaser", "Nightprowler", "Glacierborn", "Voltshard", "Ebonyfang", "Skyrunner", "Moonwatcher", "Pyrestalker", "Celestguard",
  "Emberstorm", "Shatterfang", "Radiantfang", "Voidmender", "Frostfang", "Blazeguard", "Stormhunter", "Luminblade", "Shadowhunter", "Thunderstrike",
  "Nightwarden", "Astralblade", "Flameshard", "Winterfang", "Gravblade", "Starhunter", "Voidhunter", "Skyhunter", "Solarguard", "Obsidianfang",
  "Emberblade", "Frostblade", "Nightblade", "Thunderfang", "Shadowfang", "Pyroblade", "Moonblade", "Frostfang", "Emberfang", "Skyfang"
];

const COMMON_TITLES = [
  "Flame Adept", "Ice Adept", "Shadow Adept", "Sky Adept", "Moon Adept", "Thunder Adept", "Iron Adept", "Wind Adept", "Grim Adept", "Star Adept",
  "Void Adept", "Solar Adept", "Night Adept", "Glacier Adept", "Volt Adept", "Ebony Adept", "Sky Adept", "Moon Adept", "Pyre Adept", "Celestial Adept",
  "Ember Adept", "Shatter Adept", "Radiant Adept", "Frost Adept", "Storm Adept"
];

const DOGWATER_TITLES = [
  "Wetstick", "Mudball", "Pebblebop", "Tiny Twig", "Soggy Sock", "Halfbrick", "Dustcloud", "Squishy", "Flopshard", "Crumpled Leaf"
];

// --- GENERATOR HELPERS ---

const pickAbilityFromHash = (name: string): AbilityType => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const abilities: AbilityType[] = ['SPEED_BOOST', 'CURVE_SHOT', 'WOBBLE_SHOT', 'ZIGZAG_SHOT', 'ENLARGE_PADDLE'];
  return abilities[Math.abs(hash) % abilities.length];
};

const determineStatsAndAbility = (name: string, tier: RarityTier): { stats: any, ability: AuraAbility, hex: string, glow: string } => {
  const n = name.toLowerCase();
  
  let abilityType: AbilityType = 'SPEED_BOOST';
  let hex = '#FFFFFF';
  let glow = '#FFFFFF';
  let speed = 1.0;
  let height = 1.0;

  if (n.includes('fire') || n.includes('pyro') || n.includes('flame') || n.includes('blaze') || n.includes('ember') || n.includes('solar') || n.includes('sun')) {
    hex = '#ef4444'; glow = '#f87171'; abilityType = 'SPEED_BOOST'; speed = 1.2;
  } else if (n.includes('water') || n.includes('ice') || n.includes('frost') || n.includes('tide') || n.includes('glacier') || n.includes('blue') || n.includes('wet')) {
    hex = '#3b82f6'; glow = '#60a5fa'; abilityType = 'STOP_AND_GO'; height = 1.1;
  } else if (n.includes('void') || n.includes('shadow') || n.includes('night') || n.includes('dark') || n.includes('abyss') || n.includes('obsidian')) {
    hex = '#9333ea'; glow = '#a855f7'; abilityType = 'GHOST_BALL'; speed = 1.1;
  } else if (n.includes('star') || n.includes('astral') || n.includes('cosmic') || n.includes('space') || n.includes('galaxy') || n.includes('celestial')) {
    hex = '#eab308'; glow = '#facc15'; abilityType = 'WOBBLE_SHOT'; speed = 1.15;
  } else if (n.includes('wind') || n.includes('storm') || n.includes('sky') || n.includes('air') || n.includes('thunder')) {
    hex = '#06b6d4'; glow = '#22d3ee'; abilityType = 'CURVE_SHOT'; speed = 1.25;
  } else if (n.includes('iron') || n.includes('rock') || n.includes('stone') || n.includes('earth') || n.includes('grim') || n.includes('brick')) {
    hex = '#78716c'; glow = '#a8a29e'; abilityType = 'ENLARGE_PADDLE'; height = 1.3; speed = 0.9;
  } else if (n.includes('leaf') || n.includes('twig') || n.includes('mud')) {
    hex = '#57534e'; glow = '#78716c'; abilityType = 'SHRINK_PADDLE'; speed = 0.8; 
  } else if (n.includes('lightning') || n.includes('volt') || n.includes('shock') || n.includes('flash')) {
    hex = '#fef08a'; glow = '#ffff00'; abilityType = 'ZIGZAG_SHOT'; speed = 1.4;
  } else {
    abilityType = pickAbilityFromHash(name);
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
    hex = '#' + '00000'.substring(0, 6 - c.length) + c;
    glow = hex;
  }

  if (tier === RarityTier.DOGWATER) {
      abilityType = 'SHRINK_PADDLE'; 
      height = 0.7;
      speed = 0.8;
  }

  const tierMult = {
    [RarityTier.DOGWATER]: 0.8,
    [RarityTier.COMMON]: 1.0,
    [RarityTier.UNCOMMON]: 1.05,
    [RarityTier.RARE]: 1.1,
    [RarityTier.EPIC]: 1.15,
    [RarityTier.LEGENDARY]: 1.2,
    [RarityTier.MYTHIC]: 1.3,
    [RarityTier.GODLY]: 1.5,
  }[tier];

  const descriptions: Record<AbilityType, string> = {
      'SPEED_BOOST': 'Ball accelerates massively on hit',
      'CURVE_SHOT': 'Ball curves in mid-air',
      'GHOST_BALL': 'Ball becomes invisible briefly',
      'ENLARGE_PADDLE': 'Paddle grows in size',
      'SHRINK_PADDLE': 'Paddle shrinks (Challenge Mode!)',
      'WOBBLE_SHOT': 'Ball destabilizes and vibrates',
      'ZIGZAG_SHOT': 'Ball moves in unpredictable angles',
      'STOP_AND_GO': 'Ball freezes then launches'
  };

  return {
    stats: {
      paddleHeightScale: height * (tier === RarityTier.DOGWATER ? 0.8 : 1.0),
      paddleSpeedScale: speed * tierMult
    },
    ability: {
      type: abilityType,
      name: `${name.split(' ')[0]} ${abilityType.split('_')[0]}`, 
      duration: 1000 + (tierMult * 1000),
      cooldown: Math.max(3000, 10000 - (tierMult * 2000)),
      description: descriptions[abilityType]
    },
    hex,
    glow
  };
};

const createAura = (name: string, tier: RarityTier, chance: number): Aura => {
  const { stats, ability, hex, glow } = determineStatsAndAbility(name, tier);
  
  let finalAbility = ability;
  if (tier === RarityTier.GODLY) {
    const g = GODLY_TITLES.find(t => t.name === name);
    if (g) {
      finalAbility = { ...ability, name: g.ability, type: g.type as AbilityType, duration: 4000, cooldown: 8000 };
    }
  }

  let textColor = 'text-white';
  if (hex.includes('#ef') || hex.includes('#f8')) textColor = 'text-red-500';
  else if (hex.includes('#3b') || hex.includes('#60')) textColor = 'text-blue-400';
  else if (hex.includes('#93') || hex.includes('#a8')) textColor = 'text-purple-400';
  else if (hex.includes('#ea') || hex.includes('#fa') || hex === '#FFD700') textColor = 'text-yellow-400';
  else if (hex.includes('#06') || hex.includes('#22')) textColor = 'text-cyan-400';
  else if (hex === '#000000') textColor = 'text-gray-900';
  else if (tier === RarityTier.DOGWATER) textColor = 'text-amber-700';

  return {
    id: name.toLowerCase().replace(/\s/g, '-'),
    name,
    chance,
    tier,
    color: textColor,
    hex: tier === RarityTier.GODLY && name === "The Absolute" ? '#FFFFFF' : hex,
    glowColor: glow,
    stats,
    ability: finalAbility
  };
};

// --- AURA GENERATION ---
const generatedAuras: Aura[] = [];

GODLY_TITLES.forEach(g => generatedAuras.push(createAura(g.name, RarityTier.GODLY, 100000)));
MYTHIC_TITLES.forEach(n => generatedAuras.push(createAura(n, RarityTier.MYTHIC, 10000)));
LEGENDARY_TITLES.forEach(n => generatedAuras.push(createAura(n, RarityTier.LEGENDARY, 1000)));
EPIC_TITLES.forEach(n => generatedAuras.push(createAura(n, RarityTier.EPIC, 100)));
RARE_TITLES.forEach(n => generatedAuras.push(createAura(n, RarityTier.RARE, 20)));
UNCOMMON_TITLES.forEach(n => generatedAuras.push(createAura(n, RarityTier.UNCOMMON, 7)));
COMMON_TITLES.forEach(n => generatedAuras.push(createAura(n, RarityTier.COMMON, 3)));
DOGWATER_TITLES.forEach(n => generatedAuras.push(createAura(n, RarityTier.DOGWATER, 3)));

export const AURAS = generatedAuras;

export const getRandomAura = (luck: number = 1.0): Aura => {
  const rand = Math.random(); 
  const sorted = [...AURAS].sort((a, b) => b.chance - a.chance);
  
  for (const aura of sorted) {
    const probability = Math.min(1, (1 / aura.chance) * luck);
    if (rand < probability) {
       return aura;
    }
  }
  
  return AURAS.find(a => a.tier === RarityTier.DOGWATER) || AURAS[AURAS.length - 1];
};

// --- SHOP HELPERS ---

export const getShopPrice = (tier: RarityTier): number => {
  switch (tier) {
    case RarityTier.DOGWATER: return 5;
    case RarityTier.COMMON: return 5;
    case RarityTier.UNCOMMON: return 10;
    case RarityTier.RARE: return 20;
    case RarityTier.EPIC: return 50;
    case RarityTier.LEGENDARY: return 150;
    case RarityTier.MYTHIC: return 500;
    case RarityTier.GODLY: return 2000;
    default: return 10;
  }
};

export const generateShopItems = (): ShopItem[] => {
  const items: ShopItem[] = [];
  const SHOP_LUCK = 5.0; // Shop has much better luck to find cooler titles

  for (let i = 0; i < SHOP_SIZE; i++) {
    const aura = getRandomAura(SHOP_LUCK);
    items.push({
      id: `shop-${Date.now()}-${i}`,
      aura,
      price: getShopPrice(aura.tier),
      sold: false
    });
  }
  return items;
};


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
  [RarityTier.DOGWATER]: 0,
  [RarityTier.COMMON]: 1,
  [RarityTier.UNCOMMON]: 2,
  [RarityTier.RARE]: 3,
  [RarityTier.EPIC]: 4,
  [RarityTier.LEGENDARY]: 5,
  [RarityTier.MYTHIC]: 6,
  [RarityTier.GODLY]: 7,
};

export const getTierColor = (tier: RarityTier): string => {
  return TIER_COLOR_MAP[tier] || 'border-gray-500';
};