import { create } from 'zustand';

interface SandboxStore {
  isSandbox: boolean;
  toggleSandbox: () => void;
  setSandbox: (value: boolean) => void;
}

export const useSandboxStore = create<SandboxStore>((set) => ({
  isSandbox: import.meta.env.DEV,
  toggleSandbox: () => set((state) => ({ isSandbox: !state.isSandbox })),
  setSandbox: (value: boolean) => set({ isSandbox: value }),
}));
