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

-- Create policy for anonymous SELECT access (anyone can check if file exists)
CREATE POLICY "Allow anonymous read access" ON files
  FOR SELECT USING (true);

-- Create policy for anonymous UPDATE access (anyone can increment download count)
CREATE POLICY "Allow anonymous update download count" ON files
  FOR UPDATE USING (true) WITH CHECK (true);

-- Optionally: Create a policy for DELETE (for your cron job)
-- Note: Use service role key in your backend for DELETE operations
CREATE POLICY "Allow service role delete" ON files
  FOR DELETE USING (
    -- This check is handled in the API with the service role key
    auth.role() = 'service_role'
  );

-- Create a view for expired files (useful for monitoring)
CREATE OR REPLACE VIEW expired_files AS
SELECT * FROM files
WHERE expires_at < NOW();

-- Create a view for files expiring soon (within 1 hour)
CREATE OR REPLACE VIEW expiring_soon_files AS
SELECT * FROM files
WHERE expires_at > NOW()
  AND expires_at < NOW() + INTERVAL '1 hour'
ORDER BY expires_at ASC;
