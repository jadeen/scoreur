<script setup>
defineProps({
  modelValue: { type: Number, required: true },
});
const emit = defineEmits(["update:modelValue"]);
</script>

<template>
  <div class="step">
    <button type="button" aria-label="Moins" @click="emit('update:modelValue', modelValue - 1)">
      −
    </button>
    <output>{{ modelValue }}</output>
    <button type="button" aria-label="Plus" @click="emit('update:modelValue', modelValue + 1)">
      +
    </button>
  </div>
</template>
