import { RarityTier, AbilityType } from "../types";

let audioCtx: AudioContext | null = null;

const getCtx = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
};

export const playHitSound = (tier: RarityTier) => {
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    // Customize frequency/type based on rarity
    let freq = 200;
    let type: OscillatorType = 'sine';
    let duration = 0.15;
    
    switch(tier) {
      case RarityTier.DOGWATER: 
        freq = 100; type = 'sawtooth'; duration = 0.3; // Fart noise
        break;
      case RarityTier.COMMON: freq = 220; type = 'square'; break;
      case RarityTier.UNCOMMON: freq = 280; type = 'square'; break;
      case RarityTier.RARE: freq = 330; type = 'triangle'; break;
      case RarityTier.EPIC: freq = 440; type = 'sawtooth'; break;
      case RarityTier.LEGENDARY: freq = 550; type = 'sine'; break;
      case RarityTier.MYTHIC: freq = 660; type = 'sine'; break;
      case RarityTier.GODLY: 
         freq = 880; type = 'sine'; duration = 0.5; // Long pure tone
         break;
    }

    osc.type = type;
    
    if (tier === RarityTier.DOGWATER) {
        osc.frequency.setValueAtTime(150, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(50, ctx.currentTime + duration);
    } else if (tier === RarityTier.GODLY) {
        // Chord-like arpeggio effect for Godly
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        osc.frequency.setValueAtTime(freq * 1.5, ctx.currentTime + 0.1);
        osc.frequency.setValueAtTime(freq * 2, ctx.currentTime + 0.2);
    } else {
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.5, ctx.currentTime + 0.1);
    }
    
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (e) {
    console.error("Audio error", e);
  }
};

export const playAbilitySound = () => {
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(100, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(800, ctx.currentTime + 0.5);
    
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);

    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  } catch (e) { console.error("Audio error", e); }
};

export const playWinSound = () => {
    try {
        const ctx = getCtx();
        const now = ctx.currentTime;
        [440, 554, 659, 880].forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.type = 'triangle';
            osc.frequency.value = freq;
            
            const start = now + i * 0.1;
            gain.gain.setValueAtTime(0, start);
            gain.gain.linearRampToValueAtTime(0.2, start + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, start + 0.5);
            
            osc.start(start);
            osc.stop(start + 0.6);
        });
    } catch (e) {}
}

export const playRollTickSound = () => {
    try {
        const ctx = getCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.type = 'square';
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
        
        osc.start();
        osc.stop(ctx.currentTime + 0.05);
    } catch (e) {}
}