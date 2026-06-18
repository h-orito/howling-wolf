import {
  ALL_MESSAGE_TYPE_GROUPS,
  type MessageTypeGroup
} from '~/lib/api/message-constants'
import { useVillage } from './useVillage'

/**
 * 発言抽出条件の管理
 */
export const useVillageMessageFilter = () => {
  const { village, allParticipantIds } = useVillage()
  const filterStore = useVillageMessageFilterStore()

  const applyFilter = (
    messageTypeGroups: MessageTypeGroup[] | null,
    participantIdList: number[] | null,
    toParticipantIdList: number[] | null,
    keywordText: string | null
  ) => {
    filterStore.setMessageFilter({
      messageTypeGroups,
      participantIdList,
      toParticipantIdList,
      keyword: keywordText
    })
  }

  const resetFilter = () => {
    filterStore.resetMessageFilter()
    filterStore.setMessageFilter({
      participantIdList: [...allParticipantIds.value],
      toParticipantIdList: [...allParticipantIds.value]
    })
  }

  const filterByParticipant = (participantId: number) => {
    filterStore.resetMessageFilter()
    filterStore.setMessageFilter({
      participantIdList: [participantId]
    })
  }

  const syncNewParticipants = (
    newIds: readonly number[],
    oldIds: readonly number[]
  ) => {
    if (newIds.length <= oldIds.length) return

    const addedIds = newIds.filter((id) => !oldIds.includes(id))

    const currentFilter = filterStore.participantIdFilter
    if (currentFilter !== null) {
      const wasSelectingAll =
        currentFilter.length === oldIds.length &&
        oldIds.every((id) => currentFilter.includes(id))
      if (wasSelectingAll) {
        filterStore.setMessageFilter({
          participantIdList: [...currentFilter, ...addedIds]
        })
      }
    }

    const currentToFilter = filterStore.toParticipantIdFilter
    if (currentToFilter !== null) {
      const wasSelectingAll =
        currentToFilter.length === oldIds.length &&
        oldIds.every((id) => currentToFilter.includes(id))
      if (wasSelectingAll) {
        filterStore.setMessageFilter({
          toParticipantIdList: [...currentToFilter, ...addedIds]
        })
      }
    }
  }

  watch(allParticipantIds, (newIds, oldIds) => {
    if (oldIds && oldIds.length > 0) {
      syncNewParticipants(newIds, oldIds)
    }
  })

  const isFiltering = computed(() => {
    if (!village) return false
    const totalParticipantCount = allParticipantIds.value.length
    const groups = filterStore.messageTypeGroups
    const pidFilter = filterStore.participantIdFilter
    const toPidFilter = filterStore.toParticipantIdFilter
    const kFilter = filterStore.keywordFilter

    return (
      (groups.length !== 0 &&
        groups.length !== ALL_MESSAGE_TYPE_GROUPS.length) ||
      (pidFilter &&
        pidFilter.length > 0 &&
        pidFilter.length !== totalParticipantCount) ||
      (toPidFilter &&
        toPidFilter.length > 0 &&
        toPidFilter.length !== totalParticipantCount) ||
      !!kFilter
    )
  })

  return {
    messageTypeGroups: computed(() => filterStore.messageTypeGroups),
    participantIds: computed(() => filterStore.participantIdFilter),
    toParticipantIds: computed(() => filterStore.toParticipantIdFilter),
    keyword: computed(() => filterStore.keywordFilter),
    messageTypes: computed(() => filterStore.messageTypeFilter),
    isFiltering,

    applyFilter,
    resetFilter,
    filterByParticipant
  }
}
