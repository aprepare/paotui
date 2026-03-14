const mongoose = require('mongoose')

const configHistorySchema = new mongoose.Schema({
    page: { type: String, required: true, index: true },        // 配置页面标识：home / welfare / job / price / bannedWords / tabbar
    version: { type: Number, required: true },                   // 版本号（递增）
    config: { type: mongoose.Schema.Types.Mixed, default: {} },  // 该版本的完整配置快照
    sections: { type: mongoose.Schema.Types.Mixed, default: [] },
    summary: { type: String, default: '' },                      // 自动生成的变更摘要
    operator: { type: String, default: 'admin' },                // 操作人
    createTime: { type: Date, default: Date.now }                // 保存时间
})

configHistorySchema.index({ page: 1, version: -1 })
configHistorySchema.index({ createTime: -1 })

module.exports = mongoose.model('ConfigHistory', configHistorySchema, 'config_history')
