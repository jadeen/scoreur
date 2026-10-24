-- PR 5 : save_match crée une partie et les scores de ses joueurs en une
-- seule transaction. security invoker (par défaut) : la RLS s'applique
-- avec les droits de l'appelant, pas de contournement.
--
-- p_players : tableau jsonb d'objets { player_id, score, rank, is_winner, team }
-- ex. [{"player_id": 12, "score": 45, "rank": 1, "is_winner": true}]
create function save_match(
  p_game_id int,
  p_players jsonb,
  p_played_at timestamptz default now(),
  p_notes text default null,
  p_details jsonb default null,
  p_details_format text default null
)
returns bigint
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_match_id bigint;
begin
  insert into matches (owner_id, game_id, played_at, notes, details, details_format)
  values (auth.uid(), p_game_id, p_played_at, p_notes, p_details, p_details_format)
  returning id into v_match_id;

  insert into match_players (match_id, player_id, score, rank, is_winner, team)
  select
    v_match_id,
    (player ->> 'player_id')::bigint,
    (player ->> 'score')::int,
    (player ->> 'rank')::int,
    coalesce((player ->> 'is_winner')::boolean, false),
    player ->> 'team'
  from jsonb_array_elements(p_players) as player;

  return v_match_id;
end;
$$;

grant execute on function save_match(int, jsonb, timestamptz, text, jsonb, text) to authenticated;
