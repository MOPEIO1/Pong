import React from 'react';
import { Sparkles, Zap, Play, Pause } from 'lucide-react';

interface RollButtonProps {
  onRoll: () => void;
  isRolling: boolean;
  autoRoll: boolean;
  toggleAutoRoll: () => void;
  canRoll: boolean;
}

const RollButton: React.FC<RollButtonProps> = ({ 
  onRoll, 
  isRolling, 
  autoRoll, 
  toggleAutoRoll,
  canRoll
}) => {
  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-md mx-auto">
      <button
        onClick={onRoll}
        disabled={isRolling || !canRoll}
        className={`
          relative group w-64 h-64 rounded-full flex flex-col items-center justify-center
          transition-all duration-200 transform
          ${isRolling ? 'scale-95 opacity-80 cursor-wait' : 'hover:scale-105 active:scale-95 cursor-pointer'}
          ${canRoll ? 'bg-gradient-to-b from-indigo-600 to-purple-800 shadow-[0_0_50px_rgba(79,70,229,0.5)]' : 'bg-gray-700 opacity-50'}
          border-4 border-indigo-400/30
        `}
      >
        <div className="absolute inset-0 rounded-full bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 animate-spin-slow"></div>
        
        {/* Inner Ring */}
        <div className="absolute inset-4 rounded-full border-2 border-white/10 flex items-center justify-center overflow-hidden">
             {isRolling && (
               <div className="absolute inset-0 bg-white/10 animate-pulse"></div>
             )}
        </div>

        <span className="font-display font-bold text-4xl tracking-widest text-white drop-shadow-lg z-10 group-hover:text-indigo-200 transition-colors">
          {isRolling ? 'ROLLING' : 'ROLL'}
        </span>
        <Sparkles className={`w-8 h-8 text-yellow-300 absolute top-12 ${isRolling ? 'animate-ping' : ''}`} />
      </button>

      <div className="flex gap-4">
        <button
          onClick={toggleAutoRoll}
          className={`
            flex items-center gap-2 px-6 py-3 rounded-lg font-bold text-sm tracking-wider uppercase
            border transition-all duration-300
            ${autoRoll 
              ? 'bg-green-500/20 border-green-500 text-green-400 shadow-[0_0_15px_rgba(74,222,128,0.3)]' 
              : 'bg-gray-800/50 border-gray-600 text-gray-400 hover:bg-gray-800 hover:border-gray-400'}
          `}
        >
          {autoRoll ? <Pause size={16} /> : <Play size={16} />}
          {autoRoll ? 'Auto: ON' : 'Auto: OFF'}
        </button>
      </div>
      
      {!canRoll && <p className="text-xs text-red-400">Cooldown active...</p>}
    </div>
  );
};

export default RollButton;