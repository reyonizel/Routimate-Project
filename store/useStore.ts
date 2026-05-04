import { create } from 'zustand';

export type Gender = 'male' | 'female';

export interface Routine {
  id: string;
  name: string;
  description?: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  notificationTime: string; // "HH:MM"
  completedDates: string[]; // ISO date strings
  createdAt: string;
  targetDays?: number[];    // weekly: which days of week (0=Sun…6=Sat)
  monthlyDays?: number[];   // monthly: which days of month (1-31)
}

export interface Photo {
  id: string;
  uri: string;
  uploadedAt: string;
  isPinned?: boolean;
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
  gender: Gender;
  avatarUri: string | null;
  isPro: boolean;
  interests: string[];
  routines: Routine[];
  photos: Photo[];
  achievementScore: number;
  matchedSince: string | null;
  restDays: string[]; // ISO date strings marked as rest days
}

export interface Mate {
  id: string;
  username: string;
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
  messages: Message[];
  isLoggedIn: boolean;
  discoveryUsers: Mate[];
  matchRequests: MatchRequest[];
  sentMatchRequests: string[]; // IDs of users we sent requests to

  // Actions
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
  
  // Discovery & Matching
  sendMatchRequest: (targetUser: Mate) => void;
  acceptMatchRequest: (request: MatchRequest) => void;
  rejectMatchRequest: (requestId: string) => void;
  unmatch: () => void;
}

const MOCK_DISCOVERY: Mate[] = [
  {
    id: 'd-1',
    username: 'selin_yoga',
    gender: 'female',
    avatarUri: 'https://i.pravatar.cc/150?u=selin_yoga',
    interests: ['Spor', 'Meditasyon', 'Kitap'],
    achievementScore: 88,
    routines: [], photos: []
  },
  {
    id: 'd-2',
    username: 'can_kod',
    gender: 'male',
    avatarUri: 'https://i.pravatar.cc/150?u=can_kod',
    interests: ['Yazılım', 'Girişimcilik', 'Müzik'],
    achievementScore: 92,
    routines: [], photos: []
  },
  {
    id: 'd-3',
    username: 'ayse_fit',
    gender: 'female',
    avatarUri: 'https://i.pravatar.cc/150?u=ayse_fit',
    interests: ['Spor', 'Beslenme', 'Yürüyüş'],
    achievementScore: 75,
    routines: [], photos: []
  },
  {
    id: 'd-4',
    username: 'mert_travel',
    gender: 'male',
    avatarUri: 'https://i.pravatar.cc/150?u=mert_travel',
    interests: ['Seyahat', 'Sanat', 'Tasarım'],
    achievementScore: 64,
    routines: [], photos: []
  },
  {
    id: 'd-5',
    username: 'dilara_edu',
    gender: 'female',
    avatarUri: 'https://i.pravatar.cc/150?u=dilara_edu',
    interests: ['Dil Öğrenimi', 'Kitap', 'Yazılım'],
    achievementScore: 81,
    routines: [], photos: []
  }
];

const INITIAL_USER: User = {
  id: 'user-1',
  username: 'burhan_dev',
  gender: 'male',
  avatarUri: null,
  isPro: false,
  interests: ['Yazılım', 'Spor', 'Kitap'],
  achievementScore: 74,
  matchedSince: null,
  routines: [
    {
      id: 'r-1',
      name: 'Morning Workout',
      frequency: 'daily',
      notificationTime: '07:00',
      completedDates: [new Date().toISOString().split('T')[0]],
      createdAt: new Date().toISOString(),
    },
    {
      id: 'r-2',
      name: 'Meditation',
      frequency: 'daily',
      notificationTime: '09:00',
      completedDates: [],
      createdAt: new Date().toISOString(),
    },
  ],
  photos: [],
  restDays: [],
};

export const useStore = create<AppState>((set, get) => ({
  user: INITIAL_USER,
  mate: null,
  messages: [],
  isLoggedIn: false,
  discoveryUsers: MOCK_DISCOVERY,
  matchRequests: [
    {
      id: 'req-1',
      fromUser: {
        id: 'd-5',
        username: 'dilara_edu',
        avatarUri: 'https://i.pravatar.cc/150?u=dilara_edu',
        interests: ['Dil Öğrenimi', 'Kitap', 'Yazılım'],
        achievementScore: 81,
        gender: 'female'
      },
      timestamp: new Date().toISOString()
    }
  ],
  sentMatchRequests: [],

  toggleRoutineComplete: (routineId, date) => {
    set((state) => ({
      user: {
        ...state.user,
        routines: state.user.routines.map((r) => {
          if (r.id !== routineId) return r;
          const already = r.completedDates.includes(date);
          return {
            ...r,
            completedDates: already
              ? r.completedDates.filter((d) => d !== date)
              : [...r.completedDates, date],
          };
        }),
      },
    }));
  },

  addRoutine: (routine) => {
    set((state) => ({
      user: { ...state.user, routines: [...state.user.routines, routine] },
    }));
  },

  addRoutines: (routines) => {
    set((state) => ({
      user: { ...state.user, routines: [...state.user.routines, ...routines] },
    }));
  },

  deleteRoutine: (routineId) => {
    set((state) => ({
      user: {
        ...state.user,
        routines: state.user.routines.filter((r) => r.id !== routineId),
      },
    }));
  },

  updateRoutine: (id, updates) => {
    set((state) => ({
      user: {
        ...state.user,
        routines: state.user.routines.map((r) =>
          r.id === id ? { ...r, ...updates } : r
        ),
      },
    }));
  },

  updateUser: (updates) => {
    set((state) => ({ user: { ...state.user, ...updates } }));
  },

  togglePro: () => {
    set((state) => ({
      user: { ...state.user, isPro: !state.user.isPro },
    }));
  },

  addPhoto: (photo) => {
    set((state) => ({
      user: {
        ...state.user,
        photos: [...state.user.photos, photo],
      },
    }));
  },

  deletePhoto: (id) => {
    set((state) => ({
      user: {
        ...state.user,
        photos: state.user.photos.filter((p) => p.id !== id),
      },
    }));
  },

  pinPhoto: (id) => {
    set((state) => {
      const photos = [...state.user.photos];
      const idx = photos.findIndex(p => p.id === id);
      if (idx > -1) {
        const [pinned] = photos.splice(idx, 1);
        pinned.isPinned = !pinned.isPinned;
        if (pinned.isPinned) {
          photos.unshift(pinned);
        } else {
          photos.push(pinned);
        }
      }
      return { user: { ...state.user, photos } };
    });
  },

  sendMessage: (text: string) => {
    const msg: Message = {
      id: Date.now().toString(), text, sentByMe: true,
      timestamp: new Date().toISOString(),
    };
    set((state) => ({ messages: [...state.messages, msg] }));
  },

  deleteMessage: (id: string) => {
    set((state) => ({
      messages: state.messages.filter((m) => m.id !== id),
    }));
  },

  toggleRestDay: (date: string) => {
    set((state) => {
      const already = state.user.restDays.includes(date);
      return {
        user: {
          ...state.user,
          restDays: already
            ? state.user.restDays.filter((d) => d !== date)
            : [...state.user.restDays, date],
        },
      };
    });
  },

  setLoggedIn: (value: boolean) => set({ isLoggedIn: value }),

  // Discovery & Matching
  sendMatchRequest: (targetUser: Mate) => {
    set((state) => ({
      sentMatchRequests: [...state.sentMatchRequests, targetUser.id]
    }));
  },

  acceptMatchRequest: (request: MatchRequest) => {
    const newMate: Mate = {
      id: request.fromUser.id,
      username: request.fromUser.username,
      avatarUri: request.fromUser.avatarUri,
      gender: request.fromUser.gender,
      interests: request.fromUser.interests,
      achievementScore: request.fromUser.achievementScore,
      routines: [],
      photos: []
    };
    set((state) => ({
      mate: newMate,
      user: { ...state.user, matchedSince: new Date().toISOString() },
      matchRequests: state.matchRequests.filter(r => r.id !== request.id),
      messages: [
        {
          id: 'initial',
          text: `🎉 ${request.fromUser.username} ile eşleştin! Rutin yolculuğunuz başlıyor.`,
          sentByMe: false,
          timestamp: new Date().toISOString()
        }
      ]
    }));
  },

  rejectMatchRequest: (requestId: string) => {
    set((state) => ({
      matchRequests: state.matchRequests.filter(r => r.id !== requestId)
    }));
  },

  unmatch: () => {
    set((state) => ({
      mate: null,
      messages: [],
      user: { ...state.user, matchedSince: null }
    }));
  }
}));
