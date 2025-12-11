import { create } from 'zustand';

interface TTSState {
  isPlaying: boolean;
  progress: number;
  speed: number;
  currentText: string;

  // Actions
  setIsPlaying: (playing: boolean) => void;
  setProgress: (progress: number) => void;
  setSpeed: (speed: number) => void;
  setCurrentText: (text: string) => void;
  reset: () => void;
}

export const useTTSStore = create<TTSState>((set) => ({
  isPlaying: false,
  progress: 0,
  speed: 1.0,
  currentText: '',

  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setProgress: (progress) => set({ progress }),
  setSpeed: (speed) => set({ speed }),
  setCurrentText: (text) => set({ currentText: text }),
  reset: () =>
    set({
      isPlaying: false,
      progress: 0,
      speed: 1.0,
      currentText: '',
    }),
}));

