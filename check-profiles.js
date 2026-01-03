// Script to check profiles table structure and data
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qiyrhgunnptusyzcynjp.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFpeXJoZ3VubnB0dXN5emN5bmpwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzAwNzE4MywiZXhwIjoyMDgyNTgzMTgzfQ.b1VJERZbkpKjf0MAI7szHAhRPgAizEKWzxLvMyrOULg';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkProfiles() {
  console.log('🔍 Checking profiles table...\n');

  try {
    // Get all profiles
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*');

    if (error) {
      console.error('❌ Error fetching profiles:', error);
      return;
    }

    console.log(`✅ Found ${profiles.length} profile(s)\n`);

    // Show each profile
    profiles.forEach((profile, index) => {
      console.log(`Profile ${index + 1}:`);
      console.log('  ID:', profile.id);
      console.log('  Email:', profile.email);
      console.log('  Full Name:', profile.full_name);
      console.log('  Phone:', profile.phone);
      console.log('  Company Name:', profile.company_name);
      console.log('  Order Count:', profile.order_count);
      console.log('  Created At:', profile.created_at);
      console.log('  Last Login:', profile.last_login);
      console.log('');
    });

    // Also check auth users to see user_metadata
    console.log('🔍 Checking auth.users for user_metadata...\n');
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
      console.error('❌ Error fetching users:', authError);
      return;
    }

    users.forEach((user, index) => {
      console.log(`User ${index + 1}:`);
      console.log('  ID:', user.id);
      console.log('  Email:', user.email);
      console.log('  User Metadata:', user.user_metadata);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkProfiles();
