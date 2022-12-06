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

-- Trigger profile email update on user update
create function public.update_profile_email()
returns trigger as $$
begin
  update public.profiles
  set email = new.email
  where id = new.id;
end;
$$ language plpgsql security definer;

create trigger on_update_profile_email
  after update of email on auth.users
  for each row execute procedure public.update_profile_email();

-- Create bucket for images
insert into storage.buckets (id, name)
values ('images', 'images');

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

-- Create bucket for documents
insert into storage.buckets (id, name)
values ('documents', 'documents');

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
