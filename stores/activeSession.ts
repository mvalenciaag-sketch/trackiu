import { create } from "zustand";
import { persist } from "zustand/middleware";

export type SetType = "warmup" | "working" | "drop" | "failure";

export interface ActiveSet {
  localId: string;
  remoteId?: string;
  exerciseId: string;
  setNumber: number;
  setType: SetType;
  weightKg: number | null;
  reps: number | null;
  isCompleted: boolean;
  rir: number | null;
  rpe: number | null;
  rom: string | null;
  tempo: string | null;
  restSeconds: number | null;
  notes: string | null;
}

interface ActiveSessionStore {
  sessionId: string | null;
  sets: ActiveSet[];
  init: (sessionId: string, sets: ActiveSet[]) => void;
  upsertSet: (set: ActiveSet) => void;
  removeSet: (localId: string) => void;
  clear: () => void;
}

export function newLocalId() {
  return `local_${Math.random().toString(36).slice(2, 9)}`;
}

export const useActiveSession = create<ActiveSessionStore>()(
  persist(
    (set) => ({
      sessionId: null,
      sets: [],
      init: (sessionId, initialSets) => set({ sessionId, sets: initialSets }),
      upsertSet: (updated) =>
        set((state) => ({
          sets: state.sets.some((s) => s.localId === updated.localId)
            ? state.sets.map((s) =>
                s.localId === updated.localId ? updated : s
              )
            : [...state.sets, updated],
        })),
      removeSet: (localId) =>
        set((state) => ({
          sets: state.sets.filter((s) => s.localId !== localId),
        })),
      clear: () => set({ sessionId: null, sets: [] }),
    }),
    { name: "trackiu-active-session" }
  )
);
