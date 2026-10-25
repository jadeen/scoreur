-- PR 9 : vue de statistiques par joueur et par jeu (parties, victoires,
-- record, moyenne), affichée sur la page de chaque jeu.
--
-- security_invoker : sans cette option la vue s'exécute avec les droits de
-- son propriétaire (postgres, qui contourne la RLS) et renverrait les
-- parties de tous les comptes, pas seulement celles de l'utilisateur
-- connecté. Avec security_invoker, les policies de matches/match_players/
-- players s'appliquent normalement selon le rôle appelant.
create view player_game_stats
with (security_invoker = true) as
select
  m.game_id,
  mp.player_id,
  p.name as player_name,
  count(*) as parties,
  count(*) filter (where mp.is_winner) as victoires,
  case when g.lower_wins then min(mp.score) else max(mp.score) end as record,
  round(avg(mp.score))::int as moyenne
from match_players mp
join matches m on m.id = mp.match_id
join games g on g.id = m.game_id
join players p on p.id = mp.player_id
where mp.score is not null
group by m.game_id, mp.player_id, p.name, g.lower_wins;

-- Vue privée (le carnet qu'elle agrège l'est) : jamais exposée à anon.
grant select on player_game_stats to authenticated;
