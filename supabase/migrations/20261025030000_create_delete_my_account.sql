-- PR 16 : un compte peut se supprimer lui-même. La ligne auth.users est le
-- point d'ancrage de toutes les données privées (players.owner_id,
-- matches.owner_id, et demain game_submissions.submitted_by référencent
-- auth.users on delete cascade, cf. create_carnet.sql) : la supprimer suffit
-- à effacer en cascade le carnet, les parties et les propositions.
--
-- security definer car authenticated n'a pas le droit de delete sur
-- auth.users ; search_path vidé et identifiants qualifiés pour éviter
-- toute capture de recherche de schéma.
create function delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from auth.users where id = auth.uid();
end;
$$;

grant execute on function public.delete_my_account() to authenticated;
