<script setup>
defineProps({
  players: { type: Array, required: true },
  rows: { type: Array, required: true },
});
</script>

<template>
  <div v-if="rows.length" class="scroll">
    <table class="manches-table">
      <thead>
        <tr>
          <th>Manche</th>
          <th v-for="player in players" :key="player.id">{{ player.name }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in rows" :key="row.label">
          <td>{{ row.label }}</td>
          <td v-for="(cell, index) in row.cells" :key="index" :class="{ neg: cell.negative }">
            <span class="tot">{{ cell.value }}</span>
            <small v-if="cell.detail">{{ cell.detail }}</small>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
  <p v-else class="muted empty">Les scores de chaque manche s'afficheront ici.</p>
</template>
