import { create } from 'zustand';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type YTPlayer = any;

interface PlayerStore {
  player: YTPlayer | null;
  currentTime: number;
  isPlayerReady: boolean;
  setPlayer: (player: YTPlayer) => void;
  setCurrentTime: (t: number) => void;
  setPlayerReady: (ready: boolean) => void;
  reset: () => void;
}

export const usePlayerStore = create<PlayerStore>((set) => ({
  player: null,
  currentTime: 0,
  isPlayerReady: false,
  setPlayer: (player) => set({ player, isPlayerReady: true }),
  setCurrentTime: (t) => set({ currentTime: t }),
  setPlayerReady: (ready) => set({ isPlayerReady: ready }),
  reset: () => set({ player: null, currentTime: 0, isPlayerReady: false }),
}));
