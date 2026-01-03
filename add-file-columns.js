// Script to add file reference columns to orders table
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qiyrhgunnptusyzcynjp.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFpeXJoZ3VubnB0dXN5emN5bmpwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzAwNzE4MywiZXhwIjoyMDgyNTgzMTgzfQ.b1VJERZbkpKjf0MAI7szHAhRPgAizEKWzxLvMyrOULg';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function addColumns() {
  console.log('📋 Adding file reference columns to orders table...\n');

  // Test if columns already exist by trying to select them
  const { data, error } = await supabase
    .from('orders')
    .select('id, statement_files, previous_file')
    .limit(1);

  if (!error) {
    console.log('✅ Columns already exist!');
    console.log('   statement_files: TEXT[]');
    console.log('   previous_file: TEXT');
  } else if (error.message.includes('column')) {
    console.log('⚠️  Columns do not exist yet.');
    console.log('\n📝 Please run this SQL in Supabase SQL Editor:');
    console.log('─'.repeat(50));
    console.log('ALTER TABLE orders');
    console.log('ADD COLUMN statement_files TEXT[],');
    console.log('ADD COLUMN previous_file TEXT;');
    console.log('─'.repeat(50));
  } else {
    console.error('❌ Error:', error.message);
  }
}

addColumns();
