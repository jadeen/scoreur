import './styles/global.css';

const app = document.getElementById('app');

app.innerHTML = `
  <div class="app">
    <div class="topbar">
      <a class="logo" href="/">Scoreur</a>
      <a class="btn sm" href="#">Se connecter</a>
    </div>
    <nav class="desktop-nav">
      <div class="desktop-nav__inner">
        <a class="logo" href="/">Scoreur</a>
        <a class="link on" href="#">Accueil</a>
        <a class="link" href="#">Jeux</a>
        <a class="link" href="#">Mes joueurs</a>
        <a class="link" href="#">Proposer un jeu</a>
      </div>
    </nav>
    <main class="main">
      <h1 class="h1">Le carnet de scores de vos soirées jeux</h1>
      <p class="muted">Notez chaque partie, voyez qui gagne le plus, et revoyez toutes les feuilles de score.</p>
      <div class="note">Catalogue, connexion et parties arrivent dans les prochaines étapes.</div>
    </main>
  </div>
`;
