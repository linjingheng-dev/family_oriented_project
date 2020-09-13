// 云函数入口文件
const cloud = require('wx-server-sdk')

// 获取当前用户的openid
function getCurrentUserOpenId() {
    cloud.init({
        env: 'qiucheng-afgeg'
    })
    const wxContext = cloud.getWXContext()
    return {
        openid: wxContext.OPENID,
        appid: wxContext.APPID,
        unionid: wxContext.UNIONID,
    }
}

// 云函数入口函数
exports.main = async (event, context) => {
    return getCurrentUserOpenId();
}