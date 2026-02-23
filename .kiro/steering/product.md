# Product Overview

校园跑腿 (Campus Errand Runner) is a WeChat Mini Program for university campus life services. It connects students who need tasks done with riders/helpers who can fulfill them.

## Core Features

- **Express Pickup (代取快递)**: Package pickup requests; riders accept and deliver to dorms. Real-time location tracking, photo proof, tipping.
- **General Errands (万能跑腿)**: Flexible task posting (buy food, return library books, print documents, etc.)
- **Carpooling (校园拼车)**: Organize shared rides to train stations, airports, etc.
- **Second-hand Market (二手市场)**: Buy/sell used goods among students.
- **Campus Forum (校园广场)**: Social posts with likes, comments, and favorites.
- **Team Up (校园组队)**: Organize group activities (sports, gaming, study groups). Supports enterprise WeChat group chat QR code.
- **Part-time Jobs (校园兼职)**: Job listings with sub-categories: tutoring, campus jobs, Anaya resort, Arcadia resort, seasonal jobs.
- **Tutoring (家教信息)**: Parents post tutoring demands; students post tutor profiles. Apply/contact with in-app messaging.
- **Shoe Washing Group Buy (洗鞋团购)**: Group purchase for shoe cleaning services with product catalog and group management.
- **Skill Rental (技能出租)**: Students offer skills for hire (photography, design, tutoring, etc.)
- **Graduate Exam Services (考研服务)**: Study check-in, schedule, resources, experience sharing.
- **Messaging**: In-app notification system for order status updates, likes, comments, tutor applications.
- **Rider System**: Students register as riders to accept delivery tasks and earn income.
- **Wallet & Withdraw (钱包提现)**: View balance and request withdrawals.
- **In-app Admin Panel (管理后台)**: Admin page within the mini program for managing orders, users, products, forum posts, wash products, welfare config.

## User Roles

- **Regular User**: Posts orders/tasks, browses forum/market, joins teams.
- **Rider (骑手)**: Registered users who accept and fulfill express/errand orders.
- **Admin**: Phone number `19922240902`. Access in-app admin panel via "我的" page.

## Key Business Logic

- Orders follow status flows: express (待接单→已接单→配送中→已完成/已取消), errands (待接单→进行中→已完成/已取消).
- Users auto-register on first WeChat login via openid.
- Login requires phone number (SMS verification, dev universal code: `000000`).
- All prices are in CNY (¥). Tips incentivize faster pickup.
- Custom tab bar component replaces native tabBar (hidden via `uni.hideTabBar`).
- Welfare page services are configurable from admin panel.
