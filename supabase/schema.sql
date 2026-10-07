-- giasuchillchill: bảng lưu dữ liệu của từng gia sư (đã chạy trên project Supabase "giasuchillchill")
create table public.kv (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  key text not null check (char_length(key) between 1 and 200),
  value jsonb not null check (octet_length(value::text) <= 1048576),
  updated_at timestamptz not null default now(),
  primary key (user_id, key)
);
alter table public.kv enable row level security;
create policy "kv_select_own" on public.kv for select to authenticated using ((select auth.uid()) = user_id);
create policy "kv_insert_own" on public.kv for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "kv_update_own" on public.kv for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "kv_delete_own" on public.kv for delete to authenticated using ((select auth.uid()) = user_id);
revoke all on public.kv from anon;
grant select, insert, update, delete on public.kv to authenticated;
create or replace function public.kv_touch() returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at := now(); return new; end; $$;
create trigger kv_touch before update on public.kv for each row execute function public.kv_touch();
