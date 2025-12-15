import React from 'react';
import { InventoryItem, RarityTier } from '../types';
import { TIER_ORDER, getTierColor } from '../constants';
import { X, Sparkles, BrainCircuit } from 'lucide-react';

interface InventoryProps {
  isOpen: boolean;
  onClose: () => void;
  inventory: Record<string, InventoryItem>;
  onInspect: (item: InventoryItem) => void;
}

const Inventory: React.FC<InventoryProps> = ({ isOpen, onClose, inventory, onInspect }) => {
  const items = (Object.values(inventory) as InventoryItem[]).sort((a, b) => {
    // Sort by tier descending, then by name
    const tierDiff = TIER_ORDER[b.aura.tier] - TIER_ORDER[a.aura.tier];
    if (tierDiff !== 0) return tierDiff;
    return a.aura.name.localeCompare(b.aura.name);
  });

  return (
    <div 
      className={`
        fixed inset-y-0 right-0 w-full md:w-96 bg-gray-900/95 backdrop-blur-xl border-l border-white/10 z-50
        transform transition-transform duration-300 ease-out
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
      `}
    >
      <div className="p-6 h-full flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-display font-bold text-white flex items-center gap-2">
            Collection <span className="text-sm bg-indigo-600 px-2 py-0.5 rounded-full">{items.length}</span>
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 scrollbar-hide space-y-3">
          {items.length === 0 ? (
            <div className="text-center text-gray-500 mt-10">
              <p>Your collection is empty.</p>
              <p className="text-sm mt-2">Start rolling to find auras!</p>
            </div>
          ) : (
            items.map((item) => (
              <div 
                key={item.aura.id}
                onClick={() => onInspect(item)}
                className={`
                  relative p-4 rounded-lg border cursor-pointer hover:scale-[1.02] transition-all
                  ${getTierColor(item.aura.tier)}
                `}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className={`text-xs font-bold uppercase mb-1 opacity-70`}>{item.aura.tier}</p>
                    <h3 className={`text-xl font-display font-bold ${item.aura.color}`}>{item.aura.name}</h3>
                  </div>
                  <div className="text-right">
                    <span className="block text-2xl font-bold text-white/20">x{item.count || 1}</span>
                  </div>
                </div>
                
                {/* Special indicator for AI Lore available */}
                {TIER_ORDER[item.aura.tier] >= TIER_ORDER[RarityTier.LEGENDARY] && (
                   <div className="absolute bottom-2 right-2">
                      <BrainCircuit size={16} className={item.aiLore ? "text-emerald-400" : "text-white/20"} />
                   </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Inventory;