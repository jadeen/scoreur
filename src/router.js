import { createRouter, createWebHashHistory } from "vue-router";
import Accueil from "./views/Accueil.vue";
import Catalogue from "./views/Catalogue.vue";
import Jeu from "./views/Jeu.vue";
import Joueurs from "./views/Joueurs.vue";

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
      path: "/joueurs",
      name: "joueurs",
      component: Joueurs,
      meta: { back: { to: "/", label: "Accueil" } },
    },
  ],
});
