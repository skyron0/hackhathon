-- ===========================================================================
-- YKS AI Coach  |  Database Schema (Supabase / PostgreSQL)
-- ===========================================================================
-- Tables: students, universities, programs, exams, subject_scores, topic_errors
-- ===========================================================================

create extension if not exists "uuid-ossp";

-- ---------- 1. Universities ---------------------------------------------------
create table if not exists public.universities (
  kod          int primary key,
  isim         text not null,
  sehir        text,
  tip          text default 'devlet'      -- devlet | vakif
);

create index if not exists universities_isim_idx on public.universities using gin (to_tsvector('simple', isim));

-- ---------- 2. Programs (Bolumler) -------------------------------------------
create table if not exists public.programs (
  id              bigserial primary key,
  kod             bigint unique,
  isim            text not null,
  fakulte         text,
  okul_kod        int references public.universities(kod) on delete cascade,
  puan_turu       text check (puan_turu in ('SAY','EA','SÖZ','DİL','TYT')),
  taban_siralama  int,
  taban_puan      numeric(5,2),
  yil             int default 2024
);

create index if not exists programs_okul_idx on public.programs(okul_kod);
create index if not exists programs_puan_idx on public.programs(puan_turu);
create index if not exists programs_isim_idx on public.programs using gin (to_tsvector('simple', isim));

-- ---------- 3. Students ------------------------------------------------------
create table if not exists public.students (
  id                 uuid primary key default uuid_generate_v4(),
  full_name          text not null,
  alan               text check (alan in ('SAY','EA','SÖZ','DİL')) default 'SAY',
  target_uni_kod     int references public.universities(kod),
  target_program_id  bigint references public.programs(id),
  target_ranking     int,           -- hedef sıralama, örn. 5000
  created_at         timestamptz default now()
);

create index if not exists students_name_idx on public.students(full_name);

-- ---------- 4. Exams ---------------------------------------------------------
-- A single mock exam attempt — TYT or AYT.
create table if not exists public.exams (
  id            uuid primary key default uuid_generate_v4(),
  student_id    uuid references public.students(id) on delete cascade,
  exam_name     text not null,                       -- "Özdebir TYT 3"
  exam_type     text check (exam_type in ('TYT','AYT')) not null,
  taken_at      timestamptz default now(),
  total_net     numeric(6,2)                         -- denormalized for charts
);

create index if not exists exams_student_idx on public.exams(student_id);
create index if not exists exams_takenat_idx on public.exams(taken_at desc);

-- ---------- 5. Subject scores ------------------------------------------------
-- Per-subject result for one exam.
create table if not exists public.subject_scores (
  id            bigserial primary key,
  exam_id       uuid references public.exams(id) on delete cascade,
  subject       text not null,                       -- "Türkçe", "Matematik", "Fizik" ...
  correct       int default 0,
  wrong         int default 0,
  blank         int default 0,
  net           numeric(6,2) generated always as (correct - wrong * 0.25) stored
);

create index if not exists scores_exam_idx on public.subject_scores(exam_id);

-- ---------- 6. Topic errors --------------------------------------------------
-- Konu bazlı yanlışlar — AI koçun en çok değer kattığı tablo.
create table if not exists public.topic_errors (
  id            bigserial primary key,
  exam_id       uuid references public.exams(id) on delete cascade,
  student_id    uuid references public.students(id) on delete cascade,
  subject       text not null,
  topic         text not null,                       -- "Problemler", "Paragrafta Anlam"
  wrong_count   int default 1,
  importance    int default 5                        -- 1-10 YKS soru çıkma ağırlığı
);

create index if not exists topic_errors_student_idx on public.topic_errors(student_id);

-- ===========================================================================
-- Row Level Security (RLS)
-- ===========================================================================
-- For the hackathon we operate in single-user demo mode; RLS off keeps queries
-- simple. In prod, turn this on and add per-user policies tied to auth.uid().
alter table public.students       disable row level security;
alter table public.exams          disable row level security;
alter table public.subject_scores disable row level security;
alter table public.topic_errors   disable row level security;

-- ===========================================================================
-- Views: çalışma planına ham veri sağlayan analytic view'lar
-- ===========================================================================

-- Öğrencinin son 6 denemedeki net trendi
create or replace view public.v_student_trend as
select
  e.student_id,
  e.id            as exam_id,
  e.exam_name,
  e.exam_type,
  e.taken_at,
  e.total_net
from public.exams e
order by e.taken_at;

-- Öğrencinin ders dağılımı (en son deneme)
create or replace view public.v_student_subject_latest as
select
  ss.exam_id,
  e.student_id,
  ss.subject,
  ss.correct,
  ss.wrong,
  ss.blank,
  ss.net
from public.subject_scores ss
join public.exams e on e.id = ss.exam_id;

-- Öğrencinin en çok yanlış yaptığı konular (ağırlıklı skor)
create or replace view public.v_topic_weakness as
select
  te.student_id,
  te.subject,
  te.topic,
  sum(te.wrong_count)                         as total_wrong,
  sum(te.wrong_count * te.importance)         as weighted_score
from public.topic_errors te
group by te.student_id, te.subject, te.topic
order by weighted_score desc;
