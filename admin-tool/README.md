# admin-tool

HOWLING WOLF の管理者向けローカル閲覧ツール。デプロイせず、ローカルで起動して DB に直接接続して使う。

## できること

- プレイヤー検索・詳細
  - uid / ニックネーム / 権限 / 入村制限 / Twitter ユーザー名 (DB)
  - 入村制限 (`PLAYER.IS_RESTRICTED_PARTICIPATION`) の ON / OFF 切り替え (confirm あり)
  - Firebase Authentication 上のアカウント情報 (Google / Twitter などの provider、email)。未設定時は `twitter_user` テーブルの Twitter ユーザー名を表示
  - 参加した村 (キャラクター / 役職 / 退村・見学・死亡)
- 村検索・参加者一覧 (退村済み `is_gone = true` は除外)
  - プレイヤー情報 / 参加キャラクター名 / 役職
  - IP アドレス / クライアントトークン / それぞれの登録日時
  - 他の参加者と IP・トークンが重複している値を赤字で表示

## 構成

Nuxt 4 単体で完結する。ブラウザ → Nitro server routes (`server/api/`) → MySQL / Firebase Admin SDK。
backend (Spring Boot) の API は使わない。

```
admin-tool/
├── app/            # 画面 (pages / layouts / components)
├── server/api/     # /api/players, /api/villages, /api/status
├── server/utils/   # DB 接続 (mysql2) / Firebase Admin SDK
└── shared/types/   # API レスポンス型 (app / server 共有)
```

## 起動

```bash
cd admin-tool
pnpm install
pnpm dev   # http://localhost:3100
```

### 接続先の設定

環境変数 (または `.env`) で指定する。既定値はリポジトリ直下 `docker-compose.yml` のローカル MySQL。

| 環境変数                             | 既定値            | 説明                                                                                |
| ------------------------------------ | ----------------- | ----------------------------------------------------------------------------------- |
| `NUXT_DB_HOST`                       | `127.0.0.1`       | MySQL ホスト                                                                        |
| `NUXT_DB_PORT`                       | `4306`            | MySQL ポート                                                                        |
| `NUXT_DB_USER`                       | `howlingwolfuser` | ユーザー                                                                            |
| `NUXT_DB_PASSWORD`                   | `howlingwolfpass` | パスワード                                                                          |
| `NUXT_DB_NAME`                       | `howlingwolfdb`   | データベース名                                                                      |
| `NUXT_FIREBASE_SERVICE_ACCOUNT_PATH` | (空)              | Firebase Admin SDK サービスアカウント JSON のパス。空なら Firebase 情報は取得しない |

`.env.example` をコピーして `.env` を作ると楽。

本番 DB を参照する場合は、SSH / kubectl などでポートフォワードしたうえで `NUXT_DB_HOST` / `NUXT_DB_PORT` を向ける。

```bash
NUXT_DB_PORT=13306 NUXT_DB_PASSWORD=xxx NUXT_FIREBASE_SERVICE_ACCOUNT_PATH=/path/to/serviceAccount.json pnpm dev
```

ホーム画面 (`/`) で DB 接続と Firebase 設定の状態を確認できる。

## 注意

- 書き込みは入村制限フラグの更新のみ (`PUT /api/players/:id/restricted`)。本番 DB を向けている場合はそのまま本番に反映される
- 認証はない。IP アドレスやトークンを表示するため、**外部に公開しないこと**
- 検索結果は最大 100 件

## コマンド

```bash
pnpm lint
pnpm format
pnpm type-check
```
