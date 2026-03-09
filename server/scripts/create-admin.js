const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '.env') })

const config = require('../config')
const AdminUser = require('../models/AdminUser')

async function main() {
  await mongoose.connect(config.mongoUri)
  console.log('Connected to MongoDB')

  const username = process.argv[2] || 'admin'
  const password = process.argv[3] || 'admin123'
  const hash = await bcrypt.hash(password, 10)

  const existing = await AdminUser.findOne({ username })
  if (existing) {
    console.log(`Admin user "${username}" already exists, updating password...`)
    existing.passwordHash = hash
    await existing.save()
    console.log('Password updated.')
  } else {
    await AdminUser.create({
      username,
      passwordHash: hash,
      role: 'admin'
    })
    console.log(`Admin user "${username}" created.`)
  }

  console.log(`\nLogin credentials:`)
  console.log(`  Username: ${username}`)
  console.log(`  Password: ${password}`)
  console.log(`\nPlease change the password after first login.`)

  await mongoose.disconnect()
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
