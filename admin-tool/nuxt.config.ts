import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2025-08-24',
  devtools: { enabled: false },
  devServer: {
    // frontend (3000) と衝突しないようにする
    port: 3100
  },
  app: {
    head: {
      titleTemplate: '%s | HOWLING WOLF 管理ツール',
      htmlAttrs: { lang: 'ja' },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'robots', content: 'noindex, nofollow' }
      ]
    }
  },
  modules: ['@nuxt/eslint'],
  css: ['~/assets/css/main.css'],
  vite: {
    plugins: [tailwindcss()]
  },
  typescript: {
    typeCheck: true
  },
  // サーバー専用設定。NUXT_DB_HOST などの環境変数で上書きできる
  runtimeConfig: {
    dbHost: '127.0.0.1',
    dbPort: '4306',
    dbUser: 'howlingwolfuser',
    dbPassword: 'howlingwolfpass',
    dbName: 'howlingwolfdb',
    // Firebase Admin SDK のサービスアカウント JSON パス。未設定なら Firebase 情報は取得しない
    firebaseServiceAccountPath: ''
  }
})
