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

export async function scheduleRoutineNotification(r: Routine): Promise<void> {
  await cancelRoutineNotification(r.id);
  const [h, m] = r.notificationTime.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return;

  const content: Notifications.NotificationContentInput = {
    title: 'Rutin Zamanı',
    body: r.name,
    sound: true,
    priority: 'max',
    vibrate: [0, 250, 250, 250],
  };

  if (r.frequency === 'daily') {
    await Notifications.scheduleNotificationAsync({
      identifier: `${PREFIX}${r.id}`,
      content,
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        channelId: 'default',
        hour: h,
        minute: m,
      },
    });
  } else if (r.frequency === 'weekly') {
    for (const day of r.targetDays ?? []) {
      // Expo weekday: 1=Paz … 7=Cts | JS getDay(): 0=Paz … 6=Cts
      const weekday = ((day % 7) + 1) as 1 | 2 | 3 | 4 | 5 | 6 | 7;
      await Notifications.scheduleNotificationAsync({
        identifier: `${PREFIX}${r.id}-d${day}`,
        content,
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          channelId: 'default',
          weekday,
          hour: h,
          minute: m,
        },
      });
    }
  } else if (r.frequency === 'monthly') {
    for (const d of r.monthlyDays ?? []) {
      await Notifications.scheduleNotificationAsync({
        identifier: `${PREFIX}${r.id}-m${d}`,
        content,
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.MONTHLY,
          channelId: 'default',
          day: d,
          hour: h,
          minute: m,
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
