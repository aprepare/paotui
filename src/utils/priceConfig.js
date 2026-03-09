/**
 * 全局价格配置中心
 * 前端所有页面共享同一份配置，从后端拉取一次
 */
import { callCloud } from './cloud'

// 默认值（后端未配置时使用）
const defaults = {
    // 快递配送费
    expressSmallFee: 2,
    expressMediumFee: 5,
    expressLargeFee: 20,
    // 家教查看联系方式费用（0=免费）
    tutorViewFee: 0.01,
    // 技能服务查看联系方式费用（0=免费）
    skillViewFee: 1,
    // 洗鞋跑腿取送费
    washDeliveryFee: 3
}

let _config = null
let _loading = null

/**
 * 获取价格配置（全局缓存）
 * @returns {Promise<object>}
 */
export async function getPriceConfig() {
    if (_config) return _config
    if (_loading) return _loading
    _loading = _fetchConfig()
    _config = await _loading
    _loading = null
    return _config
}

async function _fetchConfig() {
    try {
        const res = await callCloud('home', 'priceConfig', {})
        if (res.code === 0 && res.data) {
            return { ...defaults, ...res.data }
        }
    } catch (e) { }
    return { ...defaults }
}

/**
 * 强制刷新配置
 */
export function refreshPriceConfig() {
    _config = null
    _loading = null
}
