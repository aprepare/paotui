const WxPay = require('wechatpay-node-v3')
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

let wxpay = null

function getWxPay() {
    if (wxpay) return wxpay
    const privateKeyPath = path.resolve(__dirname, '..', process.env.WXPAY_PRIVATE_KEY_PATH || './certs/apiclient_key.pem')
    if (!fs.existsSync(privateKeyPath)) {
        console.error('[wxpay] 商户私钥文件不存在:', privateKeyPath)
        return null
    }
    // 微信支付 V3 库要求 publicKey 必须是真正的公钥证书格式（BEGIN CERTIFICATE）
    // 下单接口实际只用到 privateKey 进行签名。为了绕过初始化校验，传入一个基本的多行伪造证书结构，
    // 或者如果你有 apiclient_cert.pem，建议读取它。这里我们提供一个格式上能过校验的 dummy cert
    const dummyCert = '-----BEGIN CERTIFICATE-----\nMIIDhTCCAm2gAwIBAgIUBw==\n-----END CERTIFICATE-----'

    wxpay = new WxPay({
        appid: process.env.WX_APPID,
        mchid: process.env.WXPAY_MCH_ID,
        publicKey: dummyCert, // 绕过 publicKey 校验
        privateKey: fs.readFileSync(privateKeyPath),
        key: process.env.WXPAY_API_V3_KEY
    })
    return wxpay
}

const axios = require('axios')

function buildAuthorization(method, url, body) {
    const timestamp = Math.floor(Date.now() / 1000).toString()
    const nonce_str = crypto.randomBytes(16).toString('hex')
    const message = `${method}\n${url}\n${timestamp}\n${nonce_str}\n${body}\n`

    const privateKeyPath = path.resolve(__dirname, '..', process.env.WXPAY_PRIVATE_KEY_PATH || './certs/apiclient_key.pem')
    const privateKey = fs.readFileSync(privateKeyPath)

    // V3 要求使用 SHA256-RSA
    const sign = crypto.createSign('RSA-SHA256')
    sign.update(message)
    const signature = sign.sign(privateKey, 'base64')

    const auth = `WECHATPAY2-SHA256-RSA2048 mchid="${process.env.WXPAY_MCH_ID}",nonce_str="${nonce_str}",signature="${signature}",timestamp="${timestamp}",serial_no="${process.env.WXPAY_SERIAL_NO}"`
    return auth
}

/**
 * 创建 JSAPI 预付订单
 * @param {string} openid 用户的 openid
 * @param {string} outTradeNo 商户订单号
 * @param {number} totalFee 金额（单位：分）
 * @param {string} description 商品描述
 * @returns {object} 返回前端调起支付所需的参数
 */
async function createJSAPIOrder(openid, outTradeNo, totalFee, description) {
    const url = '/v3/pay/transactions/jsapi'
    const absoluteUrl = 'https://api.mch.weixin.qq.com' + url

    const params = {
        appid: process.env.WX_APPID,
        mchid: process.env.WXPAY_MCH_ID,
        description: description || '校园跑腿-付费服务',
        out_trade_no: outTradeNo,
        notify_url: process.env.WXPAY_NOTIFY_URL,
        amount: {
            total: totalFee,
            currency: 'CNY'
        },
        payer: {
            openid: openid
        }
    }

    const payloadStr = JSON.stringify(params)
    const authHeader = buildAuthorization('POST', url, payloadStr)

    // 发送原生请求
    let result
    try {
        const res = await axios.post(absoluteUrl, payloadStr, {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': authHeader
            }
        })
        result = res.data
    } catch (err) {
        console.error('[wxpay] 下单请求失败:', err.response ? err.response.data : err.message)
        throw new Error('微信支付接口请求失败: ' + (err.response ? JSON.stringify(err.response.data) : err.message))
    }

    if (!result || !result.prepay_id) {
        console.error('[wxpay] 下单返回无 prepay_id:', result)
        throw new Error('创建预付订单失败')
    }

    // 生成前端 wx.requestPayment 需要的参数
    const timeStamp = Math.floor(Date.now() / 1000).toString()
    const nonceStr = crypto.randomBytes(16).toString('hex')
    const packageStr = 'prepay_id=' + result.prepay_id

    // 小程序调起支付需要的签名 (和头部认证签名格式相同)
    const signStr = [process.env.WX_APPID, timeStamp, nonceStr, packageStr, ''].join('\n')
    const privateKey = fs.readFileSync(
        path.resolve(__dirname, '..', process.env.WXPAY_PRIVATE_KEY_PATH || './certs/apiclient_key.pem')
    )
    const sign = crypto.createSign('RSA-SHA256')
    sign.update(signStr)
    const paySign = sign.sign(privateKey, 'base64')

    return {
        timeStamp,
        nonceStr,
        package: packageStr,
        signType: 'RSA',
        paySign
    }
}

/**
 * 解密微信支付回调通知中的 resource 数据
 * @param {object} resource 通知中的 resource 字段
 * @returns {object} 解密后的订单信息
 */
function decryptNotifyResource(resource) {
    const { ciphertext, nonce, associated_data } = resource
    const key = process.env.WXPAY_API_V3_KEY
    const ciphertextBuffer = Buffer.from(ciphertext, 'base64')

    // AES-256-GCM 解密
    const authTag = ciphertextBuffer.slice(ciphertextBuffer.length - 16)
    const data = ciphertextBuffer.slice(0, ciphertextBuffer.length - 16)

    const decipher = crypto.createDecipheriv('aes-256-gcm', key, nonce)
    decipher.setAuthTag(authTag)
    if (associated_data) decipher.setAAD(Buffer.from(associated_data))

    let decrypted = decipher.update(data)
    decrypted = Buffer.concat([decrypted, decipher.final()])

    return JSON.parse(decrypted.toString('utf8'))
}

module.exports = {
    getWxPay,
    createJSAPIOrder,
    decryptNotifyResource
}
