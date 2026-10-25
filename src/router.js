import { createRouter, createWebHashHistory } from "vue-router";
import Accueil from "./views/Accueil.vue";
import Catalogue from "./views/Catalogue.vue";
import Compte from "./views/Compte.vue";
import Confidentialite from "./views/Confidentialite.vue";
import Historique from "./views/Historique.vue";
import Jeu from "./views/Jeu.vue";
import Joueurs from "./views/Joueurs.vue";
import MentionsLegales from "./views/MentionsLegales.vue";
import NouvellePartie from "./views/NouvellePartie.vue";
import Partie from "./views/Partie.vue";

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: "/", name: "accueil", component: Accueil },
    {
      path: "/jeux",
      name: "catalogue",
      component: Catalogue,
      meta: { back: { to: "/", label: "Accueil" } },
    },
    {
      path: "/jeu/:slug",
      name: "jeu",
      component: Jeu,
      props: true,
      meta: { back: { to: "/jeux", label: "Jeux" } },
    },
    {
      path: "/jeu/:slug/partie",
      name: "nouvelle-partie",
      component: NouvellePartie,
      props: true,
    },
    {
      path: "/joueurs",
      name: "joueurs",
      component: Joueurs,
      meta: { back: { to: "/", label: "Accueil" } },
    },
    {
      path: "/historique",
      name: "historique",
      component: Historique,
      meta: { back: { to: "/", label: "Accueil" } },
    },
    {
      path: "/partie/:id",
      name: "partie",
      component: Partie,
      props: true,
      meta: { back: { to: "/historique", label: "Historique" } },
    },
    {
      path: "/compte",
      name: "compte",
      component: Compte,
      meta: { back: { to: "/", label: "Accueil" } },
    },
    {
      path: "/mentions-legales",
      name: "mentions-legales",
      component: MentionsLegales,
      meta: { back: { to: "/compte", label: "Mon compte" } },
    },
    {
      path: "/confidentialite",
      name: "confidentialite",
      component: Confidentialite,
      meta: { back: { to: "/compte", label: "Mon compte" } },
    },
  ],
});
