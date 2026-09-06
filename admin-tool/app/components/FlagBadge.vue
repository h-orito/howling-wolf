<script setup lang="ts">
defineProps<{
  label: string
  tone?: 'red' | 'yellow' | 'gray' | 'blue'
}>()
</script>

<template>
  <span
    class="inline-block rounded px-1.5 py-0.5 text-xs font-bold"
    :class="{
      'bg-red-100 text-red-800': tone === 'red',
      'bg-yellow-100 text-yellow-800': tone === 'yellow',
      'bg-blue-100 text-blue-800': tone === 'blue',
      'bg-slate-200 text-slate-700': !tone || tone === 'gray'
    }"
  >
    {{ label }}
  </span>
</template>
