-- PR 2 : catalogue de jeux
-- Table publique en lecture, alimentée uniquement par migration.

create table games (
  id serial primary key,
  slug text not null unique,
  name text not null,
  description text,
  players_min int,
  players_max int,
  sheet text not null default 'generique',
  lower_wins boolean not null default false,
  created_at timestamptz not null default now()
);

alter table games enable row level security;

create policy "catalogue public" on games for select using (true);

insert into games (slug, name, description, players_min, players_max, sheet, lower_wins) values
  ('wizard', 'Wizard', 'Jeu de plis et d''annonces, par manches, de 3 à 6 joueurs.', 3, 6, 'wizard-v1', false),
  ('odin', 'Odin', 'Jeu de cartes où l''on tente de se débarrasser de sa main, de 2 à 6 joueurs.', 2, 6, 'odin-v1', true),
  ('bingo', 'Bingo', 'Loto à la française, en solo, un carton par soirée.', 1, 1, 'bingo-v1', false);
