-- Users table stores authentication info from Supabase Auth
-- This table should be populated by Supabase Auth triggers
create table users (
  id uuid references auth.users not null primary key,
  first_name text,
  last_name text,
  email text,
  role text default 'customer' not null -- 'admin' or 'customer'
);

-- Locations table for storing user-saved coordinates
create table locations (
  id bigint primary key generated always as identity,
  user_id uuid references users(id) not null,
  created_at timestamptz default now() not null,
  latitude double precision not null,
  longitude double precision not null
);

-- Orders table to track laundry service orders
create table orders (
  id bigint primary key generated always as identity,
  order_uid text unique not null,
  user_id uuid references users(id) not null,
  customer_name text not null,
  contact_number text not null,
  service_package text not null,
  weight_kg numeric,
  distance_km numeric,
  total_price numeric not null,
  loads int not null,
  status text not null,
  delivery_option text, -- for package2: 'drop-off' or 'pick-up'
  created_at timestamptz default now() not null
);

-- Function to create a user profile when a new user signs up in Supabase Auth
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, email, role)
  values (new.id, new.email, 'customer');
  return new;
end;
$$;

-- Trigger to call the function after a new user is created in auth.users
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Enable Row Level Security (RLS) for all tables
alter table users enable row level security;
alter table locations enable row level security;
alter table orders enable row level security;

-- Policies for 'users' table
create policy "Users can view their own profile."
  on users for select
  using ( auth.uid() = id );

create policy "Users can update their own profile."
  on users for update
  using ( auth.uid() = id );
  
create policy "Admins can view all user profiles."
  on users for select
  using ( (select role from users where id = auth.uid()) = 'admin' );

-- Policies for 'locations' table
create policy "Users can insert their own locations."
  on locations for insert
  with check ( auth.uid() = user_id );

create policy "Users can view their own locations."
  on locations for select
  using ( auth.uid() = user_id );

-- Policies for 'orders' table
create policy "Users can create their own orders."
  on orders for insert
  with check ( auth.uid() = user_id );

create policy "Users can view their own orders."
  on orders for select
  using ( auth.uid() = user_id );
  
create policy "Admins can view all orders."
  on orders for select
  using ( (select role from users where id = auth.uid()) = 'admin' );

create policy "Admins can update orders."
  on orders for update
  using ( (select role from users where id = auth.uid()) = 'admin' );
