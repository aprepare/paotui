/**
 * 创建初始管理员账号
 * 用法: node scripts/create-admin.js
 */
require('dotenv').config()
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const config = require('../config')
const AdminUser = require('../models/AdminUser')

async function main() {
  await mongoose.connect(config.mongoUri)
  const username = 'admin'
  const password = 'admin123'
  const existing = await AdminUser.findOne({ username })
  if (existing) {
    console.log('Admin user already exists')
  } else {
    const passwordHash = await bcrypt.hash(password, 10)
    await AdminUser.create({ username, passwordHash, role: 'admin', createTime: new Date() })
    console.log(`Admin user created: ${username} / ${password}`)
  }
  await mongoose.disconnect()
}

main().catch(err => { console.error(err); process.exit(1) })
