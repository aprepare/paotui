# Tech Stack

## Frontend
- **Framework**: uni-app 3.x (Vue 3 with Composition API + `<script setup>`)
- **Build Tool**: Vite 5.2
- **Language**: JavaScript (no TypeScript in app code)
- **Styling**: Scoped CSS in SFCs using `rpx` units (WeChat responsive units). Global theme via CSS custom properties in `App.vue` `:root`.
- **SCSS**: `src/uni.scss` provides uni-app built-in SCSS variables (not heavily used; most styling is inline scoped CSS).

## Backend
- **WeChat Cloud Functions** (`wx-server-sdk`): Serverless Node.js functions in `cloudfunctions/` directory.
- **Database**: WeChat Cloud Database (NoSQL, document-based). Accessed via `db.collection()`.
- **File Storage**: WeChat Cloud Storage for images (avatars, photos).
- **Auth**: WeChat openid-based. Auto-login on app launch via `wx.cloud.callFunction`. Phone number required for registration (SMS verification, dev code: `000000`).

## Primary Target Platform
- **WeChat Mini Program** (`mp-weixin`). WeChat is the primary target.
- **WeChat DevTools** project config: `project.config.json`
- WeChat AppID: `wx8c7aa4be058ad8`
- Cloud environment ID: `cloudbase-3g5qd6t022a198cf`

## Key Libraries
| Package | Purpose |
|---|---|
| `@dcloudio/uni-app` | uni-app core framework |
| `@dcloudio/vite-plugin-uni` | Vite plugin for uni-app |
| `vue` 3.4+ | UI framework |
| `wx-server-sdk` | WeChat cloud function SDK (backend) |

## Common Commands

```bash
# Development (WeChat Mini Program)
npm run dev:mp-weixin

# Build for production (WeChat Mini Program)
npm run build:mp-weixin

# Development (H5 / browser)
npm run dev:h5
```

Output for WeChat goes to `dist/dev/mp-weixin/` (dev) or `dist/build/mp-weixin/` (prod). Open this directory in WeChat DevTools.

## Cloud Function Deployment
Cloud functions are deployed individually through WeChat DevTools (right-click a cloud function folder → "上传并部署：云端安装依赖"). Each function has its own `package.json`. There is no unified deploy command.

## New DB Collections
New collections must be manually created in WeChat DevTools cloud console before use (they don't auto-create). If a collection doesn't exist, the cloud function should catch the error gracefully.

## Important Notes
- `USE_CLOUD = true` in cloud.js (using WeChat cloud development)
- Default admin phone: `19922240902`
- Dev SMS universal code: `000000`
- After editing `pages.json` or `manifest.json`, may need to restart dev server
- Sub-packages used for code splitting (carpool, team, graduate, skill, wash, admin, job-sub)
