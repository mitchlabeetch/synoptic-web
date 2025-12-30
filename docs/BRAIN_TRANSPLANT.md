# 🧠 Brain Transplant: Vector RAG Architecture

## Overview

This document describes the migration from DigitalOcean's managed GenAI Knowledge Base to a self-hosted RAG (Retrieve-And-Generate) system using pgvector.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        RAG PIPELINE                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. USER QUERY          2. LOCAL EMBEDDING        3. VECTOR DB   │
│  ┌─────────────┐       ┌─────────────────┐      ┌─────────────┐ │
│  │ "Explain    │ ───▶  │ all-MiniLM-L6   │ ───▶ │ PostgreSQL  │ │
│  │  the French │       │ (CPU, 384 dims) │      │ + pgvector  │ │
│  │  subjunc-   │       └─────────────────┘      │             │ │
│  │  tive..."   │                                │ ┌─────────┐ │ │
│  └─────────────┘                                │ │knowledge│ │ │
│                                                 │ │_base    │ │ │
│  4. RETRIEVED           5. AUGMENTED PROMPT     │ │(HNSW)   │ │ │
│     CONTEXT                                     │ └─────────┘ │ │
│  ┌─────────────┐       ┌─────────────────┐      └─────────────┘ │
│  │ Top 3 most  │ ───▶  │ SYSTEM: You are │                      │
│  │ relevant    │       │ The Philologist. │                     │
│  │ grammar     │       │ REFERENCE:       │                     │
│  │ chunks      │       │ [retrieved ctx]  │                     │
│  └─────────────┘       │ USER: [query]    │                     │
│                        └─────────────────┘                      │
│                               │                                  │
│                               ▼                                  │
│  6. LLM INFERENCE      ┌─────────────────┐                      │
│                        │ Llama 3.3 70B   │                      │
│                        │ (DO Gradient)   │                      │
│                        └─────────────────┘                      │
│                               │                                  │
│                               ▼                                  │
│  7. RESPONSE           ┌─────────────────┐                      │
│                        │ Structured JSON │                      │
│                        │ with explanation│                      │
│                        └─────────────────┘                      │
└─────────────────────────────────────────────────────────────────┘
```

## Cost Comparison

| Component          | Managed GenAI | Manual RAG          |
| ------------------ | ------------- | ------------------- |
| Knowledge Base     | ~€15-25/mo    | €0 (in existing PG) |
| OpenSearch Cluster | ~€20-40/mo    | €0 (pgvector)       |
| Embeddings         | API cost      | €0 (local CPU)      |
| LLM Inference      | Same          | Same                |
| **Total Savings**  |               | **~€35-65/mo**      |

## Files Created

```
synoptic-web/
├── scripts/
│   ├── nuke-kb.js              # 🗑️  Delete expensive DO resources
│   ├── run-vector-migration.js # 🧬  Apply vector schema
│   └── seed-knowledge.ts       # 🧠  Ingest grammar files
├── migrations/
│   └── 001_add_vectors.sql     # 📊  Vector schema + HNSW index
└── src/lib/ai/providers/
    └── rag.ts                  # 🔌  RAG provider implementation
```

## Deployment Steps

### Step 1: Nuke Old Infrastructure (Optional)

```bash
# Delete expensive DO resources (GenAI agents, KB, OpenSearch)
DO_API_TOKEN=your_token node scripts/nuke-kb.js
```

### Step 2: Apply Database Migration

**Option A: From DigitalOcean Console**

1. Go to Databases → Your Cluster → Query Editor
2. Paste contents of `migrations/001_add_vectors.sql`
3. Execute

**Option B: From Allowed IP/VPN**

```bash
DB_PASSWORD=your_password node scripts/run-vector-migration.js
```

**Option C: Via App Platform Build Phase**
Add to your `package.json`:

```json
{
  "scripts": {
    "postinstall": "node scripts/run-vector-migration.js"
  }
}
```

### Step 3: Seed Knowledge Base

```bash
# First time will download ~90MB model (cached after)
DB_PASSWORD=your_password npx ts-node scripts/seed-knowledge.ts
```

This ingests all 33 translation guide markdown files (~300KB total):

- Chunks by H2 headers (##)
- Generates 384-dim embeddings locally
- Stores in PostgreSQL with HNSW index

### Step 4: Update Environment Variables

```env
# Remove old GenAI agent IDs (optional)
# NEXT_PUBLIC_AI_AGENT_LINGUIST_ID=...
# NEXT_PUBLIC_AI_AGENT_PHILOLOGIST_ID=...

# Add direct inference keys
DO_LINGUIST_KEY=XvuNZ86iTN85pIX-VPF0vBWWansLee9H
DO_PHILOLOGIST_KEY=d5wc5BJb0sVc81phFQIvFWiAB0Zn0Y1m

# Set provider to RAG (or leave unset - it's the default now)
AI_PROVIDER=rag
```

### Step 5: Deploy

```bash
git add .
git commit -m "🧠 Brain Transplant: Migrate to self-hosted RAG"
git push
```

## Verification

### Check Knowledge Base Stats

```sql
SELECT
  language,
  COUNT(*) as chunks,
  AVG(LENGTH(content)) as avg_length
FROM knowledge_base
GROUP BY language
ORDER BY chunks DESC;
```

### Test Semantic Search

```sql
-- This requires running the embedding through the model first
-- In practice, the RAG provider does this automatically
SELECT
  section_title,
  LEFT(content, 100) as preview
FROM knowledge_base
WHERE language = 'fr'
LIMIT 5;
```

## Troubleshooting

### "extension 'vector' does not exist"

pgvector isn't installed. On DigitalOcean Managed PostgreSQL:

1. Go to Database Settings
2. Enable the `vector` extension
3. Re-run migration

### "connect ETIMEDOUT"

Your IP isn't allowed. Options:

1. Add your IP to "Trusted Sources" in DO database settings
2. Run migration from App Platform (has automatic access)
3. Use VPN connected to DO network

### Embedding model download stuck

The first run downloads ~90MB model. If stuck:

```bash
# Clear cache and retry
rm -rf ~/.cache/huggingface
npx ts-node scripts/seed-knowledge.ts
```

## Provider Comparison

| Provider       | Use Case                          | Cost          |
| -------------- | --------------------------------- | ------------- |
| `rag`          | **Default** - Best for production | Lowest        |
| `gradient`     | Legacy managed agents             | Higher        |
| `openai`       | Backup/testing                    | Pay-per-token |
| `digitalocean` | Deprecated                        | N/A           |

## Future Improvements

1. **Streaming**: Add streaming support for real-time responses
2. **Caching**: Cache frequent queries to reduce embedding overhead
3. **Reranking**: Add cross-encoder reranking for better relevance
4. **Multi-modal**: Support image embeddings for visual content
