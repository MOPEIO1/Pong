import React, { useState, useEffect } from 'react';
import { PlayerControls } from '../types';
import { X } from 'lucide-react';

interface SettingsMenuProps {
  p1Controls: PlayerControls;
  p2Controls: PlayerControls;
  onSave: (p1: PlayerControls, p2: PlayerControls) => void;
  onClose: () => void;
}

const SettingsMenu: React.FC<SettingsMenuProps> = ({ p1Controls, p2Controls, onSave, onClose }) => {
  const [p1, setP1] = useState<PlayerControls>({ ...p1Controls });
  const [p2, setP2] = useState<PlayerControls>({ ...p2Controls });
  const [listeningFor, setListeningFor] = useState<{ player: 1 | 2, key: keyof PlayerControls } | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (listeningFor) {
        e.preventDefault();
        const code = e.code;
        
        if (listeningFor.player === 1) {
          setP1(prev => ({ ...prev, [listeningFor.key]: code }));
        } else {
          setP2(prev => ({ ...prev, [listeningFor.key]: code }));
        }
        setListeningFor(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [listeningFor]);

  const ControlRow = ({ label, value, isActive, onClick }: { label: string, value: string, isActive: boolean, onClick: () => void }) => (
    <div className="flex justify-between items-center bg-white/5 p-3 rounded mb-2 border border-white/10">
      <span className="text-gray-400 text-sm uppercase tracking-wider">{label}</span>
      <button 
        onClick={onClick}
        className={`px-4 py-2 rounded font-mono text-sm min-w-[100px] border transition-all ${
          isActive 
            ? 'bg-indigo-600 border-indigo-400 text-white animate-pulse' 
            : 'bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700'
        }`}
      >
        {isActive ? 'PRESS KEY' : value}
      </button>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
      <div className="w-full max-w-4xl bg-[#0f172a] border border-white/20 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-white/10 flex justify-between items-center">
          <h2 className="text-2xl font-display font-bold text-white tracking-widest uppercase">Control Settings</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg"><X size={24} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 flex flex-col md:flex-row gap-12">
          {/* Player 1 Config */}
          <div className="flex-1 space-y-4">
            <h3 className="text-xl font-bold text-blue-400 mb-6 border-b border-blue-400/30 pb-2">PLAYER 1 (LEFT)</h3>
            <ControlRow 
              label="Move Up" 
              value={p1.up} 
              isActive={listeningFor?.player === 1 && listeningFor.key === 'up'}
              onClick={() => setListeningFor({ player: 1, key: 'up' })}
            />
            <ControlRow 
              label="Move Down" 
              value={p1.down} 
              isActive={listeningFor?.player === 1 && listeningFor.key === 'down'}
              onClick={() => setListeningFor({ player: 1, key: 'down' })}
            />
            <ControlRow 
              label="Roll / Ability" 
              value={p1.action} 
              isActive={listeningFor?.player === 1 && listeningFor.key === 'action'}
              onClick={() => setListeningFor({ player: 1, key: 'action' })}
            />
            <ControlRow 
              label="Ready / Lock" 
              value={p1.ready} 
              isActive={listeningFor?.player === 1 && listeningFor.key === 'ready'}
              onClick={() => setListeningFor({ player: 1, key: 'ready' })}
            />
          </div>

          {/* Player 2 Config */}
          <div className="flex-1 space-y-4">
            <h3 className="text-xl font-bold text-purple-400 mb-6 border-b border-purple-400/30 pb-2">PLAYER 2 (RIGHT)</h3>
            <ControlRow 
              label="Move Up" 
              value={p2.up} 
              isActive={listeningFor?.player === 2 && listeningFor.key === 'up'}
              onClick={() => setListeningFor({ player: 2, key: 'up' })}
            />
            <ControlRow 
              label="Move Down" 
              value={p2.down} 
              isActive={listeningFor?.player === 2 && listeningFor.key === 'down'}
              onClick={() => setListeningFor({ player: 2, key: 'down' })}
            />
            <ControlRow 
              label="Roll / Ability" 
              value={p2.action} 
              isActive={listeningFor?.player === 2 && listeningFor.key === 'action'}
              onClick={() => setListeningFor({ player: 2, key: 'action' })}
            />
            <ControlRow 
              label="Ready / Lock" 
              value={p2.ready} 
              isActive={listeningFor?.player === 2 && listeningFor.key === 'ready'}
              onClick={() => setListeningFor({ player: 2, key: 'ready' })}
            />
          </div>
        </div>

        <div className="p-6 border-t border-white/10 flex justify-end gap-4 bg-black/20">
          <button 
            onClick={onClose} 
            className="px-6 py-3 rounded text-gray-400 hover:text-white font-bold"
          >
            CANCEL
          </button>
          <button 
            onClick={() => { onSave(p1, p2); onClose(); }} 
            className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-bold shadow-lg shadow-indigo-500/20"
          >
            SAVE CHANGES
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsMenu;