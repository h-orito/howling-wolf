import type { RowDataPacket } from 'mysql2/promise'
import type {
  UpdateRestrictedParticipationBody,
  UpdateRestrictedParticipationResponse
} from '#shared/types/admin'

interface PlayerRow extends RowDataPacket {
  is_restricted_participation: number
  update_datetime: string
}

const UPDATE_TRACE = 'admin-tool'

/** PLAYER.IS_RESTRICTED_PARTICIPATION (入村制限) を更新する */
export default defineEventHandler(
  async (event): Promise<UpdateRestrictedParticipationResponse> => {
    const playerId = Number(getRouterParam(event, 'id'))
    if (!Number.isInteger(playerId)) {
      throw createError({ statusCode: 400, statusMessage: 'invalid id' })
    }
    const body =
      await readBody<Partial<UpdateRestrictedParticipationBody>>(event)
    if (typeof body?.isRestrictedParticipation !== 'boolean') {
      throw createError({
        statusCode: 400,
        statusMessage: 'isRestrictedParticipation (boolean) is required'
      })
    }

    const affected = await execute(
      `UPDATE player
          SET is_restricted_participation = ?,
              update_datetime = NOW(),
              update_trace = ?
        WHERE player_id = ?`,
      [body.isRestrictedParticipation, UPDATE_TRACE, playerId]
    )
    if (affected === 0) {
      throw createError({ statusCode: 404, statusMessage: 'player not found' })
    }

    const rows = await query<PlayerRow>(
      'SELECT is_restricted_participation, update_datetime FROM player WHERE player_id = ?',
      [playerId]
    )
    const row = rows[0]
    if (!row) {
      throw createError({ statusCode: 404, statusMessage: 'player not found' })
    }
    return {
      playerId,
      isRestrictedParticipation: toBoolean(row.is_restricted_participation),
      updateDatetime: row.update_datetime
    }
  }
)
