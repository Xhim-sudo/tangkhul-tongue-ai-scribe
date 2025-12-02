-- Enable realtime for training_entries table
ALTER PUBLICATION supabase_realtime ADD TABLE public.training_entries;

-- Enable realtime for translation_consensus table
ALTER PUBLICATION supabase_realtime ADD TABLE public.translation_consensus;

-- Set REPLICA IDENTITY FULL for complete row data
ALTER TABLE public.training_entries REPLICA IDENTITY FULL;
ALTER TABLE public.translation_consensus REPLICA IDENTITY FULL;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;