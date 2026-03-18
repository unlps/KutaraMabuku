-- =============================================================================
-- ValidaMabuku: Reviewer Dashboard Schema
-- =============================================================================

-- 1. Reviewer Invitations (admin invites reviewers via token)
CREATE TABLE IF NOT EXISTS public.reviewer_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Reviewer Profiles (extends auth.users for reviewer-specific data)
CREATE TABLE IF NOT EXISTS public.reviewer_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  editor_secret_id TEXT UNIQUE NOT NULL DEFAULT ('VM-' || upper(substr(encode(gen_random_bytes(6), 'hex'), 1, 12))),
  publisher_name TEXT,
  phone TEXT,
  secondary_contact TEXT,
  date_of_birth DATE,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'reviewer' CHECK (role IN ('reviewer', 'senior_reviewer', 'admin')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Book Submissions (books submitted by writers for review)
CREATE TABLE IF NOT EXISTS public.book_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ebook_id UUID NOT NULL REFERENCES public.ebooks(id) ON DELETE CASCADE,
  submitted_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reviewer_id UUID REFERENCES public.reviewer_profiles(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending_review' CHECK (
    status IN ('pending_review', 'in_review', 'approved', 'rejected', 'revision_requested')
  ),
  review_notes TEXT,
  rejection_reason TEXT,
  priority INTEGER NOT NULL DEFAULT 0,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ
);

-- =============================================================================
-- Indexes
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_reviewer_invitations_token ON public.reviewer_invitations(token);
CREATE INDEX IF NOT EXISTS idx_reviewer_invitations_email ON public.reviewer_invitations(email);
CREATE INDEX IF NOT EXISTS idx_book_submissions_status ON public.book_submissions(status);
CREATE INDEX IF NOT EXISTS idx_book_submissions_reviewer ON public.book_submissions(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_book_submissions_ebook ON public.book_submissions(ebook_id);

-- =============================================================================
-- Row Level Security
-- =============================================================================

-- Reviewer Invitations RLS
ALTER TABLE public.reviewer_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read invitation by token"
  ON public.reviewer_invitations FOR SELECT
  USING (true);

CREATE POLICY "Only admins can create invitations"
  ON public.reviewer_invitations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.reviewer_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Invitation can be updated on acceptance"
  ON public.reviewer_invitations FOR UPDATE
  USING (true)
  WITH CHECK (status = 'accepted');

-- Reviewer Profiles RLS
ALTER TABLE public.reviewer_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reviewers can read own profile"
  ON public.reviewer_profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Reviewers can read other reviewer names"
  ON public.reviewer_profiles FOR SELECT
  USING (true);

CREATE POLICY "Reviewers can update own profile"
  ON public.reviewer_profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "System can insert reviewer profiles"
  ON public.reviewer_profiles FOR INSERT
  WITH CHECK (true);

-- Book Submissions RLS
ALTER TABLE public.book_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Writers can see own submissions"
  ON public.book_submissions FOR SELECT
  USING (submitted_by = auth.uid());

CREATE POLICY "Reviewers can see all submissions"
  ON public.book_submissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.reviewer_profiles
      WHERE id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Writers can create submissions"
  ON public.book_submissions FOR INSERT
  WITH CHECK (submitted_by = auth.uid());

CREATE POLICY "Reviewers can update submissions"
  ON public.book_submissions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.reviewer_profiles
      WHERE id = auth.uid() AND status = 'active'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.reviewer_profiles
      WHERE id = auth.uid() AND status = 'active'
    )
  );

-- =============================================================================
-- Updated_at trigger for reviewer_profiles
-- =============================================================================
CREATE OR REPLACE FUNCTION public.update_reviewer_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_reviewer_updated_at
  BEFORE UPDATE ON public.reviewer_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_reviewer_updated_at();
