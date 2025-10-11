import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const EXPO_PUSH_ENDPOINT = 'https://exp.host/--/api/v2/push/send';

serve(async (req) => {
  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { record: newGrade } = await req.json();

    // 1. Get the student's profile to check their settings and get their push token
    const { data: studentProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('push_token, new_grade_notifications_enabled')
      .eq('id', newGrade.user_id)
      .single();

    if (profileError) throw profileError;

    // Exit if the user doesn't have a token or has disabled this notification
    if (!studentProfile || !studentProfile.push_token || !studentProfile.new_grade_notifications_enabled) {
      return new Response(JSON.stringify({ message: 'User has no push token or has disabled this notification.' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // 2. Get the assignment details to include in the message
    const { data: assignment, error: assignmentError } = await supabaseAdmin
      .from('assignments')
      .select('title')
      .eq('id', newGrade.assignment_id)
      .single();

    if (assignmentError) throw assignmentError;

    // 3. Send the notification
    const message = {
      to: studentProfile.push_token,
      sound: 'default',
      title: `🔔 Nouvelle note disponible !`,
      body: `Vous avez reçu la note de ${newGrade.grade} pour le devoir "${assignment.title}"`,
      data: { screen: 'grades' }, // To navigate the user to the grades screen
    };

    await fetch(EXPO_PUSH_ENDPOINT, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    return new Response(JSON.stringify({ success: true }), {
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
