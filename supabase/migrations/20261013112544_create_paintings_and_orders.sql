-- Paintings, orders and admin check, with Row Level Security.
-- Prices are integers in öre (SEK minor unit). Paintings are never deleted, only archived.

-- Admins -------------------------------------------------------------------
-- Only users listed here count as admin. Public sign-ups are disabled in Supabase Auth,
-- but we check this table explicitly instead of trusting the `authenticated` role.
create table public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade
);

alter table public.admins enable row level security;
-- No policies on purpose: nobody can read or write this table through the API.

-- security definer lets the function read `admins` even though RLS blocks direct access.
create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admins where user_id = (select auth.uid())
  );
$$;

-- Paintings ----------------------------------------------------------------
create table public.paintings (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  price_ore integer not null check (price_ore > 0),
  image_path text,
  status text not null default 'available'
    check (status in ('available', 'reserved', 'sold', 'archived')),
  -- When an active reservation ends. Lets us release paintings if an expiry webhook is missed.
  reserved_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index paintings_status_idx on public.paintings (status);

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger paintings_set_updated_at
  before update on public.paintings
  for each row execute function public.set_updated_at();

alter table public.paintings enable row level security;

-- Visitors (and any logged-in user) can only see available paintings.
create policy "Anyone can read available paintings"
  on public.paintings for select
  to anon, authenticated
  using (status = 'available');

-- Admin can see everything, including reserved, sold and archived.
create policy "Admin can read all paintings"
  on public.paintings for select
  to authenticated
  using (public.is_admin());

create policy "Admin can insert paintings"
  on public.paintings for insert
  to authenticated
  with check (public.is_admin());

create policy "Admin can update paintings"
  on public.paintings for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- No delete policy: paintings are archived (soft delete), never removed.

-- Orders -------------------------------------------------------------------
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  -- restrict: a painting that has an order can never be removed.
  painting_id uuid not null references public.paintings (id) on delete restrict,
  -- Unique, so the webhook can safely receive the same event more than once.
  stripe_session_id text not null unique,
  customer_email text not null,
  customer_name text,
  -- Null for pickup.
  shipping_address jsonb,
  amount_ore integer not null check (amount_ore > 0),
  created_at timestamptz not null default now()
);

create index orders_painting_id_idx on public.orders (painting_id);

alter table public.orders enable row level security;

-- Contains customer personal data: only the admin can read it.
-- Orders are written by the webhook Edge Function with the service role (bypasses RLS),
-- so there are no insert, update or delete policies.
create policy "Admin can read orders"
  on public.orders for select
  to authenticated
  using (public.is_admin());
