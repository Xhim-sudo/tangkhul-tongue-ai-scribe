
-- Drop broken policies on error_logs
DROP POLICY IF EXISTS "Anyone can insert error logs" ON error_logs;
DROP POLICY IF EXISTS "Users can insert error logs" ON error_logs;
DROP POLICY IF EXISTS "Admins can view all error logs" ON error_logs;

-- Authenticated users can insert error logs
CREATE POLICY "Authenticated users can insert error logs" ON error_logs
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Admins can view all error logs using correct function
CREATE POLICY "Admins can view all error logs" ON error_logs
  FOR SELECT TO authenticated
  USING (check_user_role(auth.uid(), 'admin'));
