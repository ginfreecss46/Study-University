import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const EXPO_PUSH_ENDPOINT = 'https://exp.host/--/api/v2/push/send';
const VOTE_THRESHOLD = 5; // Notify when an assignment gets 5 upvotes

serve(async (req) => {
  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { record: newVote } = await req.json();

    // 1. Count the votes for the assignment
    const { data: votes, error: votesError } = await supabaseAdmin
      .from('assignment_votes')
      .select('vote')
      .eq('assignment_id', newVote.assignment_id);

    if (votesError) throw votesError;

    const totalVotes = votes.reduce((acc, v) => acc + v.vote, 0);

    // 2. If the threshold is reached, send notifications
    if (totalVotes >= VOTE_THRESHOLD) {
      // 3. Get assignment details
      const { data: assignment, error: assignmentError } = await supabaseAdmin
        .from('assignments')
        .select('title, user_id')
        .eq('id', newVote.assignment_id)
        .single();

      if (assignmentError) throw assignmentError;

      // 4. Get the profile of the user who created the assignment to determine the class
      const { data: authorProfile, error: authorProfileError } = await supabaseAdmin
        .from('profiles')
        .select('level, filiere, option')
        .eq('id', assignment.user_id)
        .single();

      if (authorProfileError) throw authorProfileError;

      // 5. Get all users in the same class
      const { data: classmates, error: classmatesError } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('level', authorProfile.level)
        .eq('filiere', authorProfile.filiere)
        .eq('option', authorProfile.option);

      if (classmatesError) throw classmatesError;

      const recipientIds = classmates.map(c => c.id);

      // 6. Get the push tokens of the recipients
      const { data: recipients, error: tokensError } = await supabaseAdmin
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

      // 7. Send notifications
      const messages = pushTokens.map(token => ({
        to: token,
        sound: 'default',
        title: 'Nouveau devoir confirmé',
        body: `Le devoir "${assignment.title}" a été confirmé par la communauté.`,
        data: { assignmentId: newVote.assignment_id },
      }));

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
    }

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
