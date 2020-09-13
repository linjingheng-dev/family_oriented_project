const db = require('./../../../utils/db')

// 上传图片
async function uploadImg(params) {
    const DB = wx.cloud.database().collection('background_img')
    const sResult = await db.selectWhere(DB, params['flagObj'])
    if (sResult['code'] === 0 && !sResult.data.length) {
        return db.addItem(DB, params['params'])
    } else if (sResult['code'] === 0 && sResult.data.length) {
        const addResult = await db.editItem(DB, sResult.data[0]['_id'], { imgFileId: params['params']['imgFileId'], imgSrc: params['params']['imgSrc'] });
        const imgFileId = sResult.data[0]['imgFileId'];
        wx.cloud.deleteFile({
            fileList: [imgFileId]
        })
        return {
            code: addResult['code'] === 0 ? 0 : -1,
            data: addResult['code'] === 0 ? params['params']['imgSrc'] : null
        }
    }
}

module.exports = {
    uploadImg
}