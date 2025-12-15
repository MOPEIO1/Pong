import React, { useEffect, useState } from 'react';
import { InventoryItem } from '../types';
import { BrainCircuit, Loader2, Sparkles, X } from 'lucide-react';
import { generateAuraLore } from '../services/geminiService';

interface LoreModalProps {
  item: InventoryItem | null;
  onClose: () => void;
  onUpdateLore: (id: string, lore: string) => void;
}

const LoreModal: React.FC<LoreModalProps> = ({ item, onClose, onUpdateLore }) => {
  const [loading, setLoading] = useState(false);
  const [displayedLore, setDisplayedLore] = useState<string | null>(null);

  useEffect(() => {
    if (item) {
      if (item.aiLore) {
        setDisplayedLore(item.aiLore);
        setLoading(false);
      } else {
        // Generate new lore if missing
        setLoading(true);
        generateAuraLore(item.aura).then((lore) => {
          setDisplayedLore(lore);
          onUpdateLore(item.aura.id, lore);
          setLoading(false);
        });
      }
    } else {
        setDisplayedLore(null);
    }
  }, [item]); // Remove onUpdateLore from dependency to avoid loop if parent recreates it, though it should be stable.

  if (!item) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div 
        className="relative w-full max-w-lg bg-gray-900 border border-white/10 rounded-2xl p-8 overflow-hidden shadow-2xl"
        style={{ boxShadow: `0 0 50px ${item.aura.glowColor}40` }}
      >
        {/* Background Ambient Glow */}
        <div 
            className="absolute -top-20 -right-20 w-64 h-64 rounded-full blur-[80px] opacity-20 pointer-events-none"
            style={{ backgroundColor: item.aura.glowColor }}
        />

        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-500 hover:text-white transition-colors z-10"
        >
          <X size={20} />
        </button>

        <div className="flex flex-col items-center text-center space-y-6">
           <div className="p-3 rounded-full bg-white/5 border border-white/10">
              <Sparkles className={item.aura.color.replace('text-', 'text-')} size={32} />
           </div>

           <div>
             <h2 className={`text-sm tracking-[0.2em] font-bold text-white/40 uppercase mb-2`}>{item.aura.tier}</h2>
             <h1 className={`text-5xl font-display font-black uppercase ${item.aura.color} drop-shadow-lg`}>
                {item.aura.name}
             </h1>
             <p className="mt-2 text-white/50">1 in {item.aura.chance.toLocaleString()}</p>
           </div>

           <div className="w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent my-4"></div>

           <div className="bg-black/40 rounded-xl p-6 w-full border border-white/5 min-h-[100px] flex items-center justify-center relative">
              {loading ? (
                  <div className="flex flex-col items-center gap-2 text-indigo-400">
                      <Loader2 className="animate-spin" size={24} />
                      <span className="text-xs uppercase tracking-widest animate-pulse">Consulting the Oracle...</span>
                  </div>
              ) : (
                  <div className="relative z-10">
                      <BrainCircuit className="absolute -top-3 -left-3 text-white/10" size={40} />
                      <p className="text-lg font-serif italic text-gray-300 leading-relaxed">
                          "{displayedLore}"
                      </p>
                  </div>
              )}
           </div>
           
           {!loading && !item.aiLore && (
               <p className="text-xs text-gray-600">Powered by Google Gemini</p>
           )}
        </div>
      </div>
    </div>
  );
};

export default LoreModal;