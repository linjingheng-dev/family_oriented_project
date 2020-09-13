
const cloud = require('wx-server-sdk')
const TcbRouter = require('tcb-router');

cloud.init({
    env: 'qiucheng-afgeg'
})

function successRes(ctx, data) {
    ctx.body = {
        code: 0,
        data: data,
        msg: 'success'
    }
}

function errorRes(ctx, err) {
    ctx.body = {
        code: -1,
        data: null,
        msg: err
    }
}

// 当前邀请用户
async function inviteCode(ctx, next) {
    try {
        const DB = cloud.database()
        const bodyData = ctx['_req']['event']
        const collection = DB.collection(bodyData['connectionName'])
        const result = await collection.where(bodyData['data']).get()
        if (result && result['errMsg'] === 'collection.get:ok') {
            successRes(ctx, result['data'] || [])
        } else {
            errorRes(ctx, '获取用户信息失败')
        }
    } catch (err) {
        console.log('获取用户信息失败！', err)
        errorRes(ctx, err || '获取用户信息失败')
    }
}

// 赞助表单插入
async function insertSponsorData(ctx, next) {
    const DB = cloud.database()
    const params = ctx['_req']['event']['data']
    const bankObj = params['bankName'] ? JSON.parse(params['bankName']) : {}
    if (bankObj && JSON.stringify(bankObj) !== '{}') {
        params['bankName'] = bankObj['bankName'] || '';
        params['bankCode'] = bankObj['bankCode'] || '';
        params['bankcardType'] = bankObj['cardType'] || '';
        params['bankcardTypeName'] = bankObj['cardTypeName'] || '';
    }
    const result = await DB.collection('publish_sponsor').add({
        data: params
    })
    if (result && result['errMsg'] === 'collection.add:ok') {
        successRes(ctx, null)
    } else {
        errorRes(ctx, '赞助申请失败，稍后重试，可以给开发者留言，^_^')
    }
}

// 数据查询
async function getData(ctx, next) {
    try {
        const DB = cloud.database()
        const bodyData = ctx['_req']['event']
        let collection = DB.collection(bodyData['connectionName'])
        const _ = DB.command
        let searchData = bodyData['data']
        // 排序功能
        if (bodyData['isSort'] && bodyData['sortList'].length) {
            bodyData['sortList'].forEach(i => {
                collection = collection.orderBy(i['filed'], i['sortDesc'])
            })
        }
        // 按照日期查询
        if (bodyData['dateQj']) {
            const obj = {}
            if (searchData) {
                searchData[bodyData['dateQj']['file']] = _.and(_.gte(bodyData['dateQj']['startDate']), _.lte(bodyData['dateQj']['endDate']))
            } else {
                obj[bodyData['dateQj']['file']] = _.and(_.gte(bodyData['dateQj']['startDate']), _.lte(bodyData['dateQj']['endDate']))
                searchData = obj
            }
        }
        console.log('查询>>>>>', bodyData['dateQj'], searchData)
        const result = bodyData['flag'] === 0 ? await collection.where(searchData).get() : await collection.get()
        if (result && result['errMsg'] === 'collection.get:ok') {
            successRes(ctx, result['data'] || [])
        } else {
            errorRes(ctx, '查询失败，稍后重试，可以给开发者留言，^_^')
        }
    } catch (err) {
        console.log('查询报错', err)
        errorRes(ctx, err || '查询失败，稍后重试，可以给开发者留言，^_^')
    }
}

// 分页查询
async function pagingSearch(ctx, next) {
    const DB = cloud.database()
    const bodyData = ctx['_req']['event']
    const collection = DB.collection(bodyData['connectionName'])
    const filterData = bodyData['data'] || ''
    const page = bodyData['page'] || 1
    const pageSize = bodyData['pageSize'] || 30
    const totalResult = bodyData['flag'] === 0 ? await collection.where(filterData).count() : await collection.count()
    console.log('中的记录数', totalResult)
    const total = totalResult.total
    const totalPage = Math.ceil(total / pageSize)
    const result = bodyData['flag'] === 0 ? await collection.where(filterData).skip((page - 1) * pageSize).limit(pageSize).get().then(res => {
        const data = res.data ? res.data : []
        data.forEach(i => {
            i['page'] = page
            i['totalPage'] = totalPage
        })
        return data
    }).catch(err => {
        return []
    }) :
        await collection.skip((page - 1) * pageSize).limit(pageSize).get().then(res => {
            const data = res.data ? res.data : []
            data.forEach(i => {
                i['page'] = page
                i['totalPage'] = totalPage
            })
            return data
        }).catch(err => {
            return []
        })
    successRes(ctx, result || [])
}

// 设置定时推送功能
async function setTimerFn(ctx, next) {
    try {
        const DB = cloud.database()
        const params = ctx['_req']['event']['data']
        const result = await DB.collection('timer_matter').add({
            data: params
        })
        if (result && result['errMsg'] === 'collection.add:ok') {
            successRes(ctx, null)
        } else {
            errorRes(ctx, '设置定时任务失败，稍后重试，可以给开发者留言，^_^')
        }
    } catch (err) {
        console.log('设置定时任务失败', err)
        errorRes(ctx, err || '设置定时任务失败，稍后重试，可以给开发者留言，^_^')
    }
}

// 云函数入口函数
exports.main = async (event, context) => {
    // 初始化路由
    const app = new TcbRouter({
        event
    });
    // 该中间件会适用于所有的路由
    app.use(async (ctx, next) => {
        console.log('进入全局路由>>>>')
        ctx.data = {};
        await next();
        console.log('退出全局路由>>>>')
    });
    app.router('publish/inviteCode', inviteCode);
    app.router('publish/help', insertSponsorData);
    app.router('publish/getData', getData);
    app.router('publish/pagingSearch', pagingSearch);
    app.router('publish/setTimer', setTimerFn);
    return app.serve()
}