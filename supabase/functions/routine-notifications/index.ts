import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);
const FCM_KEY = Deno.env.get('FCM_SERVER_KEY') ?? '';

async function sendOne(token: string, title: string, body: string): Promise<void> {
  if (token.startsWith('fcm:')) {
    await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `key=${FCM_KEY}`,
      },
      body: JSON.stringify({
        to: token.slice(4),
        notification: { title, body, sound: 'default' },
        android: { priority: 'high' },
      }),
    });
  } else {
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: token, title, body, sound: 'default', priority: 'high' }),
    });
  }
}

Deno.serve(async () => {
  // Turkey time = UTC+3
  const now = new Date();
  const turkey = new Date(now.getTime() + 3 * 60 * 60 * 1000);
  const h = turkey.getUTCHours();
  const m = turkey.getUTCMinutes();
  const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  const todayDay  = turkey.getUTCDay();
  const todayDate = turkey.getUTCDate();

  const { data: routines } = await supabase
    .from('routines')
    .select('id, name, frequency, target_days, monthly_days, user_id')
    .eq('notification_time', timeStr);

  if (!routines?.length) return new Response(`ok - no routines at ${timeStr}`);

  const due = routines.filter(r => {
    if (r.frequency === 'daily')   return true;
    if (r.frequency === 'weekly')  return (r.target_days  ?? []).includes(todayDay);
    if (r.frequency === 'monthly') return (r.monthly_days ?? []).includes(todayDate);
    return false;
  });

  if (!due.length) return new Response('ok - none due');

  const userIds = [...new Set(due.map(r => r.user_id))];
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, push_token')
    .in('id', userIds)
    .not('push_token', 'is', null);

  if (!profiles?.length) return new Response('ok - no tokens');

  const tokenMap = Object.fromEntries(profiles.map(p => [p.id, p.push_token]));

  await Promise.all(
    due
      .filter(r => tokenMap[r.user_id])
      .map(r => sendOne(tokenMap[r.user_id], 'Rutin Zamanı', r.name).catch(() => {}))
  );

  return new Response(`ok - sent ${due.length} at ${timeStr}`);
});
