import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const EXPO_PUSH_ENDPOINT = 'https://exp.host/--/api/v2/push/send';

// This function will be triggered by a cron job.
serve(async (_req) => {
  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const now = new Date();

    // Define time windows to check for
    const windows = {
      '1_hour_before': { start: new Date(now.getTime() + 59 * 60 * 1000), end: new Date(now.getTime() + 61 * 60 * 1000) },
      '1_day_before': { start: new Date(now.getTime() + 23 * 60 * 60 * 1000), end: new Date(now.getTime() + 25 * 60 * 60 * 1000) },
      '2_days_before': { start: new Date(now.getTime() + 47 * 60 * 60 * 1000), end: new Date(now.getTime() + 49 * 60 * 60 * 1000) },
      // We don't handle same_day_morning here as it's more complex (needs to check time of day)
    };

    const notificationsToSend: any[] = [];

    for (const [preference, window] of Object.entries(windows)) {
      // 1. Find assignments due within the current time window
      const { data: assignments, error: assignmentsError } = await supabaseAdmin
        .from('assignments')
        .select('id, title, course_id')
        .gte('due_date', window.start.toISOString())
        .lte('due_date', window.end.toISOString());

      if (assignmentsError) throw assignmentsError;

      for (const assignment of assignments) {
        // 2. For each assignment, find users who are enrolled in that course AND have the matching preference
        const { data: profiles, error: profilesError } = await supabaseAdmin
          .from('profiles')
          .select('push_token, user_courses!inner(course_id)')
          .eq('user_courses.course_id', assignment.course_id)
          .eq('assignment_reminder_preference', preference);
        
        if (profilesError) throw profilesError;

        // 3. Prepare notifications
        for (const profile of profiles) {
          if (profile.push_token) {
            notificationsToSend.push({
              to: profile.push_token,
              sound: 'default',
              title: `⏰ Rappel de devoir`,
              body: `N'oubliez pas, le devoir "${assignment.title}" est à rendre bientôt !`,
              data: { assignmentId: assignment.id },
            });
          }
        }
      }
    }

    // 4. Send all notifications in parallel
    if (notificationsToSend.length > 0) {
      await Promise.all(notificationsToSend.map(message => 
        fetch(EXPO_PUSH_ENDPOINT, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Accept-encoding': 'gzip, deflate',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(message),
        })
      ));
    }

    return new Response(JSON.stringify({ success: true, sent: notificationsToSend.length }), {
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
