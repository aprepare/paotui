# Product Overview

校园跑腿 (Campus Errand Runner) is a WeChat Mini Program for university campus life services. It connects students who need tasks done with riders/helpers who can fulfill them.

## Core Features

- **Express Pickup (代取快递)**: Students post package pickup requests; riders accept and deliver to dorms. Supports real-time rider location tracking, photo proof of pickup/delivery, and tipping.
- **General Errands (万能跑腿)**: Flexible task posting (buy food, return library books, print documents, etc.)
- **Carpooling (校园拼车)**: Organize shared rides to train stations, airports, etc.
- **Second-hand Market (二手市场)**: Buy/sell used goods among students.
- **Campus Forum (校园广场)**: Social posts with likes, comments, and favorites.
- **Team Up (校园组队)**: Organize group activities (sports, gaming, study groups).
- **Messaging**: In-app notification system for order status updates, likes, comments.
- **Rider System**: Students can register as riders to accept delivery tasks and earn income.

## User Roles

- **Regular User**: Posts orders/tasks, browses forum/market, joins teams.
- **Rider (骑手)**: Registered users who accept and fulfill express/errand orders.

## Key Business Logic

- Orders follow status flows: express (待接单→已接单→配送中→已完成/已取消), errands (待接单→进行中→已完成/已取消).
- Users auto-register on first WeChat login via openid.
- Login completion requires setting a nickname (profile page).
- All prices are in CNY (¥). Tips incentivize faster pickup.
