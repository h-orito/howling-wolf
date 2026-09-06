<script setup lang="ts">
import type { PlayersResponse } from '#shared/types/admin'

useHead({ title: 'プレイヤー一覧' })

const route = useRoute()
const router = useRouter()
const initialQ = typeof route.query.q === 'string' ? route.query.q : ''
const input = ref(initialQ)
const keyword = ref(initialQ)

const { data, error, status } = await useFetch<PlayersResponse>(
  '/api/players',
  { query: { q: keyword } }
)

const submit = () => {
  keyword.value = input.value.trim()
  router.replace({ query: keyword.value ? { q: keyword.value } : {} })
}
</script>

<template>
  <div class="space-y-4">
    <h1 class="text-2xl font-bold">プレイヤー一覧</h1>
    <SearchForm
      v-model="input"
      placeholder="player_id / uid / ニックネーム / Twitter ユーザー名"
      @submit="submit"
    />
    <ErrorAlert :error="error" />
    <p v-if="data" class="text-sm text-slate-600">
      {{ data.total }} 件中 {{ data.players.length }} 件表示 (最大
      {{ data.limit }} 件)
    </p>
    <div class="overflow-x-auto rounded border border-slate-200 bg-white">
      <table class="w-full min-w-4xl text-sm">
        <thead class="bg-slate-50 text-left text-xs text-slate-600">
          <tr>
            <th class="px-3 py-2">ID</th>
            <th class="px-3 py-2">ニックネーム</th>
            <th class="px-3 py-2">uid</th>
            <th class="px-3 py-2">Twitter</th>
            <th class="px-3 py-2">権限</th>
            <th class="px-3 py-2">参加村数</th>
            <th class="px-3 py-2">登録日時</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="status === 'pending'">
            <td colspan="7" class="px-3 py-4 text-center text-slate-500">
              読み込み中...
            </td>
          </tr>
          <tr v-else-if="data && data.players.length === 0">
            <td colspan="7" class="px-3 py-4 text-center text-slate-500">
              該当するプレイヤーがいません
            </td>
          </tr>
          <tr
            v-for="p in data?.players ?? []"
            :key="p.playerId"
            class="border-t border-slate-100 hover:bg-slate-50"
          >
            <td class="px-3 py-2">
              <NuxtLink
                :to="`/players/${p.playerId}`"
                class="text-blue-700 underline"
              >
                {{ p.playerId }}
              </NuxtLink>
            </td>
            <td class="px-3 py-2">
              <NuxtLink
                :to="`/players/${p.playerId}`"
                class="text-blue-700 underline"
              >
                {{ p.nickname }}
              </NuxtLink>
              <FlagBadge
                v-if="p.isRestrictedParticipation"
                label="入村制限"
                tone="red"
                class="ml-1"
              />
            </td>
            <td class="px-3 py-2 font-mono text-xs break-all">{{ p.uid }}</td>
            <td class="px-3 py-2">{{ p.twitterUserName ?? '-' }}</td>
            <td class="px-3 py-2">{{ p.authorityCode }}</td>
            <td class="px-3 py-2 text-right">{{ p.villageCount }}</td>
            <td class="px-3 py-2 whitespace-nowrap">
              {{ p.registerDatetime }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
