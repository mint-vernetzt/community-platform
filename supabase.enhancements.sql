-- RLS for images bucket

create policy "anyone can access images"
  on storage.objects for select
  using ( bucket_id = 'images' );

create policy "authenticated user can upload images"
  on storage.objects for insert
  to authenticated
  with check ( bucket_id = 'images' );

create policy "authenticated user can update images"
  on storage.objects for update
  to authenticated
  using ( bucket_id = 'images' );

-- RLS for documents bucket

create policy "authenticated user can access documents"
  on storage.objects for select
  to authenticated
  using ( bucket_id = 'documents' );

create policy "authenticated user can upload documents"
  on storage.objects for insert
  to authenticated
  with check ( bucket_id = 'documents' );

create policy "authenticated user can update documents"
  on storage.objects for update
  to authenticated
  using ( bucket_id = 'documents' );
