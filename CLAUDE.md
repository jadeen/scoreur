# Scoreur.fr

Site public de suivi des scores de jeux de plateau. N'importe qui peut enregistrer ses parties à partir d'une liste de jeux.

## Stack
- **Front** : site statique hébergé sur GitHub Pages.
- **Back** : Supabase uniquement (base, auth, stockage), sans API maison.
- **Auth** : connexion Google, réservée à la personne qui enregistre la partie. Les joueurs n'ont pas de compte et sont de simples noms.

## Modèle métier
- **Catalogue de jeux dynamique** : chaque jeu a sa propre page et son mode de calcul des scores.
- **Seules les parties terminées sont sauvegardées**, jamais de partie en cours.
- On stocke un **score final par joueur**, plus le **détail de la partie** (manches, etc.) dans une colonne dédiée, pour pouvoir revoir la partie plus tard. Pas de limite de taille pour l'instant.
- **Jeux de référence** pour les modes de score :
  - **Odin** et **Wizard** : multijoueurs, score par manches.
  - **Bingo** : traité comme un jeu **solo**. Un tirage par soirée, trois paliers de gain, un carton par joueur. On enregistre seulement si l'utilisateur a gagné.
- **Soumission de jeux** : les utilisateurs peuvent proposer un jeu, qui va dans une table de soumissions. Une GitHub Action crée une issue par jeu soumis, et c'est le mainteneur qui décide de l'ajout.

## Design
- Ambiance jeu de plateau. Direction validée : **« A · Tapis de jeu »** : feutrine verte `#17473A`, accent or `#F3C969`, cartes papier `#FBF8F0`, jetons de poker pour les scores. Polices : Archivo Black pour les titres et les chiffres, Work Sans pour le texte.
- Les feuilles de score de chaque jeu doivent suivre le design global de l'app. Les composants sont partagés (classement, stepper, tableau des manches, bandeau de fin), seul le carton du Bingo est spécifique.
- **Mobile-first** (390 px), mais l'app doit aussi bien fonctionner sur desktop (1280 px). Une colonne sous 768 px, deux colonnes et une nav horizontale à partir de 1024 px.

## Contexte local : `.memories/` (à lire avant de coder)
Le dossier `.memories/` contient le contexte de conception du projet. Il est **ignoré par git** (voir `.gitignore`) : il reste sur la machine locale et n'est jamais commité ni poussé. Il ne faut donc pas le référencer depuis le code, ni le retirer du `.gitignore`. Une session qui clone le dépôt depuis GitHub ne l'aura pas.

- `.memories/ARCHITECTURE.md` : schéma SQL et RLS, formats `details` (`wizard-v1`, `odin-v1`, `bingo-v1`), règles de score, flux, configuration, **plan des 18 PR**. À tenir à jour quand la structure change.
- `.memories/design/README.md` : tokens complets (couleurs, typo, formes) et index des écrans.
- `.memories/design/wireframes/` : tous les écrans, en mobile et en `desktop/`. `.memories/design/ambiance/` : écrans de référence de l'ambiance. Ce sont des exports `.dc.html` à lire comme du HTML/CSS de référence (ils ne s'affichent pas seuls).
- `.memories/reference/` : prototypes fonctionnels des feuilles Wizard, Odin et Bingo, qui servent de base pour la logique. Leur style est à remplacer par le Tapis de jeu.

## Sécurité (dépôt public)
- Ne **jamais** commiter de secret, ni dans le code, ni dans les workflows, ni dans ce fichier.
- **Clé `service_role` Supabase** : interdite dans le dépôt comme dans le front, car elle contourne la RLS.
- **Clé `anon` et URL Supabase** : elles sont publiques par conception et peuvent aller dans le front. La sécurité repose sur la **RLS, activée sur chaque table** avec des policies explicites. Toute nouvelle table arrive avec sa RLS dans la même PR.
- **GitHub Actions** : les secrets passent par les *Secrets* du dépôt (`${{ secrets.X }}`), jamais en clair.
- **`.env`** et autres fichiers de config locale : dans le `.gitignore`.
- Avant chaque commit, vérifier le diff pour repérer toute clé, tout token ou toute donnée personnelle.

## Façon de travailler
- On discute et on finalise le design **avant** de modifier le code ou de créer des tickets.
- **Issues et PR courtes** : moins d'une minute de lecture.
- Pas de captures d'écran dans les PR : toute PR qui touche l'UI est testée localement (`npm run dev`) avant d'être ouverte.
- Montrer le contenu d'une issue ou d'une PR avant de la publier, car le dépôt est public.
