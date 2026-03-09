const mongoose = require('mongoose')

const pageConfigSchema = new mongoose.Schema({
  page: { type: String, required: true, unique: true },
  sections: [{
    key: String,
    order: Number,
    visible: { type: Boolean, default: true },
    title: { type: String, default: '' },
    items: [{
      text: { type: String, default: '' },
      emoji: { type: String, default: '' },
      image: { type: String, default: '' },
      link: { type: String, default: '' },
      bg: { type: String, default: '' },
      order: Number
    }]
  }],
  config: { type: mongoose.Schema.Types.Mixed, default: {} },
  updateTime: { type: Date, default: Date.now }
})

pageConfigSchema.index({ page: 1 }, { unique: true })

module.exports = mongoose.model('PageConfig', pageConfigSchema, 'page_config')
