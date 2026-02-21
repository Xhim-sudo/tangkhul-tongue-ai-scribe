
-- Drop all existing RESTRICTIVE policies on training_submissions_log
DROP POLICY IF EXISTS "Users can create submissions" ON public.training_submissions_log;
DROP POLICY IF EXISTS "Users can view own submissions" ON public.training_submissions_log;
DROP POLICY IF EXISTS "Reviewers can view all submissions" ON public.training_submissions_log;
DROP POLICY IF EXISTS "Admins can update submissions" ON public.training_submissions_log;

-- Recreate as PERMISSIVE policies
CREATE POLICY "Users can create submissions"
ON public.training_submissions_log FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = contributor_id);

CREATE POLICY "Users can view own submissions"
ON public.training_submissions_log FOR SELECT
TO authenticated
USING (auth.uid() = contributor_id);

CREATE POLICY "Reviewers can view all submissions"
ON public.training_submissions_log FOR SELECT
TO authenticated
USING (public.check_user_role(auth.uid(), 'admin'::app_role) OR public.check_user_role(auth.uid(), 'expert'::app_role) OR public.check_user_role(auth.uid(), 'reviewer'::app_role));

CREATE POLICY "Admins can update submissions"
ON public.training_submissions_log FOR UPDATE
TO authenticated
USING (public.check_user_role(auth.uid(), 'admin'::app_role) OR public.check_user_role(auth.uid(), 'reviewer'::app_role));

-- Also fix training_categories (same issue - restrictive policies)
DROP POLICY IF EXISTS "Anyone can view categories" ON public.training_categories;
DROP POLICY IF EXISTS "Only admins can manage categories" ON public.training_categories;

CREATE POLICY "Anyone can view categories"
ON public.training_categories FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Only admins can manage categories"
ON public.training_categories FOR ALL
TO authenticated
USING (public.check_user_role(auth.uid(), 'admin'::app_role));

-- Fix profiles table too
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can view all profiles"
ON public.profiles FOR SELECT
USING (true);

CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

-- Fix translation_consensus
DROP POLICY IF EXISTS "Anyone can view consensus" ON public.translation_consensus;
DROP POLICY IF EXISTS "Only reviewers can manage consensus" ON public.translation_consensus;

CREATE POLICY "Anyone can view consensus"
ON public.translation_consensus FOR SELECT
USING (true);

CREATE POLICY "Only reviewers can manage consensus"
ON public.translation_consensus FOR ALL
TO authenticated
USING (public.check_user_role(auth.uid(), 'admin'::app_role) OR public.check_user_role(auth.uid(), 'expert'::app_role) OR public.check_user_role(auth.uid(), 'reviewer'::app_role));

-- Fix translation_cache
DROP POLICY IF EXISTS "Anyone can read cache" ON public.translation_cache;
DROP POLICY IF EXISTS "System can manage cache" ON public.translation_cache;

CREATE POLICY "Anyone can read cache"
ON public.translation_cache FOR SELECT
USING (true);

CREATE POLICY "System can manage cache"
ON public.translation_cache FOR ALL
USING (true)
WITH CHECK (true);

-- Fix translation_analytics
DROP POLICY IF EXISTS "Users can view own analytics" ON public.translation_analytics;
DROP POLICY IF EXISTS "Admins can view all analytics" ON public.translation_analytics;
DROP POLICY IF EXISTS "System can insert analytics" ON public.translation_analytics;

CREATE POLICY "Users can view own analytics"
ON public.translation_analytics FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all analytics"
ON public.translation_analytics FOR SELECT
TO authenticated
USING (public.check_user_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert analytics"
ON public.translation_analytics FOR INSERT
WITH CHECK (true);

-- Fix other tables with same issue
DROP POLICY IF EXISTS "Authenticated users can insert error logs" ON public.error_logs;
DROP POLICY IF EXISTS "Admins can view all error logs" ON public.error_logs;

CREATE POLICY "Authenticated users can insert error logs"
ON public.error_logs FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can view all error logs"
ON public.error_logs FOR SELECT
TO authenticated
USING (public.check_user_role(auth.uid(), 'admin'::app_role));
