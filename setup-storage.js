// Script to set up Supabase Storage for file uploads
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qiyrhgunnptusyzcynjp.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFpeXJoZ3VubnB0dXN5emN5bmpwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzAwNzE4MywiZXhwIjoyMDgyNTgzMTgzfQ.b1VJERZbkpKjf0MAI7szHAhRPgAizEKWzxLvMyrOULg';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function setupStorage() {
  console.log('🔧 Setting up Supabase Storage...\n');

  try {
    // 1. Create storage bucket
    console.log('📦 Creating order-files bucket...');
    const { data: bucket, error: bucketError } = await supabase.storage.createBucket('order-files', {
      public: false,
      fileSizeLimit: 10485760, // 10MB in bytes
      allowedMimeTypes: [
        'application/pdf',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/csv'
      ]
    });

    if (bucketError) {
      if (bucketError.message.includes('already exists')) {
        console.log('✅ Bucket already exists, skipping creation');
      } else {
        console.error('❌ Error creating bucket:', bucketError);
        return;
      }
    } else {
      console.log('✅ Bucket created successfully');
    }

    // 2. Verify bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    if (listError) {
      console.error('❌ Error listing buckets:', listError);
      return;
    }

    const orderFilesBucket = buckets.find(b => b.id === 'order-files');
    if (orderFilesBucket) {
      console.log('✅ Verified bucket exists:', orderFilesBucket.name);
    } else {
      console.error('❌ Bucket not found after creation');
      return;
    }

    // 3. Add columns to orders table
    console.log('\n📋 Adding file reference columns to orders table...');
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE orders
        ADD COLUMN IF NOT EXISTS statement_files TEXT[],
        ADD COLUMN IF NOT EXISTS previous_file TEXT;
      `
    });

    // If exec_sql doesn't exist, we'll need to run the SQL manually
    // Try direct query instead
    const { error: columnError } = await supabase
      .from('orders')
      .select('statement_files, previous_file')
      .limit(1);

    if (columnError && columnError.message.includes('column')) {
      console.log('⚠️  Columns need to be added manually via Supabase dashboard');
      console.log('   Run this SQL in Supabase SQL Editor:');
      console.log('   ALTER TABLE orders');
      console.log('   ADD COLUMN IF NOT EXISTS statement_files TEXT[],');
      console.log('   ADD COLUMN IF NOT EXISTS previous_file TEXT;');
    } else {
      console.log('✅ File reference columns verified');
    }

    console.log('\n🎉 Storage setup complete!');
    console.log('\nNext steps:');
    console.log('1. If columns weren\'t added automatically, run setup-storage.sql in Supabase dashboard');
    console.log('2. Verify storage policies in Supabase dashboard under Storage > Policies');
    console.log('3. Test file upload functionality');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

setupStorage();
