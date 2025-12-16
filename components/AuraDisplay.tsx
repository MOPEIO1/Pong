import React, { useEffect, useState } from 'react';
import { Aura, RarityTier } from '../types';
import { TIER_ORDER, getTierColor } from '../constants';

interface AuraDisplayProps {
  aura: Aura | null;
  isRolling: boolean;
}

const AuraDisplay: React.FC<AuraDisplayProps> = ({ aura, isRolling }) => {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (aura) {
      setAnimate(true);
      const timer = setTimeout(() => setAnimate(false), 500);
      return () => clearTimeout(timer);
    }
  }, [aura]);

  if (isRolling) {
    return (
      <div className="h-64 flex flex-col items-center justify-center animate-pulse">
        <div className="text-6xl font-display font-bold text-white/20 blur-sm animate-bounce">
          ???
        </div>
        <div className="mt-4 text-sm text-gray-500 uppercase tracking-widest">
          Aligning Stars...
        </div>
      </div>
    );
  }

  if (!aura) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-gray-600">
        <p>Press Roll to Begin</p>
      </div>
    );
  }

  const isRare = TIER_ORDER[aura.tier] >= TIER_ORDER[RarityTier.LEGENDARY];
  const isMythicPlus = TIER_ORDER[aura.tier] >= TIER_ORDER[RarityTier.MYTHIC];
  const isGodly = aura.tier === RarityTier.GODLY;
  const isDogwater = aura.tier === RarityTier.DOGWATER;

  return (
    <div className={`h-64 flex flex-col items-center justify-center transition-all duration-300 ${animate ? 'scale-110' : 'scale-100'}`}>
      <div className={`
        relative px-12 py-8 rounded-xl border-2 backdrop-blur-md
        flex flex-col items-center
        ${getTierColor(aura.tier)}
        transition-all duration-500
        ${isGodly ? 'shadow-[0_0_100px_rgba(255,255,255,0.8)] border-4' : ''}
        ${isDogwater ? 'opacity-70 rotate-1' : ''}
        ${isMythicPlus ? 'animate-pulse' : ''}
      `}>
        {/* Background glow for rares */}
        {isRare && (
          <div 
            className="absolute inset-0 rounded-xl blur-xl -z-10 opacity-50"
            style={{ backgroundColor: aura.glowColor }}
          ></div>
        )}

        <h2 className="text-lg text-white/60 font-medium tracking-widest uppercase mb-2">
          {aura.tier}
        </h2>
        
        <h1 className={`text-5xl md:text-7xl font-display font-black tracking-tighter uppercase drop-shadow-2xl ${aura.color} ${isRare ? 'animate-float' : ''} ${isGodly ? 'animate-shine bg-clip-text text-transparent bg-gradient-to-r from-white via-yellow-200 to-white' : ''}`}>
          {aura.name}
        </h1>
        
        <div className="mt-4 flex items-center gap-2 px-3 py-1 bg-black/40 rounded-full border border-white/10">
          <span className="text-xs text-gray-300 uppercase">Chance</span>
          <span className="text-sm font-bold text-white">1 in {aura.chance.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};

export default AuraDisplay;