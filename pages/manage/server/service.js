const db = require('./../../../utils/db')
const utils = require('./../../../utils/util')

// 添加成员
function addMemberFn(params, isEdit = false, _id = '') {
    console.log('编辑', isEdit, _id)
    if (!isEdit) {
        const DB = wx.cloud.database().collection('manage_member')
        return db.addItem(DB, params)
    } else {
        const DB = wx.cloud.database().collection('manage_member')
        return db.editItem(DB, _id, params)        
    }
}

module.exports = {
    addMemberFn
}