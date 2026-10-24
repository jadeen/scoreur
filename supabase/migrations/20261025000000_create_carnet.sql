-- PR 5 : carnet de scores (joueurs, parties, scores par joueur)
-- Tables privées : chaque ligne appartient au compte qui l'a créée
-- (owner_id = auth.uid()), jamais visible par un autre compte ni par anon.

create table players (
  id bigserial primary key,
  owner_id uuid not null default auth.uid() references auth.users on delete cascade,
  name text not null,
  is_me boolean not null default false,
  created_at timestamptz not null default now()
);
create unique index players_owner_name_idx on players (owner_id, lower(name));

create table matches (
  id bigserial primary key,
  owner_id uuid not null default auth.uid() references auth.users on delete cascade,
  game_id int not null references games,
  played_at timestamptz not null default now(),
  notes text,
  details jsonb,
  details_format text,
  created_at timestamptz not null default now()
);

create table match_players (
  match_id bigint not null references matches on delete cascade,
  player_id bigint not null references players on delete cascade,
  score int,
  rank int,
  is_winner boolean not null default false,
  team text,
  primary key (match_id, player_id)
);

alter table players       enable row level security;
alter table matches       enable row level security;
alter table match_players enable row level security;

create policy "mon carnet" on players for all
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "mes parties" on matches for all
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "scores de mes parties" on match_players for all
  using (exists (select 1 from matches m where m.id = match_id and m.owner_id = auth.uid()))
  with check (
    exists (select 1 from matches m where m.id = match_id and m.owner_id = auth.uid())
    and exists (select 1 from players p where p.id = player_id and p.owner_id = auth.uid())
  );

-- Tables privées : seuls les comptes connectés y ont accès, jamais anon.
-- Une policy RLS ne suffit pas sans le privilège au niveau table.
grant select, insert, update, delete on public.players       to authenticated;
grant select, insert, update, delete on public.matches       to authenticated;
grant select, insert, update, delete on public.match_players to authenticated;

-- Les colonnes bigserial ont besoin d'un privilège explicite sur leur séquence.
grant usage, select on sequence players_id_seq to authenticated;
grant usage, select on sequence matches_id_seq to authenticated;
