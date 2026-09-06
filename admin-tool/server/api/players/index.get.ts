import type { RowDataPacket } from 'mysql2/promise'
import type { PlayerSummary, PlayersResponse } from '#shared/types/admin'

interface PlayerRow extends RowDataPacket {
  player_id: number
  uid: string
  nickname: string
  authority_code: string
  is_restricted_participation: number
  twitter_user_name: string | null
  village_count: number
  register_datetime: string
}

interface CountRow extends RowDataPacket {
  total: number
}

const LIMIT = 100

export default defineEventHandler(async (event): Promise<PlayersResponse> => {
  const { q } = getQuery(event)
  const keyword = typeof q === 'string' ? q.trim() : ''

  const conditions: string[] = []
  const params: unknown[] = []
  if (keyword !== '') {
    const like = `%${escapeLike(keyword)}%`
    conditions.push(
      '(p.uid LIKE ? OR p.nickname LIKE ? OR tu.twitter_user_name LIKE ? OR p.player_id = ?)'
    )
    params.push(like, like, like, Number(keyword) || 0)
  }
  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  const countRows = await query<CountRow>(
    `SELECT COUNT(*) AS total
       FROM player p
       LEFT JOIN twitter_user tu ON tu.player_id = p.player_id
       ${where}`,
    params
  )
  const rows = await query<PlayerRow>(
    `SELECT p.player_id, p.uid, p.nickname, p.authority_code,
            p.is_restricted_participation, tu.twitter_user_name,
            (SELECT COUNT(*) FROM village_player vp WHERE vp.player_id = p.player_id) AS village_count,
            p.register_datetime
       FROM player p
       LEFT JOIN twitter_user tu ON tu.player_id = p.player_id
       ${where}
      ORDER BY p.player_id DESC
      LIMIT ${LIMIT}`,
    params
  )

  const players: PlayerSummary[] = rows.map((r) => ({
    playerId: r.player_id,
    uid: r.uid,
    nickname: r.nickname,
    authorityCode: r.authority_code,
    isRestrictedParticipation: toBoolean(r.is_restricted_participation),
    twitterUserName: r.twitter_user_name,
    villageCount: Number(r.village_count),
    registerDatetime: r.register_datetime
  }))
  return { players, total: countRows[0]?.total ?? 0, limit: LIMIT }
})
