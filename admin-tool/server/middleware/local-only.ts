// 管理ツールは自分の PC のブラウザからだけ使う。
// - Host が localhost 以外: 別の端末からのアクセスや DNS リバインディング
// - Origin が localhost 以外: 開いている別サイトからのリクエスト
// のどちらも拒否する
const LOCAL_HOSTNAMES = ['localhost', '127.0.0.1', '[::1]']

const isLocalHostname = (hostname: string): boolean =>
  LOCAL_HOSTNAMES.includes(hostname)

const hostnameOf = (url: string): string | null => {
  try {
    return new URL(url).hostname
  } catch {
    return null
  }
}

export default defineEventHandler((event) => {
  const host = getRequestHeader(event, 'host')
  const hostname = host ? hostnameOf(`http://${host}`) : null
  if (!hostname || !isLocalHostname(hostname)) {
    throw createError({ statusCode: 403, statusMessage: 'forbidden host' })
  }

  const origin = getRequestHeader(event, 'origin')
  if (origin) {
    const originHostname = hostnameOf(origin)
    if (!originHostname || !isLocalHostname(originHostname)) {
      throw createError({ statusCode: 403, statusMessage: 'forbidden origin' })
    }
  }
})
