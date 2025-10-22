const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ahsqppwyfevrbajyfohz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFoc3FwcHd5ZmV2cmJhanlmb2h6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxODc4NTcsImV4cCI6MjA3Mzc2Mzg1N30.mXRAU34x3TzAUUzzB5wUNMYsPC3Npgzp1GKs4fB7AgM';
const supabase = createClient(supabaseUrl, supabaseKey);

async function getUserId() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('full_name', 'sasaki')
    .single();

  if (error) {
    console.error('Error fetching user ID:', error);
    return;
  }

  console.log(data.id);
}

getUserId();
