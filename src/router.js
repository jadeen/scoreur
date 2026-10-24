import { createRouter, createWebHashHistory } from "vue-router";
import Accueil from "./views/Accueil.vue";
import Catalogue from "./views/Catalogue.vue";
import Jeu from "./views/Jeu.vue";

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: "/", name: "accueil", component: Accueil },
    { path: "/jeux", name: "catalogue", component: Catalogue },
    { path: "/jeu/:slug", name: "jeu", component: Jeu, props: true },
  ],
});
