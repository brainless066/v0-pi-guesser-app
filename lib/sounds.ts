"use client";

export type SoundType = "soft" | "typewriter" | "mechanical" | "tap" | "mute";

const STORAGE_KEY_SOUND = "pi-guesser-sound";
const STORAGE_KEY_VOLUME = "pi-guesser-volume";

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  }
  return audioContext;
}

// Create noise buffer for more natural click sounds
function createNoiseBuffer(ctx: AudioContext, duration: number): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const length = sampleRate * duration;
  const buffer = ctx.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);
  
  for (let i = 0; i < length; i++) {
    data[i] = (Math.random() * 2 - 1);
  }
  return buffer;
}

export function playSound(type: SoundType, volume: number = 1) {
  if (type === "mute" || volume === 0) return;

  const ctx = getAudioContext();
  const now = ctx.currentTime;
  
  // Volume multiplier (0 to 1)
  const vol = Math.max(0, Math.min(1, volume));

  switch (type) {
    case "soft": {
      // Soft keyboard tap - like a laptop keyboard
      const noise = ctx.createBufferSource();
      noise.buffer = createNoiseBuffer(ctx, 0.02);
      
      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.value = 3000;
      filter.Q.value = 1;
      
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.06 * vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.015);
      
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start(now);
      noise.stop(now + 0.02);
      break;
    }

    case "typewriter": {
      // Typewriter click - sharper attack
      const noise = ctx.createBufferSource();
      noise.buffer = createNoiseBuffer(ctx, 0.03);
      
      const filter = ctx.createBiquadFilter();
      filter.type = "highpass";
      filter.frequency.value = 2000;
      
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.1 * vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);
      
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start(now);
      noise.stop(now + 0.03);
      break;
    }

    case "mechanical": {
      // Mechanical keyboard - thocky sound
      const noise = ctx.createBufferSource();
      noise.buffer = createNoiseBuffer(ctx, 0.04);
      
      const lowpass = ctx.createBiquadFilter();
      lowpass.type = "lowpass";
      lowpass.frequency.value = 1500;
      
      const highpass = ctx.createBiquadFilter();
      highpass.type = "highpass";
      highpass.frequency.value = 200;
      
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.12 * vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);
      
      noise.connect(lowpass);
      lowpass.connect(highpass);
      highpass.connect(gain);
      gain.connect(ctx.destination);
      noise.start(now);
      noise.stop(now + 0.04);
      break;
    }

    case "tap": {
      // Light finger tap - very subtle
      const noise = ctx.createBufferSource();
      noise.buffer = createNoiseBuffer(ctx, 0.015);
      
      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.value = 4000;
      filter.Q.value = 0.5;
      
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.04 * vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.01);
      
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start(now);
      noise.stop(now + 0.015);
      break;
    }
  }
}

export function getSavedSound(): SoundType {
  if (typeof window === "undefined") return "soft";
  const saved = localStorage.getItem(STORAGE_KEY_SOUND);
  if (saved && ["soft", "typewriter", "mechanical", "tap", "mute"].includes(saved)) {
    return saved as SoundType;
  }
  return "soft";
}

export function saveSound(type: SoundType) {
  localStorage.setItem(STORAGE_KEY_SOUND, type);
}

export function getSavedVolume(): number {
  if (typeof window === "undefined") return 0.5;
  const saved = localStorage.getItem(STORAGE_KEY_VOLUME);
  if (saved) {
    const parsed = parseFloat(saved);
    if (!isNaN(parsed) && parsed >= 0 && parsed <= 1) {
      return parsed;
    }
  }
  return 0.5;
}

export function saveVolume(volume: number) {
  localStorage.setItem(STORAGE_KEY_VOLUME, volume.toString());
}
