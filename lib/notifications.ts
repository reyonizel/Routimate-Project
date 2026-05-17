import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import type { Routine } from '../store/useStore';

const PREFIX = 'routine-';

export async function requestPushPermission(): Promise<string | null> {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return null;
  const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
  if (!projectId) return null;
  try {
    const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
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

const content = (name: string): Notifications.NotificationContentInput => ({
  title: 'Rutin Zamanı',
  body: name,
  sound: true,
  priority: 'max',
  vibrate: [0, 250, 250, 250],
});

export async function scheduleRoutineNotification(r: Routine): Promise<void> {
  await cancelRoutineNotification(r.id);
  if (!r.notificationTime) return;
  const [h, m] = r.notificationTime.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return;

  if (r.frequency === 'daily') {
    await Notifications.scheduleNotificationAsync({
      identifier: `${PREFIX}${r.id}`,
      content: content(r.name),
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
        content: content(r.name),
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
        content: content(r.name),
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

export async function scheduleAllRoutineNotifications(routines: Routine[]): Promise<void> {
  await cancelAllRoutineNotifications();
  await Promise.all(routines.map(r => scheduleRoutineNotification(r).catch(() => {})));
}
