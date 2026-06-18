<template>
  <div v-if="isCurrentVillageDayLatest" class="text-xs leading-[1.125rem]">
    <!-- 村の状況メッセージ -->
    <Alert :class="charSizeClass" class="mb-1.5" type="default">
      <span :class="charSizeClass" v-html="villageSituationMessageHtml" />
    </Alert>

    <!-- 突然死警告メッセージ -->
    <Alert
      v-if="isDispSuddenlyDeathMessage"
      :class="charSizeClass"
      class="mb-1.5"
      type="warning"
    >
      <span :class="charSizeClass" v-html="suddenlyDeathMessageHtml" />
    </Alert>

    <!-- 沈黙時間メッセージ -->
    <Alert
      v-if="isSilentTime"
      :class="charSizeClass"
      class="mb-1.5"
      type="warning"
    >
      <span :class="charSizeClass" v-html="silentTimeMessageHtml" />
    </Alert>

    <!-- 自動退村警告メッセージ -->
    <Alert
      v-if="isDispAutoKickWarning"
      :class="charSizeClass"
      class="mb-1.5"
      type="warning"
    >
      <span :class="charSizeClass" v-html="autoKickWarningMessageHtml" />
    </Alert>
  </div>
</template>

<script setup lang="ts">
import { VILLAGE_STATUS } from '~/lib/api/village-status-constants'
import { useVillage } from '~/composables/village/useVillage'
import { useMessage } from '~/composables/village/useMessage'
import { useSituation } from '~/composables/village/useSituation'
import { useUserSettings } from '~/composables/village/useUserSettings'
import Alert from '~/components/ui/feedback/Alert.vue'

// Composables
const { village, latestDay, isCurrentVillageDayLatest } = useVillage()
const { messages } = useMessage()
const { situation } = useSituation()
const { messageDisplay } = useUserSettings()

// 村の状況メッセージ
const villageSituationMessage = computed(() => {
  if (!village.value) return ''

  const status = village.value.status.code
  switch (status) {
    case VILLAGE_STATUS.PROLOGUE:
      return prologueMessage.value
    case VILLAGE_STATUS.IN_PROGRESS:
      return progressMessage.value
    case VILLAGE_STATUS.EPILOGUE:
      return epilogueMessage.value
    case VILLAGE_STATUS.COMPLETED:
      return completeMessage.value
    case VILLAGE_STATUS.CANCEL:
      return cancelMessage.value
    default:
      return ''
  }
})

// HTML変換（改行 -> <br />）
const villageSituationMessageHtml = computed(() => {
  return villageSituationMessage.value.replace(/\n/g, '<br />')
})

// プロローグメッセージ
const prologueMessage = computed(() => {
  if (!village.value) return ''
  const minPersonCount = village.value.setting.capacity.min
  const currentParticipantCount = village.value.participant.count
  const startDatetime = village.value.setting.time.start_datetime

  return currentParticipantCount < minPersonCount
    ? `${startDatetime}時点で${minPersonCount}人集まれば村が開始されます。`
    : `${startDatetime}に村が開始されます。`
})

// 進行中メッセージ
const progressMessage = computed(() => {
  if (!village.value) return ''

  const dayList = village.value.day.day_list
  if (dayList.length === 0) return ''

  const latestDayData = dayList.at(-1)
  if (!latestDayData) return ''

  const isFirstDay = latestDayData.day === 1

  if (isFirstDay) {
    return `${daychangeDatetime.value}に日付が更新されます。\n能力者は対象を選択してセットしてください。${commitMessage.value}`
  } else {
    return `${daychangeDatetime.value}に日付が更新されます。\n処刑したい人に投票してください。\n能力者は対象を選択してセットしてください。${commitMessage.value}`
  }
})

// 時短メッセージ
const commitMessage = computed(() => {
  if (!village.value) return ''
  const isAvailableCommit = village.value.setting.rules.available_commit
  return isAvailableCommit
    ? '\n全員が時短希望すると、すぐに日付が更新されます。'
    : ''
})

// エピローグメッセージ
const epilogueMessage = computed(() => {
  if (!village.value?.win_camp) return ''
  const winCamp = village.value.win_camp.name
  return `${winCamp}の勝利です。\n全てのログとユーザー名を公開します。\n今回の感想などを話し合いましょう。\n\n${daychangeDatetime.value}に村が終了します。`
})

// 終了メッセージ
const completeMessage = computed(() => {
  return 'この村は終了しました。'
})

// 廃村メッセージ
const cancelMessage = computed(() => {
  return 'この村は廃村になりました。'
})

// 日付更新日時
const daychangeDatetime = computed(() => {
  if (!village.value) return ''
  const dayList = village.value.day.day_list
  const latestDayData = dayList.at(-1)
  if (!latestDayData) return ''
  return latestDayData.day_change_datetime
})

// 突然死警告メッセージ表示判定
const isDispSuddenlyDeathMessage = computed(() => {
  return (
    isProgress.value &&
    isAvailableSuddenlyDeath.value &&
    existsNoSayMember.value &&
    !isSilentTime.value
  )
})

// 進行中かどうか
const isProgress = computed(() => {
  if (!village.value) return false
  return village.value.status.code === VILLAGE_STATUS.IN_PROGRESS
})

// 突然死有効か
const isAvailableSuddenlyDeath = computed(() => {
  if (!village.value) return false
  return village.value.setting.rules.available_suddenly_death
})

// 沈黙時間かどうか
const isSilentTime = computed(() => {
  if (!village.value) return false
  return village.value.silent_time
})

// 突然死警告メッセージ
const suddenlyDeathMessage = computed(() => {
  const noSayMemberNames = noSayMembers.value.map(
    (member) => member.chara.chara_name.name
  )
  return `日付更新までに通常発言がない人は突然死します。\n現在まで発言していない人\n${noSayMemberNames.join('\n')}`
})

const suddenlyDeathMessageHtml = computed(() => {
  return suddenlyDeathMessage.value.replace(/\n/g, '<br />')
})

// 未発言メンバーが存在するか
const existsNoSayMember = computed(() => {
  return noSayMembers.value.length > 0
})

// 未発言メンバー
const noSayMembers = computed(() => {
  if (!village.value || !messages.value) return []

  const dummyCharaId = village.value.setting.charachip.dummy_chara_id
  return village.value.participant.member_list
    .filter((member) => !member.dead)
    .filter((member) => member.chara.id !== dummyCharaId)
    .filter((member) => getSayCount(member.id) === 0)
})

// 発言回数取得
const getSayCount = (participantId: number): number => {
  if (!messages.value) return 0
  return messages.value.today_message_count_map[participantId] ?? 0
}

// 沈黙時間メッセージ
const silentTimeMessage = computed(() => {
  return `通常発言ができない時間です。\n${sayableTime.value}から発言できます。`
})

const silentTimeMessageHtml = computed(() => {
  return silentTimeMessage.value.replace(/\n/g, '<br />')
})

// 発言可能時刻
const sayableTime = computed(() => {
  if (!latestDay.value?.sayable_start_time) return ''
  const time = latestDay.value.sayable_start_time
  // hour/minuteを使って表示
  const hour = String(time.hour ?? 0).padStart(2, '0')
  const minute = String(time.minute ?? 0).padStart(2, '0')
  return `${hour}:${minute}`
})

// 自動退村警告メッセージ表示判定
const isDispAutoKickWarning = computed(() => {
  return isPrologue.value && myParticipantId.value !== null && !isSafeFromAutoKick.value
})

const isPrologue = computed(() => {
  if (!village.value) return false
  return village.value.status.code === VILLAGE_STATUS.PROLOGUE
})

const myParticipantId = computed((): number | null => {
  return situation.value?.participate.myself?.id ?? null
})

const formatDateTime = (date: Date): string => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const h = String(date.getHours()).padStart(2, '0')
  const min = String(date.getMinutes()).padStart(2, '0')
  return `${y}/${m}/${d} ${h}:${min}`
}

const parseStartDatetime = (): Date | null => {
  if (!village.value) return null
  const str = village.value.setting.time.start_datetime
  const parts = /^(\d{4})\/(\d{2})\/(\d{2}) (\d{2}):(\d{2}):(\d{2})$/.exec(
    str
  )
  if (!parts) return null
  const [, year, month, day, hour, minute, second] = parts
  if (!year || !month || !day || !hour || !minute || !second) return null
  return new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    Number(second)
  )
}

const MILLIS_HOUR = 60 * 60 * 1000
const MILLIS_24H = 24 * MILLIS_HOUR
const MILLIS_72H = 72 * MILLIS_HOUR
const MILLIS_96H = 96 * MILLIS_HOUR
const MILLIS_2H = 2 * MILLIS_HOUR

const isSafeFromAutoKick = computed(() => {
  if (!messages.value || myParticipantId.value === null || !village.value)
    return false
  const startDatetime = parseStartDatetime()
  if (!startDatetime) return false
  const latestMilli =
    messages.value.latest_message_unix_time_milli_map[myParticipantId.value]
  if (latestMilli == null) return false
  return latestMilli + MILLIS_24H >= startDatetime.getTime() - MILLIS_2H
})

const autoKickWarningMessage = computed(() => {
  if (!messages.value || myParticipantId.value === null || !village.value)
    return ''

  const startDatetime = parseStartDatetime()
  if (!startDatetime) return ''

  const startMillis = startDatetime.getTime()
  const windowStart = startMillis - MILLIS_72H
  const activeFrom = startMillis - MILLIS_96H

  const now = Date.now()
  if (now < activeFrom) {
    const windowStartStr = formatDateTime(new Date(windowStart))
    const activeFromStr = formatDateTime(new Date(activeFrom))
    return (
      `${windowStartStr}（開始72時間前）以降、24時間発言がない参加者は、自動で村を去ります。\n` +
      `${activeFromStr}（96時間前）以降に通常発言することで、退村までの時間を24時間伸ばせます。`
    )
  }

  const windowEnd = startMillis - MILLIS_2H
  const latestMilli =
    messages.value.latest_message_unix_time_milli_map[myParticipantId.value]
  const deadlineFromMessage =
    latestMilli != null ? latestMilli + MILLIS_24H : windowStart
  const deadline = Math.min(
    Math.max(deadlineFromMessage, windowStart),
    windowEnd
  )

  return (
    `${formatDateTime(new Date(deadline))}までに発言がない場合、あなたは自動で村を去ります。\n` +
    `通常発言することで、退村までの時間を24時間伸ばせます。`
  )
})

const autoKickWarningMessageHtml = computed(() => {
  return autoKickWarningMessage.value.replace(/\n/g, '<br />')
})

// 文字サイズクラス
const charSizeClass = computed(() => {
  return isCharSizeLarge.value
    ? 'text-sm leading-[1.375rem]'
    : 'text-xs leading-[1.125rem]'
})

// 文字サイズ大設定
const isCharSizeLarge = computed(() => {
  return messageDisplay.value.isCharLarge
})
</script>
