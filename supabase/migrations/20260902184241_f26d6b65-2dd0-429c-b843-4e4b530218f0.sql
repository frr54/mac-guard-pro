CREATE TABLE public.system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  support_whatsapp text NOT NULL DEFAULT '',
  support_message text NOT NULL DEFAULT 'Olá, preciso de suporte com meu acesso.',
  global_notice_text text NOT NULL DEFAULT '',
  global_notice_image_url text NOT NULL DEFAULT '',
  global_notice_active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.system_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.system_settings TO authenticated;
GRANT ALL ON public.system_settings TO service_role;

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY system_settings_select ON public.system_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY system_settings_update ON public.system_settings FOR UPDATE TO authenticated USING (public.is_master(auth.uid())) WITH CHECK (public.is_master(auth.uid()));
CREATE POLICY system_settings_insert ON public.system_settings FOR INSERT TO authenticated WITH CHECK (public.is_master(auth.uid()));

CREATE TRIGGER trg_system_settings_updated BEFORE UPDATE ON public.system_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.system_settings (support_whatsapp) VALUES ('');

ALTER PUBLICATION supabase_realtime ADD TABLE public.system_settings;