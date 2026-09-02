CREATE POLICY "notices_master_read" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'notices' AND public.is_master(auth.uid()));
CREATE POLICY "notices_master_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'notices' AND public.is_master(auth.uid()));
CREATE POLICY "notices_master_update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'notices' AND public.is_master(auth.uid()));
CREATE POLICY "notices_master_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'notices' AND public.is_master(auth.uid()));