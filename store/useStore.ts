import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import {
  ProfileAPI, RoutineAPI, PhotoAPI, MatchAPI, MessageAPI,
  OrderAPI, StorageAPI, StoreWaitlistAPI, SessionAPI, generateId,
} from '../lib/api';

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

export interface OrderProduct {
  id: string;
  name: string;
  price: number;
  emoji: string;
}

export type OrderStatus = 'Hazırlanıyor' | 'Kargoya Verildi' | 'Teslim Edildi';

export interface Order {
  id: string;
  products: OrderProduct[];
  total: number;
  city: string;
  district: string;
  neighborhood: string;
  address: string;
  phone: string;
  status: OrderStatus;
  createdAt: string;
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
  orders: Order[];
  isLoggedIn: boolean;
  isInitializing: boolean;
  discoveryUsers: Mate[];
  matchRequests: MatchRequest[];
  sentMatchRequests: string[];

  addOrder: (order: Order) => void;
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
  appendMessage: (msg: Message) => void;
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

  uploadAvatar: (localUri: string) => Promise<void>;
  joinStoreWaitlist: (email: string) => Promise<'ok' | 'already' | 'error'>;
  refreshAchievementScore: () => Promise<void>;
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

function calcAchievementScore(routines: Routine[]): number {
  if (routines.length === 0) return 0;
  const today = new Date();
  const last30 = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    return d.toISOString().split('T')[0];
  });
  let totalExpected = 0;
  let totalDone = 0;
  for (const r of routines) {
    const expected = last30.filter(date => {
      if (r.frequency === 'daily') return true;
      if (r.frequency === 'weekly') {
        const day = new Date(date).getDay();
        return (r.targetDays ?? []).includes(day);
      }
      if (r.frequency === 'monthly') {
        const dayOfMonth = new Date(date).getDate();
        return (r.monthlyDays ?? []).includes(dayOfMonth);
      }
      return false;
    }).length || 1;
    const done = r.completedDates.filter(d => last30.includes(d)).length;
    totalExpected += expected;
    totalDone += done;
  }
  return Math.round((totalDone / totalExpected) * 100);
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: BLANK_USER,
      mate: null,
      matchId: null,
      messages: [],
      orders: [],
      isLoggedIn: false,
      isInitializing: true,
      discoveryUsers: [],
      matchRequests: [],
      sentMatchRequests: [],

      setInitialized: () => set({ isInitializing: false }),

      addOrder: (order) => {
        set((s) => ({ orders: [order, ...s.orders] }));
        const userId = get().user.id;
        if (userId) {
          OrderAPI.create(userId, order).catch(console.error);
        }
      },

      // ── Load all user data from Supabase ──────────────────────────────────
      loadUserData: async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session?.user) return 'no_user';
          const authUser = session.user;
          if (!authUser.email_confirmed_at) return 'unverified';

          const userId = authUser.id;

          // Profil önce çekilir: hem gate kontrolü hem keşfet skorlaması için gerekli
          const profile = await ProfileAPI.get(userId);
          if (!profile) {
            const cached = get().user;
            if (cached.id === userId) {
              set({ isLoggedIn: true });
              return 'ok';
            }
            return 'onboarding';
          }
          if (!profile.username) return 'onboarding';

          const [routinesRes, restDaysRes, photosRes, matchRes, requestsRes, sentRes, discoveryRes, ordersRes] =
            await Promise.allSettled([
              RoutineAPI.getAll(userId),
              RoutineAPI.getRestDays(userId),
              PhotoAPI.getAll(userId),
              MatchAPI.getActiveMatch(userId),
              MatchAPI.getRequests(userId),
              MatchAPI.getSentRequests(userId),
              ProfileAPI.getDiscovery(userId, [], {
                birthDate: profile.birthDate,
                locationLat: profile.locationLat,
                locationLon: profile.locationLon,
                gender: profile.gender,
                achievementScore: profile.achievementScore,
              }),
              OrderAPI.getAll(userId),
            ]);

          const cached = get().user;
          const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

          // Resolve routines: DB is authoritative when it has rows.
          // If DB is empty but cache has rows, migrate cache → DB (fixes old
          // non-UUID ids from the create screen bug).
          const dbRoutines = routinesRes.status === 'fulfilled' ? routinesRes.value : null;
          let routines: Routine[];
          if (dbRoutines !== null && dbRoutines.length > 0) {
            routines = dbRoutines;
          } else if (dbRoutines !== null && dbRoutines.length === 0 && cached.routines.length > 0) {
            // Re-sync: fix any non-UUID ids before inserting
            routines = cached.routines.map(r =>
              UUID_RE.test(r.id) ? r : { ...r, id: generateId() }
            );
            routines.forEach(r => RoutineAPI.create(userId, r).catch(console.error));
          } else {
            routines = dbRoutines ?? cached.routines;
          }
          const restDays  = restDaysRes.status  === 'fulfilled' ? restDaysRes.value  : cached.restDays;

          // Merge: DB is authoritative, but preserve cached photos not yet synced to DB
          const dbPhotos  = photosRes.status    === 'fulfilled' ? photosRes.value    : null;
          const photos    = dbPhotos !== null
            ? [
                ...dbPhotos,
                ...cached.photos.filter(p => !dbPhotos.some(d => d.id === p.id)),
              ]
            : cached.photos;
          const matchData = matchRes.status     === 'fulfilled' ? matchRes.value     : { matchId: null, matchedSince: null, mate: null };
          const matchReqs = requestsRes.status  === 'fulfilled' ? requestsRes.value  : [];
          const sentReqs  = sentRes.status      === 'fulfilled' ? sentRes.value      : [];
          const orders    = ordersRes.status    === 'fulfilled' ? ordersRes.value    : get().orders;

          // Eşleşilen / istek gönderilen kullanıcıları keşfetten çıkar
          const excludeSet = new Set<string>([
            matchData.mate?.id,
            ...sentReqs,
            ...matchReqs.map(r => r.fromUser.id),
          ].filter(Boolean) as string[]);
          const rawDiscovery = discoveryRes.status === 'fulfilled' ? discoveryRes.value : [];
          const discovery = rawDiscovery.filter(u => !excludeSet.has(u.id));

          let messages: Message[] = [];
          if (matchData.matchId) {
            try { messages = await MessageAPI.getAll(matchData.matchId, userId); } catch {}
          }

          SessionAPI.record(userId).catch(() => {});

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
            orders,
            isLoggedIn: true,
          });
          return 'ok';
        } catch {
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

        set((s) => {
          const updatedRoutines = s.user.routines.map((r) => {
            if (r.id !== routineId) return r;
            return {
              ...r,
              completedDates: wasCompleted
                ? r.completedDates.filter((d) => d !== date)
                : [...r.completedDates, date],
            };
          });
          const newScore = calcAchievementScore(updatedRoutines);
          return {
            user: {
              ...s.user,
              routines: updatedRoutines,
              achievementScore: newScore,
            },
          };
        });

        const userId = get().user.id;
        if (userId) {
          RoutineAPI.setCompletion(routineId, userId, date, nowCompleted).catch(console.error);
          // Local score güncellendi. DB'den kesin skoru arka planda al ve kaydet.
          SessionAPI.calculateScore(userId).then(score => {
            set((s) => ({ user: { ...s.user, achievementScore: score } }));
            ProfileAPI.update(userId, { achievementScore: score }).catch(console.error);
          }).catch(() => {
            const localScore = get().user.achievementScore;
            ProfileAPI.update(userId, { achievementScore: localScore }).catch(console.error);
          });
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

      uploadAvatar: async (localUri) => {
        const userId = get().user.id;
        if (!userId) return;
        try {
          const url = await StorageAPI.uploadImage('avatars', `${userId}/avatar`, localUri);
          set((s) => ({ user: { ...s.user, avatarUri: url } }));
          await ProfileAPI.update(userId, { avatarUri: url });
        } catch {
          // Fallback: keep local URI
          set((s) => ({ user: { ...s.user, avatarUri: localUri } }));
          await ProfileAPI.update(userId, { avatarUri: localUri });
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
        MessageAPI.delete(id).catch(console.error);
      },

      appendMessage: (msg) => {
        set((s) => {
          const exists = s.messages.some(m => m.id === msg.id);
          if (exists) return s;
          return { messages: [...s.messages, msg] };
        });
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
          const newInactive = isInactive
            ? inactive.filter(n => n !== setName)
            : [...inactive, setName];
          const userId = s.user.id;
          if (userId) {
            ProfileAPI.update(userId, { inactiveSets: newInactive }).catch(console.error);
          }
          return {
            user: {
              ...s.user,
              inactiveSets: newInactive,
            },
          };
        });
      },

      addRoutineProof: (routineId, date, uri) => {
        const userId = get().user.id;
        const routine = get().user.routines.find(r => r.id === routineId);

        const photoId = `proof-${routineId}-${date}`;
        const proofMeta = {
          routineId,
          routineName: routine?.name ?? '',
          setName: routine?.setName,
          capturedAt: new Date().toISOString(),
        };

        const newPhoto: Photo = {
          id: photoId,
          uri,
          uploadedAt: new Date().toISOString(),
          proofMeta,
        };

        set((s) => ({
          user: {
            ...s.user,
            routines: s.user.routines.map(r =>
              r.id !== routineId ? r : {
                ...r,
                proofPhotos: [...(r.proofPhotos ?? []).filter(p => p.date !== date), { date, uri }],
              }
            ),
            photos: [...s.user.photos.filter(p => p.id !== photoId), newPhoto],
          },
        }));

        if (userId) {
          // Save to DB immediately with local URI so reloads don't lose the photo
          PhotoAPI.add(userId, newPhoto).catch(console.error);

          // Background: upload to storage, then upsert with publicUrl
          (async () => {
            try {
              const storagePath = `${userId}/${routineId}/${date}`;
              const publicUrl = await StorageAPI.uploadImage('photos', storagePath, uri);
              const uploadedPhoto: Photo = { ...newPhoto, uri: publicUrl };

              set((s) => ({
                user: {
                  ...s.user,
                  photos: s.user.photos.map(p => p.id === photoId ? uploadedPhoto : p),
                  routines: s.user.routines.map(r =>
                    r.id !== routineId ? r : {
                      ...r,
                      proofPhotos: (r.proofPhotos ?? []).map(p => p.date === date ? { date, uri: publicUrl } : p),
                    }
                  ),
                },
              }));

              // Upsert to replace local URI with publicUrl in DB
              await PhotoAPI.add(userId, uploadedPhoto);
            } catch {
              // Local URI already persisted in DB — acceptable fallback
            }
          })();
        }
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
          orders: [],
          isLoggedIn: false,
          discoveryUsers: [],
          matchRequests: [],
          sentMatchRequests: [],
        });
      },

      joinStoreWaitlist: async (email) => {
        const userId = get().user.id || null;
        return StoreWaitlistAPI.join(userId, email);
      },

      refreshAchievementScore: async () => {
        const userId = get().user.id;
        if (!userId) return;
        const score = await SessionAPI.calculateScore(userId);
        set((s) => ({ user: { ...s.user, achievementScore: score } }));
        ProfileAPI.update(userId, { achievementScore: score }).catch(console.error);
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
        orders: s.orders,
        discoveryUsers: s.discoveryUsers,
        matchRequests: s.matchRequests,
        sentMatchRequests: s.sentMatchRequests,
      }),
    }
  )
);
