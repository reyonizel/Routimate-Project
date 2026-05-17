import { decode } from 'base64-arraybuffer';
import * as FileSystem from 'expo-file-system/legacy';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { supabase } from './supabase';
import type { User, Mate, Routine, Photo, Message, MatchRequest, Gender, Order, OrderProduct } from '../store/useStore';

export function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function dbToRoutine(r: any): Routine {
  return {
    id: r.id,
    name: r.name,
    description: r.description ?? undefined,
    frequency: r.frequency,
    notificationTime: r.notification_time,
    completedDates: (r.routine_completions ?? []).map((c: any) => c.completed_date as string),
    createdAt: r.created_at,
    targetDays: r.target_days ?? undefined,
    monthlyDays: r.monthly_days ?? undefined,
    setName: r.set_name ?? undefined,
    scope: (r.scope ?? 'recurring') as Routine['scope'],
    onceRange: r.once_start && r.once_end
      ? { start: r.once_start, end: r.once_end }
      : undefined,
  };
}

function dbToPhoto(p: any): Photo {
  return {
    id: p.id,
    uri: p.uri,
    uploadedAt: p.created_at,
    isPinned: p.is_pinned ?? false,
    proofMeta: p.proof_meta ?? undefined,
  };
}

function dbToMate(p: any): Mate {
  return {
    id: p.id,
    username: p.username,
    gender: p.gender as Gender,
    avatarUri: p.avatar_url ?? null,
    interests: p.interests ?? [],
    achievementScore: p.achievement_score ?? 0,
    routines: (p.routines ?? []).map(dbToRoutine),
    photos: (p.photos ?? []).map(dbToPhoto),
  };
}

// ─── Storage ──────────────────────────────────────────────────────────────────

export const StorageAPI = {
  async uploadImage(
    bucket: 'avatars' | 'photos',
    path: string,
    localUri: string,
    opts?: { maxWidth?: number; quality?: number }
  ): Promise<string> {
    const maxWidth = opts?.maxWidth ?? (bucket === 'avatars' ? 400 : 1200);
    const quality  = opts?.quality  ?? (bucket === 'avatars' ? 0.85 : 0.82);

    const webp = await manipulateAsync(
      localUri,
      [{ resize: { width: maxWidth } }],
      { compress: quality, format: SaveFormat.WEBP }
    );

    const base64 = await FileSystem.readAsStringAsync(webp.uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(`${path}.webp`, decode(base64), { contentType: 'image/webp', upsert: true });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return publicUrl;
  },

  async deleteImage(bucket: 'avatars' | 'photos', path: string): Promise<void> {
    await supabase.storage.from(bucket).remove([path]);
  },
};

// ─── Discovery scoring helpers ───────────────────────────────────────────────

const AGE_GROUPS: [number, number][] = [
  [13, 17], [17, 25], [25, 35], [35, 45],
  [45, 55], [55, 65], [65, 86],
];

function getAgeGroup(birthDate?: string | null): number {
  if (!birthDate) return -1;
  const age = Math.floor((Date.now() - new Date(birthDate).getTime()) / (365.25 * 24 * 3600 * 1000));
  return AGE_GROUPS.findIndex(([lo, hi]) => age >= lo && age < hi);
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const toRad = (d: number) => d * (Math.PI / 180);
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

type DiscoveryUserProfile = {
  birthDate?: string;
  locationLat?: number;
  locationLon?: number;
  gender: Gender;
  achievementScore: number;
};

function scoreCandidate(user: DiscoveryUserProfile, c: any): number {
  let score = 0;

  // 1. Yaş grubu — baskın kriter
  const ug = getAgeGroup(user.birthDate);
  const cg = getAgeGroup(c.birth_date);
  if (ug >= 0 && cg >= 0) {
    if (ug === cg) score += 1000;
    else if (Math.abs(ug - cg) === 1) score += 300;
  }

  // 2. Konum mesafesi — ikincil kriter
  if (user.locationLat && user.locationLon && c.location_lat && c.location_lon) {
    const km = haversineKm(user.locationLat, user.locationLon, c.location_lat, c.location_lon);
    if (km < 10)       score += 500;
    else if (km < 50)  score += 300;
    else if (km < 100) score += 150;
    else if (km < 300) score += 50;
  }

  // 3. Cinsiyet — üçüncül kriter
  if (user.gender === c.gender) score += 100;

  // 4. Başarı oranı benzerliği — dördüncül kriter
  const diff = Math.abs((user.achievementScore ?? 0) - (c.achievement_score ?? 0));
  score += Math.max(0, 50 - diff / 2);

  return score;
}

// ─── Profile ─────────────────────────────────────────────────────────────────

export const ProfileAPI = {
  async get(userId: string): Promise<Omit<User, 'routines' | 'photos' | 'restDays'> | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    if (error || !data) return null;
    return {
      id: data.id,
      username: data.username,
      fullName: data.full_name ?? undefined,
      bio: data.bio ?? undefined,
      birthDate: data.birth_date ?? undefined,
      locationName: data.location_name ?? undefined,
      locationLat: data.location_lat ?? undefined,
      locationLon: data.location_lon ?? undefined,
      gender: data.gender as Gender,
      avatarUri: data.avatar_url ?? null,
      isPro: data.is_pro ?? false,
      interests: data.interests ?? [],
      achievementScore: data.achievement_score ?? 0,
      matchedSince: data.matched_since ?? null,
      inactiveSets: data.inactive_sets ?? [],
      notificationSound: data.notification_sound ?? 'default',
      completionSound: data.completion_sound ?? 'correct',
    };
  },

  async update(userId: string, updates: Partial<User>): Promise<void> {
    const db: Record<string, any> = {};
    if (updates.username !== undefined)          db.username = updates.username;
    if (updates.fullName !== undefined)          db.full_name = updates.fullName;
    if (updates.bio !== undefined)               db.bio = updates.bio;
    if (updates.birthDate !== undefined)         db.birth_date = updates.birthDate;
    if (updates.locationName !== undefined)      db.location_name = updates.locationName;
    if (updates.locationLat !== undefined)       db.location_lat = updates.locationLat;
    if (updates.locationLon !== undefined)       db.location_lon = updates.locationLon;
    if (updates.gender !== undefined)            db.gender = updates.gender;
    if (updates.avatarUri !== undefined)         db.avatar_url = updates.avatarUri;
    if (updates.isPro !== undefined)             db.is_pro = updates.isPro;
    if (updates.interests !== undefined)         db.interests = updates.interests;
    if (updates.achievementScore !== undefined)  db.achievement_score = updates.achievementScore;
    if (updates.matchedSince !== undefined)      db.matched_since = updates.matchedSince;
    if (updates.inactiveSets !== undefined)      db.inactive_sets = updates.inactiveSets;
    if (updates.notificationSound !== undefined) db.notification_sound = updates.notificationSound;
    if (updates.completionSound !== undefined)   db.completion_sound = updates.completionSound;
    if (Object.keys(db).length > 0) {
      await supabase.from('profiles').update(db).eq('id', userId);
    }
  },

  async getDiscovery(
    userId: string,
    excludeIds: string[] = [],
    userProfile?: DiscoveryUserProfile,
  ): Promise<Mate[]> {
    const { data } = await supabase
      .from('profiles')
      .select('id, username, gender, avatar_url, interests, achievement_score, birth_date, location_lat, location_lon, routines(id, name, description, frequency, notification_time, created_at, target_days, monthly_days, set_name, scope, once_start, once_end, routine_completions(completed_date)), photos(id, uri, is_pinned, created_at, proof_meta)')
      .neq('id', userId)
      .limit(50);
    if (!data) return [];

    const excluded = new Set(excludeIds);
    let candidates = data.filter(p => !excluded.has(p.id));

    if (userProfile) {
      candidates = [...candidates].sort(
        (a, b) => scoreCandidate(userProfile, b) - scoreCandidate(userProfile, a)
      );
    }

    return candidates.slice(0, 30).map(dbToMate);
  },
};

// ─── Routines ─────────────────────────────────────────────────────────────────

export const RoutineAPI = {
  async getAll(userId: string): Promise<Routine[]> {
    const { data } = await supabase
      .from('routines')
      .select('*, routine_completions(completed_date)')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });
    if (!data) return [];
    return data.map(dbToRoutine);
  },

  async create(userId: string, routine: Routine): Promise<void> {
    const { error } = await supabase.from('routines').insert({
      id: routine.id,
      user_id: userId,
      name: routine.name,
      description: routine.description ?? null,
      frequency: routine.frequency,
      notification_time: routine.notificationTime,
      target_days: routine.targetDays ?? [],
      monthly_days: routine.monthlyDays ?? [],
      set_name: routine.setName ?? null,
      scope: routine.scope ?? 'recurring',
      once_start: routine.onceRange?.start ?? null,
      once_end: routine.onceRange?.end ?? null,
      created_at: routine.createdAt,
    });
    if (error && __DEV__) console.error('[RoutineAPI.create]', error.message, error.code);
  },

  async update(id: string, updates: Partial<Routine>): Promise<void> {
    const db: Record<string, any> = {};
    if (updates.name !== undefined)             db.name = updates.name;
    if (updates.description !== undefined)      db.description = updates.description;
    if (updates.frequency !== undefined)        db.frequency = updates.frequency;
    if (updates.notificationTime !== undefined) db.notification_time = updates.notificationTime;
    if (updates.targetDays !== undefined)       db.target_days = updates.targetDays;
    if (updates.monthlyDays !== undefined)      db.monthly_days = updates.monthlyDays;
    if (updates.setName !== undefined)          db.set_name = updates.setName;
    if (Object.keys(db).length > 0) {
      await supabase.from('routines').update(db).eq('id', id);
    }
  },

  async delete(id: string): Promise<void> {
    await supabase.from('routines').delete().eq('id', id);
  },

  async setCompletion(routineId: string, userId: string, date: string, completed: boolean): Promise<void> {
    if (completed) {
      await supabase.from('routine_completions')
        .upsert({ routine_id: routineId, user_id: userId, completed_date: date });
    } else {
      await supabase.from('routine_completions')
        .delete()
        .match({ routine_id: routineId, completed_date: date });
    }
  },

  async getRestDays(userId: string): Promise<string[]> {
    const { data } = await supabase
      .from('rest_days')
      .select('rest_date')
      .eq('user_id', userId);
    if (!data) return [];
    return data.map(r => r.rest_date as string);
  },

  async setRestDay(userId: string, date: string, isRest: boolean): Promise<void> {
    if (isRest) {
      await supabase.from('rest_days').upsert({ user_id: userId, rest_date: date });
    } else {
      await supabase.from('rest_days').delete().match({ user_id: userId, rest_date: date });
    }
  },
};

// ─── Photos ──────────────────────────────────────────────────────────────────

export const PhotoAPI = {
  async getAll(userId: string): Promise<Photo[]> {
    const { data } = await supabase
      .from('photos')
      .select('*')
      .eq('user_id', userId)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false });
    if (!data) return [];
    return data.map(dbToPhoto);
  },

  async add(userId: string, photo: Photo): Promise<string> {
    const { data } = await supabase.from('photos').upsert({
      id: photo.id,
      user_id: userId,
      uri: photo.uri,
      is_pinned: photo.isPinned ?? false,
      created_at: photo.uploadedAt,
      proof_meta: photo.proofMeta ?? null,
    }, { onConflict: 'id' }).select('id').single();
    return data?.id ?? photo.id;
  },

  async delete(id: string): Promise<void> {
    await supabase.from('photos').delete().eq('id', id);
  },

  async setPin(id: string, isPinned: boolean): Promise<void> {
    await supabase.from('photos').update({ is_pinned: isPinned }).eq('id', id);
  },
};

// ─── Orders ──────────────────────────────────────────────────────────────────

export const OrderAPI = {
  async getAll(userId: string): Promise<Order[]> {
    const { data } = await supabase
      .from('user_orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (!data) return [];
    return data.map(r => ({
      id: r.id,
      products: r.products as OrderProduct[],
      total: r.total,
      city: r.city,
      district: r.district,
      neighborhood: r.neighborhood ?? '',
      address: r.address,
      phone: r.phone,
      status: r.status as Order['status'],
      createdAt: r.created_at,
    }));
  },

  async create(userId: string, order: Order): Promise<void> {
    await supabase.from('user_orders').insert({
      id: order.id,
      user_id: userId,
      products: order.products,
      total: order.total,
      city: order.city,
      district: order.district,
      neighborhood: order.neighborhood,
      address: order.address,
      phone: order.phone,
      status: order.status,
      created_at: order.createdAt,
    });
  },
};

// ─── Matching ─────────────────────────────────────────────────────────────────

export const MatchAPI = {
  async sendRequest(fromUserId: string, toUserId: string): Promise<void> {
    await supabase.from('match_requests')
      .upsert({ from_user_id: fromUserId, to_user_id: toUserId });
  },

  async cancelRequest(fromUserId: string, toUserId: string): Promise<void> {
    await supabase.from('match_requests')
      .delete()
      .eq('from_user_id', fromUserId)
      .eq('to_user_id', toUserId);
  },

  async getRequests(userId: string): Promise<MatchRequest[]> {
    const { data } = await supabase
      .from('match_requests')
      .select('id, created_at, from_user:from_user_id(id, username, avatar_url, interests, achievement_score, gender)')
      .eq('to_user_id', userId);
    if (!data) return [];
    return (data as any[]).map(r => ({
      id: r.id,
      fromUser: {
        id: r.from_user.id,
        username: r.from_user.username,
        avatarUri: r.from_user.avatar_url ?? null,
        interests: r.from_user.interests ?? [],
        achievementScore: r.from_user.achievement_score ?? 0,
        gender: r.from_user.gender as Gender,
      },
      timestamp: r.created_at,
    }));
  },

  async getSentRequests(userId: string): Promise<string[]> {
    const { data } = await supabase
      .from('match_requests')
      .select('to_user_id')
      .eq('from_user_id', userId);
    if (!data) return [];
    return data.map(r => r.to_user_id as string);
  },

  async accept(fromUserId: string, toUserId: string, requestId: string): Promise<string | null> {
    const [user_a, user_b] = fromUserId < toUserId
      ? [fromUserId, toUserId]
      : [toUserId, fromUserId];

    const { data, error } = await supabase
      .from('matches')
      .insert({ user_a, user_b, status: 'active' })
      .select('id')
      .single();

    if (error && __DEV__) console.error('[MatchAPI.accept]', error.message);
    await supabase.from('match_requests').delete().eq('id', requestId);

    return data?.id ?? null;
  },

  async reject(requestId: string): Promise<void> {
    await supabase.from('match_requests').delete().eq('id', requestId);
  },

  async getActiveMatch(userId: string): Promise<{
    mate: Mate | null;
    matchId: string | null;
    matchedSince: string | null;
  }> {
    const { data: match, error } = await supabase
      .from('matches')
      .select('id, matched_at, user_a, user_b')
      .or(`user_a.eq.${userId},user_b.eq.${userId}`)
      .eq('status', 'active')
      .limit(1)
      .maybeSingle();

    if (error && __DEV__) console.error('[MatchAPI.getActiveMatch]', error.message);
    if (!match) return { mate: null, matchId: null, matchedSince: null };

    const mateId = (match as any).user_a === userId
      ? (match as any).user_b
      : (match as any).user_a;

    const { data: mateRaw } = await supabase
      .from('profiles')
      .select('id, username, gender, avatar_url, interests, achievement_score, routines(id, name, description, frequency, notification_time, created_at, target_days, monthly_days, set_name, scope, once_start, once_end, routine_completions(completed_date)), photos(id, uri, is_pinned, created_at, proof_meta)')
      .eq('id', mateId)
      .maybeSingle();

    return {
      mate: mateRaw ? dbToMate(mateRaw) : null,
      matchId: match.id,
      matchedSince: (match as any).matched_at ?? null,
    };
  },

  async unmatch(matchId: string): Promise<void> {
    await supabase.from('matches')
      .update({ status: 'ended', ended_at: new Date().toISOString() })
      .eq('id', matchId);
  },
};

// ─── Messages ─────────────────────────────────────────────────────────────────

export const MessageAPI = {
  async getAll(matchId: string, userId: string): Promise<Message[]> {
    const { data } = await supabase
      .from('messages')
      .select('id, text, sender_id, created_at')
      .eq('match_id', matchId)
      .order('created_at', { ascending: true });
    if (!data) return [];
    return data.map(m => ({
      id: m.id,
      text: m.text,
      sentByMe: m.sender_id === userId,
      timestamp: m.created_at,
    }));
  },

  async send(matchId: string, senderId: string, text: string): Promise<void> {
    await supabase.from('messages').insert({ match_id: matchId, sender_id: senderId, text });
  },

  async delete(messageId: string): Promise<void> {
    await supabase.from('messages').delete().eq('id', messageId);
  },

  subscribeToMatch(matchId: string, userId: string, onMessage: (msg: Message) => void) {
    return supabase
      .channel(`match:${matchId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `match_id=eq.${matchId}` },
        (payload) => {
          const m = payload.new as any;
          onMessage({
            id: m.id,
            text: m.text,
            sentByMe: m.sender_id === userId,
            timestamp: m.created_at,
          });
        }
      )
      .subscribe();
  },
};

// ─── Store Waitlist ───────────────────────────────────────────────────────────

export const StoreWaitlistAPI = {
  async join(userId: string | null, email: string): Promise<'ok' | 'already' | 'error'> {
    const cleanEmail = email.trim().toLowerCase();

    const { error } = await supabase
      .from('store_waitlist')
      .insert({ user_id: userId || null, email: cleanEmail });

    if (!error) return 'ok';
    if (error.code === '23505') return 'already'; // unique e-mail

    // FK ihlali (user_id profiles'da yok) → user_id olmadan tekrar dene
    if (error.code === '23503') {
      const { error: e2 } = await supabase
        .from('store_waitlist')
        .insert({ email: cleanEmail });
      if (!e2) return 'ok';
      if (e2.code === '23505') return 'already';
      if (__DEV__) console.error('[StoreWaitlistAPI.join] retry', e2.code, e2.message);
      return 'error';
    }

    if (__DEV__) console.error('[StoreWaitlistAPI.join]', error.code, error.message, error.details);
    return 'error';
  },
};

// ─── Session (başarı skoru metriği) ───────────────────────────────────────────

export const SessionAPI = {
  async record(userId: string): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    await supabase
      .from('app_sessions')
      .upsert({ user_id: userId, session_date: today }, { onConflict: 'user_id,session_date' });
  },

  async calculateScore(userId: string): Promise<number> {
    const { data, error } = await supabase.rpc('calculate_achievement_score', { p_user_id: userId });
    if (error || data === null) return 0;
    return data as number;
  },
};
