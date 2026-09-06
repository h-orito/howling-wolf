<script setup lang="ts">
import type { NuxtError } from '#app'

defineProps<{
  error: NuxtError | null | undefined
}>()
</script>

<template>
  <div
    v-if="error"
    class="rounded border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800"
  >
    <p class="font-bold">エラー ({{ error.statusCode }})</p>
    <p class="break-all">{{ error.statusMessage || error.message }}</p>
  </div>
</template>
