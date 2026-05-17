import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import type { UserProfile } from '../types';

const SECURE_KEY = 'timeprice_profiles';

type ProfileState = {
  profiles: UserProfile[];
  activeProfileId: string | null;
  hydrated: boolean;

  // Actions
  hydrate: () => Promise<void>;
  addProfile: (profile: UserProfile) => Promise<void>;
  updateProfile: (id: string, patch: Partial<UserProfile>) => Promise<void>;
  deleteProfile: (id: string) => Promise<void>;
  setActiveProfile: (id: string) => void;
  getActiveProfile: () => UserProfile | null;
};

async function persistProfiles(profiles: UserProfile[]): Promise<void> {
  await SecureStore.setItemAsync(SECURE_KEY, JSON.stringify(profiles));
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  profiles: [],
  activeProfileId: null,
  hydrated: false,

  hydrate: async () => {
    try {
      const raw = await SecureStore.getItemAsync(SECURE_KEY);
      if (raw) {
        const profiles = JSON.parse(raw) as UserProfile[];
        const defaultProfile = profiles.find((p) => p.isDefault) ?? profiles[0];
        set({
          profiles,
          activeProfileId: defaultProfile?.id ?? null,
          hydrated: true,
        });
      } else {
        set({ hydrated: true });
      }
    } catch {
      set({ hydrated: true });
    }
  },

  addProfile: async (profile) => {
    const { profiles } = get();
    // First profile becomes the default; subsequent profiles become active on creation
    const isFirst = profiles.length === 0;
    const newProfile: UserProfile = { ...profile, isDefault: isFirst };
    const updated = [...profiles, newProfile];
    await persistProfiles(updated);
    // Always activate the newly created profile so the user sees it immediately
    set({ profiles: updated, activeProfileId: newProfile.id });
  },

  updateProfile: async (id, patch) => {
    const updated = get().profiles.map((p) =>
      p.id === id ? { ...p, ...patch } : p,
    );
    await persistProfiles(updated);
    set({ profiles: updated });
  },

  deleteProfile: async (id) => {
    const { profiles, activeProfileId } = get();
    const updated = profiles.filter((p) => p.id !== id);
    await persistProfiles(updated);
    const newActive =
      activeProfileId === id
        ? (updated.find((p) => p.isDefault) ?? updated[0])?.id ?? null
        : activeProfileId;
    set({ profiles: updated, activeProfileId: newActive });
  },

  setActiveProfile: (id) => set({ activeProfileId: id }),

  getActiveProfile: () => {
    const { profiles, activeProfileId } = get();
    return profiles.find((p) => p.id === activeProfileId) ?? null;
  },
}));
