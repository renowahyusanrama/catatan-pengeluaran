-- =============================================================
-- Catatan Pengeluaran — Skema Database (Supabase PostgreSQL)
-- Jalankan file ini di SQL Editor Supabase pada project kamu.
-- =============================================================

-- Tabel transaksi pengeluaran
create table if not exists public.transactions (
  id          uuid primary key default gen_random_uuid(),
  amount      bigint       not null check (amount > 0),
  description text         not null check (char_length(trim(description)) > 0),
  category    text         not null,
  date        date         not null,
  note        text,
  created_at  timestamptz  not null default now()
);

-- Tabel anggaran bulanan (satu baris per bulan, key: YYYY-MM)
create table if not exists public.budgets (
  month      text   primary key,
  amount     bigint not null check (amount >= 0),
  updated_at timestamptz not null default now()
);

-- Indeks untuk pencarian & filter yang sering dipakai
create index if not exists idx_transactions_date       on public.transactions (date desc);
create index if not exists idx_transactions_category   on public.transactions (category);
create index if not exists idx_transactions_created_at on public.transactions (created_at desc);

-- -----------------------------------------------------------------
-- KEBERHASILAN KEAMANAN (PENTING):
-- Aplikasi ini TIDAK memakai login, sehingga SEMUA akses data
-- dilakukan lewat backend (Express) yang memegang service-role key.
-- Jangan aktifkan akses publik (anon) ke tabel ini. Bila ingin
-- mengunci lebih kuat, aktifkan RLS dan BLOKIR semua operasi anon:
-- -----------------------------------------------------------------

alter table public.transactions enable row level security;
alter table public.budgets     enable row level security;

-- Kebijakan default: tolak semua akses dari role anon/authenticated.
-- Backend memakai service-role key sehingga tetap bisa membaca,
-- tetapi klien browser (anon key) tidak pernah bisa mengakses data.
drop policy if exists "block anon transactions" on public.transactions;
drop policy if exists "block anon budgets"     on public.budgets;

create policy "block anon transactions" on public.transactions
  for all using (false) with check (false);
create policy "block anon budgets" on public.budgets
  for all using (false) with check (false);