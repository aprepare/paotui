# Project Structure

```
├── src/                          # Frontend (uni-app Vue 3)
│   ├── App.vue                   # App entry: cloud init, auto-login, global styles & CSS vars
│   ├── main.js                   # createSSRApp bootstrap
│   ├── pages.json                # Route definitions, nav bar styles, tab bar config
│   ├── manifest.json             # App metadata, WeChat appid, permissions
│   ├── uni.scss                  # uni-app built-in SCSS variables
│   ├── pages/                    # Main package pages (6 pages)
│   │   ├── index/                # Home page (live stats, latest orders, building filter)
│   │   ├── welfare/              # Campus welfare / deals (configurable from admin)
│   │   ├── forum/                # Campus forum: index (list, inline create/detail/my also exist but routed via forum-sub)
│   │   ├── mine/                 # Profile: index
│   │   ├── job/                  # Part-time jobs hub: index (main listing, also has legacy all/anaya/arcadia/campus/seasonal/tutor files)
│   │   └── login/                # Login / profile completion (phone required)
│   ├── pages/ (subPackages)      # Sub-packages for code splitting (16 sub-packages)
│   │   ├── express/              # Express pickup: index, create, detail, rider-register, building-orders
│   │   ├── errand/               # General errands: index, create, detail
│   │   ├── order/                # My orders: all, create, detail, list
│   │   ├── market/               # Second-hand market: index, create, detail, my
│   │   ├── forum-sub/            # Forum sub-pages: create, detail, my
│   │   ├── message/              # Message center: index
│   │   ├── mine-sub/             # Profile sub-pages: favorites, services, wallet, withdraw
│   │   ├── kefu/                 # Customer service: show (image display)
│   │   ├── carpool/              # Carpooling: index, create, detail
│   │   ├── team/                 # Team up: index, create, detail, list
│   │   ├── graduate/             # Graduate exam: index, checkin, schedule, resources, experience, experience-detail, experience-create
│   │   ├── skill/                # Skill rental: index, create, detail
│   │   ├── wash/                 # Shoe washing group buy: index
│   │   ├── food/                 # Food ordering (福利外卖): index, menu, confirm, orders, detail
│   │   ├── admin/                # In-app admin panel: index
│   │   └── job-sub/              # Job sub-pages: tutor, tutor-create, campus, anaya, arcadia, seasonal, all
│   ├── components/
│   │   ├── CustomTabBar.vue      # Custom tab bar (replaces native tabBar)
│   │   ├── MsgNotify.vue         # Floating unread message notification banner
│   │   ├── ServiceFab.vue        # Floating customer service button
│   │   ├── EmptyState.vue        # Reusable empty state placeholder
│   │   └── FabButton.vue         # Floating action button
│   ├── utils/
│   │   ├── cloud.js              # Helpers: callCloud(), checkLogin(), autoLogin(), uploadImage(), uploadImages()
│   │   └── foodOrder.js          # Food order utilities: getStatusInfo(), calcOrderPrice(), validateOrder(), canCancel()
│   └── static/                   # Static assets
│       ├── tab/                  # Tab bar icons (run, market, forum, team, mine + active variants)
│       ├── action/               # Action icons (kuaidi, paotui, qishou)
│       ├── welfare/              # Welfare page icons (bashi, dazi, ershou, jineng, kaoyan, pinche, waimai, xihu)
│       ├── logo.png              # App logo
│       ├── kuaidi.jpg            # Express service image
│       ├── TeamWork.jpg          # Customer service QR code image
│       └── qrcode-work-wechat.jpg # Work WeChat QR code
│
├── cloudfunctions/               # Backend (WeChat Cloud Functions, 18 functions)
│   ├── user/                     # Auth, profile, rider registration, favorites, SMS
│   ├── express/                  # Express order CRUD, accept, status, location, building stats
│   ├── errand/                   # Errand task CRUD, accept, status
│   ├── order/                    # Aggregated order queries (my published, my accepted, my carpool)
│   ├── carpool/                  # Carpool CRUD, join/leave
│   ├── market/                   # Market goods CRUD, want
│   ├── forum/                    # Forum posts, comments, likes
│   ├── team/                     # Team activities, join/leave, photos
│   ├── message/                  # Message CRUD, read/unread, send
│   ├── home/                     # Home page data: live stats, latest orders, page config
│   ├── tutor/                    # Tutor posts: list, create, apply, contact, delete
│   ├── wash/                     # Wash group buy: products, groups, join, my groups
│   ├── skill/                    # Skill rental: list, create, detail
│   ├── food/                     # Food ordering: shops, menus, orders, rider accept, Feie cloud printer integration
│   ├── experience/               # Experience posts: list, create, detail, comments, likes
│   ├── autoConfirm/              # Scheduled: 24h auto-confirm for express/errand orders (hourly trigger)
│   ├── admin/                    # Admin: stats, CRUD for all modules, welfare config, wash products
│   └── seed/                     # Test data seeder (populates all collections)
│
├── server/                       # Express.js + MongoDB backend (alternative backend, not primary)
│   ├── app.js                    # Express server entry, Mongoose connection
│   ├── config/                   # Server config (port, mongoUri)
│   ├── middleware/               # Auth middleware (auth, adminAuth)
│   ├── models/                   # Mongoose models (16 models)
│   ├── routes/                   # REST API routes (12 route files)
│   ├── services/                 # External services (qiniu upload, wechat integration)
│   └── scripts/                  # Utility scripts
│
├── admin/                        # Vue 3 + Element Plus web admin panel (alternative admin, not primary)
│   ├── src/                      # Admin panel source (api, layouts, router, stores, views)
│   ├── vite.config.js            # Vite config for admin
│   └── package.json              # Dependencies: element-plus, axios, pinia, vue-router, vuedraggable
│
├── tests/                        # Test files (vitest)
├── project.config.json           # WeChat DevTools project config
├── vite.config.js                # Vite config (uni plugin only)
├── vitest.config.js              # Vitest config
└── package.json                  # Frontend dependencies and scripts
```

## Conventions

### Frontend Pages
- Each feature has its own folder under `src/pages/` with standard sub-pages: `index.vue` (list), `create.vue` (form), `detail.vue` (single item), and optionally `my.vue` (user's own items).
- Pages use Vue 3 `<script setup>` with Composition API. Lifecycle hooks come from `@dcloudio/uni-app` (`onLoad`, `onShow`, `onPullDownRefresh`, etc.).
- Navigation uses `uni.navigateTo()` and `uni.switchTab()`. Login gating via `checkLogin()` from `src/utils/cloud.js`.
- All cloud calls go through `callCloud(functionName, action, data)` — never call `wx.cloud.callFunction` directly from pages.
- Custom tab bar: native tabBar is hidden via `uni.hideTabBar()` in `onShow`, replaced by `CustomTabBar.vue` component.
- Tab bar has 5 tabs: 首页, 兼职, 广场, 福利, 我的.
- Job sub-pages (campus, anaya, arcadia, seasonal) use a bottom-sheet popup for job details. Each job item has a `description` field for work details. Popup includes info grid, work description section, and a "contact customer service" button linking to `/pages/kefu/show`.
- Forum pages are split: `pages/forum/index.vue` is the main page (tab page), while create/detail/my are in the `pages/forum-sub/` sub-package.
- Mine pages are split: `pages/mine/index.vue` is the main page (tab page), while favorites/services/wallet/withdraw are in the `pages/mine-sub/` sub-package.

### Cloud Functions
- Each cloud function is a single `index.js` using CommonJS (`require`/`exports.main`).
- Every function uses an `action` dispatcher pattern: `event.action` routes to a `switch/case` block.
- Standard response shape: `{ code: 0, data: ... }` for success, `{ code: -1, msg: '...' }` for errors.
- User identity comes from `cloud.getWXContext().OPENID` — never passed from the client.
- Each cloud function has its own `package.json` with `wx-server-sdk` as the sole dependency (except `food/` which also uses `crypto` for Feie printer signing).
- Use try/catch around collection queries to handle missing collections gracefully.
- `autoConfirm` is a scheduled cloud function (hourly trigger) that auto-completes express/errand orders after 24 hours.

### Database Collections
| Collection | Used By |
|---|---|
| `users` | user |
| `express_orders` | express, order, home, autoConfirm |
| `errand_tasks` | errand, order, home, autoConfirm |
| `carpool` | carpool, order |
| `forum_posts` | forum |
| `forum_comments` | forum |
| `market_goods` | market |
| `team_activities` | team |
| `team_members` | team |
| `messages` | message, express, errand, forum, tutor, experience |
| `user_favorites` | user |
| `sms_codes` | user |
| `stats` | home, express |
| `tutor_posts` | tutor |
| `wash_products` | wash, admin |
| `wash_groups` | wash |
| `wash_orders` | wash |
| `skill_posts` | skill |
| `page_config` | home, admin, food (printer config) |
| `welfare_config` | admin |
| `food_shops` | food, admin |
| `food_items` | food |
| `food_orders` | food |
| `experience_posts` | experience |
| `experience_comments` | experience |

### Styling
- Uses `rpx` units throughout (750rpx = screen width on WeChat).
- Global CSS variables defined in `App.vue` `:root` (e.g. `--primary: #2B6CB0`, `--primary-light`, `--primary-dark`, `--accent`, `--bg`, `--card-bg`, `--text-primary`, `--text-secondary`, `--text-hint`, `--border`, `--success`, `--warning`, `--shadow-sm`, `--shadow`, `--shadow-md`, `--shadow-lg`).
- Scoped `<style scoped>` in every component. No external CSS frameworks.
- Consistent design language: rounded cards, gradient backgrounds, emoji icons, shadow utilities.
- Global `.tap-active` class for press feedback animation.
