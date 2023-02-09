--  Trigger profile creation on user insert
create function public.create_profile_of_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, email, first_name, last_name, academic_title, terms_accepted)
  values (new.id, new.raw_user_meta_data->>'username', new.email, new.raw_user_meta_data->>'firstName', new.raw_user_meta_data->>'lastName', new.raw_user_meta_data->>'academicTitle', Cast(new.raw_user_meta_data->>'termsAccepted' as Boolean));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.create_profile_of_new_user();

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
