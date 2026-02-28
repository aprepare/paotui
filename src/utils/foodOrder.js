/**
 * 外卖订单工具模块
 * 状态转换、价格计算、数据验证等核心逻辑
 */

/**
 * 获取订单状态信息（文案 + 颜色）
 * @param {number} status - 订单状态码 0-4
 * @param {string} deliveryMode - 配送模式 'delivery' | 'self_pickup'
 * @returns {{ text: string, color: string }}
 */
export function getStatusInfo(status, deliveryMode) {
  const map = {
    0: { text: '待确认', color: '#DD6B20' },
    1: { text: '制作中', color: '#38A169' },
    2: {
      text: deliveryMode === 'self_pickup' ? '待自取' : '配送中',
      color: '#4299E1'
    },
    3: { text: '已完成', color: '#A0AEC0' },
    4: { text: '已取消', color: '#E53E3E' }
  }
  return map[status] || map[0]
}

/**
 * 判断订单是否可取消（status <= 1）
 * @param {number} status
 * @returns {boolean}
 */
export function canCancel(status) {
  return status <= 1
}

/**
 * 判断骑手是否可接单（status === 2 且为骑手配送模式）
 * @param {number} status
 * @param {string} deliveryMode
 * @returns {boolean}
 */
export function canRiderAccept(status, deliveryMode) {
  return status === 2 && deliveryMode === 'delivery'
}

/**
 * 计算订单总价
 * @param {Array<{ price: number, quantity: number }>} items - 商品列表
 * @param {number} deliveryFee - 配送费
 * @returns {{ itemsTotal: number, totalPrice: number }}
 */
export function calcOrderPrice(items, deliveryFee) {
  const itemsTotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const fee = typeof deliveryFee === 'number' && deliveryFee >= 0 ? deliveryFee : 0
  return {
    itemsTotal: Math.round(itemsTotal * 100) / 100,
    totalPrice: Math.round((itemsTotal + fee) * 100) / 100
  }
}

const REQUIRED_FIELDS = [
  'openid', 'shopId', 'shopName', 'items', 'deliveryMode', 'phone', 'userName', 'status'
]

/**
 * 验证订单数据完整性
 * @param {object} data - 订单数据
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateOrder(data) {
  const errors = []

  for (const field of REQUIRED_FIELDS) {
    if (data[field] === undefined || data[field] === null || data[field] === '') {
      errors.push(`缺少必填字段: ${field}`)
    }
  }

  if (!Array.isArray(data.items) || data.items.length === 0) {
    errors.push('商品列表不能为空')
  }

  if (data.deliveryMode !== 'delivery' && data.deliveryMode !== 'self_pickup') {
    errors.push('配送模式无效，必须为 delivery 或 self_pickup')
  }

  if (data.deliveryMode === 'delivery' && (!data.address || !data.address.trim())) {
    errors.push('骑手配送模式下收货地址不能为空')
  }

  if (data.deliveryMode === 'self_pickup' && data.deliveryFee !== 0) {
    errors.push('到店自取模式下配送费必须为 0')
  }

  return { valid: errors.length === 0, errors }
}
