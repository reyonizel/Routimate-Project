import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import { supabase } from '../lib/supabase';
import {
  scheduleRoutineNotification,
  cancelRoutineNotification,
  scheduleAllRoutineNotifications,
  cancelAllRoutineNotifications,
} from '../lib/notifications';
import {
  ProfileAPI, RoutineAPI, PhotoAPI, MatchAPI, MessageAPI,
  OrderAPI, StorageAPI, StoreWaitlistAPI, SessionAPI, RoutineNoteAPI, generateId,
} from '../lib/api';
import { localDateStr } from '../lib/date';

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
  setIcon?: string;
  notes?: { id: string; date: string; text: string }[];
  skippedDates?: string[];
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
    date: string;
  };
}

export interface Message {
  id: string;
  text: string;
  sentByMe: boolean;
  timestamp: string;
  isSystem?: boolean;
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
  dayEndHour: number;
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
  birthDate?: string;
  locationLat?: number;
  locationLon?: number;
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
  selectedCategory: { name: string; icon: string } | null;

  addOrder: (order: Order) => void;
  loadUserData: () => Promise<'ok' | 'unverified' | 'onboarding' | 'no_user' | 'error'>;
  setInitialized: () => void;
  setSelectedCategory: (cat: { name: string; icon: string } | null) => void;

  toggleRoutineComplete: (routineId: string, date: string) => void;
  addRoutine: (routine: Routine) => void;
  addRoutines: (routines: Routine[]) => void;
  deleteRoutine: (routineId: string) => void;
  updateRoutine: (id: string, updates: Partial<Routine>) => void;
  toggleRoutineSkip: (routineId: string, date: string) => void;
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

  addRoutineProof: (routineId: string, date: string, uri: string) => Promise<void>;
  addRoutineNote: (routineId: string, date: string, text: string) => Promise<void>;
  deleteRoutineNote: (routineId: string, noteId: string) => void;
  toggleSetActive: (setName: string) => void;
  addMatchRequest: (request: MatchRequest) => void;
  sendMatchRequest: (targetUser: Mate) => void;
  cancelMatchRequest: (targetUserId: string) => void;
  acceptMatchRequest: (request: MatchRequest) => void;
  rejectMatchRequest: (requestId: string) => void;
  unmatch: () => void;
  resetStore: () => void;

  uploadAvatar: (localUri: string) => Promise<void>;
  joinStoreWaitlist: (email: string) => Promise<'ok' | 'already' | 'error'>;
  refreshAchievementScore: () => Promise<void>;
  savePushToken: (token: string) => Promise<void>;
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
  dayEndHour: 0,
};

function calcAchievementScore(routines: Routine[], photos: Photo[]): number {
  if (routines.length === 0) return 0;

  const todayStr  = localDateStr();
  const todayDay  = new Date().getDay();   // 0=Pazar … 6=Cumartesi
  const todayDate = new Date().getDate();  // 1-31

  // Bugün yapılması gereken rutinler
  const applicable = routines.filter(r => {
    if (r.frequency === 'daily')   return true;
    if (r.frequency === 'weekly')  return (r.targetDays ?? []).includes(todayDay);
    if (r.frequency === 'monthly') return (r.monthlyDays ?? []).includes(todayDate);
    return false;
  });
  if (applicable.length === 0) return 0;

  const n = applicable.length;

  // %70 — tamamlanan görevler
  const completed = applicable.filter(r => r.completedDates.includes(todayStr)).length;

  // %30 — bugün fotoğraf eklenen görevler
  const withPhoto = applicable.filter(r =>
    photos.some(p => p.proofMeta?.routineId === r.id && p.proofMeta?.date === todayStr)
  ).length;

  return Math.round((completed / n) * 70 + (withPhoto / n) * 30);
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
      selectedCategory: null,

      setInitialized: () => set({ isInitializing: false }),
      setSelectedCategory: (cat) => set({ selectedCategory: cat }),

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

          const [routinesRes, restDaysRes, photosRes, matchRes, requestsRes, sentRes, discoveryRes, ordersRes, notesRes] =
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
              RoutineNoteAPI.getAll(userId),
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

          // Merge notes into routines
          const dbNotes = notesRes.status === 'fulfilled' ? notesRes.value : [];
          const notesByRoutine = new Map<string, { id: string; date: string; text: string }[]>();
          dbNotes.forEach(n => {
            if (!notesByRoutine.has(n.routine_id)) notesByRoutine.set(n.routine_id, []);
            notesByRoutine.get(n.routine_id)!.push(...n.notes);
          });
          routines = routines.map(r => ({
            ...r,
            notes: notesByRoutine.get(r.id) ?? r.notes ?? [],
          }));

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

          // Eşleşilen ve istek gönderilen kullanıcılar keşfette görünmeye devam etsin
          // (sentReqs hariç — "Geri Çek" butonu göstermek için discovery'de kalmalı)
          const excludeSet = new Set<string>([
            matchData.mate?.id,
            ...matchReqs.map(r => r.fromUser.id),
          ].filter(Boolean) as string[]);
          const rawDiscovery = discoveryRes.status === 'fulfilled' ? discoveryRes.value : [];
          const discovery = rawDiscovery.filter(u => !excludeSet.has(u.id));

          let messages: Message[] = [];
          if (matchData.matchId) {
            try { messages = await MessageAPI.getAll(matchData.matchId, userId); } catch {}
          }

          SessionAPI.record(userId).catch(() => {});
          scheduleAllRoutineNotifications(routines, profile.username).catch(() => {});
          // Login sonrası gerçek skor hesapla (SQL function) ve kaydet
          SessionAPI.calculateScore(userId).then(score => {
            if (score > 0) {
              set((s) => ({ user: { ...s.user, achievementScore: score } }));
              ProfileAPI.update(userId, { achievementScore: score }).catch(() => {});
            }
          }).catch(() => {});

          set({
            user: {
              ...profile,
              routines,
              photos,
              restDays,
              matchedSince: matchData.matchedSince ?? null,
              dayEndHour: cached.dayEndHour ?? 0,  // kullanıcı ayarını koru
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
          const newScore = calcAchievementScore(updatedRoutines, s.user.photos);
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
          (async () => {
            try {
              await RoutineAPI.setCompletion(routineId, userId, date, nowCompleted);
              const score = await SessionAPI.calculateScore(userId);
              set((s) => ({ user: { ...s.user, achievementScore: score } }));
              ProfileAPI.update(userId, { achievementScore: score }).catch(console.error);
            } catch (e) {
              console.error('Score sync failed:', e);
            }
          })();
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
        scheduleRoutineNotification(routineWithId, get().user.username).catch(() => {});
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
        scheduleAllRoutineNotifications(get().user.routines, get().user.username).catch(() => {});
      },

      deleteRoutine: (routineId) => {
        set((s) => ({
          user: { ...s.user, routines: s.user.routines.filter((r) => r.id !== routineId) },
        }));
        RoutineAPI.delete(routineId).catch(console.error);
        cancelRoutineNotification(routineId).catch(() => {});
      },

      updateRoutine: (id, updates) => {
        set((s) => ({
          user: {
            ...s.user,
            routines: s.user.routines.map((r) => r.id === id ? { ...r, ...updates } : r),
          },
        }));
        RoutineAPI.update(id, updates).catch(console.error);
        const updated = get().user.routines.find(r => r.id === id);
        if (updated) scheduleRoutineNotification(updated).catch(() => {});
      },

      toggleRoutineSkip: (routineId, date) => {
        set((s) => ({
          user: {
            ...s.user,
            routines: s.user.routines.map((r) => {
              if (r.id !== routineId) return r;
              const skipped = r.skippedDates ?? [];
              const isSkipped = skipped.includes(date);
              return { ...r, skippedDates: isSkipped ? skipped.filter(d => d !== date) : [...skipped, date] };
            }),
          },
        }));
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

        // Dosyayı önce kalıcı dizine kopyala (logout sonrası da erişilebilir)
        const docsDir = `${FileSystem.documentDirectory}avatars/`;
        const docsPath = `${docsDir}${userId}.jpg`;
        try {
          await FileSystem.makeDirectoryAsync(docsDir, { intermediates: true });
          await FileSystem.copyAsync({ from: localUri, to: docsPath });
        } catch {}

        const persistentUri = docsPath;
        set((s) => ({ user: { ...s.user, avatarUri: persistentUri } }));
        await ProfileAPI.update(userId, { avatarUri: persistentUri });

        // Arka planda Supabase Storage'a yükle ve public URL ile güncelle
        (async () => {
          try {
            const url = await StorageAPI.uploadImage('avatars', `${userId}/avatar`, persistentUri);
            set((s) => ({ user: { ...s.user, avatarUri: url } }));
            await ProfileAPI.update(userId, { avatarUri: url });
          } catch {}
        })();
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
        const { matchId, user, mate } = get();
        if (matchId && user.id) {
          MessageAPI.send(matchId, user.id, text).catch(console.error);
        }
        if (mate?.id) {
          supabase.functions.invoke('send-push', {
            body: { recipientId: mate.id, title: user.username || 'Mesaj', body: text },
          }).catch(() => {});
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

      addRoutineProof: async (routineId, date, uri) => {
        const userId = get().user.id;
        const routine = get().user.routines.find(r => r.id === routineId);

        // Kanıt fotoğrafı eklenince rutin otomatik tamamlandı sayılır
        const alreadyDone = routine?.completedDates.includes(date) ?? false;
        if (!alreadyDone) {
          get().toggleRoutineComplete(routineId, date);
        }
        const photoUUID = generateId();
        const proofMeta = {
          routineId,
          routineName: routine?.name ?? '',
          setName: routine?.setName,
          capturedAt: new Date().toISOString(),
          date,
        };

        // 1. Dosyayı WebP olarak kalıcı konuma kaydet (DB'ye kaydetmeden ÖNCE)
        let persistentUri = uri;
        try {
          const { manipulateAsync, SaveFormat } = await import('expo-image-manipulator');
          const docsDir = `${FileSystem.documentDirectory}proofs/`;
          await FileSystem.makeDirectoryAsync(docsDir, { intermediates: true });
          const docsPath = `${docsDir}${photoUUID}.webp`;
          const result = await manipulateAsync(uri, [{ resize: { width: 1200 } }], { compress: 0.82, format: SaveFormat.WEBP });
          await FileSystem.copyAsync({ from: result.uri, to: docsPath });
          persistentUri = docsPath;
        } catch (e) {
          console.error('Proof photo convert failed:', e);
        }

        // 2. DB'ye HEMEN kaydet (logout olsa bile fotoğraf kaybolmaz)
        if (userId) {
          const dbPhoto: Photo = { id: photoUUID, uri: persistentUri, uploadedAt: new Date().toISOString(), proofMeta };
          try {
            await PhotoAPI.add(userId, dbPhoto);
          } catch (e) {
            console.error('Proof photo DB save failed:', e);
          }
        }

        // 3. Store'u güncelle (fotoğraf anında görünür)
        const finalUri = persistentUri;
        set((s) => {
          const updatedRoutines = s.user.routines.map(r =>
            r.id !== routineId ? r : {
              ...r,
              proofPhotos: [...(r.proofPhotos ?? []).filter(p => p.date !== date), { date, uri: finalUri }],
            }
          );
          const updatedPhotos = [
            ...s.user.photos.filter(p => !(p.proofMeta?.routineId === routineId && p.proofMeta?.date === date)),
            { id: photoUUID, uri: finalUri, uploadedAt: new Date().toISOString(), proofMeta },
          ];
          return {
            user: {
              ...s.user,
              routines: updatedRoutines,
              photos: updatedPhotos,
              achievementScore: calcAchievementScore(updatedRoutines, updatedPhotos),
            },
          };
        });

        // 4. Arka planda: Supabase Storage'a yükle (başarısız olsa da DB'deki yerel URI kalır)
        if (userId) {
          (async () => {
            try {
              const storagePath = `${userId}/${routineId}/${date}`;
              const publicUrl = await StorageAPI.uploadImage('photos', storagePath, persistentUri);
              const cloudPhoto: Photo = { id: photoUUID, uri: publicUrl, uploadedAt: new Date().toISOString(), proofMeta };
              set((s) => ({
                user: {
                  ...s.user,
                  photos: s.user.photos.map(p => p.id === photoUUID ? cloudPhoto : p),
                  routines: s.user.routines.map(r =>
                    r.id !== routineId ? r : {
                      ...r,
                      proofPhotos: (r.proofPhotos ?? []).map(p => p.date === date ? { date, uri: publicUrl } : p),
                    }
                  ),
                },
              }));
              await PhotoAPI.add(userId, cloudPhoto);
            } catch {}
          })();

          SessionAPI.calculateScore(userId).then(score => {
            set((s) => ({ user: { ...s.user, achievementScore: score } }));
            ProfileAPI.update(userId, { achievementScore: score }).catch(console.error);
          }).catch(console.error);
        }
      },

      // ── Routine Notes ──────────────────────────────────────────────────────
      addRoutineNote: async (routineId, date, text) => {
        const userId = get().user.id;
        if (!userId) return;
        const noteId = generateId();
        try {
          await RoutineNoteAPI.add(userId, routineId, date, text);
          set((s) => ({
            user: {
              ...s.user,
              routines: s.user.routines.map(r =>
                r.id !== routineId ? r : {
                  ...r,
                  notes: [...(r.notes ?? []), { id: noteId, date, text }],
                }
              ),
            },
          }));
        } catch (e) {
          console.error('Note save failed:', e);
        }
      },

      deleteRoutineNote: (routineId, noteId) => {
        set((s) => ({
          user: {
            ...s.user,
            routines: s.user.routines.map(r =>
              r.id !== routineId ? r : {
                ...r,
                notes: (r.notes ?? []).filter(n => n.id !== noteId),
              }
            ),
          },
        }));
        RoutineNoteAPI.delete(noteId).catch(console.error);
      },

      // ── Discovery & Matching ──────────────────────────────────────────────
      addMatchRequest: (request) => {
        set((s) => {
          const exists = s.matchRequests.some(r => r.id === request.id);
          if (exists) return s;
          return { matchRequests: [...s.matchRequests, request] };
        });
      },

      sendMatchRequest: (targetUser) => {
        set((s) => ({ sentMatchRequests: [...s.sentMatchRequests, targetUser.id] }));
        const { user } = get();
        if (user.id) {
          MatchAPI.sendRequest(user.id, targetUser.id).catch(console.error);
          supabase.functions.invoke('send-push', {
            body: {
              recipientId: targetUser.id,
              title: 'Yeni Esleme Istegi',
              body: `${user.username} sana esleme istegi gonderdi`,
            },
          }).catch(() => {});
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
          text: `${request.fromUser.username} ile eşleştin`,
          sentByMe: false,
          timestamp: new Date().toISOString(),
          isSystem: true,
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
        const { matchId, user } = get();
        set({ mate: null, messages: [], matchId: null, matchRequests: [], user: { ...get().user, matchedSince: null } });
        if (matchId) {
          MatchAPI.unmatch(matchId).catch(console.error);
        } else if (user.id) {
          // matchId store'da null olsa bile DB'de hâlâ aktif eşleşme olabilir
          MatchAPI.getActiveMatch(user.id)
            .then(md => { if (md.matchId) MatchAPI.unmatch(md.matchId).catch(console.error); })
            .catch(() => {});
        }
      },

      resetStore: () => {
        cancelAllRoutineNotifications().catch(() => {});
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

      savePushToken: async (token) => {
        const userId = get().user.id;
        if (!userId) return;
        await ProfileAPI.update(userId, { pushToken: token } as any);
      },

      joinStoreWaitlist: async (email) => {
        const userId = get().user.id || null;
        return StoreWaitlistAPI.join(userId, email);
      },

      refreshAchievementScore: async () => {
        const { user } = get();
        if (!user.id) return;
        const score = await SessionAPI.calculateScore(user.id);
        set((s) => ({ user: { ...s.user, achievementScore: score } }));
        ProfileAPI.update(user.id, { achievementScore: score }).catch(console.error);
      },
    }),
    {
      name: 'routinmate-v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        user: s.user,
        mate: s.mate,
        matchId: s.matchId,
        orders: s.orders,
        discoveryUsers: s.discoveryUsers,
        matchRequests: s.matchRequests,
        sentMatchRequests: s.sentMatchRequests,
      }),
    }
  )
);
