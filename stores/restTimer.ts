import { create } from "zustand";

interface RestTimerStore {
  seconds: number;
  total: number;
  active: boolean;
  start: (duration: number) => void;
  stop: () => void;
  tick: () => void;
}

export const useRestTimer = create<RestTimerStore>((set) => ({
  seconds: 0,
  total: 0,
  active: false,
  start: (duration) => set({ seconds: duration, total: duration, active: true }),
  stop: () => set({ active: false, seconds: 0, total: 0 }),
  tick: () =>
    set((state) => {
      const next = state.seconds - 1;
      if (next <= 0) return { seconds: 0, active: false };
      return { seconds: next };
    }),
}));
