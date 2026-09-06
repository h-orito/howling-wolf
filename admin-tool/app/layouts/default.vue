<script setup lang="ts">
const links = [
  { to: '/', label: 'ホーム' },
  { to: '/players', label: 'プレイヤー' },
  { to: '/villages', label: '村' }
]
</script>

<template>
  <div class="min-h-screen">
    <header class="bg-slate-800 text-white">
      <div class="mx-auto flex max-w-7xl items-center gap-6 px-4 py-3">
        <NuxtLink to="/" class="text-lg font-bold">
          HOWLING WOLF 管理ツール
        </NuxtLink>
        <nav class="flex gap-4 text-sm whitespace-nowrap">
          <NuxtLink
            v-for="link in links"
            :key="link.to"
            :to="link.to"
            class="rounded px-2 py-1 hover:bg-slate-700"
            active-class="bg-slate-600"
          >
            {{ link.label }}
          </NuxtLink>
        </nav>
      </div>
    </header>
    <main class="mx-auto max-w-7xl px-4 py-6">
      <slot />
    </main>
  </div>
</template>
