-- ============================================
-- USERS & AUTHENTICATION
-- ============================================

-- Extend auth.users with profile data
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,

  -- Subscription
  tier TEXT CHECK (tier IN ('free', 'pro', 'publisher', 'lifetime')) DEFAULT 'free',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  subscription_status TEXT CHECK (subscription_status IN ('active', 'canceled', 'past_due', 'trialing')) DEFAULT NULL,
  current_period_end TIMESTAMPTZ,

  -- Usage Tracking
  ai_credits_used INTEGER DEFAULT 0,
  ai_credits_limit INTEGER DEFAULT 20, -- Free tier: 20/month
  storage_used_bytes BIGINT DEFAULT 0,
  storage_limit_bytes BIGINT DEFAULT 104857600, -- 100MB for free

  -- Preferences
  ui_language TEXT DEFAULT 'en',
  theme TEXT CHECK (theme IN ('light', 'dark', 'system')) DEFAULT 'system',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- PROJECTS
-- ============================================

CREATE TABLE public.projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Metadata
  title TEXT NOT NULL DEFAULT 'Untitled Project',
  description TEXT,
  author TEXT,

  -- Language Configuration
  source_lang TEXT NOT NULL DEFAULT 'fr',
  target_lang TEXT NOT NULL DEFAULT 'en',

  -- Layout Settings
  page_size TEXT DEFAULT '6x9', -- '5x8', '5.5x8.5', '6x9', 'A4', 'A5', 'custom'
  page_width_mm NUMERIC,
  page_height_mm NUMERIC,
  margins JSONB DEFAULT '{"top": 20, "bottom": 20, "inner": 25, "outer": 20}',

  -- Theme & Styling
  settings JSONB DEFAULT '{
    "theme": "classic",
    "fonts": {
      "heading": "Crimson Pro",
      "body": "Crimson Pro",
      "annotation": "Inter"
    },
    "colors": {
      "primary": "#1a1a2e",
      "secondary": "#4a4a68",
      "accent": "#2563eb"
    },
    "layout": "side-by-side"
  }',

  -- Content (The main data - stored as JSONB for flexibility)
  -- Contains: pages[], wordGroups[], arrowConnectors[], etc.
  content JSONB NOT NULL DEFAULT '{"pages": [], "wordGroups": [], "arrows": [], "stamps": []}',

  -- Cover
  cover_data JSONB, -- Cover designer state
  cover_image_url TEXT,

  -- Publishing
  isbn TEXT,
  publisher TEXT,
  publication_date DATE,

  -- Collaboration
  collaborators UUID[] DEFAULT '{}',
  is_public BOOLEAN DEFAULT FALSE,
  public_slug TEXT UNIQUE,

  -- Versioning
  version INTEGER DEFAULT 1,

  -- Thumbnail for dashboard
  thumbnail_url TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_opened_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast dashboard queries
CREATE INDEX idx_projects_user_id ON public.projects(user_id);
CREATE INDEX idx_projects_updated_at ON public.projects(updated_at DESC);
CREATE INDEX idx_projects_public_slug ON public.projects(public_slug) WHERE public_slug IS NOT NULL;

-- ============================================
-- VERSION HISTORY
-- ============================================

CREATE TABLE public.project_versions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  version INTEGER NOT NULL,

  -- Snapshot of content at this version
  content JSONB NOT NULL,
  settings JSONB,

  -- Metadata
  message TEXT, -- "Added chapter 3" etc.
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(project_id, version)
);

CREATE INDEX idx_project_versions_project_id ON public.project_versions(project_id);

-- ============================================
-- ASSETS (User uploads)
-- ============================================

CREATE TABLE public.assets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,

  -- File info
  filename TEXT NOT NULL,
  storage_path TEXT NOT NULL, -- Path in Supabase Storage
  url TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,

  -- Dimensions (for images)
  width INTEGER,
  height INTEGER,

  -- Organization
  folder TEXT DEFAULT 'uploads',
  tags TEXT[] DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_assets_user_id ON public.assets(user_id);

-- ============================================
-- VOCABULARY (Personal word bank)
-- ============================================

CREATE TABLE public.vocabulary (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Word data
  word TEXT NOT NULL,
  language TEXT NOT NULL,
  translation TEXT NOT NULL,
  translation_language TEXT NOT NULL,

  -- Rich data
  part_of_speech TEXT, -- 'noun', 'verb', 'adjective', etc.
  gender TEXT, -- 'masculine', 'feminine', 'neuter'
  pronunciation TEXT,
  example_sentence TEXT,
  notes TEXT,

  -- SRS (Spaced Repetition System)
  ease_factor NUMERIC DEFAULT 2.5,
  interval_days INTEGER DEFAULT 0,
  repetitions INTEGER DEFAULT 0,
  next_review TIMESTAMPTZ,
  last_reviewed TIMESTAMPTZ,

  -- Source
  source_project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  source_line_id TEXT,

  -- Organization
  tags TEXT[] DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_vocabulary_user_id ON public.vocabulary(user_id);
CREATE INDEX idx_vocabulary_next_review ON public.vocabulary(next_review) WHERE next_review IS NOT NULL;

-- ============================================
-- TEMPLATES (Marketplace)
-- ============================================

CREATE TABLE public.templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  creator_name TEXT,

  -- Metadata
  name TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  preview_images TEXT[],

  -- Content
  type TEXT CHECK (type IN ('full_project', 'layout', 'theme', 'stamp_pack', 'arrow_pack')) NOT NULL,
  data JSONB NOT NULL, -- The actual template data

  -- Marketplace
  price_cents INTEGER DEFAULT 0, -- 0 = free
  currency TEXT DEFAULT 'USD',
  downloads INTEGER DEFAULT 0,
  rating NUMERIC,
  reviews_count INTEGER DEFAULT 0,

  -- Flags
  is_featured BOOLEAN DEFAULT FALSE,
  is_verified BOOLEAN DEFAULT FALSE,
  is_public BOOLEAN DEFAULT TRUE,

  -- Compatibility
  languages TEXT[] DEFAULT '{}', -- Empty = all languages
  categories TEXT[] DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_templates_type ON public.templates(type);
CREATE INDEX idx_templates_is_public ON public.templates(is_public) WHERE is_public = TRUE;

-- ============================================
-- USAGE TRACKING (Per month)
-- ============================================

CREATE TABLE public.usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  month TEXT NOT NULL, -- '2025-01' format

  -- Counts
  ai_translations INTEGER DEFAULT 0,
  ai_annotations INTEGER DEFAULT 0,
  ai_explanations INTEGER DEFAULT 0,
  exports_pdf INTEGER DEFAULT 0,
  exports_epub INTEGER DEFAULT 0,
  exports_mobi INTEGER DEFAULT 0,

  UNIQUE(user_id, month)
);

CREATE INDEX idx_usage_user_month ON public.usage(user_id, month);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vocabulary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can only read/update their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Projects: Users can CRUD their own projects, view public projects
CREATE POLICY "Users can view own projects"
  ON public.projects FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = ANY(collaborators) OR is_public = TRUE);

CREATE POLICY "Users can create projects"
  ON public.projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects"
  ON public.projects FOR UPDATE
  USING (auth.uid() = user_id OR auth.uid() = ANY(collaborators));

CREATE POLICY "Users can delete own projects"
  ON public.projects FOR DELETE
  USING (auth.uid() = user_id);

-- Project Versions: Same as projects
CREATE POLICY "Users can view own project versions"
  ON public.project_versions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = project_versions.project_id
      AND (projects.user_id = auth.uid() OR auth.uid() = ANY(projects.collaborators))
    )
  );

CREATE POLICY "Users can create project versions"
  ON public.project_versions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = project_versions.project_id
      AND (projects.user_id = auth.uid() OR auth.uid() = ANY(projects.collaborators))
    )
  );

-- Assets: Users own their assets
CREATE POLICY "Users can manage own assets"
  ON public.assets FOR ALL
  USING (auth.uid() = user_id);

-- Vocabulary: Users own their vocabulary
CREATE POLICY "Users can manage own vocabulary"
  ON public.vocabulary FOR ALL
  USING (auth.uid() = user_id);

-- Templates: Public templates are readable by all, creators can manage their own
CREATE POLICY "Anyone can view public templates"
  ON public.templates FOR SELECT
  USING (is_public = TRUE OR creator_id = auth.uid());

CREATE POLICY "Creators can manage own templates"
  ON public.templates FOR ALL
  USING (creator_id = auth.uid());

-- Usage: Users can view their own usage
CREATE POLICY "Users can view own usage"
  ON public.usage FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_templates_updated_at
  BEFORE UPDATE ON public.templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Reset AI credits monthly (called by cron job or Edge Function)
CREATE OR REPLACE FUNCTION reset_monthly_ai_credits()
RETURNS void AS $$
BEGIN
  UPDATE public.profiles
  SET ai_credits_used = 0
  WHERE ai_credits_used > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
