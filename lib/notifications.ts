import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { Routine } from '../store/useStore';

const PREFIX = 'routine-';

// Returns raw FCM token on Android (prefixed with "fcm:")
// Edge functions detect this prefix and use FCM API directly
export async function requestPushPermission(): Promise<string | null> {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return null;
  try {
    if (Platform.OS === 'android') {
      const { data } = await Notifications.getDevicePushTokenAsync();
      return `fcm:${data}`;
    }
    // iOS: fallback to Expo Push (APNs via Expo)
    const { data } = await (Notifications as any).getExpoPushTokenAsync();
    return data;
  } catch {
    return null;
  }
}

export async function sendTestNotification(): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Test Bildirimi',
      body: 'Bildirimler çalışıyor!',
      sound: true,
      priority: 'max',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      channelId: 'default',
      seconds: 5,
      repeats: false,
    },
  });
}

// Returns seconds until the next occurrence of h:m each day
function secondsUntilDaily(h: number, m: number): number {
  const now = new Date();
  const target = new Date(now);
  target.setHours(h, m, 0, 0);
  if (target <= now) target.setDate(target.getDate() + 1);
  return Math.max(10, Math.round((target.getTime() - now.getTime()) / 1000));
}

// day: JS weekday 0=Sun … 6=Sat
function secondsUntilWeekly(day: number, h: number, m: number): number {
  const now = new Date();
  const target = new Date(now);
  target.setHours(h, m, 0, 0);
  let daysAhead = (day - now.getDay() + 7) % 7;
  if (daysAhead === 0 && target <= now) daysAhead = 7;
  target.setDate(target.getDate() + daysAhead);
  return Math.max(10, Math.round((target.getTime() - now.getTime()) / 1000));
}

// dayOfMonth: 1-31
function secondsUntilMonthly(dayOfMonth: number, h: number, m: number): number {
  const now = new Date();
  const target = new Date(now.getFullYear(), now.getMonth(), dayOfMonth, h, m, 0);
  if (target <= now) target.setMonth(target.getMonth() + 1);
  return Math.max(10, Math.round((target.getTime() - now.getTime()) / 1000));
}

const TEMPLATES = [
  (first: string, task: string) => ({ title: `Harika gidiyorsun ${first}! 🔥`, body: `Sıradaki görevin: ${task}` }),
  (first: string, task: string) => ({ title: `Hey ${first} 👋`, body: `${task} yapmayı unutma!` }),
  (first: string, task: string) => ({ title: `${task} seni bekliyor 💪`, body: `Hadi ${first}, rutin zamanı!` }),
  (first: string, task: string) => ({ title: `Rutinin hazır ${first} ⏰`, body: `${task} — haydi başla!` }),
  (first: string, task: string) => ({ title: `${first}, bugün de kazanıyorsun ✨`, body: `${task} için tam zamanı` }),
];

function content(routineName: string, username: string): Notifications.NotificationContentInput {
  const first = (username || 'sen').split(' ')[0];
  const tpl = TEMPLATES[Math.floor(Math.random() * TEMPLATES.length)](first, routineName);
  return { ...tpl, sound: true, priority: 'max', vibrate: [0, 250, 250, 250] };
}

export async function scheduleRoutineNotification(r: Routine, username = ''): Promise<void> {
  await cancelRoutineNotification(r.id);
  if (!r.notificationTime) return;
  const [h, m] = r.notificationTime.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return;

  if (r.frequency === 'daily') {
    await Notifications.scheduleNotificationAsync({
      identifier: `${PREFIX}${r.id}`,
      content: content(r.name, username),
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        channelId: 'default',
        seconds: secondsUntilDaily(h, m),
        repeats: false,
      },
    });
  } else if (r.frequency === 'weekly') {
    for (const day of r.targetDays ?? []) {
      await Notifications.scheduleNotificationAsync({
        identifier: `${PREFIX}${r.id}-d${day}`,
        content: content(r.name, username),
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          channelId: 'default',
          seconds: secondsUntilWeekly(day, h, m),
          repeats: false,
        },
      });
    }
  } else if (r.frequency === 'monthly') {
    for (const d of r.monthlyDays ?? []) {
      await Notifications.scheduleNotificationAsync({
        identifier: `${PREFIX}${r.id}-m${d}`,
        content: content(r.name, username),
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          channelId: 'default',
          seconds: secondsUntilMonthly(d, h, m),
          repeats: false,
        },
      });
    }
  }
}

export async function cancelRoutineNotification(routineId: string): Promise<void> {
  const all = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    all
      .filter(n => n.identifier.startsWith(`${PREFIX}${routineId}`))
      .map(n => Notifications.cancelScheduledNotificationAsync(n.identifier))
  );
}

export async function cancelAllRoutineNotifications(): Promise<void> {
  const all = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    all
      .filter(n => n.identifier.startsWith(PREFIX))
      .map(n => Notifications.cancelScheduledNotificationAsync(n.identifier))
  );
}

export async function scheduleAllRoutineNotifications(routines: Routine[], username = ''): Promise<void> {
  await cancelAllRoutineNotifications();
  await Promise.all(routines.map(r => scheduleRoutineNotification(r, username).catch(() => {})));
}
