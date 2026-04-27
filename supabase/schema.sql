-- ================================================================
-- VISIONS CHURNSHIELD — Supabase Schema
-- Jalankan di Supabase SQL Editor
-- ================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ----------------------------------------------------------------
-- 1. PROFILES (extend auth.users)
-- ----------------------------------------------------------------
create table public.profiles (
  id            uuid        primary key references auth.users(id) on delete cascade,
  email         text        not null,
  full_name     text        not null,
  role          text        not null default 'staff' check (role in ('admin', 'staff')),
  avatar_url    text,
  is_active     boolean     not null default true,
  last_login    timestamptz,
  assigned_count int        default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- RLS
alter table public.profiles enable row level security;

create policy "Users can view all profiles"
  on public.profiles for select
  using (auth.role() = 'authenticated');

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Admins can manage all profiles"
  on public.profiles for all
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Auto-insert profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'staff')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ----------------------------------------------------------------
-- 2. CUSTOMERS
-- ----------------------------------------------------------------
create table public.customers (
  id                  serial      primary key,
  customer_id         text        not null unique,       -- e.g. C-0001
  company_name        text        not null,
  plan_type           text        not null,              -- Enterprise / Professional / Starter
  contract_type       text        not null,              -- Annual / Monthly
  tenure_months       integer     not null default 0,
  churn_score         integer     not null default 0 check (churn_score between 0 and 100),
  risk_level          text        not null default 'Rendah' check (risk_level in ('Tinggi','Sedang','Rendah')),
  prioritas           integer     default 3,
  alasan_churn        text,
  rekomendasi         text,
  monthly_usage_hrs   numeric(8,2) default 0,
  feature_adoption_pct numeric(5,2) default 0,
  nps_latest          integer     check (nps_latest between 0 and 10),
  dunning_count       integer     default 0,
  days_since_login    integer     default 0,
  open_tickets        integer     default 0,
  churn_actual        boolean,
  assigned_to         uuid        references public.profiles(id) on delete set null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- RLS
alter table public.customers enable row level security;

create policy "Admins can see all customers"
  on public.customers for select
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Staff can see assigned customers"
  on public.customers for select
  using (
    assigned_to = auth.uid()
    or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Admins can manage customers"
  on public.customers for all
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Update assigned_count on profiles when assignment changes
create or replace function update_assigned_count()
returns trigger as $$
begin
  if old.assigned_to is not null then
    update public.profiles set assigned_count = assigned_count - 1 where id = old.assigned_to;
  end if;
  if new.assigned_to is not null then
    update public.profiles set assigned_count = assigned_count + 1 where id = new.assigned_to;
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_customer_assignment_change
  after update of assigned_to on public.customers
  for each row execute procedure update_assigned_count();

-- ----------------------------------------------------------------
-- 3. ACTIVITIES
-- ----------------------------------------------------------------
create table public.activities (
  id           serial      primary key,
  staff_id     uuid        not null references public.profiles(id) on delete cascade,
  customer_id  text        not null references public.customers(customer_id) on delete cascade,
  action_type  text        not null check (action_type in ('call','email','meeting','note','other')),
  description  text        not null,
  created_at   timestamptz not null default now()
);

alter table public.activities enable row level security;

create policy "Staff can see own activities"
  on public.activities for select
  using (
    staff_id = auth.uid()
    or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Staff can insert own activities"
  on public.activities for insert
  with check (staff_id = auth.uid());

create policy "Admins can manage all activities"
  on public.activities for all
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- ----------------------------------------------------------------
-- 4. MODEL HISTORY
-- ----------------------------------------------------------------
create table public.model_history (
  id                serial      primary key,
  tanggal           date        not null,
  algoritma         text        not null,
  akurasi           numeric(5,2),
  auc_roc           numeric(5,4),
  precision_churn   numeric(5,2),
  recall_churn      numeric(5,2),
  f1_score          numeric(5,2),
  status            text        not null default 'Tidak Aktif' check (status in ('Aktif','Tidak Aktif')),
  created_at        timestamptz not null default now()
);

alter table public.model_history enable row level security;

create policy "Authenticated users can view model history"
  on public.model_history for select
  using (auth.role() = 'authenticated');

create policy "Admins can manage model history"
  on public.model_history for all
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Ensure only one active model
create or replace function ensure_single_active_model()
returns trigger as $$
begin
  if new.status = 'Aktif' then
    update public.model_history set status = 'Tidak Aktif'
    where id != new.id and status = 'Aktif';
  end if;
  return new;
end;
$$ language plpgsql;

create trigger on_model_activated
  after insert or update of status on public.model_history
  for each row when (new.status = 'Aktif')
  execute procedure ensure_single_active_model();

-- ----------------------------------------------------------------
-- 5. FEATURE IMPORTANCE
-- ----------------------------------------------------------------
create table public.feature_importance (
  id               serial  primary key,
  model_history_id integer not null references public.model_history(id) on delete cascade,
  feature_name     text    not null,
  importance_score numeric(6,4) not null
);

alter table public.feature_importance enable row level security;

create policy "Authenticated users can view feature importance"
  on public.feature_importance for select
  using (auth.role() = 'authenticated');

create policy "Admins can manage feature importance"
  on public.feature_importance for all
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- ----------------------------------------------------------------
-- SEED DATA (contoh — sesuaikan setelah buat akun Admin pertama)
-- ----------------------------------------------------------------
-- Insert model history
insert into public.model_history (tanggal, algoritma, akurasi, auc_roc, precision_churn, recall_churn, f1_score, status)
values
  ('2024-06-15', 'Random Forest',      94.2, 0.97, 91.5, 89.3, 90.4, 'Aktif'),
  ('2024-05-20', 'XGBoost',            93.1, 0.96, 90.2, 88.7, 89.4, 'Tidak Aktif'),
  ('2024-04-10', 'Logistic Regression',87.4, 0.91, 84.1, 82.9, 83.5, 'Tidak Aktif'),
  ('2024-03-05', 'Random Forest',      92.8, 0.95, 89.6, 87.4, 88.5, 'Tidak Aktif');

-- Insert feature importance untuk model aktif (id=1)
insert into public.feature_importance (model_history_id, feature_name, importance_score)
values
  (1, 'days_since_login',      0.31),
  (1, 'monthly_usage_hrs',     0.24),
  (1, 'dunning_count',         0.18),
  (1, 'nps_latest',            0.14),
  (1, 'feature_adoption_pct',  0.09);

-- ================================================================
-- Cara membuat akun Admin pertama:
-- 1. Buat user biasa lewat Supabase Auth (sign up)
-- 2. Jalankan SQL ini (ganti <user_id> dengan UUID user):
--    UPDATE public.profiles SET role = 'admin' WHERE id = '<user_id>';
-- ================================================================
