// Script to sync full_name from user_metadata to profiles table
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qiyrhgunnptusyzcynjp.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFpeXJoZ3VubnB0dXN5emN5bmpwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzAwNzE4MywiZXhwIjoyMDgyNTgzMTgzfQ.b1VJERZbkpKjf0MAI7szHAhRPgAizEKWzxLvMyrOULg';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function syncNames() {
  console.log('🔄 Syncing names from user_metadata to profiles...\n');

  try {
    // Get all users
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
      console.error('❌ Error fetching users:', authError);
      return;
    }

    console.log(`✅ Found ${users.length} user(s)\n`);

    let updated = 0;
    let skipped = 0;

    // Update each profile with name from user_metadata
    for (const user of users) {
      const fullName = user.user_metadata?.full_name;

      if (fullName) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ full_name: fullName })
          .eq('id', user.id);

        if (updateError) {
          console.error(`❌ Error updating profile for ${user.email}:`, updateError);
        } else {
          console.log(`✅ Updated ${user.email} with name: ${fullName}`);
          updated++;
        }
      } else {
        console.log(`⏭️  Skipped ${user.email} (no name in user_metadata)`);
        skipped++;
      }
    }

    console.log(`\n🎉 Done! Updated ${updated} profile(s), skipped ${skipped}`);

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

syncNames();
