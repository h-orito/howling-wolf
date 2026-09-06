import type { RowDataPacket } from 'mysql2/promise'
import type {
  AccessInfo,
  VillageDetailResponse,
  VillageParticipant
} from '#shared/types/admin'

interface VillageRow extends RowDataPacket {
  village_id: number
  village_display_name: string
  village_status_code: string
  village_status_name: string
  create_player_id: number
  create_player_nickname: string
  register_datetime: string
}

interface ParticipantRow extends RowDataPacket {
  village_player_id: number
  player_id: number
  uid: string
  nickname: string
  twitter_user_name: string | null
  chara_name: string
  skill_code: string | null
  skill_name: string | null
  request_skill_code: string | null
  is_dead: number
  is_spectator: number
  register_datetime: string
}

interface AccessInfoRow extends RowDataPacket {
  village_player_access_info_id: number
  village_player_id: number
  ip_address: string
  client_token: string | null
  register_datetime: string
  update_datetime: string
}

/** 各参加者の key (IP / token) を持つ他参加者の village_player_id を求める */
const findSharedParticipantIds = (
  participantId: number,
  keys: string[],
  keyToParticipantIds: Map<string, Set<number>>
): number[] => {
  const ids = new Set<number>()
  for (const key of keys) {
    for (const id of keyToParticipantIds.get(key) ?? []) {
      if (id !== participantId) ids.add(id)
    }
  }
  return [...ids].sort((a, b) => a - b)
}

export default defineEventHandler(
  async (event): Promise<VillageDetailResponse> => {
    const villageId = Number(getRouterParam(event, 'id'))
    if (!Number.isInteger(villageId)) {
      throw createError({ statusCode: 400, statusMessage: 'invalid id' })
    }

    const villageRows = await query<VillageRow>(
      `SELECT v.village_id, v.village_display_name, v.village_status_code,
              vs.village_status_name, v.create_player_id,
              p.nickname AS create_player_nickname, v.register_datetime
         FROM village v
         JOIN village_status vs ON vs.village_status_code = v.village_status_code
         JOIN player p ON p.player_id = v.create_player_id
        WHERE v.village_id = ?`,
      [villageId]
    )
    const village = villageRows[0]
    if (!village) {
      throw createError({ statusCode: 404, statusMessage: 'village not found' })
    }

    // 退村済み (is_gone = TRUE) は除外する
    const participantRows = await query<ParticipantRow>(
      `SELECT vp.village_player_id, p.player_id, p.uid, p.nickname,
              tu.twitter_user_name, c.chara_name,
              vp.skill_code, s.skill_name, vp.request_skill_code,
              vp.is_dead, vp.is_spectator, vp.register_datetime
         FROM village_player vp
         JOIN player p ON p.player_id = vp.player_id
         LEFT JOIN twitter_user tu ON tu.player_id = p.player_id
         JOIN chara c ON c.chara_id = vp.chara_id
         LEFT JOIN skill s ON s.skill_code = vp.skill_code
        WHERE vp.village_id = ? AND vp.is_gone = FALSE
        ORDER BY vp.is_spectator, vp.village_player_id`,
      [villageId]
    )

    const participantIds = participantRows.map((r) => r.village_player_id)
    const accessInfoRows =
      participantIds.length === 0
        ? []
        : await query<AccessInfoRow>(
            `SELECT village_player_access_info_id, village_player_id, ip_address,
                    client_token, register_datetime, update_datetime
               FROM village_player_access_info
              WHERE village_player_id IN (?)
              ORDER BY village_player_id, register_datetime, village_player_access_info_id`,
            [participantIds]
          )

    const accessInfosByParticipant = new Map<number, AccessInfo[]>()
    const ipToParticipantIds = new Map<string, Set<number>>()
    const tokenToParticipantIds = new Map<string, Set<number>>()
    for (const r of accessInfoRows) {
      const list = accessInfosByParticipant.get(r.village_player_id) ?? []
      list.push({
        villagePlayerAccessInfoId: r.village_player_access_info_id,
        ipAddress: r.ip_address,
        clientToken: r.client_token,
        registerDatetime: r.register_datetime,
        updateDatetime: r.update_datetime
      })
      accessInfosByParticipant.set(r.village_player_id, list)

      const ipSet = ipToParticipantIds.get(r.ip_address) ?? new Set<number>()
      ipSet.add(r.village_player_id)
      ipToParticipantIds.set(r.ip_address, ipSet)
      if (r.client_token) {
        const tokenSet =
          tokenToParticipantIds.get(r.client_token) ?? new Set<number>()
        tokenSet.add(r.village_player_id)
        tokenToParticipantIds.set(r.client_token, tokenSet)
      }
    }

    const participants: VillageParticipant[] = participantRows.map((r) => {
      const accessInfos =
        accessInfosByParticipant.get(r.village_player_id) ?? []
      return {
        villagePlayerId: r.village_player_id,
        playerId: r.player_id,
        uid: r.uid,
        nickname: r.nickname,
        twitterUserName: r.twitter_user_name,
        charaName: r.chara_name,
        skillCode: r.skill_code,
        skillName: r.skill_name,
        requestSkillCode: r.request_skill_code,
        isDead: toBoolean(r.is_dead),
        isSpectator: toBoolean(r.is_spectator),
        registerDatetime: r.register_datetime,
        accessInfos,
        sameIpParticipantIds: findSharedParticipantIds(
          r.village_player_id,
          accessInfos.map((a) => a.ipAddress),
          ipToParticipantIds
        ),
        sameTokenParticipantIds: findSharedParticipantIds(
          r.village_player_id,
          accessInfos.flatMap((a) => (a.clientToken ? [a.clientToken] : [])),
          tokenToParticipantIds
        )
      }
    })

    return {
      village: {
        villageId: village.village_id,
        villageDisplayName: village.village_display_name,
        villageStatusCode: village.village_status_code,
        villageStatusName: village.village_status_name,
        createPlayerId: village.create_player_id,
        createPlayerNickname: village.create_player_nickname,
        participantCount: participants.filter((p) => !p.isSpectator).length,
        registerDatetime: village.register_datetime
      },
      participants
    }
  }
)
