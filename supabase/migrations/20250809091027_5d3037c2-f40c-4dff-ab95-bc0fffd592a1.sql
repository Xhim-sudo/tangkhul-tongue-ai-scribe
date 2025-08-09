-- Add pin_code to invitations and attach staff_id generation trigger
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'invitations' 
      AND column_name = 'pin_code'
  ) THEN
    ALTER TABLE public.invitations ADD COLUMN pin_code text;
  END IF;
END $$;

-- Ensure trigger exists to auto-generate staff_id when missing
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'ensure_staff_id_on_invitations'
  ) THEN
    CREATE TRIGGER ensure_staff_id_on_invitations
    BEFORE INSERT ON public.invitations
    FOR EACH ROW
    EXECUTE FUNCTION public.ensure_staff_id_on_invitation();
  END IF;
END $$;
