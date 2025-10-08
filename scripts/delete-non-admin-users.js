const { createClient } = require('@supabase/supabase-js');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

// Function to parse .env file
function parseEnvFile() {
  const envFilePath = path.resolve(__dirname, '../.env');
  if (!fs.existsSync(envFilePath)) {
    return;
  }
  const envFileContent = fs.readFileSync(envFilePath, 'utf-8');
  envFileContent.split('\n').forEach(line => {
    const [key, ...value] = line.split('=');
    if (key && value) {
      process.env[key.trim()] = value.join('=').trim();
    }
  });
}

// Load environment variables from .env file
parseEnvFile();

// WARNING: This script will delete all users that are not admins.
// Make sure to have a backup of your data before running this script.

// 1. Get the admin emails from lib/auth.ts
const adminEmails = ['teamsasaki@gmail.com', 'deathsgun2.0@gmail.com'];

// 2. Get Supabase credentials from environment variables
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Supabase URL and Service Key are required.');
  console.error('Make sure to have EXPO_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY in your .env file.');
  process.exit(1);
}

// 3. Initialize Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function deleteNonAdminUsers() {
  try {
    // 4. Get all users
    const { data: { users }, error: listUsersError } = await supabase.auth.admin.listUsers();

    if (listUsersError) {
      throw listUsersError;
    }

    // 5. Filter non-admin users
    const nonAdminUsers = users.filter(user => !adminEmails.includes(user.email.toLowerCase()));

    if (nonAdminUsers.length === 0) {
      console.log('No non-admin users to delete.');
      rl.close();
      return;
    }

    console.log(`Found ${nonAdminUsers.length} non-admin users to delete:`);
    nonAdminUsers.forEach(user => {
      console.log(`- ${user.email} (ID: ${user.id})`);
    });

    rl.question('Are you sure you want to delete these users? (yes/no) ', async (answer) => {
      if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
        // 6. Delete non-admin users
        for (const user of nonAdminUsers) {
          console.log(`Deleting user ${user.email} (ID: ${user.id})...`);
          const { error: deleteUserError } = await supabase.auth.admin.deleteUser(user.id);
          if (deleteUserError) {
            console.error(`Failed to delete user ${user.email}:`, deleteUserError.message);
          } else {
            console.log(`User ${user.email} deleted successfully.`);
          }
        }
        console.log('Finished deleting non-admin users.');
      } else {
        console.log('Aborted. No users were deleted.');
      }
      rl.close();
    });

  } catch (error) {
    console.error('An error occurred:', error.message);
    rl.close();
  }
}

deleteNonAdminUsers();