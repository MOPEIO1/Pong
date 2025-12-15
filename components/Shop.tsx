import React, { useState, useEffect } from 'react';
import { ShopItem } from '../types';
import { X, Clock, ShoppingBag } from 'lucide-react';
import { getTierColor } from '../constants';

interface ShopProps {
  items: ShopItem[];
  p1Coins: number;
  p2Coins: number;
  nextRefresh: number;
  onBuy: (playerId: 1 | 2, itemId: string) => void;
  onClose: () => void;
}

const Shop: React.FC<ShopProps> = ({ items, p1Coins, p2Coins, nextRefresh, onBuy, onClose }) => {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const tick = () => {
      const diff = nextRefresh - Date.now();
      if (diff <= 0) {
        setTimeLeft('Refreshing...');
      } else {
        const m = Math.floor(diff / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        setTimeLeft(`${m}:${s.toString().padStart(2, '0')}`);
      }
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [nextRefresh]);

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col overflow-hidden animate-fade-in">
      <div className="flex items-center justify-between p-6 border-b border-white/10 bg-gray-900/50">
        <div className="flex items-center gap-4">
           <div className="p-3 bg-yellow-500/20 rounded-full text-yellow-500">
             <ShoppingBag size={24} />
           </div>
           <div>
             <h1 className="text-2xl font-display font-black tracking-widest uppercase">Item Shop</h1>
             <div className="flex items-center gap-2 text-sm text-gray-400">
               <Clock size={14} /> Refresh in: <span className="text-white font-mono">{timeLeft}</span>
             </div>
           </div>
        </div>
        
        <div className="flex items-center gap-8">
            <div className="text-right">
                <p className="text-xs text-gray-500 uppercase">Player 1</p>
                <p className="text-xl font-mono text-white">{p1Coins} <span className="text-yellow-500">G</span></p>
            </div>
            <div className="h-8 w-px bg-white/10"></div>
            <div className="text-right">
                <p className="text-xs text-gray-500 uppercase">Player 2</p>
                <p className="text-xl font-mono text-white">{p2Coins} <span className="text-yellow-500">G</span></p>
            </div>
            <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg ml-4">
                <X size={24} />
            </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
           {items.map((item) => (
             <div 
               key={item.id} 
               className={`
                  relative group overflow-hidden rounded-xl border-2 bg-gray-900 p-6 flex flex-col items-center text-center transition-all duration-300
                  ${item.sold ? 'opacity-50 grayscale border-gray-800' : `${getTierColor(item.aura.tier)} hover:scale-[1.02] hover:shadow-2xl`}
               `}
             >
                {/* Sold Overlay */}
                {item.sold && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-20">
                        <span className="text-red-500 font-black text-4xl -rotate-12 border-4 border-red-500 px-4 py-2 rounded-lg">SOLD</span>
                    </div>
                )}
                
                {/* Background Glow */}
                <div 
                   className="absolute inset-0 opacity-10 blur-xl group-hover:opacity-20 transition-opacity"
                   style={{ backgroundColor: item.aura.hex }}
                />

                <span className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2 relative z-10">{item.aura.tier}</span>
                <h2 className={`text-3xl font-display font-black uppercase ${item.aura.color} mb-4 relative z-10`}>
                    {item.aura.name}
                </h2>

                <div className="mt-auto w-full space-y-3 relative z-10">
                    <p className="text-sm text-gray-400 italic mb-4 min-h-[40px]">{item.aura.ability.description}</p>
                    
                    <div className="grid grid-cols-2 gap-3">
                        <button 
                          onClick={() => onBuy(1, item.id)}
                          disabled={item.sold || p1Coins < item.price}
                          className={`
                            py-2 px-3 rounded text-sm font-bold uppercase tracking-wider border transition-colors
                            ${p1Coins >= item.price && !item.sold 
                                ? 'bg-blue-600 border-blue-400 hover:bg-blue-500 text-white' 
                                : 'bg-gray-800 border-gray-700 text-gray-500 cursor-not-allowed'}
                          `}
                        >
                            P1 Buy <br/><span className="text-xs">{item.price} G</span>
                        </button>
                        <button 
                           onClick={() => onBuy(2, item.id)}
                           disabled={item.sold || p2Coins < item.price}
                           className={`
                            py-2 px-3 rounded text-sm font-bold uppercase tracking-wider border transition-colors
                            ${p2Coins >= item.price && !item.sold 
                                ? 'bg-purple-600 border-purple-400 hover:bg-purple-500 text-white' 
                                : 'bg-gray-800 border-gray-700 text-gray-500 cursor-not-allowed'}
                          `}
                        >
                             P2 Buy <br/><span className="text-xs">{item.price} G</span>
                        </button>
                    </div>
                </div>
             </div>
           ))}
        </div>
      </div>
    </div>
  );
};

export default Shop;