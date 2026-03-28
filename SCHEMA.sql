-- ShareFiles Supabase Schema
-- Run this SQL in your Supabase project to set up the database

-- Create files table
CREATE TABLE IF NOT EXISTS files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(6) UNIQUE NOT NULL,
  file_url TEXT NOT NULL,
  filename VARCHAR(255) NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type VARCHAR(100),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  downloaded_count INT DEFAULT 0
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_code ON files(code);
CREATE INDEX IF NOT EXISTS idx_expires_at ON files(expires_at);
CREATE INDEX IF NOT EXISTS idx_created_at ON files(created_at DESC);

-- Enable Row Level Security
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE files FORCE ROW LEVEL SECURITY;

-- Remove any previously permissive policies.
DROP POLICY IF EXISTS "Allow anonymous read access" ON files;
DROP POLICY IF EXISTS "Allow anonymous update download count" ON files;
DROP POLICY IF EXISTS "Allow service role delete" ON files;

-- Restrict all table operations to service role only.
CREATE POLICY "Service role full access" ON files
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Create a view for expired files (useful for monitoring)
CREATE OR REPLACE VIEW expired_files
WITH (security_invoker = true) AS
SELECT * FROM files
WHERE expires_at < NOW();

-- Create a view for files expiring soon (within 1 hour)
CREATE OR REPLACE VIEW expiring_soon_files
WITH (security_invoker = true) AS
SELECT * FROM files
WHERE expires_at > NOW()
  AND expires_at < NOW() + INTERVAL '1 hour'
ORDER BY expires_at ASC;

-- Explicitly revoke access from public-facing roles.
REVOKE ALL ON TABLE files FROM anon, authenticated;
REVOKE ALL ON TABLE expired_files FROM anon, authenticated;
REVOKE ALL ON TABLE expiring_soon_files FROM anon, authenticated;

-- Keep access for trusted backend role.
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE files TO service_role;
GRANT SELECT ON TABLE expired_files TO service_role;
GRANT SELECT ON TABLE expiring_soon_files TO service_role;
