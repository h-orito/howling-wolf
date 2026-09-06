import type { StatusResponse } from '#shared/types/admin'

export default defineEventHandler(async (): Promise<StatusResponse> => {
  const target = getDbTarget()
  let db: StatusResponse['db']
  try {
    await query('SELECT 1')
    db = { ok: true, message: '接続OK', target }
  } catch (e) {
    db = {
      ok: false,
      message: e instanceof Error ? e.message : String(e),
      target
    }
  }
  const configured = isFirebaseConfigured()
  return {
    db,
    firebase: {
      configured,
      message: configured
        ? `サービスアカウント: ${useRuntimeConfig().firebaseServiceAccountPath}`
        : 'NUXT_FIREBASE_SERVICE_ACCOUNT_PATH が未設定のため Google / Twitter アカウント情報は取得しません'
    }
  }
})
