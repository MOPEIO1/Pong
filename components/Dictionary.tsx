import React, { useState } from 'react';
import { AURAS, TIER_COLOR_MAP, TIER_ORDER, getTierColor } from '../constants';
import { RarityTier, Aura } from '../types';
import { ArrowLeft, Search, Zap, Trophy, MousePointer2, X, Lock } from 'lucide-react';

interface DictionaryProps {
  onClose: () => void;
  discoveredIds: string[];
}

const Dictionary: React.FC<DictionaryProps> = ({ onClose, discoveredIds }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTier, setSelectedTier] = useState<RarityTier | 'ALL'>('ALL');
  const [selectedAura, setSelectedAura] = useState<Aura | null>(null);

  const filteredAuras = AURAS.filter(aura => {
    // Search can match hidden items if you know the name, but they appear locked
    const matchesSearch = aura.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTier = selectedTier === 'ALL' || aura.tier === selectedTier;
    return matchesSearch && matchesTier;
  }).sort((a, b) => {
    const diff = TIER_ORDER[b.tier] - TIER_ORDER[a.tier];
    if (diff !== 0) return diff;
    return a.name.localeCompare(b.name);
  });

  const tiers = Object.values(RarityTier).reverse();
  const discoveredCount = discoveredIds.length;
  const totalCount = AURAS.length;

  return (
    <div className="fixed inset-0 z-50 bg-[#0f172a] text-white flex flex-col font-inter animate-fade-in">
      {/* Header */}
      <div className="p-6 border-b border-white/10 bg-gray-900/50 backdrop-blur-md flex flex-col md:flex-row gap-4 items-center justify-between z-10">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-3xl font-display font-black tracking-widest uppercase flex items-center gap-2">
              <Trophy className="text-yellow-500" /> Dictionary
            </h1>
            <p className="text-sm text-gray-400">
                Collection: <span className="text-white font-mono font-bold">{discoveredCount} / {totalCount}</span> Titles Discovered
            </p>
          </div>
        </div>

        <div className="flex gap-4 w-full md:w-auto overflow-x-auto scrollbar-hide">
            <div className="relative group min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-white" size={16} />
                <input 
                    type="text" 
                    placeholder="Search..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-white/30 transition-all"
                />
            </div>
            
            <select 
                value={selectedTier} 
                onChange={(e) => setSelectedTier(e.target.value as RarityTier | 'ALL')}
                className="bg-black/40 border border-white/10 rounded-full py-2 px-4 text-sm focus:outline-none cursor-pointer"
            >
                <option value="ALL">All Tiers</option>
                {tiers.map(tier => (
                    <option key={tier} value={tier}>{tier}</option>
                ))}
            </select>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-gradient-to-b from-[#0f172a] to-black">
         <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 max-w-[1600px] mx-auto">
            {filteredAuras.map((aura) => {
                const isDiscovered = discoveredIds.includes(aura.id);

                return (
                    <button 
                    key={aura.id} 
                    onClick={() => isDiscovered && setSelectedAura(aura)}
                    disabled={!isDiscovered}
                    className={`
                        group relative rounded-xl border-2 bg-gray-900 overflow-hidden transition-all duration-300 
                        ${isDiscovered ? `${getTierColor(aura.tier)} hover:scale-[1.02] hover:z-10 cursor-pointer` : 'border-gray-800 opacity-60 cursor-not-allowed'}
                        text-left
                    `}
                    >
                        <div className="p-6 flex flex-col items-center justify-center h-full relative z-10 min-h-[200px]">
                            {isDiscovered ? (
                                <>
                                    <div 
                                    className="absolute inset-0 opacity-10 blur-xl group-hover:opacity-20 transition-opacity"
                                    style={{ backgroundColor: aura.hex }}
                                    />
                                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 mb-3">{aura.tier}</span>
                                    <h2 className={`text-2xl font-display font-black uppercase text-center leading-tight mb-4 ${aura.color} drop-shadow-md`}>
                                        {aura.name}
                                    </h2>
                                    <div className="mt-auto inline-block bg-white/5 border border-white/10 rounded-full px-3 py-1 text-[10px] text-gray-400 font-mono">
                                        1 in {aura.chance.toLocaleString()}
                                    </div>
                                </>
                            ) : (
                                <div className="flex flex-col items-center gap-4 text-gray-700">
                                    <Lock size={40} />
                                    <span className="text-3xl font-display font-black">???</span>
                                    <span className="text-[10px] uppercase tracking-widest">{aura.tier}</span>
                                </div>
                            )}
                        </div>
                    </button>
                );
            })}
         </div>
      </div>

      {/* Detail Modal */}
      {selectedAura && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
              <div className={`relative w-full max-w-lg bg-gray-900 border-2 rounded-2xl overflow-hidden shadow-2xl ${getTierColor(selectedAura.tier)}`}>
                  <div 
                      className="absolute inset-0 opacity-10 blur-3xl pointer-events-none"
                      style={{ backgroundColor: selectedAura.hex }}
                  />
                  
                  <button 
                      onClick={() => setSelectedAura(null)}
                      className="absolute top-4 right-4 p-2 bg-black/40 hover:bg-white/20 rounded-full transition-colors z-20"
                  >
                      <X size={20} />
                  </button>

                  <div className="p-8 flex flex-col items-center text-center relative z-10">
                      <span className="text-sm font-bold uppercase tracking-[0.3em] text-gray-500 mb-4">{selectedAura.tier}</span>
                      <h1 className={`text-5xl font-display font-black uppercase ${selectedAura.color} mb-2 drop-shadow-lg`}>
                          {selectedAura.name}
                      </h1>
                      <div className="inline-block bg-white/5 border border-white/10 rounded-full px-4 py-1 text-xs text-gray-400 font-mono mb-8">
                            1 in {selectedAura.chance.toLocaleString()}
                      </div>

                      <div className="w-full bg-black/40 rounded-xl p-6 border border-white/10">
                          <h3 className="text-yellow-400 font-bold uppercase text-sm mb-2 tracking-wider flex items-center justify-center gap-2">
                              <Zap size={16} /> Ability: {selectedAura.ability.name}
                          </h3>
                          <p className="text-gray-300 italic leading-relaxed mb-6">"{selectedAura.ability.description}"</p>
                          
                          <div className="grid grid-cols-2 gap-4 text-xs">
                              <div className="flex justify-between p-2 bg-white/5 rounded">
                                  <span className="text-gray-500">Duration</span>
                                  <span className="text-white font-mono">{(selectedAura.ability.duration / 1000).toFixed(1)}s</span>
                              </div>
                              <div className="flex justify-between p-2 bg-white/5 rounded">
                                  <span className="text-gray-500">Cooldown</span>
                                  <span className="text-white font-mono">{(selectedAura.ability.cooldown / 1000).toFixed(1)}s</span>
                              </div>
                              <div className="flex justify-between p-2 bg-white/5 rounded">
                                  <span className="text-gray-500">Base Speed</span>
                                  <span className="text-white font-mono">{(selectedAura.stats.paddleSpeedScale * 100).toFixed(0)}%</span>
                              </div>
                              <div className="flex justify-between p-2 bg-white/5 rounded">
                                  <span className="text-gray-500">Base Size</span>
                                  <span className="text-white font-mono">{(selectedAura.stats.paddleHeightScale * 100).toFixed(0)}%</span>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Dictionary;