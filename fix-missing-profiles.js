// Script to create missing profiles for users
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qiyrhgunnptusyzcynjp.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFpeXJoZ3VubnB0dXN5emN5bmpwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzAwNzE4MywiZXhwIjoyMDgyNTgzMTgzfQ.b1VJERZbkpKjf0MAI7szHAhRPgAizEKWzxLvMyrOULg';

// Create Supabase client with service role (bypasses RLS)
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function fixMissingProfiles() {
  console.log('🔍 Checking for users without profiles...\n');

  try {
    // Get all users from auth
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
      console.error('❌ Error fetching users:', authError);
      return;
    }

    console.log(`✅ Found ${users.length} user(s) in auth.users\n`);

    // Get all existing profiles
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id');

    if (profileError) {
      console.error('❌ Error fetching profiles:', profileError);
      return;
    }

    const existingProfileIds = new Set(profiles.map(p => p.id));
    console.log(`✅ Found ${profiles.length} existing profile(s)\n`);

    // Find users without profiles
    const usersWithoutProfiles = users.filter(user => !existingProfileIds.has(user.id));

    if (usersWithoutProfiles.length === 0) {
      console.log('✨ All users already have profiles! Nothing to do.');
      return;
    }

    console.log(`🔧 Creating ${usersWithoutProfiles.length} missing profile(s)...\n`);

    // Create missing profiles
    for (const user of usersWithoutProfiles) {
      const profileData = {
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || null,
        phone: null,
        company_name: null,
        order_count: 0
      };

      const { error: insertError } = await supabase
        .from('profiles')
        .insert(profileData);

      if (insertError) {
        console.error(`❌ Error creating profile for ${user.email}:`, insertError);
      } else {
        console.log(`✅ Created profile for: ${user.email}`);
      }
    }

    console.log('\n🎉 Done! All profiles created.');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the script
fixMissingProfiles();
