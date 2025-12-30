-- migrations/001_add_vectors.sql
-- PURPOSE: Enable vector search capabilities in PostgreSQL
-- ACTION: Adds pgvector extension and knowledge_base table
-- MECHANISM: Uses HNSW index for fast cosine similarity search

-- ============================================================
-- 🧠 BRAIN TRANSPLANT: Vector Database Schema
-- ============================================================

-- 1. Enable the Vector Extension (requires superuser or rds_superuser)
-- Note: On DigitalOcean Managed PostgreSQL, pgvector should be pre-installed
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Create the Knowledge Base Table
-- This stores chunked grammar/translation guide content with embeddings
CREATE TABLE IF NOT EXISTS knowledge_base (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Source file metadata
    file_name VARCHAR(255) NOT NULL,
    chunk_index INTEGER NOT NULL DEFAULT 0,
    
    -- Classification
    category VARCHAR(50) NOT NULL DEFAULT 'grammar',  -- 'grammar', 'culture', 'vocabulary', 'tech'
    language VARCHAR(10) NOT NULL,                     -- ISO code: 'fr', 'en', 'ja', etc.
    
    -- The actual content
    section_title VARCHAR(500),                        -- e.g., "Tutoiement vs Vouvoiement"
    content TEXT NOT NULL,                             -- The chunk of text
    
    -- Vector embedding (384 dimensions matches 'all-MiniLM-L6-v2')
    embedding vector(384),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create HNSW Index for lightning-fast retrieval
-- HNSW (Hierarchical Navigable Small World) is optimal for approximate nearest neighbor
-- vector_cosine_ops: optimized for cosine similarity (semantic search)
CREATE INDEX IF NOT EXISTS idx_knowledge_base_embedding 
    ON knowledge_base 
    USING hnsw (embedding vector_cosine_ops);

-- 4. Create supporting indexes for filtered queries
CREATE INDEX IF NOT EXISTS idx_knowledge_base_language 
    ON knowledge_base(language);

CREATE INDEX IF NOT EXISTS idx_knowledge_base_category 
    ON knowledge_base(category);

CREATE INDEX IF NOT EXISTS idx_knowledge_base_file 
    ON knowledge_base(file_name);

-- 5. Composite index for common query pattern (language + category)
CREATE INDEX IF NOT EXISTS idx_knowledge_base_lang_cat 
    ON knowledge_base(language, category);

-- 6. Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_knowledge_base_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_knowledge_base_updated_at ON knowledge_base;
CREATE TRIGGER trigger_knowledge_base_updated_at
    BEFORE UPDATE ON knowledge_base
    FOR EACH ROW
    EXECUTE FUNCTION update_knowledge_base_updated_at();

-- ============================================================
-- 📊 Useful Query Examples (for reference)
-- ============================================================

-- Semantic search example (replace $1 with vector, $2 with language):
-- SELECT content, section_title, 1 - (embedding <=> $1::vector) as similarity
-- FROM knowledge_base
-- WHERE language = $2
-- ORDER BY embedding <=> $1::vector
-- LIMIT 3;

-- Check table stats:
-- SELECT language, category, COUNT(*) as chunks
-- FROM knowledge_base
-- GROUP BY language, category
-- ORDER BY language, category;

-- ============================================================
-- ✅ Migration Complete
-- ============================================================
