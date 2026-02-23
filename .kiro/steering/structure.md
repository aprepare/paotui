# Project Structure

```
├── src/                          # Frontend (uni-app Vue 3)
│   ├── App.vue                   # App entry: cloud init, auto-login, global styles & CSS vars
│   ├── main.js                   # createSSRApp bootstrap
│   ├── pages.json                # Route definitions, nav bar styles, tab bar config
│   ├── manifest.json             # App metadata, WeChat appid, permissions
│   ├── uni.scss                  # uni-app built-in SCSS variables
│   ├── pages/                    # Main package pages
│   │   ├── index/                # Home page (live stats, latest orders, building filter)
│   │   ├── express/              # Express pickup: index, create, detail, rider-register, building-orders
│   │   ├── errand/               # General errands: index, create, detail
│   │   ├── order/                # My orders: all, create, detail, list
│   │   ├── market/               # Second-hand market: index, create, detail, my
│   │   ├── forum/                # Campus forum: index, create, detail, my
│   │   ├── job/                  # Part-time jobs hub: index (main listing)
│   │   ├── welfare/              # Campus welfare / deals (configurable from admin)
│   │   ├── mine/                 # Profile: index, favorites, services, wallet, withdraw
│   │   ├── message/              # Message center
│   │   ├── login/                # Login / profile completion (phone required)
│   │   └── kefu/                 # Customer service (image display)
│   ├── pages/ (subPackages)      # Sub-packages for code splitting
│   │   ├── carpool/              # Carpooling: index, create, detail
│   │   ├── team/                 # Team up: index, create, detail, list
│   │   ├── graduate/             # Graduate exam: index, checkin, schedule, resources, experience
│   │   ├── skill/                # Skill rental: index, create, detail
│   │   ├── wash/                 # Shoe washing group buy: index
│   │   ├── admin/                # In-app admin panel: index
│   │   └── job-sub/              # Job sub-pages: tutor, tutor-create, campus, anaya, arcadia, seasonal, all
│   ├── components/
│   │   ├── CustomTabBar.vue      # Custom tab bar (replaces native tabBar)
│   │   ├── MsgNotify.vue         # Floating unread message notification banner
│   │   └── ServiceFab.vue        # Floating customer service button
│   ├── utils/
│   │   └── cloud.js              # Helpers: callCloud(), checkLogin(), uploadImage(), uploadImages()
│   └── static/                   # Static assets (logo, tab icons, action icons, welfare icons, QR codes)
│
├── cloudfunctions/               # Backend (WeChat Cloud Functions)
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
│   ├── admin/                    # Admin: stats, CRUD for all modules, welfare config, wash products
│   └── seed/                     # Test data seeder (populates all collections)
│
├── server/                       # Express.js + MongoDB backend (currently unused, switched back to cloud)
├── admin/                        # Vue 3 + Element Plus admin panel (web, currently unused)
├── project.config.json           # WeChat DevTools project config
├── vite.config.js                # Vite config (uni plugin only)
└── package.json                  # Frontend dependencies and scripts
```

## Conventions

### Frontend Pages
- Each feature has its own folder under `src/pages/` with standard sub-pages: `index.vue` (list), `create.vue` (form), `detail.vue` (single item), and optionally `my.vue` (user's own items).
- Pages use Vue 3 `<script setup>` with Composition API. Lifecycle hooks come from `@dcloudio/uni-app` (`onLoad`, `onShow`, `onPullDownRefresh`, etc.).
- Navigation uses `uni.navigateTo()` and `uni.switchTab()`. Login gating via `checkLogin()` from `src/utils/cloud.js`.
- All cloud calls go through `callCloud(functionName, action, data)` — never call `wx.cloud.callFunction` directly from pages.
- Custom tab bar: native tabBar is hidden via `uni.hideTabBar()` in `onShow`, replaced by `CustomTabBar.vue` component.

### Cloud Functions
- Each cloud function is a single `index.js` using CommonJS (`require`/`exports.main`).
- Every function uses an `action` dispatcher pattern: `event.action` routes to a `switch/case` block.
- Standard response shape: `{ code: 0, data: ... }` for success, `{ code: -1, msg: '...' }` for errors.
- User identity comes from `cloud.getWXContext().OPENID` — never passed from the client.
- Each cloud function has its own `package.json` with `wx-server-sdk` as the sole dependency.
- Use try/catch around collection queries to handle missing collections gracefully.

### Database Collections
| Collection | Used By |
|---|---|
| `users` | user |
| `express_orders` | express, order, home |
| `errand_tasks` | errand, order, home |
| `carpool` | carpool, order |
| `forum_posts` | forum |
| `forum_comments` | forum |
| `market_goods` | market |
| `team_activities` | team |
| `team_members` | team |
| `messages` | message, express, errand, forum, tutor |
| `user_favorites` | user |
| `sms_codes` | user |
| `stats` | home, express |
| `tutor_posts` | tutor |
| `wash_products` | wash, admin |
| `wash_groups` | wash |
| `skill_posts` | skill |
| `page_config` | home, admin |
| `welfare_config` | admin |

### Styling
- Uses `rpx` units throughout (750rpx = screen width on WeChat).
- Global CSS variables defined in `App.vue` `:root` (e.g. `--primary: #2B6CB0`).
- Scoped `<style scoped>` in every component. No external CSS frameworks.
- Consistent design language: rounded cards, gradient backgrounds, emoji icons, shadow utilities.
