const conf = require('./../config/conf')

// 无条件查询
function select(DB) {
    return new Promise((resolve) => {
        DB.get({
            success: res => {
                resolve({
                    code: 0,
                    data: res || [],
                    msg: 'success'
                })
            },
            fail: err => {
                resolve({
                    code: -1,
                    data: null,
                    msg: err
                })
            }
        })
    })
}

// 有条件的查询
function selectWhere(DB, data) {
    return new Promise((resolve) => {
        DB.where(data).get({
            success: res => {
                resolve({
                    code: res['errMsg'] === conf.GETSUCCESS ? 0 : -1,
                    data: res['errMsg'] === conf.GETSUCCESS ? (res.data ? res.data : []) : null,
                    msg: res['errMsg'] === conf.GETSUCCESS ? 'success' : '查询数据失败'
                })
            },
            fail: err => {
                resolve({
                    code: -1,
                    data: null,
                    msg: err
                })
            }
        })
    })
}

// 添加数据
function addItem(DB, data) {
    return new Promise((resolve) => {
        DB.add({
            data: data,
            success: res => {
                resolve({
                    code: res['errMsg'] === conf.ADDSUCCESS ? 0 : -1,
                    data: res ? res['_id'] : null,
                    msg: res['errMsg'] === conf.ADDSUCCESS ? 'success' : '添加数据失败'
                })
            },
            fail: err => {
                resolve({
                    code: -1,
                    data: null,
                    msg: err
                })
            }
        })
    })
}

// 编辑
function editItem(DB, id, data) {
    return new Promise((resolve) => {
        DB.doc(id).update({
            data: data,
            success(res) {
                console.log('编辑响应>>>>', res)
                resolve({
                    code: 0,
                    data: null,
                    msg: 'success'
                })
            },
            fail(err) {
                resolve({
                    code: -1,
                    data: null,
                    msg: err
                })
            }
        })
    })
}

// 指定条件编辑
function editTargetItem(DB, searchData, data) {
    return new Promise((resolve) => {
        DB.where(searchData).update({
            data: data,
            success(res) {
                console.log('编辑响应>>>>', res)
                resolve({
                    code: 0,
                    data: null,
                    msg: 'success'
                })
            },
            fail(err) {
                resolve({
                    code: -1,
                    data: null,
                    msg: err
                })
            }
        })
    })
}

// 删除
function deleteItem(DB, id) {
    return new Promise((resolve) => {
        DB.doc(id).remove({
            success(res) {
                resolve({
                    code: 0,
                    data: null,
                    msg: 'success'
                })
            },
            fail(err) {
                resolve({
                    code: -1,
                    data: null,
                    msg: err
                })
            }
        })
    })
}

// 指定条件删除
function deleteTargetItem(DB, data) {
    return new Promise((resolve) => {
        DB.where(data).remove({
            success(res) {
                resolve({
                    code: 0,
                    data: null,
                    msg: 'success'
                })
            },
            fail(err) {
                resolve({
                    code: -1,
                    data: null,
                    msg: err
                })
            }
        })
    })
}

module.exports = {
    select,
    selectWhere,
    addItem,
    editItem,
    deleteItem,
    deleteTargetItem,
    editTargetItem
}
