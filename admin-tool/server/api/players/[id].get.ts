import type { RowDataPacket } from 'mysql2/promise'
import type {
  ParticipatedVillage,
  PlayerDetailResponse
} from '#shared/types/admin'

interface PlayerRow extends RowDataPacket {
  player_id: number
  uid: string
  nickname: string
  authority_code: string
  is_restricted_participation: number
  twitter_user_name: string | null
  other_site_name: string | null
  introduction: string | null
  register_datetime: string
  update_datetime: string
}

interface VillageRow extends RowDataPacket {
  village_player_id: number
  village_id: number
  village_display_name: string
  village_status_code: string
  village_status_name: string
  chara_name: string
  skill_code: string | null
  skill_name: string | null
  is_dead: number
  is_spectator: number
  is_gone: number
  register_datetime: string
}

export default defineEventHandler(
  async (event): Promise<PlayerDetailResponse> => {
    const playerId = Number(getRouterParam(event, 'id'))
    if (!Number.isInteger(playerId)) {
      throw createError({ statusCode: 400, statusMessage: 'invalid id' })
    }

    const rows = await query<PlayerRow>(
      `SELECT p.player_id, p.uid, p.nickname, p.authority_code,
              p.is_restricted_participation, tu.twitter_user_name,
              pd.other_site_name, pd.introduction,
              p.register_datetime, p.update_datetime
         FROM player p
         LEFT JOIN twitter_user tu ON tu.player_id = p.player_id
         LEFT JOIN player_detail pd ON pd.player_id = p.player_id
        WHERE p.player_id = ?`,
      [playerId]
    )
    const row = rows[0]
    if (!row) {
      throw createError({ statusCode: 404, statusMessage: 'player not found' })
    }

    const villageRows = await query<VillageRow>(
      `SELECT vp.village_player_id, v.village_id, v.village_display_name,
              v.village_status_code, vs.village_status_name,
              c.chara_name, vp.skill_code, s.skill_name,
              vp.is_dead, vp.is_spectator, vp.is_gone, vp.register_datetime
         FROM village_player vp
         JOIN village v ON v.village_id = vp.village_id
         JOIN village_status vs ON vs.village_status_code = v.village_status_code
         JOIN chara c ON c.chara_id = vp.chara_id
         LEFT JOIN skill s ON s.skill_code = vp.skill_code
        WHERE vp.player_id = ?
        ORDER BY v.village_id DESC, vp.village_player_id DESC`,
      [playerId]
    )
    const villages: ParticipatedVillage[] = villageRows.map((r) => ({
      villagePlayerId: r.village_player_id,
      villageId: r.village_id,
      villageDisplayName: r.village_display_name,
      villageStatusCode: r.village_status_code,
      villageStatusName: r.village_status_name,
      charaName: r.chara_name,
      skillCode: r.skill_code,
      skillName: r.skill_name,
      isDead: toBoolean(r.is_dead),
      isSpectator: toBoolean(r.is_spectator),
      isGone: toBoolean(r.is_gone),
      registerDatetime: r.register_datetime
    }))

    const firebase = await fetchFirebaseUser(row.uid)

    return {
      player: {
        playerId: row.player_id,
        uid: row.uid,
        nickname: row.nickname,
        authorityCode: row.authority_code,
        isRestrictedParticipation: toBoolean(row.is_restricted_participation),
        twitterUserName: row.twitter_user_name,
        villageCount: villages.length,
        otherSiteName: row.other_site_name,
        introduction: row.introduction,
        registerDatetime: row.register_datetime,
        updateDatetime: row.update_datetime
      },
      firebase,
      villages
    }
  }
)
