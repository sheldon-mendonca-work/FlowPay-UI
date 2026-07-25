import { create } from 'zustand';

interface DeploymentStoreType {
  ready: boolean;
  instanceId: string | null;
  publicIp: string | null;
  healthy: boolean;
  baseUrl: string | null;
  setStatus: (status: { instanceId: string; publicIp: string; healthy: boolean }) => void;
  setReady: (baseUrl: string) => void;
}

export const useDeploymentStore = create<DeploymentStoreType>((set) => ({
  ready: false,
  instanceId: null,
  publicIp: null,
  healthy: false,
  baseUrl: null,
  setStatus: ({ instanceId, publicIp, healthy }) => set({ instanceId, publicIp, healthy }),
  setReady: (baseUrl) => set({ ready: true, baseUrl }),
}));
