import { readFileSync } from 'node:fs'
import { cert, getApps, initializeApp, type App } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import type { FirebaseUserInfo } from '#shared/types/admin'

let app: App | null = null

export const isFirebaseConfigured = (): boolean =>
  useRuntimeConfig().firebaseServiceAccountPath !== ''

const getApp = (): App | null => {
  if (app) return app
  const path = useRuntimeConfig().firebaseServiceAccountPath
  if (!path) return null
  const existing = getApps()[0]
  if (existing) {
    app = existing
    return app
  }
  const serviceAccount = JSON.parse(readFileSync(path, 'utf-8'))
  app = initializeApp({ credential: cert(serviceAccount) })
  return app
}

const errorCode = (e: unknown): string | undefined => {
  if (typeof e === 'object' && e !== null && 'code' in e) {
    const code = (e as { code: unknown }).code
    return typeof code === 'string' ? code : undefined
  }
  return undefined
}

const errorMessage = (e: unknown): string =>
  e instanceof Error ? e.message : String(e)

/** Firebase Authentication 上のユーザー情報 (Google / Twitter などの provider 情報) を取得する */
export const fetchFirebaseUser = async (
  uid: string
): Promise<FirebaseUserInfo> => {
  let firebaseApp: App | null
  try {
    firebaseApp = getApp()
  } catch (e) {
    return {
      status: 'error',
      message: `Firebase 初期化に失敗しました: ${errorMessage(e)}`
    }
  }
  if (!firebaseApp) return { status: 'not_configured' }

  try {
    const user = await getAuth(firebaseApp).getUser(uid)
    return {
      status: 'found',
      email: user.email ?? null,
      displayName: user.displayName ?? null,
      disabled: user.disabled,
      creationTime: user.metadata.creationTime ?? null,
      lastSignInTime: user.metadata.lastSignInTime ?? null,
      providers: user.providerData.map((p) => ({
        providerId: p.providerId,
        uid: p.uid,
        displayName: p.displayName ?? null,
        email: p.email ?? null
      }))
    }
  } catch (e) {
    if (errorCode(e) === 'auth/user-not-found') return { status: 'not_found' }
    return { status: 'error', message: errorMessage(e) }
  }
}
