import type { UserType } from '@/types/user-types';
import type { UserInfoResponse } from '@/types/types';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

let _cachedAccessToken: string | null = null;

export function getCachedAccessToken(): string | null {
  return _cachedAccessToken;
}

interface AuthStoreType {
  userMode: UserType;
  userID: string;
  userName: string;
  accessToken: string | null;
  refreshToken: string | null;
  userInfo: UserInfoResponse | null;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setUserInfo: (info: UserInfoResponse) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthStoreType>()(
  persist(
    (set) => ({
      userMode: 'ACCOUNT',
      userID: '',
      userName: '',
      accessToken: null,
      refreshToken: null,
      userInfo: null,
      setTokens: (accessToken, refreshToken) => {
        _cachedAccessToken = accessToken;
        set({ accessToken, refreshToken });
      },
      setUserInfo: (info) => set({ userInfo: info }),
      clearAuth: () => {
        _cachedAccessToken = null;
        set({ accessToken: null, refreshToken: null, userName: '', userID: '', userInfo: null });
      },
    }),
    {
      name: 'fp_auth',
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        userMode: state.userMode,
        userName: state.userName,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.accessToken) {
          _cachedAccessToken = state.accessToken;
        }
      },
    },
  ),
);
