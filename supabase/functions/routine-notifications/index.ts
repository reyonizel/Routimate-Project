import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

Deno.serve(async () => {
  // Turkey time = UTC+3
  const now = new Date();
  const turkey = new Date(now.getTime() + 3 * 60 * 60 * 1000);
  const h = turkey.getUTCHours();
  const m = turkey.getUTCMinutes();
  const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  const todayDay  = turkey.getUTCDay();   // 0=Paz … 6=Cmt
  const todayDate = turkey.getUTCDate();  // 1-31

  // Routines matching current minute
  const { data: routines, error } = await supabase
    .from('routines')
    .select('id, name, frequency, target_days, monthly_days, user_id')
    .eq('notification_time', timeStr);

  if (error || !routines?.length) return new Response('ok');

  // Filter by frequency / day conditions
  const due = routines.filter(r => {
    if (r.frequency === 'daily')   return true;
    if (r.frequency === 'weekly')  return (r.target_days  ?? []).includes(todayDay);
    if (r.frequency === 'monthly') return (r.monthly_days ?? []).includes(todayDate);
    return false;
  });

  if (!due.length) return new Response('ok');

  // Get push tokens for due users
  const userIds = [...new Set(due.map(r => r.user_id))];
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, push_token')
    .in('id', userIds)
    .not('push_token', 'is', null);

  if (!profiles?.length) return new Response('ok');

  const tokenMap = Object.fromEntries(profiles.map(p => [p.id, p.push_token]));

  const messages = due
    .filter(r => tokenMap[r.user_id])
    .map(r => ({
      to: tokenMap[r.user_id],
      title: 'Rutin Zamanı',
      body: r.name,
      sound: 'default',
      priority: 'high',
    }));

  if (!messages.length) return new Response('ok');

  // Expo Push API accepts up to 100 messages per request
  for (let i = 0; i < messages.length; i += 100) {
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(messages.slice(i, i + 100)),
    });
  }

  return new Response(`Sent ${messages.length} notifications for ${timeStr}`);
});
