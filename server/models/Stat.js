const mongoose = require('mongoose')

const statSchema = new mongoose.Schema({
  key: { type: String, default: 'global' },
  todayDelivered: { type: Number, default: 0 },
  totalOrders: { type: Number, default: 0 }
})

module.exports = mongoose.model('Stat', statSchema, 'stats')
