-- Email Verification Migration
-- Run this in the DigitalOcean Database Console or any connected psql client
-- Database: synoptic-data

-- ============================================
-- 1. Add email_verified column to profiles
-- ============================================
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;

-- ============================================
-- 2. Add onboarding JSONB column to profiles
-- ============================================
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS onboarding JSONB DEFAULT '{}'::jsonb;

-- ============================================
-- 3. Create email_verification_tokens table
-- ============================================
CREATE TABLE IF NOT EXISTS email_verification_tokens (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  token_hash VARCHAR(64) NOT NULL,
  email VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 4. Create indexes for fast lookups
-- ============================================
CREATE INDEX IF NOT EXISTS idx_verification_tokens_hash 
ON email_verification_tokens(token_hash);

CREATE INDEX IF NOT EXISTS idx_verification_tokens_user 
ON email_verification_tokens(user_id);

CREATE INDEX IF NOT EXISTS idx_verification_tokens_expiry 
ON email_verification_tokens(expires_at);

-- ============================================
-- 5. Verify the migration
-- ============================================
SELECT 'email_verified column' as check_item, 
       CASE WHEN COUNT(*) > 0 THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'email_verified'

UNION ALL

SELECT 'onboarding column' as check_item, 
       CASE WHEN COUNT(*) > 0 THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'onboarding'

UNION ALL

SELECT 'email_verification_tokens table' as check_item,
       CASE WHEN COUNT(*) > 0 THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
FROM information_schema.tables 
WHERE table_name = 'email_verification_tokens';
