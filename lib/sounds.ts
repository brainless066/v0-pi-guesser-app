"use client";

export type SoundType = "tick" | "pop" | "beep" | "click" | "mute";

const STORAGE_KEY_SOUND = "pi-guesser-sound";

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  }
  return audioContext;
}

export function playSound(type: SoundType) {
  if (type === "mute") return;

  const ctx = getAudioContext();
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  const now = ctx.currentTime;

  switch (type) {
    case "tick":
      // Short, high-pitched tick
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(1800, now);
      oscillator.frequency.exponentialRampToValueAtTime(1200, now + 0.03);
      gainNode.gain.setValueAtTime(0.15, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      oscillator.start(now);
      oscillator.stop(now + 0.05);
      break;

    case "pop":
      // Soft pop sound
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(400, now);
      oscillator.frequency.exponentialRampToValueAtTime(150, now + 0.08);
      gainNode.gain.setValueAtTime(0.2, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      oscillator.start(now);
      oscillator.stop(now + 0.1);
      break;

    case "beep":
      // Classic beep
      oscillator.type = "square";
      oscillator.frequency.setValueAtTime(880, now);
      gainNode.gain.setValueAtTime(0.08, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
      oscillator.start(now);
      oscillator.stop(now + 0.06);
      break;

    case "click":
      // Mechanical click
      oscillator.type = "triangle";
      oscillator.frequency.setValueAtTime(2500, now);
      oscillator.frequency.exponentialRampToValueAtTime(500, now + 0.02);
      gainNode.gain.setValueAtTime(0.12, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
      oscillator.start(now);
      oscillator.stop(now + 0.03);
      break;
  }
}

export function getSavedSound(): SoundType {
  if (typeof window === "undefined") return "tick";
  const saved = localStorage.getItem(STORAGE_KEY_SOUND);
  if (saved && ["tick", "pop", "beep", "click", "mute"].includes(saved)) {
    return saved as SoundType;
  }
  return "tick";
}

export function saveSound(type: SoundType) {
  localStorage.setItem(STORAGE_KEY_SOUND, type);
}
