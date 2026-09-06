<script setup lang="ts">
import type { AccessInfo, VillageDetailResponse } from '#shared/types/admin'

const route = useRoute()
const id = computed(() => String(route.params.id))

const { data, error } = await useFetch<VillageDetailResponse>(
  () => `/api/villages/${id.value}`
)

useHead({
  title: computed(() =>
    data.value ? `村: ${data.value.village.villageDisplayName}` : '村詳細'
  )
})

/** 複数参加者に出現する IP / トークン (値単位で赤字にするため) */
const duplicatedValues = (pick: (a: AccessInfo) => string | null) =>
  computed(() => {
    const owners = new Map<string, Set<number>>()
    for (const p of data.value?.participants ?? []) {
      for (const a of p.accessInfos) {
        const value = pick(a)
        if (!value) continue
        const set = owners.get(value) ?? new Set<number>()
        set.add(p.villagePlayerId)
        owners.set(value, set)
      }
    }
    return new Set(
      [...owners.entries()].filter(([, ids]) => ids.size > 1).map(([v]) => v)
    )
  })
const duplicatedIps = duplicatedValues((a) => a.ipAddress)
const duplicatedTokens = duplicatedValues((a) => a.clientToken)

const charaNameOf = (villagePlayerId: number): string =>
  data.value?.participants.find((p) => p.villagePlayerId === villagePlayerId)
    ?.charaName ?? String(villagePlayerId)
</script>

<template>
  <div class="space-y-6">
    <p class="text-sm">
      <NuxtLink to="/villages" class="text-blue-700 underline">
        ← 村一覧
      </NuxtLink>
    </p>
    <ErrorAlert :error="error" />
    <template v-if="data">
      <h1 class="text-2xl font-bold">
        {{ data.village.villageDisplayName }}
        <span class="text-base font-normal text-slate-500">
          (village_id: {{ data.village.villageId }})
        </span>
      </h1>
      <dl class="grid gap-x-6 gap-y-1 text-sm md:grid-cols-[8rem_1fr]">
        <dt class="text-slate-500">状態</dt>
        <dd>{{ data.village.villageStatusName }}</dd>
        <dt class="text-slate-500">村建て</dt>
        <dd>
          <NuxtLink
            :to="`/players/${data.village.createPlayerId}`"
            class="text-blue-700 underline"
          >
            {{ data.village.createPlayerNickname }}
          </NuxtLink>
        </dd>
        <dt class="text-slate-500">参加人数</dt>
        <dd>{{ data.village.participantCount }} (見学者を除く)</dd>
        <dt class="text-slate-500">作成日時</dt>
        <dd>{{ data.village.registerDatetime }}</dd>
      </dl>

      <section class="space-y-2">
        <h2 class="font-bold">
          参加者一覧
          <span class="text-sm font-normal text-slate-500">
            ({{ data.participants.length }} 件、退村済みは除く)
          </span>
        </h2>
        <p class="text-xs text-slate-600">
          IP / トークンが他の参加者と重複している行は赤字で表示します。
        </p>
        <div class="overflow-x-auto rounded border border-slate-200 bg-white">
          <table class="w-full min-w-4xl text-sm">
            <thead class="bg-slate-50 text-left text-xs text-slate-600">
              <tr>
                <th class="px-3 py-2">キャラクター</th>
                <th class="px-3 py-2">役職</th>
                <th class="px-3 py-2">プレイヤー</th>
                <th class="px-3 py-2">uid</th>
                <th class="px-3 py-2">IP アドレス</th>
                <th class="px-3 py-2">クライアントトークン</th>
                <th class="px-3 py-2">IP / トークン登録日時</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="data.participants.length === 0">
                <td colspan="7" class="px-3 py-4 text-center text-slate-500">
                  参加者がいません
                </td>
              </tr>
              <template v-for="p in data.participants" :key="p.villagePlayerId">
                <tr
                  v-for="(a, index) in p.accessInfos.length > 0
                    ? p.accessInfos
                    : [null]"
                  :key="a?.villagePlayerAccessInfoId ?? 'none'"
                  class="border-t border-slate-100"
                  :class="{ 'border-t-2 border-slate-300': index === 0 }"
                >
                  <template v-if="index === 0">
                    <td
                      :rowspan="Math.max(p.accessInfos.length, 1)"
                      class="px-3 py-2 align-top"
                    >
                      <div>{{ p.charaName }}</div>
                      <div class="mt-1 space-x-1">
                        <FlagBadge
                          v-if="p.isSpectator"
                          label="見学"
                          tone="blue"
                        />
                        <FlagBadge v-if="p.isDead" label="死亡" tone="red" />
                      </div>
                    </td>
                    <td
                      :rowspan="Math.max(p.accessInfos.length, 1)"
                      class="px-3 py-2 align-top whitespace-nowrap"
                    >
                      <div>{{ p.skillName ?? '-' }}</div>
                      <div
                        v-if="p.requestSkillCode"
                        class="text-xs text-slate-500"
                      >
                        希望: {{ p.requestSkillCode }}
                      </div>
                    </td>
                    <td
                      :rowspan="Math.max(p.accessInfos.length, 1)"
                      class="px-3 py-2 align-top"
                    >
                      <NuxtLink
                        :to="`/players/${p.playerId}`"
                        class="text-blue-700 underline"
                      >
                        {{ p.nickname }}
                      </NuxtLink>
                      <div class="text-xs text-slate-500">
                        player_id: {{ p.playerId }}
                        <span v-if="p.twitterUserName">
                          / @{{ p.twitterUserName }}
                        </span>
                      </div>
                      <div
                        v-if="p.sameIpParticipantIds.length > 0"
                        class="mt-1 text-xs text-red-700"
                      >
                        IP 重複:
                        {{ p.sameIpParticipantIds.map(charaNameOf).join(', ') }}
                      </div>
                      <div
                        v-if="p.sameTokenParticipantIds.length > 0"
                        class="mt-1 text-xs text-red-700"
                      >
                        トークン重複:
                        {{
                          p.sameTokenParticipantIds.map(charaNameOf).join(', ')
                        }}
                      </div>
                    </td>
                    <td
                      :rowspan="Math.max(p.accessInfos.length, 1)"
                      class="px-3 py-2 align-top font-mono text-xs break-all"
                    >
                      {{ p.uid }}
                    </td>
                  </template>
                  <template v-if="a">
                    <td
                      class="px-3 py-2 font-mono text-xs whitespace-nowrap"
                      :class="{
                        'font-bold text-red-700': duplicatedIps.has(a.ipAddress)
                      }"
                    >
                      {{ a.ipAddress }}
                    </td>
                    <td
                      class="px-3 py-2 font-mono text-xs break-all"
                      :class="{
                        'font-bold text-red-700':
                          a.clientToken !== null &&
                          duplicatedTokens.has(a.clientToken)
                      }"
                    >
                      {{ a.clientToken ?? '-' }}
                    </td>
                    <td class="px-3 py-2 text-xs whitespace-nowrap">
                      <div>登録: {{ a.registerDatetime }}</div>
                      <div
                        v-if="a.updateDatetime !== a.registerDatetime"
                        class="text-slate-500"
                      >
                        更新: {{ a.updateDatetime }}
                      </div>
                    </td>
                  </template>
                  <td
                    v-else
                    colspan="3"
                    class="px-3 py-2 text-xs text-slate-500"
                  >
                    アクセス情報なし
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </section>
    </template>
  </div>
</template>
