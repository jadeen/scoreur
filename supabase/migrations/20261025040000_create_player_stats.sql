-- Issue #33 : total de parties et de victoires par joueur, tous jeux
-- confondus, affiché sur « Mes joueurs » (player_game_stats, PR 9, est par
-- jeu). security_invoker : même raison que player_game_stats, sinon la vue
-- s'exécuterait avec les droits de postgres et contournerait la RLS de
-- match_players.
create view player_stats
with (security_invoker = true) as
select
  player_id,
  count(*) as parties,
  count(*) filter (where is_winner) as victoires
from match_players
where score is not null
group by player_id;

-- Vue privée (le carnet qu'elle agrège l'est) : jamais exposée à anon.
grant select on player_stats to authenticated;
