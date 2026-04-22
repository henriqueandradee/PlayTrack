import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface TourState {
  run: boolean;
  stepIndex: number;
  hasSeenTour: boolean;
  startTour: () => void;
  stopTour: () => void;
  setStepIndex: (index: number) => void;
  resetTour: () => void;
  finishTour: () => void;
}

export const useTourStore = create<TourState>()(
  persist(
    (set) => ({
      run: false,
      stepIndex: 0,
      hasSeenTour: false,
      startTour: () => set({ run: true, stepIndex: 0 }),
      stopTour: () => set({ run: false }),
      setStepIndex: (index) => set({ stepIndex: index }),
      resetTour: () => set({ run: true, stepIndex: 0, hasSeenTour: false }),
      finishTour: () => set({ run: false, hasSeenTour: true, stepIndex: 0 }),
    }),
    {
      name: 'playtrack-tour-storage',
    }
  )
);
