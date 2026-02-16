/**
 * SMS Parser - extracted from src/pages/express/create.vue onSmsInput()
 * Pure function: takes SMS text, returns parsed result.
 */

const COMPANIES = ['顺丰', '京东', '中通', '韵达', '圆通', '申通', '极兔', '百世', '天天', '邮政', 'EMS', '德邦', '丰网', '众邮', '宅急送']

export function parseSms(text) {
  if (!text || text.length < 6) {
    return { recognized: false, pickupPoint: '', pickupCode: '', expressCompany: '' }
  }

  var foundPoint = ''
  var foundCode = ''
  var foundCompany = ''

  // ===== 识别快递公司 =====
  for (var ei = 0; ei < COMPANIES.length; ei++) {
    if (text.indexOf(COMPANIES[ei]) !== -1) {
      foundCompany = COMPANIES[ei]
      break
    }
  }
  if (!foundCompany) {
    var signMatch = text.match(/【([^】]{2,10})】/)
    if (signMatch) {
      var sign = signMatch[1]
      for (var si = 0; si < COMPANIES.length; si++) {
        if (sign.indexOf(COMPANIES[si]) !== -1) {
          foundCompany = COMPANIES[si]
          break
        }
      }
      if (!foundCompany && (sign.indexOf('快递') !== -1 || sign.indexOf('速递') !== -1 || sign.indexOf('物流') !== -1)) {
        foundCompany = sign
      }
    }
  }

  // ===== 识别取件码 =====
  var cnBracketMatch = text.match(/凭[「]([A-Za-z0-9\-]{4,20})[」]/)
  if (cnBracketMatch) foundCode = cnBracketMatch[1]
  if (!foundCode) {
    var labelCodeMatch = text.match(/提货码\s*([A-Za-z0-9\-]{4,20})/)
    if (labelCodeMatch) foundCode = labelCodeMatch[1]
  }
  if (!foundCode) {
    var pingMatch = text.match(/[可请]*凭\s*([A-Za-z]-[\d]-\d{4})/)
    if (pingMatch) foundCode = pingMatch[1]
  }
  if (!foundCode) {
    var pingMatch2 = text.match(/[可请]*凭\s*(\d{1,3}-\d{1,3}-\d{2,8})/)
    if (pingMatch2) foundCode = pingMatch2[1]
  }
  if (!foundCode) {
    var pingMatch3 = text.match(/[可请]*凭\s*([A-Za-z]-\d{2,8})/)
    if (pingMatch3) foundCode = pingMatch3[1]
  }
  if (!foundCode) {
    var pingMatch4 = text.match(/[可请]*凭\s*(\d{6,12})/)
    if (pingMatch4) foundCode = pingMatch4[1]
  }
  if (!foundCode) {
    var labelPatterns = [
      /取件码[：:\s]*([A-Za-z0-9\-]{2,20})/,
      /取货码[：:\s]*([A-Za-z0-9\-]{2,20})/,
      /取件号[：:\s]*([A-Za-z0-9\-]{2,20})/,
      /验证码[：:\s]*([A-Za-z0-9\-]{2,20})/,
      /签收码[：:\s]*([A-Za-z0-9\-]{2,20})/,
      /开柜码[：:\s]*([A-Za-z0-9\-]{2,20})/,
      /开箱码[：:\s]*([A-Za-z0-9\-]{2,20})/
    ]
    for (var ki = 0; ki < labelPatterns.length; ki++) {
      var km = text.match(labelPatterns[ki])
      if (km) { foundCode = km[1]; break }
    }
  }
  if (!foundCode) {
    var dashMatch = text.match(/(\d{1,3}-\d{1,3}-\d{2,8})/)
    if (dashMatch) foundCode = dashMatch[1]
  }

  // ===== 识别取件点 =====
  var yidaoMatch = text.match(/已到([^,，。！!?？\n]{2,40})[,，]/)
  if (yidaoMatch) {
    foundPoint = yidaoMatch[1].replace(/\s+$/, '')
    var slotAfterDao = text.match(/凭[^到]*到([A-Z]\d{1,3})取件/)
    if (slotAfterDao) foundPoint = foundPoint + slotAfterDao[1]
  }
  if (!foundPoint) {
    var guiSlotMatch = text.match(/到([^\s,，。！!?？]{2,30}柜)([A-Z]\d{1,3})取件/)
    if (guiSlotMatch) foundPoint = guiSlotMatch[1] + guiSlotMatch[2]
  }
  if (!foundPoint) {
    var qingpingMatch = text.match(/凭[^到]*到([^\s,，。！!?？]{2,40}?)(?:领取|取件|自取|取(?:[,，。\s]|$))/)
    if (qingpingMatch) {
      var pt = qingpingMatch[1]
      if (pt.indexOf('到店') === -1 && pt.indexOf('店学校') === -1) {
        if (!/^[A-Z]\d{1,3}$/.test(pt)) foundPoint = pt
      }
    }
  }
  if (!foundPoint) {
    var angleBracketMatch = text.match(/在<([^>]{2,30})>/)
    if (angleBracketMatch) foundPoint = angleBracketMatch[1]
  }
  if (!foundPoint) {
    var yidaoMatch2 = text.match(/已到([^,，。！!?？\n]{2,40}?)(?:[,，]|，请|，凭|请)/)
    if (yidaoMatch2) foundPoint = yidaoMatch2[1].replace(/\s+$/, '')
  }
  if (!foundPoint) {
    var brandPatterns = [
      /菜鸟驿站[A-Za-z0-9\u4e00-\u9fa5（()）]*/,
      /菜鸟[A-Za-z0-9\u4e00-\u9fa5]*驿站/,
      /丰巢[快递柜]*[A-Za-z0-9\u4e00-\u9fa5（()）]*/,
      /速递易[A-Za-z0-9\u4e00-\u9fa5]*/,
      /近邻宝[A-Za-z0-9\u4e00-\u9fa5]*/,
      /驿收发[A-Za-z0-9\u4e00-\u9fa5]*/,
      /妈妈驿站[A-Za-z0-9\u4e00-\u9fa5]*/
    ]
    for (var pi = 0; pi < brandPatterns.length; pi++) {
      var pm = text.match(brandPatterns[pi])
      if (pm) { foundPoint = pm[0]; break }
    }
  }
  if (!foundPoint) {
    var locMatch = text.match(/(?:已到|已放|已存|存放在?|放在|放到|在)[\s:：]*([^\s,，。！!?？\n]{2,25}(?:驿站|快递柜|快递点|代收点|自提点|服务站|营业部|超市|门店|柜|站点|站))/)
    if (locMatch) foundPoint = locMatch[1]
  }

  // 清理取件点
  if (foundPoint) {
    var addrIdx = foundPoint.indexOf('，地址')
    if (addrIdx > 0) foundPoint = foundPoint.substring(0, addrIdx)
    foundPoint = foundPoint.replace(/运单尾号.*$/, '').replace(/\s+$/, '')
  }

  return {
    recognized: !!(foundPoint || foundCode),
    pickupPoint: foundPoint,
    pickupCode: foundCode,
    expressCompany: foundCompany,
  }
}

export { COMPANIES }
