-- Migration: Create user_favorites table
-- Run this migration to enable the Library Favorites feature

-- Create the user_favorites table
CREATE TABLE IF NOT EXISTS user_favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    tile_id VARCHAR(100) NOT NULL,
    saved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique favorites per user
    CONSTRAINT unique_user_favorite UNIQUE (user_id, tile_id)
);

-- Index for fast lookups by user
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON user_favorites(user_id);

-- Index for listing favorites sorted by date
CREATE INDEX IF NOT EXISTS idx_user_favorites_saved_at ON user_favorites(user_id, saved_at DESC);

-- Comment for documentation
COMMENT ON TABLE user_favorites IS 'Stores user favorite library templates for quick access from dashboard';
COMMENT ON COLUMN user_favorites.tile_id IS 'References the sourceId from the library registry';
