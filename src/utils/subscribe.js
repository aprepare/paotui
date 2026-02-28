/**
 * 微信订阅消息工具
 * 模板ID配置 + 授权请求 + 发送辅助
 */

// 订阅消息模板ID
export const TEMPLATE = {
  // 订单状态通知（字段：订单号、订单状态、提示信息、时间）
  ORDER_STATUS: 'xlvGM1wbE0FKTpG7rB8ktBsCo1gn_9n0USbqRw48fjI',
  // 留言提醒（字段：用户名称、备注消息）
  MESSAGE_REMIND: 'Xx4pl5WbjptPWfN3zS7Trz2yQV6eukLMDgsj4uXNOH4'
}

/**
 * 请求订阅消息授权
 * @param {string[]} tmplIds - 模板ID数组，最多3个
 * @returns {Promise<object>} 每个模板的授权结果
 */
export const requestSubscribe = (tmplIds) => {
  return new Promise((resolve) => {
    // #ifdef MP-WEIXIN
    wx.requestSubscribeMessage({
      tmplIds: tmplIds,
      success: (res) => {
        console.log('[subscribe] 授权结果', res)
        resolve(res)
      },
      fail: (err) => {
        console.log('[subscribe] 授权失败或取消', err)
        resolve({})
      }
    })
    // #endif
    // #ifndef MP-WEIXIN
    resolve({})
    // #endif
  })
}

/**
 * 请求订单相关订阅授权
 * 在用户下单、接单时调用
 */
export const requestOrderSubscribe = () => {
  return requestSubscribe([TEMPLATE.ORDER_STATUS])
}

/**
 * 请求互动消息订阅授权
 * 在用户发帖、评论时调用
 */
export const requestMessageSubscribe = () => {
  return requestSubscribe([TEMPLATE.MESSAGE_REMIND])
}

/**
 * 同时请求订单+消息订阅授权
 */
export const requestAllSubscribe = () => {
  return requestSubscribe([TEMPLATE.ORDER_STATUS, TEMPLATE.MESSAGE_REMIND])
}
