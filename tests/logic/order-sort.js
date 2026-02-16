/**
 * Order sorting and building filter logic - extracted from src/pages/index/index.vue
 * Pure functions for testing.
 */

// Express status priority: 待接单(0) > 配送中(2) > 已接单(1) > 已完成(3) > 已取消(4)
const expressPriority = { 0: 0, 2: 1, 1: 2, 3: 3, 4: 4 }
// Errand status priority: 待接单(0) > 进行中(1) > 待确认(4) > 已完成(2) > 已取消(3)
const errandPriority = { 0: 0, 1: 1, 4: 2, 2: 3, 3: 4 }

/**
 * Sort orders by status priority then by tip (descending).
 * @param {Array} orders - array of order objects with { orderType, status, tip }
 * @returns {Array} sorted copy
 */
export function sortOrders(orders) {
  return [...orders].sort((a, b) => {
    var pm = a.orderType === 'errand' ? errandPriority : expressPriority
    var pm2 = b.orderType === 'errand' ? errandPriority : expressPriority
    var aOrder = pm[a.status] !== undefined ? pm[a.status] : 5
    var bOrder = pm2[b.status] !== undefined ? pm2[b.status] : 5
    if (aOrder !== bOrder) return aOrder - bOrder
    return (b.tip || 0) - (a.tip || 0)
  })
}

/**
 * Compute building filter tabs from sorted orders.
 * @param {Array} orders - sorted order array with { buildingName }
 * @returns {Array} tabs like [{ name: '全部', count: N }, { name: 'X栋', count: M }, ...]
 */
export function computeBuildingTabs(orders) {
  var map = {}
  orders.forEach(function (o) {
    var name = o.buildingName || '未知'
    if (!map[name]) map[name] = 0
    map[name]++
  })
  var tabs = [{ name: '全部', count: orders.length }]
  Object.keys(map).forEach(function (k) {
    tabs.push({ name: k, count: map[k] })
  })
  return tabs
}

export { expressPriority, errandPriority }
