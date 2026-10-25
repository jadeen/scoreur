-- Couleur de jeu : en base plutôt que dans lib/gameColors.js, pour que
-- l'ajout d'un jeu n'exige jamais un déploiement front (voir #43).
alter table games add column color text;

update games set color = '#2f4b8f' where slug = 'wizard';
update games set color = '#2c7fa3' where slug = 'odin';
update games set color = '#c8572f' where slug = 'bingo';

alter table games alter column color set not null;
