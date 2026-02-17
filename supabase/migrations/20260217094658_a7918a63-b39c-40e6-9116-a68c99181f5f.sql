-- Allow admins to UPDATE training_submissions_log (for golden data marking)
CREATE POLICY "Admins can update submissions"
ON public.training_submissions_log
FOR UPDATE TO authenticated
USING (check_user_role(auth.uid(), 'admin'::app_role));