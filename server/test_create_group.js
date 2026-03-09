require('dotenv').config();
const axios = require('axios');
const weworkService = require('./services/weworkService');

async function testCreateGroup() {
    try {
        const token = await weworkService.getAccessToken();
        console.log('Token fetched');

        // 企微 API: 创建客户群
        const url = `https://qyapi.weixin.qq.com/cgi-bin/externalcontact/groupchat/create?access_token=${token}`;

        console.log('--- 测试 API 创建带名称的新群 ---');
        const res = await axios.post(url, {
            name: "周末篮球联赛-官方群",
            owner: process.env.WEWORK_STAFF_USERID || "WangJie",
            user_list: [process.env.WEWORK_STAFF_USERID || "WangJie"],
        });

        console.log('结果:', JSON.stringify(res.data, null, 2));

    } catch (err) {
        if (err.response) {
            console.error('API Error:', err.response.data);
        } else {
            console.error('异常:', err.message);
        }
    }
    process.exit(0);
}

testCreateGroup();
