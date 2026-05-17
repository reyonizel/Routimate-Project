import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const FCM_KEY = Deno.env.get('FCM_SERVER_KEY') ?? '';

async function sendNotification(token: string, title: string, body: string): Promise<void> {
  if (token.startsWith('fcm:')) {
    // Direct FCM API
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
    // Legacy Expo Push token fallback
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: token, title, body, sound: 'default', priority: 'high' }),
    });
  }
}

Deno.serve(async (req: Request) => {
  try {
    const { recipientId, title, body } = await req.json();
    if (!recipientId || !title) return new Response('missing params', { status: 400 });

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: profile } = await supabase
      .from('profiles')
      .select('push_token')
      .eq('id', recipientId)
      .maybeSingle();

    const token = profile?.push_token;
    if (!token) return new Response('no token', { status: 200 });

    await sendNotification(token, title, body);
    return new Response('ok', { status: 200 });
  } catch (e) {
    return new Response(String(e), { status: 500 });
  }
});
