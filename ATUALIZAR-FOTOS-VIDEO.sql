alter table public.products
  add column if not exists description text not null default '',
  add column if not exists image_urls text[] not null default '{}'::text[],
  add column if not exists video_url text;

update public.products
set image_urls = array[image_url]
where cardinality(image_urls) = 0 and image_url is not null;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-videos',
  'product-videos',
  true,
  20971520,
  array['video/mp4', 'video/webm']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "videos publicos" on storage.objects;
drop policy if exists "proprietario envia videos" on storage.objects;
drop policy if exists "proprietario altera videos" on storage.objects;
drop policy if exists "proprietario exclui videos" on storage.objects;

create policy "videos publicos" on storage.objects
for select to public using (bucket_id = 'product-videos');

create policy "proprietario envia videos" on storage.objects
for insert to authenticated with check (
  bucket_id = 'product-videos'
  and auth.uid() = 'a72dffcb-a319-463c-917d-d5ed9cb55147'::uuid
);

create policy "proprietario altera videos" on storage.objects
for update to authenticated using (
  bucket_id = 'product-videos'
  and auth.uid() = 'a72dffcb-a319-463c-917d-d5ed9cb55147'::uuid
);

create policy "proprietario exclui videos" on storage.objects
for delete to authenticated using (
  bucket_id = 'product-videos'
  and auth.uid() = 'a72dffcb-a319-463c-917d-d5ed9cb55147'::uuid
);
