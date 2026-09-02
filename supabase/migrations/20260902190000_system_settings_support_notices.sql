-- Global support, notices and public configuration.
create table if not exists public.system_settings (
  id uuid primary key default gen_random_uuid(),
  support_whatsapp text not null default '',
  support_message text not null default 'Olá, preciso de suporte com meu acesso.',
  global_notice_text text not null default '',
  global_notice_image_url text not null default '',
  global_notice_active boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.system_settings enable row level security;

-- Public clients may read the singleton settings row.
drop policy if exists "system_settings_public_read" on public.system_settings;
create policy "system_settings_public_read"
on public.system_settings
for select
to anon, authenticated
using (true);

-- Only the Master Admin may create/update/delete settings.
drop policy if exists "system_settings_master_insert" on public.system_settings;
create policy "system_settings_master_insert"
on public.system_settings
for insert
to authenticated
with check (public.is_master(auth.uid()));

drop policy if exists "system_settings_master_update" on public.system_settings;
create policy "system_settings_master_update"
on public.system_settings
for update
to authenticated
using (public.is_master(auth.uid()))
with check (public.is_master(auth.uid()));

drop policy if exists "system_settings_master_delete" on public.system_settings;
create policy "system_settings_master_delete"
on public.system_settings
for delete
to authenticated
using (public.is_master(auth.uid()));

insert into public.system_settings (id)
select gen_random_uuid()
where not exists (select 1 from public.system_settings);

-- Public Storage bucket for notice/banner images.
insert into storage.buckets (id, name, public)
values ('notices', 'notices', true)
on conflict (id) do update set public = excluded.public;

-- Anyone can view notice images because the bucket is public.
drop policy if exists "notices_public_read" on storage.objects;
create policy "notices_public_read"
on storage.objects
for select
to public
using (bucket_id = 'notices');

-- Only Master Admin can upload, update or delete notice images.
drop policy if exists "notices_master_insert" on storage.objects;
create policy "notices_master_insert"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'notices' and public.is_master(auth.uid()));

drop policy if exists "notices_master_update" on storage.objects;
create policy "notices_master_update"
on storage.objects
for update
to authenticated
using (bucket_id = 'notices' and public.is_master(auth.uid()))
with check (bucket_id = 'notices' and public.is_master(auth.uid()));

drop policy if exists "notices_master_delete" on storage.objects;
create policy "notices_master_delete"
on storage.objects
for delete
to authenticated
using (bucket_id = 'notices' and public.is_master(auth.uid()));
