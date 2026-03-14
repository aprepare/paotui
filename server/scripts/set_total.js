require('dotenv').config({ path: '/opt/paotui-server/.env' })
const m = require('mongoose')
const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/campus_errand'
m.connect(uri).then(async () => {
    await m.connection.db.collection('stats').updateOne(
        { key: 'global' },
        { $set: { totalOrders: 1000 } },
        { upsert: true }
    )
    console.log('totalOrders set to 1000')
    process.exit()
}).catch(e => { console.error(e); process.exit(1) })
