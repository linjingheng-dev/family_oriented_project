const cloud = require('wx-server-sdk')
const moment = require('moment')
const DATEFORMAT = 'YYYYMMDDHHmm'

cloud.init({
    env: 'qiucheng-afgeg'
})

// 事项订阅推送
async function matterSubscribeFn(event, context) {
    try {
        const DB = cloud.database()
        const collection = DB.collection('timer_matter')
        const result = await collection.get()
        console.log('获取>>>', result)
        if (result && result['errMsg'] === 'collection.get:ok') {
            const data = result['data'] || []
            // templateID
            for (let i = 0; i < data.length; i++) {
                if (!data[i]['yesOrNo'] && data[i]['parentID']) {
                    const codeObj = await judgeAuthToPushMsgFn(data[i])
                    if (codeObj['code'] === 0) {
                        // 触发订阅推送
                        const code = triggerDateFn(data[i])
                        console.log('时间返回值》', code)
                        if (code === 0) {
                            pushMsgToSubscribeUserFn(data[i], codeObj['data'])
                        }
                    }
                }
            }
            // console.log(data)
        } else {
            console.log('查询事项订阅记录失败')
        }
    } catch (err) {
        console.log('执行事项订阅消息失败>>>', err)
    }
}

// 判断是否有权限发送消息
async function judgeAuthToPushMsgFn(data) {
    try {
        const DB = cloud.database()
        const collection = DB.collection('subscribe_template')
        const result = await collection.where({
            templateID: data['templateID'],
            currentUserOpenID: data['optionUserOpenID'],
            matterID: data['parentID']
        }).get()
        let code = -1
        let onlyID = null
        if (result['errMsg'] === 'collection.get:ok') {
            code = result['data'] && result['data'].length && result['data'][0]['num'] ? 0 : -1
            onlyID = result['data'] && result['data'].length && result['data'][0]['matterID'] ? result['data'][0]['_id'] : null
        }
        console.log('进入11>>>', result, code)
        return {
            code,
            data: onlyID
        }
    } catch (err) {
        console.log('获取权限信息失败', err)
        return { code: -1, data: null }
    }
}

// 时间判断
function triggerDateFn(data) {
    let code = -1
    const currentDate = Number(moment().format(DATEFORMAT))
    const setTimerDate = Number(moment(data['taskEDate'], 'YYYY-MM-DD HH:mm').format(DATEFORMAT))
    if (currentDate === setTimerDate) {
        code = 0
    }
    console.log('当前时间比较>>>', currentDate, setTimerDate, currentDate === setTimerDate, data['taskEDate'], code)
    return code
}

// 推送消息
async function pushMsgToSubscribeUserFn(data, matterID) {
    console.log('发送订阅消息>>>', matterID)
    try {
        if (!data || JSON.stringify(data) === '{}') {
            throw ('没有可以发送的消息')
        }
        const result = await cloud.openapi.subscribeMessage.send({
            touser: data['optionUserOpenID'],
            page: 'pages/home/index',
            lang: 'zh_CN',
            templateId: data['templateID'],
            miniprogramState: 'developer', // 跳转小程序类型：developer为开发版；trial为体验版；formal为正式版；默认为正式版
            data: {
                thing2: {
                    value: data['shortName'] || '--'
                },
                date3: {
                    value: data['taskEDate'] || '--'
                },
                name1: {
                    value: data['lastEditUser'] || '--'
                }
            }
        })
        console.log('消息>>>>', result)
        editSubscribeFn(matterID)
    } catch (err) {
        console.log('发送消息失败！', err)
    }
}

// 删除订阅记录
function editSubscribeFn(_id) {
    const DB = cloud.database()
    const collection = DB.collection('subscribe_template')
    collection.doc(_id).remove({
        success(res) {
            console.log('删除成功', res)
        },
        fail(err) {
            console.log('删除失败！', err)
        }
    })
}

exports.main = async (event, context) => {
    console.log('每30分钟执行一次')
    // 获取 timer_matter 表数据
    await matterSubscribeFn()
}