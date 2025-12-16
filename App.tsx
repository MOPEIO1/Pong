import React, { useState, useEffect } from 'react';
import { GameScreen, PlayerState, PlayerControls, ShopItem, InventoryItem } from './types';
import { getRandomAura, DEFAULT_CONTROLS_P1, DEFAULT_CONTROLS_P2, ROLLS_PER_GAME, COINS_PER_MATCH, SHOP_REFRESH_MS, generateShopItems } from './constants';
import RollPhase from './components/RollPhase';
import PongGame from './components/PongGame';
import SettingsMenu from './components/SettingsMenu';
import Shop from './components/Shop';
import Dictionary from './components/Dictionary';
import { Play, RotateCcw, Settings, ShoppingBag, BookOpen, Save } from 'lucide-react';
import { playWinSound } from './services/audioService';

const INITIAL_PLAYER_STATE = (id: 1 | 2, startingLuck: number = 1.0, coins: number = 0, inventory: InventoryItem[] = []): PlayerState => ({
  id,
  hp: 100,
  maxHp: 100,
  aura: null,
  isReady: false,
  rollsRemaining: ROLLS_PER_GAME,
  luck: startingLuck,
  coins,
  inventory,
  cooldown: 0
});

const loadGameData = () => {
  try {
    const data = localStorage.getItem('aura_pong_save_data');
    if (data) return JSON.parse(data);
  } catch (e) { console.error("Failed to load save", e); }
  return null;
};

function App() {
  const saveData = loadGameData();

  const [screen, setScreen] = useState<GameScreen>(GameScreen.START);
  const [winner, setWinner] = useState<1 | 2 | null>(null);
  const [showSaveIndicator, setShowSaveIndicator] = useState(false);
  
  // Persistent Player Data - Loaded from save or default
  const [p1Coins, setP1Coins] = useState(saveData?.p1Coins ?? 0);
  const [p2Coins, setP2Coins] = useState(saveData?.p2Coins ?? 0);
  const [p1Inventory, setP1Inventory] = useState<InventoryItem[]>(saveData?.p1Inventory ?? []);
  const [p2Inventory, setP2Inventory] = useState<InventoryItem[]>(saveData?.p2Inventory ?? []);

  // Discovery System (Collection)
  const [discoveredAuras, setDiscoveredAuras] = useState<string[]>(() => {
     // Support legacy discovery save key migration
     const legacy = localStorage.getItem('celestial_discovery');
     return saveData?.discoveredAuras ?? (legacy ? JSON.parse(legacy) : []);
  });

  // Shop State
  const [shopItems, setShopItems] = useState<ShopItem[]>([]);
  const [nextShopRefresh, setNextShopRefresh] = useState<number>(Date.now() + SHOP_REFRESH_MS);
  
  // Player State initialized with loaded persistence data
  const [p1, setP1] = useState<PlayerState>(INITIAL_PLAYER_STATE(1, 1.0, p1Coins, p1Inventory));
  const [p2, setP2] = useState<PlayerState>(INITIAL_PLAYER_STATE(2, 1.0, p2Coins, p2Inventory));

  const [p1Controls, setP1Controls] = useState<PlayerControls>(saveData?.p1Controls ?? DEFAULT_CONTROLS_P1);
  const [p2Controls, setP2Controls] = useState<PlayerControls>(saveData?.p2Controls ?? DEFAULT_CONTROLS_P2);

  // --- SAVE SYSTEM ---
  useEffect(() => {
    const dataToSave = {
      p1Coins, p2Coins, 
      p1Inventory, p2Inventory,
      discoveredAuras,
      p1Controls, p2Controls
    };
    localStorage.setItem('aura_pong_save_data', JSON.stringify(dataToSave));
    // Also update legacy key for safety if user downgrades (optional, but good for now)
    localStorage.setItem('celestial_discovery', JSON.stringify(discoveredAuras));

    // Show indicator briefly
    if (screen !== GameScreen.BATTLE) {
        setShowSaveIndicator(true);
        const t = setTimeout(() => setShowSaveIndicator(false), 2000);
        return () => clearTimeout(t);
    }
  }, [p1Coins, p2Coins, p1Inventory, p2Inventory, discoveredAuras, p1Controls, p2Controls]);

  const handleResetData = () => {
      if (confirm("Are you sure? This will wipe all coins, items, and discovery progress.")) {
          localStorage.removeItem('aura_pong_save_data');
          localStorage.removeItem('celestial_discovery');
          window.location.reload();
      }
  };

  const markDiscovered = (auraId: string) => {
    if (!discoveredAuras.includes(auraId)) {
      setDiscoveredAuras(prev => [...prev, auraId]);
    }
  };

  // --- SHOP LOGIC ---
  useEffect(() => {
    setShopItems(generateShopItems());
  }, []);

  useEffect(() => {
    const checkRefresh = setInterval(() => {
      if (Date.now() >= nextShopRefresh) {
        setShopItems(generateShopItems());
        setNextShopRefresh(Date.now() + SHOP_REFRESH_MS);
      }
    }, 1000);
    return () => clearInterval(checkRefresh);
  }, [nextShopRefresh]);

  const handleBuyItem = (playerId: 1 | 2, itemId: string) => {
    const itemIndex = shopItems.findIndex(i => i.id === itemId);
    if (itemIndex === -1) return;
    const item = shopItems[itemIndex];
    if (item.sold) return;

    const coins = playerId === 1 ? p1Coins : p2Coins;
    
    if (coins >= item.price) {
      if (playerId === 1) setP1Coins(prev => prev - item.price);
      else setP2Coins(prev => prev - item.price);

      const newItem: InventoryItem = { id: `inv-${Date.now()}`, aura: item.aura };
      if (playerId === 1) setP1Inventory(prev => [...prev, newItem]);
      else setP2Inventory(prev => [...prev, newItem]);

      // Buying also discovers it
      markDiscovered(item.aura.id);

      const newShop = [...shopItems];
      newShop[itemIndex] = { ...item, sold: true, soldTo: playerId };
      setShopItems(newShop);
    }
  };

  useEffect(() => {
    setP1(prev => ({ ...prev, coins: p1Coins, inventory: p1Inventory }));
    setP2(prev => ({ ...prev, coins: p2Coins, inventory: p2Inventory }));
  }, [p1Coins, p2Coins, p1Inventory, p2Inventory]);


  const handleUpdatePlayer = (id: 1 | 2, updates: Partial<PlayerState>) => {
    // Check if we are updating the aura, if so, mark as discovered
    if (updates.aura) {
        markDiscovered(updates.aura.id);
    }

    if (id === 1) {
        setP1(prev => ({ ...prev, ...updates }));
        if (updates.inventory) setP1Inventory(updates.inventory);
    } else {
        setP2(prev => ({ ...prev, ...updates }));
        if (updates.inventory) setP2Inventory(updates.inventory);
    }
  };

  const handleStartGame = () => {
    if (!p1.aura) {
        const a = getRandomAura(p1.luck);
        handleUpdatePlayer(1, { aura: a });
    }
    if (!p2.aura) {
        const a = getRandomAura(p2.luck);
        handleUpdatePlayer(2, { aura: a });
    }
    setScreen(GameScreen.BATTLE);
  };

  const handleGameEnd = (winnerId: 1 | 2) => {
    setWinner(winnerId);
    setScreen(GameScreen.WIN);
    playWinSound();
    setP1Coins(prev => prev + COINS_PER_MATCH);
    setP2Coins(prev => prev + COINS_PER_MATCH);
  };

  const handleRematch = () => {
    let p1Luck = 1.0;
    let p2Luck = 1.0;

    if (winner === 1) {
        p1Luck = 1.0;
        p2Luck = p2.luck + 1.0;
    } else if (winner === 2) {
        p2Luck = 1.0;
        p1Luck = p1.luck + 1.0;
    }

    setP1(INITIAL_PLAYER_STATE(1, p1Luck, p1Coins, p1Inventory));
    setP2(INITIAL_PLAYER_STATE(2, p2Luck, p2Coins, p2Inventory));
    setWinner(null);
    setScreen(GameScreen.ROLL);
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white flex flex-col overflow-hidden font-inter relative">
      
      {/* Auto-Save Indicator */}
      <div className={`fixed bottom-4 right-4 z-[100] flex items-center gap-2 text-xs font-mono text-gray-500 bg-black/50 px-3 py-1 rounded-full border border-white/5 transition-opacity duration-500 ${showSaveIndicator ? 'opacity-100' : 'opacity-0'}`}>
          <Save size={12} /> Auto-Saved
      </div>

      {screen === GameScreen.SETTINGS && (
        <SettingsMenu 
          p1Controls={p1Controls} 
          p2Controls={p2Controls}
          onSave={(newP1, newP2) => {
            setP1Controls(newP1);
            setP2Controls(newP2);
          }}
          onClose={() => setScreen(GameScreen.START)}
          onReset={handleResetData}
        />
      )}

      {screen === GameScreen.SHOP && (
        <Shop 
          items={shopItems}
          p1Coins={p1Coins}
          p2Coins={p2Coins}
          nextRefresh={nextShopRefresh}
          onBuy={handleBuyItem}
          onClose={() => setScreen(GameScreen.START)}
        />
      )}

      {screen === GameScreen.DICTIONARY && (
        <Dictionary 
            onClose={() => setScreen(GameScreen.START)} 
            discoveredIds={discoveredAuras}
        />
      )}

      {screen === GameScreen.START && (
        <div className="flex-1 flex flex-col items-center justify-center relative">
          <div className="absolute inset-0 overflow-hidden">
             <div className="absolute -top-[20%] -left-[20%] w-[50%] h-[50%] bg-blue-500/20 blur-[150px] rounded-full animate-pulse" />
             <div className="absolute top-[30%] -right-[20%] w-[60%] h-[60%] bg-purple-500/20 blur-[150px] rounded-full animate-pulse" style={{ animationDelay: '1s'}} />
          </div>
          
          <div className="z-10 text-center space-y-8">
            <h1 className="text-8xl font-display font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-500 drop-shadow-2xl">
              AURA PONG
            </h1>
            <p className="text-xl text-gray-400 tracking-widest uppercase">
              let your talent shine.
            </p>
            
            <div className="pt-12 flex flex-col items-center gap-6">
               <button 
                 onClick={() => setScreen(GameScreen.ROLL)}
                 className="group relative px-12 py-4 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/30 transition-all duration-300 hover:scale-105 active:scale-95 hover:shadow-[0_0_30px_rgba(255,255,255,0.1)]"
               >
                 <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r from-blue-500/20 to-purple-500/20 blur-md -z-10" />
                 
                 <span className="flex items-center gap-3 font-display font-bold text-xl tracking-[0.2em] text-white">
                    PRESS START <Play size={18} fill="currentColor" />
                 </span>
               </button>

               <div className="flex gap-4">
                  <button 
                    onClick={() => setScreen(GameScreen.SHOP)}
                    className="flex items-center justify-center gap-2 px-6 py-2 bg-yellow-500/10 border border-yellow-500/30 text-yellow-200 hover:bg-yellow-500/20 transition-all rounded-full uppercase tracking-widest text-sm"
                  >
                    <ShoppingBag size={16} /> Item Shop
                  </button>
                  <button 
                    onClick={() => setScreen(GameScreen.DICTIONARY)}
                    className="flex items-center justify-center gap-2 px-6 py-2 bg-blue-500/10 border border-blue-500/30 text-blue-200 hover:bg-blue-500/20 transition-all rounded-full uppercase tracking-widest text-sm"
                  >
                    <BookOpen size={16} /> Dictionary
                  </button>
                  <button 
                    onClick={() => setScreen(GameScreen.SETTINGS)}
                    className="flex items-center justify-center gap-2 px-6 py-2 bg-white/5 border border-white/10 text-gray-400 hover:text-white transition-all rounded-full uppercase tracking-widest text-sm"
                  >
                    <Settings size={16} /> Controls
                  </button>
               </div>
            </div>
          </div>
        </div>
      )}

      {screen === GameScreen.ROLL && (
        <RollPhase 
          p1State={p1} 
          p2State={p2} 
          p1Controls={p1Controls}
          p2Controls={p2Controls}
          onUpdatePlayer={handleUpdatePlayer} 
          onStartGame={handleStartGame} 
          onBackToMenu={() => setScreen(GameScreen.START)}
          onOpenShop={() => setScreen(GameScreen.SHOP)}
        />
      )}

      {screen === GameScreen.BATTLE && (
        <div className="flex-1 flex items-center justify-center bg-black">
          <PongGame 
            p1Data={p1} 
            p2Data={p2} 
            p1Controls={p1Controls}
            p2Controls={p2Controls}
            onGameEnd={handleGameEnd} 
          />
        </div>
      )}

      {screen === GameScreen.WIN && winner && (
        <div className="flex-1 flex flex-col items-center justify-center relative bg-black/90">
           <div className={`absolute inset-0 opacity-30 blur-[100px] bg-gradient-to-t ${winner === 1 ? 'from-blue-900' : 'from-red-900'} to-transparent`} />
           
           <div className="z-10 text-center">
             <h2 className="text-2xl text-gray-400 font-bold uppercase tracking-widest mb-4">Winner</h2>
             <h1 className="text-9xl font-display font-black text-white mb-8 drop-shadow-[0_0_30px_rgba(255,255,255,0.5)]">
               PLAYER {winner}
             </h1>
             
             <div className="mb-12">
               <p className="text-gray-500 uppercase tracking-widest text-sm mb-2">Victory Title</p>
               <div className={`text-4xl font-display font-bold ${(winner === 1 ? p1 : p2).aura?.color}`}>
                 {(winner === 1 ? p1 : p2).aura?.name}
               </div>
             </div>

             <div className="mb-8 p-6 bg-white/5 rounded-lg border border-white/10 max-w-lg mx-auto">
               <p className="text-sm text-yellow-400 font-bold uppercase tracking-widest mb-4">+5 Coins Earned!</p>
               
               <div className="grid grid-cols-2 gap-8 text-left mb-6">
                 <div>
                    <span className="text-xs text-gray-500 uppercase block">P1 Balance</span>
                    <span className="text-xl font-mono text-white">{p1Coins} <span className="text-yellow-500 text-sm">G</span></span>
                 </div>
                 <div className="text-right">
                    <span className="text-xs text-gray-500 uppercase block">P2 Balance</span>
                    <span className="text-xl font-mono text-white">{p2Coins} <span className="text-yellow-500 text-sm">G</span></span>
                 </div>
               </div>

                <div className="w-full h-px bg-white/10 mb-6" />

                <p className="text-sm text-gray-400 mb-2 uppercase tracking-wide text-center">Next Round Luck</p>
                <div className="flex justify-between items-center gap-8">
                    <div className="flex flex-col items-center">
                        <span className={`font-bold ${winner === 1 ? 'text-green-400' : 'text-yellow-400'}`}>P1</span>
                        <span className="text-2xl font-display">{winner === 1 ? '1.0x' : (p1.luck + 1.0).toFixed(1) + 'x'}</span>
                    </div>
                    <div className="h-8 w-px bg-white/20"></div>
                    <div className="flex flex-col items-center">
                        <span className={`font-bold ${winner === 2 ? 'text-green-400' : 'text-yellow-400'}`}>P2</span>
                        <span className="text-2xl font-display">{winner === 2 ? '1.0x' : (p2.luck + 1.0).toFixed(1) + 'x'}</span>
                    </div>
                </div>
             </div>

             <button 
               onClick={handleRematch}
               className="flex items-center gap-3 px-8 py-4 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full text-white transition-all mx-auto"
             >
               <RotateCcw /> REMATCH
             </button>
           </div>
        </div>
      )}

    </div>
  );
}

export default App;