import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { ProfileAPI, RoutineAPI, PhotoAPI, MatchAPI, MessageAPI, generateId } from '../lib/api';

export type Gender = 'male' | 'female';

export interface RoutineProof {
  date: string;
  uri: string;
}

export interface Routine {
  id: string;
  name: string;
  description?: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  notificationTime: string;
  completedDates: string[];
  createdAt: string;
  targetDays?: number[];
  monthlyDays?: number[];
  proofPhotos?: RoutineProof[];
  setName?: string;
  scope?: 'recurring' | 'once';
  onceRange?: { start: string; end: string };
}

export interface Photo {
  id: string;
  uri: string;
  uploadedAt: string;
  isPinned?: boolean;
  proofMeta?: {
    routineId: string;
    routineName: string;
    setName?: string;
    capturedAt: string;
  };
}

export interface Message {
  id: string;
  text: string;
  sentByMe: boolean;
  timestamp: string;
}

export interface User {
  id: string;
  username: string;
  fullName?: string;
  bio?: string;
  birthDate?: string;
  locationName?: string;
  locationLat?: number;
  locationLon?: number;
  gender: Gender;
  avatarUri: string | null;
  isPro: boolean;
  interests: string[];
  routines: Routine[];
  photos: Photo[];
  achievementScore: number;
  matchedSince: string | null;
  restDays: string[];
  inactiveSets: string[];
  notificationSound: string;
  completionSound: string;
}

export interface Mate {
  id: string;
  username: string;
  fullName?: string;
  gender: Gender;
  avatarUri: string | null;
  interests: string[];
  routines: Routine[];
  photos: Photo[];
  achievementScore: number;
}

export interface MatchRequest {
  id: string;
  fromUser: {
    id: string;
    username: string;
    avatarUri: string | null;
    interests: string[];
    achievementScore: number;
    gender: Gender;
  };
  timestamp: string;
}

interface AppState {
  user: User;
  mate: Mate | null;
  matchId: string | null;
  messages: Message[];
  isLoggedIn: boolean;
  isInitializing: boolean;
  discoveryUsers: Mate[];
  matchRequests: MatchRequest[];
  sentMatchRequests: string[];

  loadUserData: () => Promise<'ok' | 'unverified' | 'onboarding' | 'no_user' | 'error'>;
  setInitialized: () => void;

  toggleRoutineComplete: (routineId: string, date: string) => void;
  addRoutine: (routine: Routine) => void;
  addRoutines: (routines: Routine[]) => void;
  deleteRoutine: (routineId: string) => void;
  updateRoutine: (id: string, updates: Partial<Routine>) => void;
  updateUser: (updates: Partial<User>) => void;
  togglePro: () => void;
  addPhoto: (photo: Photo) => void;
  deletePhoto: (id: string) => void;
  pinPhoto: (id: string) => void;
  sendMessage: (text: string) => void;
  deleteMessage: (id: string) => void;
  setLoggedIn: (value: boolean) => void;
  toggleRestDay: (date: string) => void;

  addRoutineProof: (routineId: string, date: string, uri: string) => void;
  toggleSetActive: (setName: string) => void;
  sendMatchRequest: (targetUser: Mate) => void;
  cancelMatchRequest: (targetUserId: string) => void;
  acceptMatchRequest: (request: MatchRequest) => void;
  rejectMatchRequest: (requestId: string) => void;
  unmatch: () => void;
  resetStore: () => void;
}

const BLANK_USER: User = {
  id: '',
  username: '',
  gender: 'male',
  avatarUri: null,
  isPro: false,
  interests: [],
  achievementScore: 0,
  matchedSince: null,
  routines: [],
  photos: [],
  restDays: [],
  inactiveSets: [],
  notificationSound: 'default',
  completionSound: 'correct',
};

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: BLANK_USER,
      mate: null,
      matchId: null,
      messages: [],
      isLoggedIn: false,
      isInitializing: true,
      discoveryUsers: [],
      matchRequests: [],
      sentMatchRequests: [],

      setInitialized: () => set({ isInitializing: false }),

      // ── Load all user data from Supabase ──────────────────────────────────
      loadUserData: async () => {
        try {
          // getSession() reads from AsyncStorage cache — works offline
          const { data: { session } } = await supabase.auth.getSession();
          if (!session?.user) return 'no_user';
          const authUser = session.user;
          if (!authUser.email_confirmed_at) return 'unverified';

          const userId = authUser.id;

          // allSettled so a single failing endpoint doesn't crash everything
          const [profileRes, routinesRes, restDaysRes, photosRes, matchRes, requestsRes, sentRes, discoveryRes] =
            await Promise.allSettled([
              ProfileAPI.get(userId),
              RoutineAPI.getAll(userId),
              RoutineAPI.getRestDays(userId),
              PhotoAPI.getAll(userId),
              MatchAPI.getActiveMatch(userId),
              MatchAPI.getRequests(userId),
              MatchAPI.getSentRequests(userId),
              ProfileAPI.getDiscovery(userId),
            ]);

          const profile = profileRes.status === 'fulfilled' ? profileRes.value : null;

          if (!profile) {
            // Network failed but session is valid — fall back to cached store data
            const cached = get().user;
            if (cached.id === userId) {
              set({ isLoggedIn: true });
              return 'ok';
            }
            return 'onboarding';
          }
          if (!profile.username) return 'onboarding';

          const routines   = routinesRes.status   === 'fulfilled' ? routinesRes.value   : [];
          const restDays   = restDaysRes.status   === 'fulfilled' ? restDaysRes.value   : [];
          const photos     = photosRes.status     === 'fulfilled' ? photosRes.value     : [];
          const matchData  = matchRes.status      === 'fulfilled' ? matchRes.value      : { matchId: null, matchedSince: null, mate: null };
          const matchReqs  = requestsRes.status   === 'fulfilled' ? requestsRes.value   : [];
          const sentReqs   = sentRes.status       === 'fulfilled' ? sentRes.value       : [];
          const discovery  = discoveryRes.status  === 'fulfilled' ? discoveryRes.value  : [];

          let messages: Message[] = [];
          if (matchData.matchId) {
            try { messages = await MessageAPI.getAll(matchData.matchId, userId); } catch {}
          }

          set({
            user: {
              ...profile,
              routines,
              photos,
              restDays,
              matchedSince: matchData.matchedSince ?? null,
            },
            mate: matchData.mate,
            matchId: matchData.matchId,
            messages,
            matchRequests: matchReqs,
            sentMatchRequests: sentReqs,
            discoveryUsers: discovery,
            isLoggedIn: true,
          });
          return 'ok';
        } catch {
          // On unexpected error, keep user logged in if we have cached data
          const cached = get().user;
          if (cached.id) {
            set({ isLoggedIn: true });
            return 'ok';
          }
          return 'error';
        }
      },

      // ── Routines ──────────────────────────────────────────────────────────
      toggleRoutineComplete: (routineId, date) => {
        const state = get();
        const routine = state.user.routines.find(r => r.id === routineId);
        const wasCompleted = routine?.completedDates.includes(date) ?? false;
        const nowCompleted = !wasCompleted;

        set((s) => ({
          user: {
            ...s.user,
            routines: s.user.routines.map((r) => {
              if (r.id !== routineId) return r;
              return {
                ...r,
                completedDates: wasCompleted
                  ? r.completedDates.filter((d) => d !== date)
                  : [...r.completedDates, date],
              };
            }),
          },
        }));

        const userId = get().user.id;
        if (userId) {
          RoutineAPI.setCompletion(routineId, userId, date, nowCompleted).catch(console.error);
        }
      },

      addRoutine: (routine) => {
        const routineWithId = { ...routine, id: routine.id || generateId() };
        set((s) => ({
          user: { ...s.user, routines: [...s.user.routines, routineWithId] },
        }));
        const userId = get().user.id;
        if (userId) {
          RoutineAPI.create(userId, routineWithId).catch(console.error);
        }
      },

      addRoutines: (routines) => {
        const withIds = routines.map(r => ({ ...r, id: r.id || generateId() }));
        set((s) => ({
          user: { ...s.user, routines: [...s.user.routines, ...withIds] },
        }));
        const userId = get().user.id;
        if (userId) {
          withIds.forEach(r => RoutineAPI.create(userId, r).catch(console.error));
        }
      },

      deleteRoutine: (routineId) => {
        set((s) => ({
          user: { ...s.user, routines: s.user.routines.filter((r) => r.id !== routineId) },
        }));
        RoutineAPI.delete(routineId).catch(console.error);
      },

      updateRoutine: (id, updates) => {
        set((s) => ({
          user: {
            ...s.user,
            routines: s.user.routines.map((r) => r.id === id ? { ...r, ...updates } : r),
          },
        }));
        RoutineAPI.update(id, updates).catch(console.error);
      },

      // ── User ──────────────────────────────────────────────────────────────
      updateUser: (updates) => {
        set((s) => ({ user: { ...s.user, ...updates } }));
        const userId = get().user.id;
        if (userId) {
          ProfileAPI.update(userId, updates).catch(console.error);
        }
      },

      togglePro: () => {
        set((s) => ({ user: { ...s.user, isPro: !s.user.isPro } }));
        const { user } = get();
        if (user.id) {
          ProfileAPI.update(user.id, { isPro: user.isPro }).catch(console.error);
        }
      },

      // ── Photos ────────────────────────────────────────────────────────────
      addPhoto: (photo) => {
        set((s) => ({ user: { ...s.user, photos: [...s.user.photos, photo] } }));
        const userId = get().user.id;
        if (userId) {
          PhotoAPI.add(userId, photo).catch(console.error);
        }
      },

      deletePhoto: (id) => {
        set((s) => ({ user: { ...s.user, photos: s.user.photos.filter((p) => p.id !== id) } }));
        PhotoAPI.delete(id).catch(console.error);
      },

      pinPhoto: (id) => {
        set((s) => {
          const photos = [...s.user.photos];
          const idx = photos.findIndex(p => p.id === id);
          if (idx > -1) {
            const [pinned] = photos.splice(idx, 1);
            pinned.isPinned = !pinned.isPinned;
            if (pinned.isPinned) photos.unshift(pinned);
            else photos.push(pinned);
            PhotoAPI.setPin(id, !!pinned.isPinned).catch(console.error);
          }
          return { user: { ...s.user, photos } };
        });
      },

      // ── Messages ──────────────────────────────────────────────────────────
      sendMessage: (text) => {
        const msg: Message = {
          id: generateId(),
          text,
          sentByMe: true,
          timestamp: new Date().toISOString(),
        };
        set((s) => ({ messages: [...s.messages, msg] }));
        const { matchId, user } = get();
        if (matchId && user.id) {
          MessageAPI.send(matchId, user.id, text).catch(console.error);
        }
      },

      deleteMessage: (id) => {
        set((s) => ({ messages: s.messages.filter((m) => m.id !== id) }));
      },

      // ── Auth & Misc ───────────────────────────────────────────────────────
      setLoggedIn: (value) => set({ isLoggedIn: value }),

      toggleRestDay: (date) => {
        set((s) => {
          const already = s.user.restDays.includes(date);
          const userId = s.user.id;
          if (userId) {
            RoutineAPI.setRestDay(userId, date, !already).catch(console.error);
          }
          return {
            user: {
              ...s.user,
              restDays: already
                ? s.user.restDays.filter((d) => d !== date)
                : [...s.user.restDays, date],
            },
          };
        });
      },

      toggleSetActive: (setName) => {
        set((s) => {
          const inactive = s.user.inactiveSets ?? [];
          const isInactive = inactive.includes(setName);
          return {
            user: {
              ...s.user,
              inactiveSets: isInactive
                ? inactive.filter(n => n !== setName)
                : [...inactive, setName],
            },
          };
        });
      },

      addRoutineProof: (routineId, date, uri) => {
        set((s) => {
          const routine = s.user.routines.find(r => r.id === routineId);
          const newPhoto: Photo = {
            id: `proof-${routineId}-${date}`,
            uri,
            uploadedAt: new Date().toISOString(),
            proofMeta: {
              routineId,
              routineName: routine?.name ?? '',
              setName: routine?.setName,
              capturedAt: new Date().toISOString(),
            },
          };
          return {
            user: {
              ...s.user,
              routines: s.user.routines.map(r =>
                r.id !== routineId ? r : {
                  ...r,
                  proofPhotos: [...(r.proofPhotos ?? []).filter(p => p.date !== date), { date, uri }],
                }
              ),
              photos: [...s.user.photos.filter(p => p.id !== newPhoto.id), newPhoto],
            },
          };
        });
      },

      // ── Discovery & Matching ──────────────────────────────────────────────
      sendMatchRequest: (targetUser) => {
        set((s) => ({ sentMatchRequests: [...s.sentMatchRequests, targetUser.id] }));
        const userId = get().user.id;
        if (userId) {
          MatchAPI.sendRequest(userId, targetUser.id).catch(console.error);
        }
      },

      cancelMatchRequest: (targetUserId) => {
        set((s) => ({ sentMatchRequests: s.sentMatchRequests.filter(id => id !== targetUserId) }));
        const userId = get().user.id;
        if (userId) {
          MatchAPI.cancelRequest(userId, targetUserId).catch(console.error);
        }
      },

      acceptMatchRequest: (request) => {
        const newMate: Mate = {
          id: request.fromUser.id,
          username: request.fromUser.username,
          avatarUri: request.fromUser.avatarUri,
          gender: request.fromUser.gender,
          interests: request.fromUser.interests,
          achievementScore: request.fromUser.achievementScore,
          routines: [],
          photos: [],
        };
        const welcomeMsg: Message = {
          id: generateId(),
          text: `🎉 ${request.fromUser.username} ile eşleştin! Rutin yolculuğunuz başlıyor.`,
          sentByMe: false,
          timestamp: new Date().toISOString(),
        };

        set((s) => ({
          mate: newMate,
          user: { ...s.user, matchedSince: new Date().toISOString() },
          matchRequests: s.matchRequests.filter(r => r.id !== request.id),
          messages: [welcomeMsg],
        }));

        const userId = get().user.id;
        if (userId) {
          MatchAPI.accept(request.fromUser.id, userId, request.id)
            .then(matchId => { if (matchId) set({ matchId }); })
            .catch(console.error);
        }
      },

      rejectMatchRequest: (requestId) => {
        set((s) => ({ matchRequests: s.matchRequests.filter(r => r.id !== requestId) }));
        MatchAPI.reject(requestId).catch(console.error);
      },

      unmatch: () => {
        const { matchId } = get();
        set({ mate: null, messages: [], matchId: null, user: { ...get().user, matchedSince: null } });
        if (matchId) {
          MatchAPI.unmatch(matchId).catch(console.error);
        }
      },

      resetStore: () => {
        set({
          user: BLANK_USER,
          mate: null,
          matchId: null,
          messages: [],
          isLoggedIn: false,
          discoveryUsers: [],
          matchRequests: [],
          sentMatchRequests: [],
        });
      },
    }),
    {
      name: 'routinmate-v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        user: s.user,
        mate: s.mate,
        matchId: s.matchId,
        messages: s.messages,
        discoveryUsers: s.discoveryUsers,
        matchRequests: s.matchRequests,
        sentMatchRequests: s.sentMatchRequests,
      }),
    }
  )
);
