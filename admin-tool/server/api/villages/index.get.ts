import type { RowDataPacket } from 'mysql2/promise'
import type { VillageSummary, VillagesResponse } from '#shared/types/admin'

interface VillageRow extends RowDataPacket {
  village_id: number
  village_display_name: string
  village_status_code: string
  village_status_name: string
  create_player_id: number
  create_player_nickname: string
  participant_count: number
  register_datetime: string
}

interface CountRow extends RowDataPacket {
  total: number
}

const LIMIT = 100

export default defineEventHandler(async (event): Promise<VillagesResponse> => {
  const { q } = getQuery(event)
  const keyword = typeof q === 'string' ? q.trim() : ''

  const conditions: string[] = []
  const params: unknown[] = []
  if (keyword !== '') {
    conditions.push('(v.village_display_name LIKE ? OR v.village_id = ?)')
    params.push(`%${escapeLike(keyword)}%`, Number(keyword) || 0)
  }
  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  const countRows = await query<CountRow>(
    `SELECT COUNT(*) AS total FROM village v ${where}`,
    params
  )
  const rows = await query<VillageRow>(
    `SELECT v.village_id, v.village_display_name, v.village_status_code,
            vs.village_status_name, v.create_player_id,
            p.nickname AS create_player_nickname,
            (SELECT COUNT(*) FROM village_player vp
              WHERE vp.village_id = v.village_id
                AND vp.is_gone = FALSE AND vp.is_spectator = FALSE) AS participant_count,
            v.register_datetime
       FROM village v
       JOIN village_status vs ON vs.village_status_code = v.village_status_code
       JOIN player p ON p.player_id = v.create_player_id
       ${where}
      ORDER BY v.village_id DESC
      LIMIT ${LIMIT}`,
    params
  )

  const villages: VillageSummary[] = rows.map((r) => ({
    villageId: r.village_id,
    villageDisplayName: r.village_display_name,
    villageStatusCode: r.village_status_code,
    villageStatusName: r.village_status_name,
    createPlayerId: r.create_player_id,
    createPlayerNickname: r.create_player_nickname,
    participantCount: Number(r.participant_count),
    registerDatetime: r.register_datetime
  }))
  return { villages, total: countRows[0]?.total ?? 0, limit: LIMIT }
})
