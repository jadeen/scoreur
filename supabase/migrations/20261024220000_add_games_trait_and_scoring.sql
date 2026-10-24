-- Contenu éditorial par jeu (trait distinctif, résumé des règles de score) :
-- en base plutôt que dans le code, pour que l'ajout d'un jeu n'exige
-- jamais un déploiement front.
alter table games
  add column trait text,
  add column scoring_summary text;

update games set
  trait = 'annonces et plis',
  scoring_summary = 'Annonce exacte : 20 points + 10 par pli. Sinon −10 par pli d''écart. Le plus haut total gagne.'
where slug = 'wizard';

update games set
  trait = 'le plus bas gagne',
  scoring_summary = 'Les cartes restées en main valent 1 point chacune. Dès qu''un joueur atteint le seuil, le plus petit total gagne.'
where slug = 'odin';

update games set
  trait = 'quine, double quine, carton plein',
  scoring_summary = 'Trois paliers possibles : quine, double quine, carton plein. La partie est gagnée dès qu''un palier est atteint.'
where slug = 'bingo';
