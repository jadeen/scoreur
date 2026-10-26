import { createRouter, createWebHashHistory } from "vue-router";
import Accueil from "./views/Accueil.vue";
import Catalogue from "./views/Catalogue.vue";
import Compte from "./views/Compte.vue";
import Confidentialite from "./views/Confidentialite.vue";
import Historique from "./views/Historique.vue";
import Introuvable from "./components/Introuvable.vue";
import Jeu from "./views/Jeu.vue";
import Joueurs from "./views/Joueurs.vue";
import MentionsLegales from "./views/MentionsLegales.vue";
import NouvellePartie from "./views/NouvellePartie.vue";
import Partie from "./views/Partie.vue";
import { DEFAULT_TITLE } from "./lib/pageTitle";

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: "/", name: "accueil", component: Accueil },
    {
      path: "/jeux",
      name: "catalogue",
      component: Catalogue,
      meta: { back: { to: "/", label: "Accueil" }, title: "Jeux · Scoreur" },
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
      meta: { back: { to: "/", label: "Accueil" }, title: "Joueurs · Scoreur" },
    },
    {
      path: "/historique",
      name: "historique",
      component: Historique,
      meta: { back: { to: "/", label: "Accueil" }, title: "Historique · Scoreur" },
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
      meta: { back: { to: "/", label: "Accueil" }, title: "Mon compte · Scoreur" },
    },
    {
      path: "/mentions-legales",
      name: "mentions-legales",
      component: MentionsLegales,
      meta: { back: { to: "/compte", label: "Mon compte" }, title: "Mentions légales · Scoreur" },
    },
    {
      path: "/confidentialite",
      name: "confidentialite",
      component: Confidentialite,
      meta: { back: { to: "/compte", label: "Mon compte" }, title: "Confidentialité · Scoreur" },
    },
    {
      path: "/:pathMatch(.*)*",
      name: "introuvable",
      component: Introuvable,
      props: {
        title: "Hors du plateau",
        message: "Cette page n'existe pas, ou plus. Le lien est peut-être mal copié.",
        primaryLabel: "Retour à l'accueil",
        primaryTo: "/",
        secondaryLabel: "Voir les jeux",
        secondaryTo: "/jeux",
      },
    },
  ],
});

router.afterEach((to) => {
  document.title = to.meta.title ?? DEFAULT_TITLE;
});
