-- Correctif PR 2 : une policy RLS ne suffit pas, il faut aussi le privilège
-- SELECT au niveau table pour que anon/authenticated puissent lire le catalogue.
grant select on public.games to anon, authenticated;
