import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const EXPO_PUSH_ENDPOINT = 'https://exp.host/--/api/v2/push/send';

serve(async (req) => {
  try {
    // Create a Supabase client with the service role key to bypass RLS
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { record: newReply } = await req.json();

    // 1. Get the original post to find the author
    const { data: post, error: postError } = await supabaseAdmin
      .from('forum_posts')
      .select('user_id, title')
      .eq('id', newReply.post_id)
      .single();

    if (postError) throw postError;

    // Don't notify if the user is replying to their own post
    if (post.user_id === newReply.user_id) {
      return new Response(JSON.stringify({ message: 'User replied to their own post. No notification needed.' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // 2. Get the author's push token and notification preference
    const { data: authorProfile, error: authorError } = await supabaseAdmin
      .from('profiles')
      .select('push_token, forum_reply_notifications_enabled')
      .eq('id', post.user_id)
      .single();

    // If no token, or if notifications are disabled, we can't do anything
    if (authorError || !authorProfile || !authorProfile.push_token || !authorProfile.forum_reply_notifications_enabled) {
      return new Response(JSON.stringify({ message: 'Author does not have a push token or has disabled this notification type.' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      });
    }
    
    // 3. Get the replier's name
    const { data: replierProfile, error: replierError } = await supabaseAdmin
      .from('profiles')
      .select('full_name')
      .eq('id', newReply.user_id)
      .single();

    if (replierError) throw replierError;


    // 4. Send the notification
    const message = {
      to: authorProfile.push_token,
      sound: 'default',
      title: `Nouvelle réponse à votre post`,
      body: `${replierProfile.full_name} a répondu à "${post.title}"`,
      data: { postId: newReply.post_id },
    };

    const response = await fetch(EXPO_PUSH_ENDPOINT, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });
    
    const data = await response.json();
    console.log('Expo push response:', data);

    return new Response(JSON.stringify({ success: true, data }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});