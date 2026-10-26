<script setup>
defineProps({
  eyebrow: { type: String, default: "Erreur 404" },
  title: { type: String, required: true },
  message: { type: String, required: true },
  primaryLabel: { type: String, required: true },
  primaryTo: { type: String, required: true },
  secondaryLabel: { type: String, required: true },
  secondaryTo: { type: String, required: true },
});
</script>

<template>
  <div class="introuvable">
    <svg
      class="introuvable__illustration"
      viewBox="0 0 264 140"
      role="img"
      aria-label="Un pion tombé hors du plateau, à côté d'une case vide"
    >
      <rect
        x="8"
        y="40"
        width="56"
        height="56"
        rx="10"
        fill="var(--panel)"
        stroke="var(--panel-border)"
      />
      <rect
        x="72"
        y="40"
        width="56"
        height="56"
        rx="10"
        fill="var(--panel)"
        stroke="var(--panel-border)"
      />
      <rect
        x="136"
        y="40"
        width="56"
        height="56"
        rx="10"
        fill="none"
        stroke="var(--nav-inactive)"
        stroke-width="2"
        stroke-dasharray="6 5"
      />
      <g transform="translate(232 112) rotate(90) scale(0.8) translate(-50 -51)">
        <circle cx="50" cy="30" r="13" fill="var(--gold)" />
        <rect x="38" y="44" width="24" height="6" rx="3" fill="var(--gold)" />
        <path d="M42 50 C 41 62, 34 70, 30 78 L 70 78 C 66 70, 59 62, 58 50 Z" fill="var(--gold)" />
        <rect x="24" y="76" width="52" height="10" rx="5" fill="var(--gold)" />
      </g>
    </svg>
    <div class="introuvable__content">
      <span class="label">{{ eyebrow }}</span>
      <h1 class="h1">{{ title }}</h1>
      <p class="muted introuvable__message">{{ message }}</p>
      <div class="introuvable__actions">
        <router-link class="btn primary" :to="primaryTo">{{ primaryLabel }}</router-link>
        <router-link class="btn" :to="secondaryTo">{{ secondaryLabel }}</router-link>
      </div>
    </div>
  </div>
</template>
