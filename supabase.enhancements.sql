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

-- Create bucket for images
insert into storage.buckets (id, name)
values ('images', 'images');