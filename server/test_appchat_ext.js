require('dotenv').config();
const axios = require('axios');
const weworkService = require('./services/weworkService');

async function testAppchatExternal() {
    try {
        const token = await weworkService.getAccessToken();
        console.log('Token fetched');

        // 企微 API: 创建群聊会话 (内部群)
        const url = `https://qyapi.weixin.qq.com/cgi-bin/appchat/create?access_token=${token}`;

        console.log('--- 测试 API 创建群聊 (附加 external_userid_list) ---');
        const res = await axios.post(url, {
            name: "客户交流群",
            owner: process.env.WEWORK_STAFF_USERID || "WangJie",
            // 为了满足 userlist 至少 2 人的要求：
            userlist: [process.env.WEWORK_STAFF_USERID || "WangJie", "Xiaohai"],
            external_userid_list: ["wme123456789"]
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

testAppchatExternal();
