import { User } from '@supabase/supabase-js';

const adminEmails = ['teamsasaki@gmail.com', 'deathsgun2.0@gmail.com'];

export const isAdmin = (user: User | null) => {
  if (!user) return false;
  return adminEmails.includes(user.email?.toLowerCase() || '');
};
