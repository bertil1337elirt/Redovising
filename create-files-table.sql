-- Create a structured files table for better tracking
-- Run this in Supabase SQL Editor

-- Create files table
CREATE TABLE IF NOT EXISTS files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- File details
  file_type TEXT NOT NULL CHECK (file_type IN ('statement', 'previous')),
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL, -- Storage path in Supabase Storage
  file_url TEXT NOT NULL,  -- Public URL
  file_size INTEGER,       -- Size in bytes
  mime_type TEXT,          -- e.g., 'application/pdf'

  -- Metadata
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Guest user info (for non-authenticated uploads)
  guest_email TEXT,
  guest_name TEXT
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS files_order_id_idx ON files(order_id);
CREATE INDEX IF NOT EXISTS files_user_id_idx ON files(user_id);
CREATE INDEX IF NOT EXISTS files_file_type_idx ON files(file_type);
CREATE INDEX IF NOT EXISTS files_uploaded_at_idx ON files(uploaded_at);

-- Add RLS policies
ALTER TABLE files ENABLE ROW LEVEL SECURITY;

-- Allow users to insert files
CREATE POLICY "Users can insert files"
ON files
FOR INSERT
TO public
WITH CHECK (true);

-- Allow users to read files
CREATE POLICY "Users can read files"
ON files
FOR SELECT
TO public
USING (true);

-- Allow users to delete their own files
CREATE POLICY "Users can delete own files"
ON files
FOR DELETE
TO public
USING (
  auth.uid() = user_id
  OR auth.uid() IS NULL
);

-- Optional: Keep the old columns for backward compatibility
-- Or remove them with:
-- ALTER TABLE orders DROP COLUMN IF EXISTS statement_files;
-- ALTER TABLE orders DROP COLUMN IF EXISTS previous_file;

-- Add a helpful view for easy querying
CREATE OR REPLACE VIEW order_files_view AS
SELECT
  o.id as order_id,
  o.package_type,
  o.status,
  o.guest_name,
  o.guest_email,
  u.email as user_email,
  f.id as file_id,
  f.file_type,
  f.file_name,
  f.file_url,
  f.file_size,
  f.mime_type,
  f.uploaded_at
FROM orders o
LEFT JOIN files f ON o.id = f.order_id
LEFT JOIN auth.users u ON o.user_id = u.id
ORDER BY o.created_at DESC, f.uploaded_at DESC;

-- Grant access to the view
GRANT SELECT ON order_files_view TO authenticated, anon;

COMMENT ON TABLE files IS 'Stores all uploaded files with metadata and relationships to orders';
COMMENT ON VIEW order_files_view IS 'Easy view to see all orders with their associated files';
