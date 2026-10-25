<script setup>
defineProps({
  card: { type: Array, required: true },
  tirage: { type: Array, default: () => [] },
});
</script>

<template>
  <div class="carton">
    <div v-for="(row, r) in card" :key="r" class="carton-row">
      <div
        v-for="(cell, c) in row"
        :key="c"
        class="carton-cell"
        :class="{ blank: !cell, hit: cell && tirage.includes(cell) }"
      >
        {{ cell || "" }}
      </div>
    </div>
  </div>
</template>
