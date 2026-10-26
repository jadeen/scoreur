<script setup>
defineProps({
  name: { type: String, required: true },
  color: { type: String, required: true },
});
</script>

<template>
  <div class="vignette-jeu" :style="{ background: color }" aria-hidden="true">
    {{ name.charAt(0).toUpperCase() }}
  </div>
</template>
