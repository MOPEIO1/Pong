import React, { useEffect, useState, useRef } from 'react';
import { Aura, PlayerState, PlayerControls, InventoryItem } from '../types';
import { getRandomAura, AURAS, TIER_COLOR_MAP, ROLLS_PER_GAME, getTierColor } from '../constants';
import { CheckCircle2, Loader2, ArrowLeft, Clover, Briefcase, ShoppingBag, ShieldCheck } from 'lucide-react';
import { playRollTickSound } from '../services/audioService';

interface RollPhaseProps {
  p1State: PlayerState;
  p2State: PlayerState;
  p1Controls: PlayerControls;
  p2Controls: PlayerControls;
  onUpdatePlayer: (id: 1 | 2, updates: Partial<PlayerState>) => void;
  onStartGame: () => void;
  onBackToMenu: () => void;
  onOpenShop?: () => void; // Optional for when added
}

const RollPhase: React.FC<RollPhaseProps> = ({ 
  p1State, p2State, p1Controls, p2Controls, onUpdatePlayer, onStartGame, onBackToMenu, onOpenShop
}) => {
  const [p1Rolling, setP1Rolling] = useState(false);
  const [p2Rolling, setP2Rolling] = useState(false);
  
  // UI State for Inventory Modal
  const [inventoryOpen, setInventoryOpen] = useState<1 | 2 | null>(null);

  // Input cooldown to prevent accidental clicks after rolling
  const [p1InputBlocked, setP1InputBlocked] = useState(false);
  const [p2InputBlocked, setP2InputBlocked] = useState(false);

  // Display auras (for animation)
  const [p1DisplayAura, setP1DisplayAura] = useState<Aura | null>(p1State.aura);
  const [p2DisplayAura, setP2DisplayAura] = useState<Aura | null>(p2State.aura);

  const p1RollRef = useRef<number | null>(null);
  const p2RollRef = useRef<number | null>(null);

  // Initialize rolls count if undefined
  useEffect(() => {
    if (typeof p1State.rollsRemaining === 'undefined') onUpdatePlayer(1, { rollsRemaining: ROLLS_PER_GAME });
    if (typeof p2State.rollsRemaining === 'undefined') onUpdatePlayer(2, { rollsRemaining: ROLLS_PER_GAME });
  }, []);

  // Cleanup timeouts on unmount ONLY
  useEffect(() => {
    return () => {
      if (p1RollRef.current) clearTimeout(p1RollRef.current);
      if (p2RollRef.current) clearTimeout(p2RollRef.current);
    };
  }, []);

  // Start game when both ready
  useEffect(() => {
    if (p1State.isReady && p2State.isReady) {
      const timer = setTimeout(onStartGame, 1000);
      return () => clearTimeout(timer);
    }
  }, [p1State.isReady, p2State.isReady, onStartGame]);

  const performRoll = (playerId: 1 | 2) => {
    const isP1 = playerId === 1;
    const currentState = isP1 ? p1State : p2State;
    const isRolling = isP1 ? p1Rolling : p2Rolling;
    const isBlocked = isP1 ? p1InputBlocked : p2InputBlocked;

    if (isRolling || isBlocked || currentState.isReady || (currentState.rollsRemaining || 0) <= 0) return;

    if (isP1) setP1Rolling(true); else setP2Rolling(true);
    
    // Decrement rolls immediately
    onUpdatePlayer(playerId, { rollsRemaining: (currentState.rollsRemaining ?? ROLLS_PER_GAME) - 1 });

    let speed = 50;
    let duration = 0;
    const maxDuration = 6000; // 6 seconds
    
    const cycle = () => {
      // Pick random visual aura for the slot machine effect
      const randomVisual = AURAS[Math.floor(Math.random() * AURAS.length)];
      if (isP1) setP1DisplayAura(randomVisual); else setP2DisplayAura(randomVisual);
      
      playRollTickSound();

      duration += speed;
      
      // Slot machine slowdown logic
      if (duration > maxDuration * 0.6) {
          speed *= 1.15; 
      }

      if (duration < maxDuration) {
        if (isP1) p1RollRef.current = window.setTimeout(cycle, speed);
        else p2RollRef.current = window.setTimeout(cycle, speed);
      } else {
        // Finalize
        // Apply player luck here
        const finalAura = getRandomAura(currentState.luck);
        
        if (isP1) {
          setP1Rolling(false);
          setP1DisplayAura(finalAura);
          onUpdatePlayer(1, { aura: finalAura });
          // Block input briefly
          setP1InputBlocked(true);
          setTimeout(() => setP1InputBlocked(false), 800);
        } else {
          setP2Rolling(false);
          setP2DisplayAura(finalAura);
          onUpdatePlayer(2, { aura: finalAura });
          // Block input briefly
          setP2InputBlocked(true);
          setTimeout(() => setP2InputBlocked(false), 800);
        }
      }
    };

    cycle();
  };

  const toggleReady = (playerId: 1 | 2) => {
    const isP1 = playerId === 1;
    const isRolling = isP1 ? p1Rolling : p2Rolling;
    const isBlocked = isP1 ? p1InputBlocked : p2InputBlocked;
    const playerState = isP1 ? p1State : p2State;

    if (!isRolling && !isBlocked && playerState.aura) {
       onUpdatePlayer(playerId, { isReady: !playerState.isReady });
    }
  };

  const equipFromInventory = (playerId: 1 | 2, item: InventoryItem) => {
      // 1. Remove from inventory
      const playerState = playerId === 1 ? p1State : p2State;
      const newInventory = playerState.inventory.filter(i => i.id !== item.id);
      
      // 2. Set as aura and update inventory
      onUpdatePlayer(playerId, { 
          aura: item.aura, 
          inventory: newInventory 
      });

      // 3. Update Visuals
      if (playerId === 1) setP1DisplayAura(item.aura);
      else setP2DisplayAura(item.aura);

      // 4. Close Modal
      setInventoryOpen(null);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Player 1
      if (e.code === p1Controls.action) performRoll(1);
      if (e.code === p1Controls.ready) toggleReady(1);

      // Player 2
      if (e.code === p2Controls.action) performRoll(2);
      if (e.code === p2Controls.ready) toggleReady(2);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      // Do NOT clear timeouts here, as this effect re-runs on state changes
    };
  }, [p1Controls, p2Controls, p1State, p2State, p1Rolling, p2Rolling, p1InputBlocked, p2InputBlocked]);

  const renderPlayerSide = (player: PlayerState, displayAura: Aura | null, isRolling: boolean, label: string, controls: PlayerControls, isBlocked: boolean) => {
    const aura = displayAura || player.aura;
    const tierColor = aura ? TIER_COLOR_MAP[aura.tier] : 'border-gray-700';
    const rollsLeft = player.rollsRemaining ?? ROLLS_PER_GAME;
    
    // Determine Guarantee visual
    let guaranteeText = "";
    let guaranteeColor = "";
    if (player.luck >= 10.0) {
        guaranteeText = "LEGENDARY+ GUARANTEED";
        guaranteeColor = "text-yellow-400";
    } else if (player.luck >= 5.0) {
        guaranteeText = "EPIC+ GUARANTEED";
        guaranteeColor = "text-purple-400";
    }

    return (
      <div className={`flex-1 flex flex-col items-center justify-center p-8 border-r border-white/10 relative overflow-hidden transition-all duration-300 ${player.isReady ? 'bg-black/40 grayscale-[0.5]' : ''}`}>
        
        {/* Background Aura Glow */}
        {aura && (
          <div 
            className="absolute inset-0 opacity-20 blur-3xl transition-colors duration-200"
            style={{ backgroundColor: aura.hex }}
          />
        )}

        <div className="z-10 text-center w-full max-w-sm">
          <div className="flex justify-between items-center mb-4">
             <h2 className="text-2xl font-bold text-gray-400 uppercase tracking-[0.2em]">{label}</h2>
             <div className="flex flex-col items-end">
                <div className="flex gap-1 mb-1">
                    {[...Array(ROLLS_PER_GAME)].map((_, i) => (
                        <div key={i} className={`w-2 h-2 rounded-full ${i < rollsLeft ? 'bg-indigo-500 shadow-lg shadow-indigo-500/50' : 'bg-gray-800'}`} />
                    ))}
                </div>
                <div className="text-xs text-yellow-400 font-mono">{player.coins} Coins</div>
             </div>
          </div>
          
          <div className="flex flex-col items-center gap-1 mb-6">
            {player.luck > 1.0 && (
                <div className="inline-flex items-center gap-2 bg-yellow-500/20 text-yellow-300 px-3 py-1 rounded-full border border-yellow-500/50 shadow-lg shadow-yellow-500/10">
                    <Clover size={16} />
                    <span className="text-sm font-bold uppercase tracking-wider">Luck x{player.luck.toFixed(1)}</span>
                </div>
            )}
            {guaranteeText && !player.isReady && (
                <div className={`text-[10px] font-bold tracking-widest uppercase flex items-center gap-1 ${guaranteeColor} animate-pulse`}>
                    <ShieldCheck size={10} /> {guaranteeText}
                </div>
            )}
          </div>

          <div className={`
            aspect-square rounded-full border-4 ${tierColor} 
            flex flex-col items-center justify-center p-6
            bg-gray-900/80 backdrop-blur-md shadow-[0_0_50px_rgba(0,0,0,0.5)]
            transition-all duration-300
            ${player.isReady ? 'scale-90 opacity-80' : 'scale-100'}
            ${isRolling ? 'animate-pulse scale-105 border-white shadow-xl' : ''}
          `}>
            {aura ? (
              <>
                <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">{aura.tier}</p>
                <h1 className={`text-4xl md:text-5xl font-display font-black uppercase ${aura.color} drop-shadow-lg mb-2`}>
                  {aura.name}
                </h1>
                <div className="text-xs text-white/60 bg-white/5 px-3 py-1 rounded-full border border-white/10 mb-4">
                  1 in {aura.chance.toLocaleString()}
                </div>
                
                {!isRolling && (
                    <div className="text-left w-full mt-4 space-y-2 text-sm bg-black/40 p-3 rounded-lg border border-white/5">
                    <div className="flex justify-between">
                        <span className="text-gray-400">Passive:</span>
                        <span className="text-white font-bold">{(aura.stats.paddleSpeedScale * 100 - 100).toFixed(0)}% Spd</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-400">Ability:</span>
                        <span className="text-yellow-400 font-bold uppercase">{aura.ability.name}</span>
                    </div>
                    <p className="text-xs text-gray-500 italic mt-1 truncate">{aura.ability.description}</p>
                    </div>
                )}
              </>
            ) : (
              <p className="text-gray-600 font-display text-2xl animate-pulse">
                 {rollsLeft > 0 ? "ROLL TO BEGIN" : "OUT OF ROLLS"}
              </p>
            )}
          </div>

          <div className="mt-12 space-y-3">
             {player.isReady ? (
                <div className="flex items-center justify-center gap-2 text-green-400 text-xl font-bold animate-pulse">
                  <CheckCircle2 /> READY
                </div>
             ) : (
               <>
                 <div className={`flex items-center justify-between bg-white/5 p-3 rounded border border-white/10 ${rollsLeft === 0 ? 'opacity-50' : ''}`}>
                   <span className="text-sm text-gray-400">
                      {isBlocked ? "Rolling..." : `Roll (${rollsLeft} left)`}
                   </span>
                   {isRolling ? (
                     <Loader2 className="animate-spin text-white" size={20} />
                   ) : (
                     <kbd className={`px-2 py-1 rounded font-mono text-sm border shadow ${rollsLeft > 0 ? 'bg-gray-700 text-white border-gray-600' : 'bg-gray-900 text-gray-600 border-gray-800'}`}>
                         {controls.action}
                     </kbd>
                   )}
                 </div>
                 
                 {/* Inventory Button */}
                 <button 
                    onClick={() => setInventoryOpen(player.id)}
                    className="w-full flex items-center justify-between bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 p-3 rounded border border-indigo-500/30 transition-colors"
                 >
                     <span className="flex items-center gap-2 text-sm"><Briefcase size={16} /> Bag ({player.inventory.length})</span>
                     <span className="text-xs uppercase opacity-70">One-Time Use</span>
                 </button>

                 {aura && !isRolling && !isBlocked && (
                    <div className="flex items-center justify-between bg-white/5 p-3 rounded border border-white/10 animate-fade-in">
                        <span className="text-sm text-gray-400">Lock In & Fight</span>
                        <kbd className="bg-gray-700 px-2 py-1 rounded text-white font-mono text-sm border border-gray-600 shadow">{controls.ready}</kbd>
                    </div>
                 )}
               </>
             )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen w-full bg-[#0f172a] relative">
      <div className="absolute top-4 left-4 z-50 flex gap-4">
        <button 
          onClick={onBackToMenu} 
          className="flex items-center gap-2 px-4 py-2 bg-black/50 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors border border-white/10"
        >
          <ArrowLeft size={16} /> Back
        </button>
        {onOpenShop && (
           <button 
           onClick={onOpenShop} 
           className="flex items-center gap-2 px-4 py-2 bg-yellow-900/20 hover:bg-yellow-900/40 rounded-lg text-yellow-400 hover:text-yellow-200 transition-colors border border-yellow-500/30"
         >
           <ShoppingBag size={16} /> Shop
         </button>
        )}
      </div>

      {renderPlayerSide(p1State, p1DisplayAura, p1Rolling, "Player 1", p1Controls, p1InputBlocked)}
      {renderPlayerSide(p2State, p2DisplayAura, p2Rolling, "Player 2", p2Controls, p2InputBlocked)}
      
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/80 px-4 py-2 rounded-full border border-white/10 backdrop-blur-md z-20">
        <span className="font-display font-bold text-white tracking-widest">VS</span>
      </div>

      {/* Inventory Modal */}
      {inventoryOpen && (
          <div className="absolute inset-0 z-[60] bg-black/90 backdrop-blur-lg flex items-center justify-center p-8">
              <div className="w-full max-w-2xl bg-gray-900 border border-white/20 rounded-xl overflow-hidden flex flex-col max-h-[80vh]">
                  <div className="p-6 border-b border-white/10 flex justify-between items-center">
                      <h2 className="text-2xl font-display font-bold">Player {inventoryOpen} Inventory</h2>
                      <button onClick={() => setInventoryOpen(null)}><ArrowLeft /></button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-6 grid grid-cols-2 gap-4">
                      {(inventoryOpen === 1 ? p1State : p2State).inventory.length === 0 ? (
                          <div className="col-span-2 text-center text-gray-500 py-12">
                              No items. Buy from shop!
                          </div>
                      ) : (
                          (inventoryOpen === 1 ? p1State : p2State).inventory.map((item) => (
                              <button 
                                key={item.id}
                                onClick={() => equipFromInventory(inventoryOpen, item)}
                                className={`p-4 rounded-lg border text-left hover:scale-[1.02] transition-transform flex flex-col gap-2 ${getTierColor(item.aura.tier)}`}
                              >
                                  <span className="text-xs font-bold uppercase opacity-70">{item.aura.tier}</span>
                                  <span className={`font-bold font-display text-xl ${item.aura.color}`}>{item.aura.name}</span>
                                  <span className="text-xs text-white/40 mt-2 bg-white/5 p-1 rounded inline-block w-max">
                                      One-Time Use
                                  </span>
                              </button>
                          ))
                      )}
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default RollPhase;