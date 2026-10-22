-- Общий рейтинг «Мага Хаоса» для Supabase (бесплатный тариф).
-- Выполнить один раз: Supabase → SQL Editor → вставить весь файл → Run.
-- Прямого доступа к таблице у игры нет (RLS без правил) — только через три функции ниже.

create table if not exists public.scores (
  id         uuid primary key,
  secret     uuid not null,
  name       text not null,
  score      integer not null default 0,
  kills      integer not null default 0,
  level      integer not null default 0,
  runs       integer not null default 0,
  updated_at timestamptz not null default now()
);
alter table public.scores enable row level security;
create index if not exists scores_score_idx on public.scores (score desc);

-- записать рекорд: значения только растут, чужую запись (другой secret) не изменить
create or replace function public.submit_score(p_id uuid, p_secret uuid, p_name text, p_score integer, p_kills integer, p_level integer, p_runs integer)
returns void language plpgsql security definer set search_path = public as $$
declare n text := left(btrim(regexp_replace(coalesce(p_name, ''), '\s+', ' ', 'g')), 16);
begin
  if n = '' then n := 'Маг'; end if;
  if p_score not between 0 and 50000000 or p_kills not between 0 and 1000000 or p_level not between 0 and 1000 or p_runs not between 0 and 1000 then
    raise exception 'bad values';
  end if;
  insert into scores as s (id, secret, name, score, kills, level, runs)
  values (p_id, p_secret, n, p_score, p_kills, p_level, p_runs)
  on conflict (id) do update set
    name = excluded.name,
    score = greatest(s.score, excluded.score),
    kills = greatest(s.kills, excluded.kills),
    level = greatest(s.level, excluded.level),
    runs = s.runs + excluded.runs,
    updated_at = now()
  where s.secret = excluded.secret;
end $$;

-- лучшие игроки
create or replace function public.top_scores(lim integer default 50)
returns table (id uuid, name text, score integer, kills integer, level integer, runs integer)
language sql stable security definer set search_path = public as $$
  select id, name, score, kills, level, runs from scores
  order by score desc, updated_at asc limit least(greatest(lim, 1), 100);
$$;

-- место игрока, даже если он не попал в топ
create or replace function public.my_rank(p_id uuid)
returns bigint language sql stable security definer set search_path = public as $$
  select case when exists (select 1 from scores where id = p_id)
    then (select count(*) + 1 from scores where score > (select score from scores where id = p_id)) end;
$$;

grant execute on function public.submit_score(uuid, uuid, text, integer, integer, integer, integer) to anon;
grant execute on function public.top_scores(integer) to anon;
grant execute on function public.my_rank(uuid) to anon;
