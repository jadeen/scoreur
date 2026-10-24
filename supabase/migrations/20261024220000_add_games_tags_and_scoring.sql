-- Contenu éditorial par jeu (tags affichés et filtrables, résumé des
-- règles de score) : en base plutôt que dans le code, pour que l'ajout
-- d'un jeu ou d'un filtre n'exige jamais un déploiement front.
alter table games
  add column tags text[] not null default '{}',
  add column scoring_summary text;

update games set
  tags = array['solo', 'quine', 'double quine', 'carton plein'],
  scoring_summary = 'Trois paliers possibles : quine, double quine, carton plein. La partie est gagnée dès qu''un palier est atteint.'
where slug = 'bingo';

update games set
  tags = array['par manches', 'le plus bas gagne'],
  scoring_summary = 'Les cartes restées en main valent 1 point chacune. Dès qu''un joueur atteint le seuil, le plus petit total gagne.'
where slug = 'odin';

update games set
  tags = array['par manches', 'annonces et plis'],
  scoring_summary = 'Annonce exacte : 20 points + 10 par pli. Sinon −10 par pli d''écart. Le plus haut total gagne.'
where slug = 'wizard';
