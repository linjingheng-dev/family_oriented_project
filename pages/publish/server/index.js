const db = require('./../../../utils/db')
const utils = require('./../../../utils/util')

function returnRes(data) {
    if (data && data['code'] === 0 && data['data'] && data['data']['code'] === 0 && data['data']['data'] && data['data']['data'].length) {
        return data['data']['data']
    } else {
        return []
    }
}

/**
 * @description 添加/编辑项目
 * @author 林景恒
 * @date 2020-08-20
 * @param {string} collectionName 表名
 * @param {object} params 参数
 * @param {boolean} [isAction=0] 0 -新增、1 -编辑、2 -删除
 * @param {string} _id ID
 */
async function addEditSearchProject(collectionName, params, sContent, isAction = 0) {
    console.log('编辑>>>', isAction, sContent, params)
    const DB = wx.cloud.database().collection(collectionName)
    let result = null
    if (isAction === 2) {
        result = await db.deleteItem(DB, sContent)
    } else if (isAction === 3) {
        result = await db.deleteTargetItem(DB, sContent)
    } else if (isAction === 4) {
        result = await db.editTargetItem(DB, sContent, params)
    } else {
        const param = {
            $url: 'publish/getData',
            flag: 0,
            connectionName: collectionName,
            data: sContent // TODO 编辑 { _id: _id }
        }
        const sResult = await utils.cloudFn('help', param)
        console.log('编辑查询>>>', param, sResult, returnRes(sResult).length)
        if (returnRes(sResult).length) {  
            result = isAction === 0 ? { code: -1, msg: '已存名称' } : await db.editItem(DB, sContent['_id'], params)
        } else {
            result = isAction === 0 ? await db.addItem(DB, params) : { code: -1, msg: '编辑失败，稍后重试' }
        }
    }
    console.log('编辑添加>>>', params, result)
    return result
}

function addZhanDFn(params, collectionName = 'bill_write') {
    const DB = wx.cloud.database().collection(collectionName)
    return db.addItem(DB, params)
}

module.exports = {
    addEditSearchProject,
    addZhanDFn
}
