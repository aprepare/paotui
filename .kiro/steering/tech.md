# Tech Stack

## Frontend
- **Framework**: uni-app 3.x (Vue 3 with Composition API + `<script setup>`)
- **Build Tool**: Vite 5.2
- **Language**: JavaScript (no TypeScript in app code)
- **Styling**: Scoped CSS in SFCs using `rpx` units (WeChat responsive units). Global theme via CSS custom properties in `App.vue` `:root`.
- **SCSS**: `src/uni.scss` provides uni-app built-in SCSS variables (not heavily used; most styling is inline scoped CSS).
- **i18n**: `vue-i18n` is a dependency but not actively configured.

## Backend
- **WeChat Cloud Functions** (`wx-server-sdk`): Serverless Node.js functions in `cloudfunctions/` directory.
- **Database**: WeChat Cloud Database (NoSQL, document-based). Accessed via `db.collection()`.
- **File Storage**: WeChat Cloud Storage for images (avatars, photos).
- **Auth**: WeChat openid-based. Auto-login on app launch via `wx.cloud.callFunction`.

## Primary Target Platform
- **WeChat Mini Program** (`mp-weixin`). The project also supports H5 and other mini program platforms via uni-app, but WeChat is the primary target.
- **WeChat DevTools** project config: `project.config.json`
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

# Build for H5
npm run build:h5
```

Output for WeChat goes to `dist/dev/mp-weixin/` (dev) or `dist/build/mp-weixin/` (prod). Open this directory in WeChat DevTools.

## Cloud Function Deployment
Cloud functions are deployed individually through WeChat DevTools (right-click a cloud function folder → "Upload and Deploy"). Each function has its own `package.json`. There is no unified deploy command.

## Seed Data
Run the `seed` cloud function to populate test data across all collections. Deploy it via WeChat DevTools, then invoke it from the console or a test page.
