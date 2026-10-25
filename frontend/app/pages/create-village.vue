<template>
  <section class="bg-gray-50 py-8">
    <div class="container mx-auto max-w-3xl px-4">
      <!-- 予約村一覧 -->
      <h1 class="mb-4 text-xl font-semibold">予約村</h1>
      <div class="mb-8 text-sm">
        <LoadingSpinner
          v-if="loadingReserved"
          message="予約村を読み込み中..."
        />

        <div
          v-else-if="reservedVillages.length > 0"
          class="overflow-hidden rounded-lg bg-white shadow"
        >
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th
                  class="px-3 py-3 text-left text-sm font-semibold text-gray-900"
                >
                  開始日時
                </th>
                <th
                  class="px-3 py-3 text-left text-sm font-semibold text-gray-900"
                >
                  編成
                </th>
                <th
                  class="px-3 py-3 text-left text-sm font-semibold text-gray-900"
                >
                  沈黙時間
                </th>
                <th
                  class="px-3 py-3 text-left text-sm font-semibold text-gray-900"
                >
                  ダミー役欠け
                </th>
                <th
                  class="px-3 py-3 text-left text-sm font-semibold text-gray-900"
                >
                  初心者村
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 bg-white">
              <tr v-for="(rv, idx) in reservedVillages" :key="idx">
                <td class="px-3 py-2 text-sm whitespace-nowrap text-gray-900">
                  {{ formatLocalTime(rv.start_time) }}
                </td>
                <td class="px-3 py-2 text-sm text-gray-900">
                  {{ rv.organization }}
                </td>
                <td class="px-3 py-2 text-sm whitespace-nowrap text-gray-900">
                  {{ rv.silent_hours }}時間
                </td>
                <td class="px-3 py-2 text-sm whitespace-nowrap text-gray-900">
                  {{ rv.available_dummy_skill ? 'あり' : 'なし' }}
                </td>
                <td class="px-3 py-2 text-sm whitespace-nowrap text-gray-900">
                  {{ rv.for_beginner ? 'はい' : 'いいえ' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-else class="rounded-lg bg-white p-6 shadow">
          <p class="text-center text-gray-500">予約村がありません</p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { ReservedVillagesView, ReservedVillageView } from '~/lib/api/types'

const { apiCall } = useApi()

const reservedVillages = ref<ReservedVillageView[]>([])
const loadingReserved = ref(true)

const formatLocalTime = (t: { hour?: number; minute?: number }): string => {
  return `${String(t.hour ?? 0).padStart(2, '0')}:${String(t.minute ?? 0).padStart(2, '0')}`
}

const loadReservedVillages = async () => {
  loadingReserved.value = true
  try {
    const response = await apiCall<ReservedVillagesView>(
      '/reserved-village/list'
    )
    reservedVillages.value = response.list ?? []
  } catch {
    console.error('予約村の取得に失敗しました')
  } finally {
    loadingReserved.value = false
  }
}

onMounted(() => {
  loadReservedVillages()
})

useSeoMeta({
  title: '予約村 | HOWLING WOLF',
  description: 'HOWLING WOLFの予約村一覧です。'
})
</script>
