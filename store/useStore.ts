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
  interests?: string[];
  routines: Routine[];
  photos: Photo[];
  achievementScore: number;
  matchedSince: string;
  restDays: string[]; // ISO date strings marked as rest days
}

export interface Mate {
  id: string;
  username: string;
  gender: Gender;
  avatarUri: string | null;
  routines: Routine[];
  photos: Photo[];
  achievementScore: number;
}

interface AppState {
  user: User;
  mate: Mate;
  messages: Message[];
  isLoggedIn: boolean;

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
  forceNewMatch: () => void;
  generateMockStats: () => void;
  toggleRestDay: (date: string) => void;
  setLoggedIn: (value: boolean) => void;
}

const MOCK_MATE: Mate = {
  id: 'mate-1',
  username: 'alex_fit',
  gender: 'male',
  avatarUri: null,
  achievementScore: 82,
  routines: [
    {
      id: 'r-m-1',
      name: '5 km Morning Run',
      frequency: 'daily',
      notificationTime: '07:00',
      completedDates: [new Date().toISOString().split('T')[0]],
      createdAt: new Date().toISOString(),
    },
    {
      id: 'r-m-2',
      name: 'Cold Shower',
      frequency: 'daily',
      notificationTime: '07:30',
      completedDates: [],
      createdAt: new Date().toISOString(),
    },
    {
      id: 'r-m-3',
      name: 'Read 30 min',
      frequency: 'daily',
      notificationTime: '22:00',
      completedDates: [new Date().toISOString().split('T')[0]],
      createdAt: new Date().toISOString(),
    },
  ],
  photos: [],
};

const INITIAL_USER: User = {
  id: 'user-1',
  username: 'burhan_dev',
  gender: 'male',
  avatarUri: null,
  isPro: false,
  interests: [],
  achievementScore: 74,
  matchedSince: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
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
    {
      id: 'r-3',
      name: 'Read 20 pages',
      frequency: 'daily',
      notificationTime: '21:00',
      completedDates: [new Date().toISOString().split('T')[0]],
      createdAt: new Date().toISOString(),
    },
    {
      id: 'r-4',
      name: 'Weekly Review',
      frequency: 'weekly',
      notificationTime: '18:00',
      completedDates: [],
      createdAt: new Date().toISOString(),
    },
  ],
  photos: [],
  restDays: [],
};

const INITIAL_MESSAGES: Message[] = [
  {
    id: 'm-1',
    text: 'Bugün rutinlerini tamamladın mı? 👀',
    sentByMe: false,
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'm-2',
    text: 'Harika gidiyorsun, devam et!',
    sentByMe: true,
    timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
  },
];

export const useStore = create<AppState>((set, get) => ({
  user: INITIAL_USER,
  mate: MOCK_MATE,
  messages: INITIAL_MESSAGES,
  isLoggedIn: false,

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

  sendMessage: (text) => {
    const msg: Message = {
      id: Date.now().toString(), text, sentByMe: true,
      timestamp: new Date().toISOString(),
    };
    set((state) => ({ messages: [...state.messages, msg] }));
  },

  deleteMessage: (id) => {
    set((state) => ({
      messages: state.messages.filter((m) => m.id !== id),
    }));
  },

  toggleRestDay: (date) => {
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

  forceNewMatch: () => {
    const newMate: Mate = {
      id: `mate-${Date.now()}`,
      username: `user_${Math.floor(Math.random() * 9999)}`,
      gender: Math.random() > 0.5 ? 'male' : 'female',
      avatarUri: null,
      achievementScore: Math.floor(Math.random() * 100),
      routines: [
        {
          id: `r-new-1`,
          name: 'New Routine 1',
          frequency: 'daily',
          notificationTime: '08:00',
          completedDates: [],
          createdAt: new Date().toISOString(),
        },
        {
          id: `r-new-2`,
          name: 'New Routine 2',
          frequency: 'weekly',
          notificationTime: '19:00',
          completedDates: [],
          createdAt: new Date().toISOString(),
        },
      ],
      photos: [],
    };
    set({
      mate: newMate,
      messages: [],
      user: {
        ...get().user,
        matchedSince: new Date().toISOString(),
      },
    });
  },

  generateMockStats: () => {
    const today = new Date();
    const routines = get().user.routines.map((r) => {
      const dates: string[] = [];
      for (let i = 0; i < 30; i++) {
        if (Math.random() > 0.35) {
          const d = new Date(today);
          d.setDate(d.getDate() - i);
          dates.push(d.toISOString().split('T')[0]);
        }
      }
      return { ...r, completedDates: dates };
    });
    const score = Math.floor(Math.random() * 30) + 60;
    set((state) => ({
      user: { ...state.user, routines, achievementScore: score },
    }));
  },

  setLoggedIn: (value) => set({ isLoggedIn: value }),
}));
