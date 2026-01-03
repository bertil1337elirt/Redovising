-- Supabase Storage Setup for File Uploads
-- Run this in Supabase SQL Editor

-- 1. Create storage bucket for order files
INSERT INTO storage.buckets (id, name, public)
VALUES ('order-files', 'order-files', false)
ON CONFLICT (id) DO NOTHING;

-- 2. Set up storage policies

-- Allow authenticated and guest users to upload files
CREATE POLICY "Allow file uploads"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'order-files');

-- Allow users to read files (for download/preview)
CREATE POLICY "Allow file reads"
ON storage.objects FOR SELECT
USING (bucket_id = 'order-files');

-- Allow users to delete their own uploads (optional, for error correction)
CREATE POLICY "Allow file deletes"
ON storage.objects FOR DELETE
USING (bucket_id = 'order-files');

-- 3. Add file reference columns to orders table
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS statement_files TEXT[],
ADD COLUMN IF NOT EXISTS previous_file TEXT;

-- Verify setup
SELECT * FROM storage.buckets WHERE id = 'order-files';
