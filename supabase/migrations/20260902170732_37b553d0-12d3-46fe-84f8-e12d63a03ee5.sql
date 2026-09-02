
CREATE TYPE public.app_role AS ENUM ('master', 'reseller');
CREATE TYPE public.device_status AS ENUM ('active', 'inactive');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  email text NOT NULL,
  name text NOT NULL DEFAULT '',
  can_create_resellers boolean NOT NULL DEFAULT false,
  is_blocked boolean NOT NULL DEFAULT false,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  mac text NOT NULL UNIQUE,
  server_url text NOT NULL DEFAULT 'http://jogar.nexusppmaster.eu:80',
  username text NOT NULL,
  password text NOT NULL,
  user_agent text NOT NULL DEFAULT 'IPTVSmarters',
  validity_days integer NOT NULL DEFAULT 30,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  status public.device_status NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.devices TO authenticated;
GRANT ALL ON public.devices TO service_role;
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.is_master(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users u
    WHERE u.id = _user_id AND lower(u.email) = 'retaseu080@gmail.com'
  ) OR EXISTS (
    SELECT 1 FROM public.user_roles r WHERE r.user_id = _user_id AND r.role = 'master'
  );
$$;

CREATE OR REPLACE FUNCTION public.can_create_resellers(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.is_master(_user_id) OR EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = _user_id AND p.can_create_resellers
  );
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_devices_updated BEFORE UPDATE ON public.devices
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, created_by)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NULLIF(NEW.raw_user_meta_data->>'created_by', '')::uuid
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    CASE WHEN lower(NEW.email) = 'retaseu080@gmail.com' THEN 'master'::public.app_role
         ELSE 'reseller'::public.app_role END
  ) ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- profiles policies
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT TO authenticated
USING (id = auth.uid() OR public.is_master(auth.uid()) OR created_by = auth.uid());
CREATE POLICY "profiles_update_master" ON public.profiles FOR UPDATE TO authenticated
USING (public.is_master(auth.uid()) OR created_by = auth.uid())
WITH CHECK (public.is_master(auth.uid()) OR created_by = auth.uid());

-- user_roles policies
CREATE POLICY "user_roles_select" ON public.user_roles FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.is_master(auth.uid()));

-- devices policies
CREATE POLICY "devices_select" ON public.devices FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.is_master(auth.uid()));
CREATE POLICY "devices_insert" ON public.devices FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());
CREATE POLICY "devices_update" ON public.devices FOR UPDATE TO authenticated
USING (user_id = auth.uid() OR public.is_master(auth.uid()))
WITH CHECK (user_id = auth.uid() OR public.is_master(auth.uid()));
CREATE POLICY "devices_delete" ON public.devices FOR DELETE TO authenticated
USING (user_id = auth.uid() OR public.is_master(auth.uid()));
