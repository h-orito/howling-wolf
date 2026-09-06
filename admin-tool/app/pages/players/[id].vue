<script setup lang="ts">
import type {
  PlayerDetailResponse,
  UpdateRestrictedParticipationBody,
  UpdateRestrictedParticipationResponse
} from '#shared/types/admin'

const route = useRoute()
const id = computed(() => String(route.params.id))

const { data, error, refresh } = await useFetch<PlayerDetailResponse>(
  () => `/api/players/${id.value}`
)

const updating = ref(false)
const updateError = ref<string | null>(null)

/** 入村制限フラグを反転して保存する (confirm あり) */
const toggleRestricted = async () => {
  if (!data.value) return
  const next = !data.value.player.isRestrictedParticipation
  const label = next ? '入村制限する' : '入村制限を解除する'
  if (
    !window.confirm(
      `${data.value.player.nickname} (player_id: ${data.value.player.playerId}) を${label}。よろしいですか?`
    )
  ) {
    return
  }
  updating.value = true
  updateError.value = null
  try {
    const body: UpdateRestrictedParticipationBody = {
      isRestrictedParticipation: next
    }
    await $fetch<UpdateRestrictedParticipationResponse>(
      `/api/players/${id.value}/restricted`,
      { method: 'PUT', body }
    )
    await refresh()
  } catch (e) {
    updateError.value = e instanceof Error ? e.message : String(e)
  } finally {
    updating.value = false
  }
}

useHead({
  title: computed(() =>
    data.value ? `プレイヤー: ${data.value.player.nickname}` : 'プレイヤー詳細'
  )
})

const providerLabel = (providerId: string): string => {
  if (providerId === 'google.com') return 'Google'
  if (providerId === 'twitter.com') return 'Twitter'
  return providerId
}
</script>

<template>
  <div class="space-y-6">
    <p class="text-sm">
      <NuxtLink to="/players" class="text-blue-700 underline">
        ← プレイヤー一覧
      </NuxtLink>
    </p>
    <ErrorAlert :error="error" />
    <template v-if="data">
      <h1 class="text-2xl font-bold">
        {{ data.player.nickname }}
        <span class="text-base font-normal text-slate-500">
          (player_id: {{ data.player.playerId }})
        </span>
        <FlagBadge
          v-if="data.player.isRestrictedParticipation"
          label="入村制限"
          tone="red"
          class="ml-2 align-middle"
        />
      </h1>

      <section class="rounded border border-slate-200 bg-white p-4">
        <h2 class="mb-3 font-bold">プレイヤー情報</h2>
        <dl class="grid gap-x-6 gap-y-2 text-sm md:grid-cols-[10rem_1fr]">
          <dt class="text-slate-500">uid</dt>
          <dd class="font-mono break-all">{{ data.player.uid }}</dd>
          <dt class="text-slate-500">ニックネーム</dt>
          <dd>{{ data.player.nickname }}</dd>
          <dt class="text-slate-500">権限</dt>
          <dd>{{ data.player.authorityCode }}</dd>
          <dt class="text-slate-500">入村制限</dt>
          <dd class="flex flex-wrap items-center gap-3">
            <FlagBadge
              :label="
                data.player.isRestrictedParticipation ? '制限中' : '制限なし'
              "
              :tone="data.player.isRestrictedParticipation ? 'red' : 'gray'"
            />
            <button
              type="button"
              class="rounded border px-3 py-1 text-xs disabled:opacity-50"
              :class="
                data.player.isRestrictedParticipation
                  ? 'border-slate-400 bg-white hover:bg-slate-50'
                  : 'border-red-300 bg-red-50 text-red-800 hover:bg-red-100'
              "
              :disabled="updating"
              @click="toggleRestricted"
            >
              {{
                updating
                  ? '更新中...'
                  : data.player.isRestrictedParticipation
                    ? '入村制限を解除する'
                    : '入村制限する'
              }}
            </button>
            <span v-if="updateError" class="text-xs break-all text-red-700">
              更新エラー: {{ updateError }}
            </span>
          </dd>
          <dt class="text-slate-500">Twitter (DB)</dt>
          <dd>{{ data.player.twitterUserName ?? '-' }}</dd>
          <dt class="text-slate-500">他サイトでの名前</dt>
          <dd>{{ data.player.otherSiteName ?? '-' }}</dd>
          <dt class="text-slate-500">自己紹介</dt>
          <dd class="whitespace-pre-wrap">
            {{ data.player.introduction ?? '-' }}
          </dd>
          <dt class="text-slate-500">登録日時</dt>
          <dd>{{ data.player.registerDatetime }}</dd>
          <dt class="text-slate-500">更新日時</dt>
          <dd>{{ data.player.updateDatetime }}</dd>
        </dl>
      </section>

      <section class="rounded border border-slate-200 bg-white p-4">
        <h2 class="mb-3 font-bold">Firebase アカウント</h2>
        <div
          v-if="data.firebase.status === 'not_configured'"
          class="space-y-2 text-sm"
        >
          <p class="text-slate-600">
            Firebase Admin SDK が未設定のため取得していません
            (NUXT_FIREBASE_SERVICE_ACCOUNT_PATH)。
          </p>
          <p v-if="data.player.twitterUserName">
            Twitter ユーザー名 (twitter_user テーブル):
            <span class="font-mono">@{{ data.player.twitterUserName }}</span>
          </p>
          <p v-else class="text-slate-600">
            twitter_user テーブルにも登録がありません。
          </p>
        </div>
        <p
          v-else-if="data.firebase.status === 'not_found'"
          class="text-sm text-slate-600"
        >
          Firebase 上にこの uid のユーザーが存在しません。
        </p>
        <p
          v-else-if="data.firebase.status === 'error'"
          class="text-sm break-all text-red-700"
        >
          取得エラー: {{ data.firebase.message }}
        </p>
        <template v-else>
          <dl
            class="mb-3 grid gap-x-6 gap-y-2 text-sm md:grid-cols-[10rem_1fr]"
          >
            <dt class="text-slate-500">email</dt>
            <dd class="break-all">{{ data.firebase.email ?? '-' }}</dd>
            <dt class="text-slate-500">表示名</dt>
            <dd>{{ data.firebase.displayName ?? '-' }}</dd>
            <dt class="text-slate-500">無効化</dt>
            <dd>{{ data.firebase.disabled ? 'はい' : 'いいえ' }}</dd>
            <dt class="text-slate-500">作成日時</dt>
            <dd>{{ data.firebase.creationTime ?? '-' }}</dd>
            <dt class="text-slate-500">最終ログイン</dt>
            <dd>{{ data.firebase.lastSignInTime ?? '-' }}</dd>
          </dl>
          <div class="overflow-x-auto">
            <table class="w-full min-w-4xl text-sm">
              <thead class="bg-slate-50 text-left text-xs text-slate-600">
                <tr>
                  <th class="px-3 py-2">プロバイダ</th>
                  <th class="px-3 py-2">プロバイダ側 uid</th>
                  <th class="px-3 py-2">表示名</th>
                  <th class="px-3 py-2">email</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="data.firebase.providers.length === 0">
                  <td colspan="4" class="px-3 py-3 text-center text-slate-500">
                    連携プロバイダなし
                  </td>
                </tr>
                <tr
                  v-for="p in data.firebase.providers"
                  :key="p.providerId"
                  class="border-t border-slate-100"
                >
                  <td class="px-3 py-2">{{ providerLabel(p.providerId) }}</td>
                  <td class="px-3 py-2 font-mono text-xs break-all">
                    {{ p.uid }}
                  </td>
                  <td class="px-3 py-2">{{ p.displayName ?? '-' }}</td>
                  <td class="px-3 py-2 break-all">{{ p.email ?? '-' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </template>
      </section>

      <section class="rounded border border-slate-200 bg-white p-4">
        <h2 class="mb-3 font-bold">
          参加した村
          <span class="text-sm font-normal text-slate-500">
            ({{ data.villages.length }} 件)
          </span>
        </h2>
        <div class="overflow-x-auto">
          <table class="w-full min-w-4xl text-sm">
            <thead class="bg-slate-50 text-left text-xs text-slate-600">
              <tr>
                <th class="px-3 py-2">村ID</th>
                <th class="px-3 py-2">村名</th>
                <th class="px-3 py-2">状態</th>
                <th class="px-3 py-2">キャラクター</th>
                <th class="px-3 py-2">役職</th>
                <th class="px-3 py-2">状況</th>
                <th class="px-3 py-2">参加日時</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="data.villages.length === 0">
                <td colspan="7" class="px-3 py-3 text-center text-slate-500">
                  参加した村はありません
                </td>
              </tr>
              <tr
                v-for="v in data.villages"
                :key="v.villagePlayerId"
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
                <td class="px-3 py-2">{{ v.charaName }}</td>
                <td class="px-3 py-2 whitespace-nowrap">
                  {{ v.skillName ?? '-' }}
                </td>
                <td class="space-x-1 px-3 py-2 whitespace-nowrap">
                  <FlagBadge v-if="v.isGone" label="退村" tone="gray" />
                  <FlagBadge v-if="v.isSpectator" label="見学" tone="blue" />
                  <FlagBadge v-if="v.isDead" label="死亡" tone="red" />
                </td>
                <td class="px-3 py-2 whitespace-nowrap">
                  {{ v.registerDatetime }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </template>
  </div>
</template>
