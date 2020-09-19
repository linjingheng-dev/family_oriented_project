const dbModule = require('./db')
const conf = require('../config/conf')
const moment = require('./moment.min')

/**
 * @description 弹窗提示
 * @author 林景恒
 * @date 2020-08-16
 * @param {*} icon ICON
 * @param {*} title 内容
 * @param {number} [duration=1500] 存在时间
 */
function showToast(icon, title, duration = 1500) {
    wx.showToast({
        title: title,
        icon: icon,
        duration: duration,
    })
}

/**
 * @description 云函数调用
 * @author 林景恒
 * @date 2020-08-16
 * @param {string} name 云函数名
 * @param {object} [data={}] 数据
 * @returns 
 */
function cloudFn(name, data = {}) {
    return new Promise((resolve) => {
        const cloudObj = {
            name: name,
            success: (res) => {
                resolve({
                    code: 0,
                    data: res['errMsg'] === 'cloud.callFunction:ok' ? res['result'] : null
                })
            },
            fail: (err) => {
                resolve({
                    code: -1,
                    data: null,
                    msg: err.errMsg || err
                })
            }
        }
        if (data && JSON.stringify(data) !== '{}') {
            cloudObj['data'] = data;
        }
        wx.cloud.callFunction(cloudObj)
    })
}

/**
 * @description 云数据库增删改查
 * @author 林景恒
 * @date 2020-08-16
 * @param {string} collectionName 集合名
 * @param {number} [flag=0] 0 -增、1 -无条件查、11 -有条件查、2 -编辑、3 -删除
 * @param {object} [data={}] 数据
 * @param {*} [id=null] 记录ID
 * @returns 
 */
function cloudDB(collectionName, flag = 0, data = {}, id = null) {
    const DB = wx.cloud.database().collection(collectionName)
    if (flag === 0) {
        return dbModule.addItem(DB, data)
    } else if (flag === 1) {
        return dbModule.select(DB)
    } else if (flag === 11) {
        return dbModule.selectWhere(DB, data)
    } else if (flag === 2) {
        return dbModule.editItem(DB, id, data)
    } else if (flag === 3) {
        return dbModule.deleteItem(DB, id)
    }
}

/**
 * @description page 返回到 component
 * @author 林景恒
 * @date 2020-08-18
 * @param {object} params 参数
 * @param {string} key 键值
 */
function returnToCFromP(key) {
    const app = getApp()
    app.globalData.isComponent = key
}

/**
 * @description 云函数返回值判断
 * @author 林景恒
 * @date 2020-08-20
 * @param {object} res 响应信息
 * @param {string} successMsg 成功提示
 * @param {string} errmsg 错误提示
 * @returns 
 */
function cloudDataH(res, successMsg, errmsg) {
    if (res['code'] === 0) {
        if (res['data']) {
            return res.data['code'] === 0 ? { code: 0, data: res.data['data'], msg: successMsg } : { code: -1, msg: errmsg }
        } else {
            return { code: -1, msg: '云调用成功，但是调用云函数失败，反馈给开发者，谢谢' }
        }
    } else {
        return { code: -1, msg: errmsg }
    }
}

/**
 * @description 上传图片
 * @author 林景恒
 * @date 2020-09-19
 * @param {*} [imgList=[]]
 * @param {*} imgSrc -上传路径
 * @returns {Promise}
 */
function uploadFile(imgList = [], imgSrc) {
    const savePromise = []
    for (let i = 0; i < imgList.length; i++) {
        const promiseData = new Promise((resolve) => {
            if (imgList[i].indexOf('cloud://') > -1) {
                resolve({
                    code: 0,
                    index: i,
                    data: imgList[i]
                })
            } else {
                wx.cloud.uploadFile({
                    cloudPath: `${imgSrc}_${(new Date()).valueOf()}.png`,
                    filePath: imgList[i],
                    success: res => {
                        if (res['errMsg'] === conf.IMGSUCCESS) {
                            resolve({
                                code: 0,
                                index: i,
                                data: res['fileID']
                            })
                        } else {
                            resolve({
                                code: -1,
                                msg: `上传第 ${i + 1} 张图片失败`
                            })
                        }
                    },
                    fail: err => {
                        resolve({
                            code: -1,
                            msg: `上传第 ${i + 1} 张图片失败`
                        })
                    }
                })
            }
        })
        savePromise.push(promiseData)
    }
    return Promise.all(savePromise)
}

/**
 * @description 计算周岁
 * @author 林景恒
 * @date 2020-09-19
 * @param {string} birthDate 出生日期，格式 YYYY-MM-DD
 * @returns {string}
 */
function accountAgeFn(birthDate) {
    const birthY = moment(birthDate, 'YYYY-MM-DD').format('Y')
    const birthM = moment(birthDate, 'YYYY-MM-DD').format('M')
    const birthD = moment(birthDate, 'YYYY-MM-DD').format('D')
    const currentY = moment().format('Y')
    const currentM = moment().format('M')
    const currentD = moment().format('D')
    return (birthM === currentM) && (Number(birthD) < (Number(currentD) + 1)) ?
        `${Number(currentY) - Number(birthY)}` : `${Number(currentY) - Number(birthY) - 1}`
}

/**
 * @description 数组对象排序
 * @author 林景恒
 * @date 2020-08-24
 * @param {string} attr 属性值
 * @param {number} sortsO 0 -降序、1 -升序
 * @returns {Function}
 */
function arrayObjectSort(attr, sortsO) {
    return function (object1, object2) {
        var value1 = object1[attr];
        var value2 = object2[attr];
        if (sortsO === 0 ? (value1 < value2) : (value1 > value2)) {
            return -1;
        } else if (sortsO === 0 ? (value1 > value2) : (value1 < value2)) {
            return 1;
        } else {
            return 0;
        }
    }
}

// 是否有家庭信息
function getFamily() {
    const family = wx.getStorageSync('joinFamily')
    return family ? true : false
}


/**
 * @description 删除云存储
 * @author 林景恒
 * @date 2020-09-01
 * @param {array} data 文件 ID
 * @returns {Promise}
 */
function delColudFile(data) {
    return new Promise(resolve => {
        wx.cloud.deleteFile({
            fileList: data,
            success: res => {
                console.log('删除云存储成功>>>', res)
                resolve(0)
            },
            fail: err => {
                console.log('删除云存储失败>>>', err)
                resolve(-1)
            }
        })
    })
}

module.exports = {
    showToast,
    cloudFn,
    cloudDB,
    returnToCFromP,
    cloudDataH,
    uploadFile,
    accountAgeFn,
    arrayObjectSort,
    getFamily,
    delColudFile
}
