<script setup lang="ts">
import type { StatusResponse } from '#shared/types/admin'

useHead({ title: 'ホーム' })
const { data: status, error } = await useFetch<StatusResponse>('/api/status')
</script>

<template>
  <div class="space-y-6">
    <h1 class="text-2xl font-bold">ホーム</h1>
    <ErrorAlert :error="error" />
    <section v-if="status" class="grid gap-4 md:grid-cols-2">
      <div class="rounded border border-slate-200 bg-white p-4">
        <h2 class="mb-2 font-bold">DB 接続</h2>
        <p>
          <FlagBadge
            :label="status.db.ok ? '接続OK' : '接続エラー'"
            :tone="status.db.ok ? 'blue' : 'red'"
          />
        </p>
        <p class="mt-2 font-mono text-sm break-all">{{ status.db.target }}</p>
        <p v-if="!status.db.ok" class="mt-2 text-sm break-all text-red-700">
          {{ status.db.message }}
        </p>
      </div>
      <div class="rounded border border-slate-200 bg-white p-4">
        <h2 class="mb-2 font-bold">Firebase Admin SDK</h2>
        <p>
          <FlagBadge
            :label="status.firebase.configured ? '設定済み' : '未設定'"
            :tone="status.firebase.configured ? 'blue' : 'yellow'"
          />
        </p>
        <p class="mt-2 text-sm break-all">{{ status.firebase.message }}</p>
      </div>
    </section>
    <section class="grid gap-4 md:grid-cols-2">
      <NuxtLink
        to="/players"
        class="block rounded border border-slate-200 bg-white p-4 hover:bg-slate-50"
      >
        <h2 class="font-bold">プレイヤー</h2>
        <p class="text-sm text-slate-600">
          uid / ニックネーム / Firebase アカウント / 参加した村
        </p>
      </NuxtLink>
      <NuxtLink
        to="/villages"
        class="block rounded border border-slate-200 bg-white p-4 hover:bg-slate-50"
      >
        <h2 class="font-bold">村</h2>
        <p class="text-sm text-slate-600">
          参加者一覧 (キャラクター / 役職 / IP アドレス / クライアントトークン)
        </p>
      </NuxtLink>
    </section>
  </div>
</template>
