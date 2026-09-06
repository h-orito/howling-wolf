<script setup lang="ts">
import type { VillagesResponse } from '#shared/types/admin'

useHead({ title: '村一覧' })

const route = useRoute()
const router = useRouter()
const initialQ = typeof route.query.q === 'string' ? route.query.q : ''
const input = ref(initialQ)
const keyword = ref(initialQ)

const { data, error, status } = await useFetch<VillagesResponse>(
  '/api/villages',
  { query: { q: keyword } }
)

const submit = () => {
  keyword.value = input.value.trim()
  router.replace({ query: keyword.value ? { q: keyword.value } : {} })
}
</script>

<template>
  <div class="space-y-4">
    <h1 class="text-2xl font-bold">村一覧</h1>
    <SearchForm v-model="input" placeholder="村ID / 村名" @submit="submit" />
    <ErrorAlert :error="error" />
    <p v-if="data" class="text-sm text-slate-600">
      {{ data.total }} 件中 {{ data.villages.length }} 件表示 (最大
      {{ data.limit }} 件)
    </p>
    <div class="overflow-x-auto rounded border border-slate-200 bg-white">
      <table class="w-full min-w-4xl text-sm">
        <thead class="bg-slate-50 text-left text-xs text-slate-600">
          <tr>
            <th class="px-3 py-2">村ID</th>
            <th class="px-3 py-2">村名</th>
            <th class="px-3 py-2">状態</th>
            <th class="px-3 py-2">村建て</th>
            <th class="px-3 py-2">参加人数</th>
            <th class="px-3 py-2">作成日時</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="status === 'pending'">
            <td colspan="6" class="px-3 py-4 text-center text-slate-500">
              読み込み中...
            </td>
          </tr>
          <tr v-else-if="data && data.villages.length === 0">
            <td colspan="6" class="px-3 py-4 text-center text-slate-500">
              該当する村がありません
            </td>
          </tr>
          <tr
            v-for="v in data?.villages ?? []"
            :key="v.villageId"
            class="border-t border-slate-100 hover:bg-slate-50"
          >
            <td class="px-3 py-2">
              <NuxtLink
                :to="`/villages/${v.villageId}`"
                class="text-blue-700 underline"
              >
                {{ v.villageId }}
              </NuxtLink>
            </td>
            <td class="px-3 py-2">
              <NuxtLink
                :to="`/villages/${v.villageId}`"
                class="text-blue-700 underline"
              >
                {{ v.villageDisplayName }}
              </NuxtLink>
            </td>
            <td class="px-3 py-2 whitespace-nowrap">
              {{ v.villageStatusName }}
            </td>
            <td class="px-3 py-2">
              <NuxtLink
                :to="`/players/${v.createPlayerId}`"
                class="text-blue-700 underline"
              >
                {{ v.createPlayerNickname }}
              </NuxtLink>
            </td>
            <td class="px-3 py-2 text-right">{{ v.participantCount }}</td>
            <td class="px-3 py-2 whitespace-nowrap">
              {{ v.registerDatetime }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
