<script setup lang="ts">
const props = defineProps<{
  modelValue: string
  placeholder: string
}>()
const emit = defineEmits<{
  'update:modelValue': [value: string]
  submit: []
}>()

const input = computed({
  get: () => props.modelValue,
  set: (value: string) => emit('update:modelValue', value)
})
</script>

<template>
  <form class="flex gap-2" @submit.prevent="emit('submit')">
    <input
      v-model="input"
      type="text"
      :placeholder="placeholder"
      class="w-full max-w-md rounded border border-slate-300 bg-white px-3 py-2 text-sm"
    />
    <button
      type="submit"
      class="rounded bg-slate-800 px-4 py-2 text-sm text-white hover:bg-slate-700"
    >
      検索
    </button>
  </form>
</template>
