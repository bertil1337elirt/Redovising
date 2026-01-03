-- Fix Supabase Storage RLS Policies for order-files bucket
-- Run this in Supabase SQL Editor
-- This version allows guest uploads but keeps the bucket PRIVATE

-- First, remove any existing policies
DROP POLICY IF EXISTS "Allow file uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public reads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public uploads to order-files" ON storage.objects;
DROP POLICY IF EXISTS "Allow public reads from order-files" ON storage.objects;
DROP POLICY IF EXISTS "Allow public deletes from order-files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload to order-files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can read from order-files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete from order-files" ON storage.objects;
DROP POLICY IF EXISTS "Service role full access to order-files" ON storage.objects;

-- Allow anyone (authenticated users + guests) to upload to order-files
-- Note: The bucket itself is PRIVATE (public: false), so files are not publicly accessible
CREATE POLICY "Allow uploads to order-files"
ON storage.objects
FOR INSERT
TO authenticated, anon
WITH CHECK (bucket_id = 'order-files');

-- Only authenticated users can read files
CREATE POLICY "Authenticated users can read order-files"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'order-files');

-- Only authenticated users can delete files
CREATE POLICY "Authenticated users can delete order-files"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'order-files');

-- Service role (backend) has full access
CREATE POLICY "Service role full access"
ON storage.objects
FOR ALL
TO service_role
USING (bucket_id = 'order-files')
WITH CHECK (bucket_id = 'order-files');

-- Make sure the bucket is set to PRIVATE
UPDATE storage.buckets
SET public = false
WHERE id = 'order-files';

-- Verify policies were created
SELECT policyname, cmd, roles FROM pg_policies
WHERE tablename = 'objects' AND policyname LIKE '%order-files%';

-- Verify bucket is private
SELECT id, name, public FROM storage.buckets WHERE id = 'order-files';
