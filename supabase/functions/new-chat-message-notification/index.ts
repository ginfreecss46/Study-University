import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const EXPO_PUSH_ENDPOINT = 'https://exp.host/--/api/v2/push/send';

serve(async (req) => {
  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { record: newChatMessage } = await req.json();

    // 1. Get the sender's profile to get their name
    const { data: senderProfile, error: senderError } = await supabaseClient
      .from('profiles')
      .select('full_name')
      .eq('id', newChatMessage.user_id)
      .single();

    if (senderError) throw senderError;

    // 2. Get all members of the group, excluding the sender
    const { data: groupMembers, error: membersError } = await supabaseClient
      .from('group_members')
      .select('user_id')
      .eq('group_id', newChatMessage.group_id)
      .neq('user_id', newChatMessage.user_id);

    if (membersError) throw membersError;

    const recipientIds = groupMembers.map(member => member.user_id);

    // 3. Get the push tokens of the recipients
    const { data: recipients, error: tokensError } = await supabaseClient
      .from('profiles')
      .select('push_token')
      .in('id', recipientIds)
      .not('push_token', 'is', null);

    if (tokensError) throw tokensError;

    const pushTokens = recipients.map(r => r.push_token);

    if (pushTokens.length === 0) {
      return new Response(JSON.stringify({ message: 'No recipients to notify.' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      });
    }
    
    // 4. Get group name for the notification title
    const { data: group, error: groupError } = await supabaseClient
      .from('chat_groups')
      .select('name')
      .eq('id', newChatMessage.group_id)
      .single();

    if (groupError) throw groupError;

    // 5. Send notifications
    const messages = pushTokens.map(token => ({
      to: token,
      sound: 'default',
      title: `Nouveau message dans ${group.name}`,
      body: `${senderProfile.full_name}: ${newChatMessage.content}`,
      data: { groupId: newChatMessage.group_id },
    }));

    // The Expo push service can handle arrays of messages
    const response = await fetch(EXPO_PUSH_ENDPOINT, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
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
