# howling-wolf

人狼ゲーム HOWLING WOLF の monorepo。

## 構成

```
howling-wolf/
├── frontend/  # Nuxt 4 (Vue 3) フロントエンド
├── backend/   # Kotlin / Spring Boot バックエンド
├── admin-tool/ # 管理者向けローカル閲覧ツール (Nuxt 4、デプロイしない)
└── e2e/       # Playwright E2E
```

旧リポジトリ:
- frontend: https://github.com/h-orito/howling-wolf-ui (archived)
- backend: https://github.com/h-orito/howling-wolf-api (archived)

## 関連リポジトリ

- [lastwolf](https://github.com/h-orito/lastwolf)
- [firewolf](https://github.com/h-orito/firewolf)

## ローカル開発

各サブディレクトリの README / CLAUDE.md を参照。

```bash
# frontend
cd frontend && pnpm install && pnpm dev

# backend
cd backend && ./gradlew bootRun

# admin-tool (管理者向け。ローカル MySQL に直接接続)
cd admin-tool && pnpm install && pnpm dev
```

## デプロイ

- frontend: Netlify (Base directory = `frontend`)
- backend: GitHub Actions → ghcr.io → k8s (`.github/workflows/deploy.yml`)
