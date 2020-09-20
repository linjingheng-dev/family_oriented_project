const service = require('./../../publish/server/index')
const utils = require('./../../../utils/util')
const moment = require('./../../../utils/moment.min')
const util = require('./../../../utils/util')
const app = getApp()

let clickNum = 0

Page({
    data: {
        isCreate: '1',
        isShow: false,
        loadingText: '加载中',
        screenWidth: 120,
        screenHeight: 120,
        CustomBar: 60,
        touchStartTime: 0,
        touchEndTime: 0,
        isScroll: true,
        isSelect: false,
        prevData: null,
        familyList: [],
        familyObj: {},
        currentFamilyID: null,
        creatObj: {
            isEdit: false,
            isShow: false,
            isError: false,
            errorText: null,
            _id: null,
            name: null
        }
    },
    onLoad: function (options) {
        const that = this
        wx.getSystemInfo({
            success: function (res) {
                that.setData({
                    screenHeight: res.windowHeight,
                    screenWidth: res.windowWidth,
                    CustomBar: app.globalData.CustomBar
                })
            },
        })
        console.log('>>>>', util.getFamily())
        that.setData({
            isCreate: options['isCreate'] || '1',
            currentFamilyID: app.globalData.joinFamily ? app.globalData.joinFamily['joinFamilyID'] : null
        })
        const eventChannel = that.getOpenerEventChannel()
        eventChannel.on('editFn', function (data) {
            if (data) {
                that.setData({
                    isSelect: true,
                    prevData: data
                })
            }
        })
        that.getMyFamilyFn()
    },
    // 表名
    rturnTableNameFn() {
        console.log('选择家庭>>>', this.data.isCreate, app.globalData.familyList)
        return this.data.isCreate === '1' ? 'family_info' : 'inviation_user'
    },
    async getMyFamilyFn() {
        if (!app.globalData.userInfo) {
            return
        }
        const isTrue = this.data.isCreate === '0'
        let params = { createOpenid: app.globalData.openid }
        let sortParams = [{ filed: 'createDateTimestamp', sortDesc: 'desc' }]
        if (isTrue) {
            params = { inviteeID: app.globalData.openid }
            sortParams = [{ filed: 'createDate', sortDesc: 'desc' }]
        }
        const rentObj = await this.search(this.rturnTableNameFn(), params, sortParams)
        const data = rentObj['code'] === 0 && rentObj['data'].length ? rentObj['data'] : []
        data.forEach(i => {
            if (isTrue) {
                i['name'] = i['joinFamilyName']
            }
            i['desc'] = isTrue ? `于${i['joinDate']}加入` : `${i['createUser']}于${i['createDate']}创建`
        })
        data.forEach(i => {
            this.data.familyObj[i['name']] = true;
        })
        this.setData({
            familyList: data,
            familyObj: this.data.familyObj
        })
        console.log('家庭列表>>>', data, this.data.familyObj)
    },
    // 创建家庭
    addFamilyFn() {
        this.setData({
            ['creatObj.isShow']: true,
            ['creatObj.name']: null
        })
    },
    // 输入
    inputFn(e) {
        const type = e.currentTarget.dataset.type
        const obj = e.currentTarget.dataset.obj
        const str = `${obj}.${type}`
        this.setData({
            [`${str}`]: e.detail.value || null
        })
        if (obj === 'creatObj') {
            this.errorJudgeFn(this.data.creatObj[type], 0)
        }
    },
    errorJudgeFn(str, flag = 0) {
        if (flag === 0) {
            this.setData({
                ['creatObj.isError']: !str || str.length > 6 ? true : false,
                ['creatObj.errorText']: !str ? '请输入家庭名称' : (str.length > 6 ? '名称请控制在6个字符内' : null),
            })
        }
    },
    async addActionFn(e) {
        const type = e.currentTarget.dataset.flag
        if (type === '0') {
            this.resetFormFn(0)
        } else {
            if (!app.globalData.userInfo) {
                return util.showToast('none', '请先授权登录后操作')
            }
            if (this.data.familyObj[this.data.creatObj['name']]) {
                return util.showToast('none', '您已创建了同名的家庭名称！')
            }
            let creatObj
            if (this.data.creatObj['isEdit']) {
                const _id = this.data.creatObj['_id']
                const params = {
                    name: this.data.creatObj['name'],
                    modifyDate: moment().format('YYYY-MM-DD HH:mm:ss'),
                    modifyTimestamp: moment().valueOf(),
                    modifyUser: app.globalData.userInfo.nickName,
                    modifyOpenid: app.globalData.openid
                }
                creatObj = await this.editDataFn(this.rturnTableNameFn(), params, { _id: _id }, true)
                console.log('编辑1>>>', creatObj)
                if (creatObj['code'] === 0) {
                    this.resetFormFn(0)
                    this.getMyFamilyFn()
                    this.editFamilyFn({familyId: _id, familyName: params['name']})
                }
            } else {
                const params = {
                    name: this.data.creatObj['name'],
                    createDate: moment().format('YYYY-MM-DD HH:mm:ss'),
                    createDateTimestamp: moment().valueOf(),
                    createUser: app.globalData.userInfo.nickName,
                    createOpenid: app.globalData.openid
                }
                creatObj = await this.addItem(this.rturnTableNameFn(), params, true)
                console.log('新增>>>', creatObj)
                if (creatObj['code'] === 0) {
                    this.resetFormFn(0)
                    this.getMyFamilyFn()
                    this.joinFamilyFn({familyId: creatObj['data'], familyName: params['name']})
                }
            }
        }
    },
    // 创建家庭后自动加入家庭
    async joinFamilyFn(obj) {
        if (!obj['familyId']) {
            return util.showToast('none', '加入家庭失败！')
        }
        const params = {
            inviterID: app.globalData.openid,
            inviterName: app.globalData.userInfo['nickName'],
            code: '',
            joinFamilyID: obj['familyId'],
            joinFamilyName: obj['familyName'],
            inviteeID: app.globalData.openid,
            inviteeName: app.globalData.userInfo['nickName'],
            joinDate: moment().format('YYYY-MM-DD HH:mm:ss'),
            joinTimestamp: moment().valueOf()
        }
        const addObj = await this.addItem('inviation_user', params, true, '加入家庭')
        if (addObj['code'] !== 0) {
            return util.showToast('none', '加入创建的家庭失败')
        }
        const joinFamilyInfo = wx.getStorageSync('joinFamily')
        if (!joinFamilyInfo) {
            wx.setStorage({
                key: 'joinFamily',
                data: { joinFamilyID: params['joinFamilyID'], joinFamilyName: params['joinFamilyName'] }
            })
        }
    },
    // 编辑家庭名称
    editFamilyFn(obj) {
        console.log('编辑>>>', obj)
        const data = {
            joinFamilyName: obj['familyName'],
            modifyOpenId: app.globalData.openid,
            modifyUser: app.globalData.userInfo.nickName,
            modifyDate: moment().format('YYYY-MM-DD HH:mm:ss')
        }
        this.batchUpdateDataFn('inviation_user', { joinFamilyID: obj['familyId'] }, data, '家庭')
    },
    // 表单重置
    resetFormFn(flag = 0) {
        if (flag === 0) {
            this.setData({
                ['creatObj.isShow']: false,
                ['creatObj.isError']: false,
                ['creatObj.isEdit']: false,
                ['creatObj._id']: null,
                ['creatObj.errorText']: null,
                ['creatObj.name']: null
            })
        }
    },
    // 保存数据
    addItem(connectionName, data, isReturn = false, str = '添加') {
        this.setData({
            isShow: true,
            loadingText: '上传数据中'
        })
        const result = service.addZhanDFn(data, connectionName).then(values => {
            this.setData({
                isShow: false
            })
            if (values['code'] === 0) {
                utils.showToast('success', `${str}成功`)
            } else {
                utils.showToast('none', values['msg'] || `${str}失败`)
            }
            if (isReturn) {
                return {
                    code: values['code'],
                    data: values['data'] ? values['data'] : null,
                    msg: 'success'
                }
            }
        }).catch(err => {
            console.log('添加失败>>>', err)
            utils.showToast('none', `${str}失败`)
            this.setData({
                isShow: false
            })
            if (isReturn) {
                return {
                    code: -1,
                    msg: `${str}失败`
                }
            }
        })
        if (isReturn) {
            return result
        }
    },
    // 编辑数据
    editDataFn(connectionName, data, only, isReturn = false, str = '编辑', isBatch = false) {
        const that = this
        this.setData({
            isShow: true,
            loadingText: '上传数据中'
        })
        const result = service.addEditSearchProject(connectionName, data, only, isBatch ? 4 : 1).then(values => {
            that.setData({
                isShow: false
            })
            if (values['code'] === 0) {
                utils.showToast('success', `${str}成功`)
            } else {
                utils.showToast('none', values['msg'] || `${str}失败`)
            }
            if (isReturn) {
                return {
                    code: values['code'],
                    msg: 'success'
                }
            }
        }).catch(err => {
            console.log('编辑失败>>>', err)
            utils.showToast('none', `${str}失败`)
            that.setData({
                isShow: false
            })
            if (isReturn) {
                return {
                    code: -1,
                    msg: `${str}失败`
                }
            }
        })
        if (isReturn) {
            return result
        }
    },
    // 批量更新
    batchUpdateDataFn(collectionName, param, data, str = '') {
        const params = {
            $url: 'publish/batch',
            flag: param ? 0 : 1,
            connectionName: collectionName,
            data: data,
            param: param
        }
        return utils.cloudFn('help', params).then(values => {
            const res = utils.cloudDataH(values, `更新${str}成功`, `更新${str}失败`)
            console.log('批量更新>>', values, res)
            if (res['code'] !== 0) {
                utils.showToast('none', res['msg'])
                return {
                    code: -1
                }
            } else {
                return {
                    code: 0,
                    data: res['data']
                }
            }
        }).catch(err => {
            this.setData({
                isShow: false
            })
            console.log(`更新${str}数据失败`, err)
            utils.showToast('none', `更新${str}数据失败`)
            return {
                code: -1
            }
        })
    },
    // 查询数据
    search(collectionName, value, sort = null, dateQj = null) {
        const params = {
            $url: 'publish/getData',
            flag: value || dateQj ? 0 : 1,
            connectionName: collectionName,
            isSort: sort ? true : false,
            sortList: sort || [],
            data: value,
            dateQj: dateQj
        }
        this.setData({
            isShow: true,
            loadingText: '加载中'
        })
        return utils.cloudFn('help', params).then(values => {
            this.setData({
                isShow: false
            })
            const res = utils.cloudDataH(values, '查询成功', '查询失败')
            if (res['code'] !== 0) {
                utils.showToast('none', res['msg'])
                return {
                    code: -1
                }
            } else {
                return {
                    code: 0,
                    data: res['data']
                }
            }
        }).catch(err => {
            this.setData({
                isShow: false
            })
            console.log('查询数据失败', err)
            utils.showToast('none', '查询数据失败')
            return {
                code: -1
            }
        })
    },
    // 点击操作
    touchStart: function (e) {
        const touch = e.touches[0]
        this.setData({
            startX: touch.clientX,
            touchStartTime: e.timeStamp
        })
    },
    // 按钮触摸结束触发的事件
    touchEnd: function (e) {
        this.setData({
            touchEndTime: e.timeStamp
        })
    },
    editFn(e) {
        if (clickNum > 0) {
            return
        }
        const data = e.currentTarget.dataset.data
        if (this.data.isCreate === '0') {
            if (data['joinFamilyID'] !== this.data.currentFamilyID) {
                clickNum += 1
                console.log('切换前>>>', app.globalData.joinFamily)
                wx.showModal({
                    title: '提示',
                    content: '是否切换家庭？',
                    showCancel: true,
                    success: res => {
                        clickNum = 0
                        if (res.confirm) {
                            wx.removeStorageSync('joinFamily')
                            app.globalData.joinFamily = { joinFamilyID: data['joinFamilyID'], joinFamilyName: data['joinFamilyName'] }
                            wx.setStorage({
                                key: 'joinFamily',
                                data: app.globalData.joinFamily
                            })
                            this.setData({
                                currentFamilyID: data['joinFamilyID']
                            })
                            console.log('切换后>>>', app.globalData.joinFamily)
                        }
                    },
                    fail: err => {
                        clickNum = 0
                    }
                })
            }
            return
        }
        if (this.data.isSelect) {
            const eventChannel = this.getOpenerEventChannel()
            wx.navigateBack({
                delta: 1
            });
            const sendData = {
                name: data['name'],
                _id: data['_id']
            }
            eventChannel.emit('refresh', { data: sendData });
            return
        }
        if (this.data.touchEndTime - this.data.touchStartTime < 350) {
            this.setData({
                ['creatObj.isEdit']: true,
                ['creatObj.isShow']: true,
                ['creatObj.name']: data['name'],
                ['creatObj._id']: data['_id']
            })
        }
    },

})