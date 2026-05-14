import { supabase } from './supabase';
import type { User, Mate, Routine, Photo, Message, MatchRequest, Gender } from '../store/useStore';

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
  };
}

function dbToPhoto(p: any): Photo {
  return {
    id: p.id,
    uri: p.uri,
    uploadedAt: p.created_at,
    isPinned: p.is_pinned ?? false,
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
      gender: data.gender as Gender,
      avatarUri: data.avatar_url ?? null,
      isPro: data.is_pro ?? false,
      interests: data.interests ?? [],
      achievementScore: data.achievement_score ?? 0,
      matchedSince: data.matched_since ?? null,
      inactiveSets: data.inactive_sets ?? [],
    };
  },

  async update(userId: string, updates: Partial<User>): Promise<void> {
    const db: Record<string, any> = {};
    if (updates.username !== undefined)      db.username = updates.username;
    if (updates.fullName !== undefined)      db.full_name = updates.fullName;
    if (updates.bio !== undefined)           db.bio = updates.bio;
    if (updates.birthDate !== undefined)     db.birth_date = updates.birthDate;
    if (updates.locationName !== undefined)  db.location_name = updates.locationName;
    if (updates.gender !== undefined)        db.gender = updates.gender;
    if (updates.avatarUri !== undefined)     db.avatar_url = updates.avatarUri;
    if (updates.isPro !== undefined)         db.is_pro = updates.isPro;
    if (updates.interests !== undefined)     db.interests = updates.interests;
    if (updates.achievementScore !== undefined) db.achievement_score = updates.achievementScore;
    if (Object.keys(db).length > 0) {
      await supabase.from('profiles').update(db).eq('id', userId);
    }
  },

  async getDiscovery(userId: string): Promise<Mate[]> {
    const { data } = await supabase
      .from('profiles')
      .select('id, username, gender, avatar_url, interests, achievement_score, routines(id, name, description, frequency, notification_time, created_at, target_days, monthly_days, routine_completions(completed_date)), photos(id, uri, is_pinned, created_at)')
      .neq('id', userId)
      .limit(30);
    if (!data) return [];
    return data.map(dbToMate);
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
    await supabase.from('routines').insert({
      id: routine.id,
      user_id: userId,
      name: routine.name,
      description: routine.description ?? null,
      frequency: routine.frequency,
      notification_time: routine.notificationTime,
      target_days: routine.targetDays ?? [],
      monthly_days: routine.monthlyDays ?? [],
      created_at: routine.createdAt,
    });
  },

  async update(id: string, updates: Partial<Routine>): Promise<void> {
    const db: Record<string, any> = {};
    if (updates.name !== undefined)             db.name = updates.name;
    if (updates.description !== undefined)      db.description = updates.description;
    if (updates.frequency !== undefined)        db.frequency = updates.frequency;
    if (updates.notificationTime !== undefined) db.notification_time = updates.notificationTime;
    if (updates.targetDays !== undefined)       db.target_days = updates.targetDays;
    if (updates.monthlyDays !== undefined)      db.monthly_days = updates.monthlyDays;
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

  async add(userId: string, photo: Photo): Promise<void> {
    await supabase.from('photos').insert({
      id: photo.id,
      user_id: userId,
      uri: photo.uri,
      is_pinned: photo.isPinned ?? false,
      created_at: photo.uploadedAt,
    });
  },

  async delete(id: string): Promise<void> {
    await supabase.from('photos').delete().eq('id', id);
  },

  async setPin(id: string, isPinned: boolean): Promise<void> {
    await supabase.from('photos').update({ is_pinned: isPinned }).eq('id', id);
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
    const [user1_id, user2_id] = fromUserId < toUserId
      ? [fromUserId, toUserId]
      : [toUserId, fromUserId];

    const { data } = await supabase
      .from('matches')
      .insert({ user1_id, user2_id })
      .select('id')
      .single();

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
    const { data } = await supabase
      .from('matches')
      .select('id, matched_since, user1_id, user2_id, user1:user1_id(id, username, gender, avatar_url, interests, achievement_score, routines(id, name, description, frequency, notification_time, created_at, target_days, monthly_days, routine_completions(completed_date)), photos(id, uri, is_pinned, created_at)), user2:user2_id(id, username, gender, avatar_url, interests, achievement_score, routines(id, name, description, frequency, notification_time, created_at, target_days, monthly_days, routine_completions(completed_date)), photos(id, uri, is_pinned, created_at))')
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .limit(1)
      .maybeSingle();

    if (!data) return { mate: null, matchId: null, matchedSince: null };

    const mateRaw: any = (data as any).user1_id === userId ? (data as any).user2 : (data as any).user1;
    return {
      mate: dbToMate(mateRaw),
      matchId: data.id,
      matchedSince: data.matched_since,
    };
  },

  async unmatch(matchId: string): Promise<void> {
    await supabase.from('matches').delete().eq('id', matchId);
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
};
