const service = require('./../../publish/server/index')
const utils = require('./../../../utils/util')
const moment = require('./../../../utils/moment.min')
const app = getApp()

Page({
    data: {
        isShow: false,
        loadingText: '数据加载中',
        screenWidth: 120,
        screenHeight: 120,
        CustomBar: 60,
        touchStartTime: 0,
        touchEndTime: 0,
        isScroll: true,
        codeList: [],
        familyList: [],
        isShare: false,
        code: null,
        codeObj: {
            isShowCode: false,
            isError: false,
            isEdit: false,
            _id: null,
            errorText: null,
            code: null,
            tag: null,
            familyName: null,
            familyID: null
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
        this.getCodeListFn()
        this.getMyFamilyFn()
    },
    // 列表
    async getCodeListFn() {
        const rentObj = await this.search('invitation_code', { createOpenid: app.globalData.openid }, [{ filed: 'createDateTimestamp', sortDesc: 'desc' }])
        const data = rentObj['code'] === 0 && rentObj['data'].length ? rentObj['data'] : []
        const currentDate = Number(moment().format('YYYYMMDD'))
        data.forEach(i => {
            i['validity'] = currentDate - Number(moment(i['createDate'], 'YYYY-MM-DD HH:mm:ss').format('YYYYMMDD')) > 1 ? false : true
            i['tabList'] = [
                { name: `${i['validity'] ? '邀请码有效' : '邀请码过期'}`, color: `${i['validity'] ? 'green' : 'red'}` },
                { name: `家庭：${i['familyName']}`, color: 'blue' },
                { name: `标签：${i['tag']}`, color: 'orange' }
            ]
        });
        this.setData({
            codeList: data
        })
        console.log('列表>>>', rentObj, data)
    },
    async getMyFamilyFn() {
        const params = {
            createOpenid: app.globalData.openid
        }
        const sortParams = [
            { filed: 'createDateTimestamp', sortDesc: 'desc' }
        ]
        const rentObj = await this.search('family_info', params, sortParams)
        const data = rentObj['code'] === 0 && rentObj['data'].length ? rentObj['data'] : []
        this.setData({
            familyList: data
        })
        console.log('家庭信息>>>', data)
    },
    // 输入
    inputFn(e) {
        const type = e.currentTarget.dataset.type
        const obj = e.currentTarget.dataset.obj
        const str = `${obj}.${type}`
        this.setData({
            [`${str}`]: e.detail.value || null
        })
        if (obj === 'codeObj') {
            this.errorJudgeFn(this.data.codeObj[type], 0)
        }
    },
    // 创建邀请码
    produceCodeFn() {
        return `${moment().valueOf().toString().split('').reverse().join('')}`
    },
    addCodeFn() {
        this.setData({
            ['codeObj.isShowCode']: true,
            ['codeObj.code']: this.produceCodeFn()
        })
    },
    async addActionFn(e) {
        const type = e.currentTarget.dataset.flag
        if (type === '0') {
            this.resetFormFn(0)
        } else {
            // 记录邀请码
            console.log('邀请码>>>', this.data.codeObj)
            if (!this.data.codeObj['familyName']) {
                return this.setData({
                    isError: true,
                    errorText: '请选择家庭'
                })
            }
            let codeObj
            if (this.data.codeObj['isEdit']) {
                const params = {
                    tag: this.data.codeObj['tag'],
                    familyName: this.data.codeObj['familyName'],
                    familyID: this.data.codeObj['familyID'],
                    modifyDate: moment().format('YYYY-MM-DD HH:mm:ss'),
                    modifyTimestamp: moment().valueOf(),
                    modifyUser: app.globalData.userInfo.nickName,
                    modifyOpenid: app.globalData.openid
                }
                codeObj = await this.editDataFn('invitation_code', params, { _id: this.data.codeObj['_id'] }, true)
                console.log('编辑>>>', codeObj)
            } else {
                const params = {
                    code: this.data.codeObj['code'],
                    tag: this.data.codeObj['tag'],
                    familyName: this.data.codeObj['familyName'],
                    familyID: this.data.codeObj['familyID'],
                    createDate: moment().format('YYYY-MM-DD HH:mm:ss'),
                    deadlineDays: 1,
                    createDateTimestamp: moment().valueOf(),
                    createUser: app.globalData.userInfo.nickName,
                    createOpenid: app.globalData.openid
                }
                codeObj = await this.addItem('invitation_code', params, true)
                console.log('新增>>>', codeObj)
            }
            const isEdit = this.data.codeObj['isEdit']
            if (codeObj['code'] === 0) {
                console.log('成功>>>', isEdit)
                this.resetFormFn(0)
                this.getCodeListFn()
            }
        }
    },
    authAction() {
        this.setData({
            isShare: false
        })
        this.resetFormFn(0)
        this.getCodeListFn()
    },
    // 表单错误校验
    errorJudgeFn(str, flag = 0) {
        if (flag === 0) {
            this.setData({
                ['codeObj.isError']: !str || str.length > 5 ? true : false,
                ['codeObj.errorText']: !str ? '请输入标签' : (str.length > 5 ? '标签请控制在6个字符内' : null),
            })
        }
    },
    // 表单重置
    resetFormFn(flag = 0) {
        if (flag === 0) {
            this.setData({
                ['codeObj.isShowCode']: false,
                ['codeObj.isError']: false,
                ['codeObj.isEdit']: false,
                ['codeObj._id']: null,
                ['codeObj.errorText']: null,
                ['codeObj.code']: null,
                ['codeObj.tag']: null,
                ['codeObj.familyName']: null,
                ['codeObj.familyID']: null,
            })
        }
    },
    // 保存数据
    addItem(connectionName, data, isReturn = false, fn = null) {
        this.setData({
            isShow: true,
            loadingText: '上传数据中'
        })
        const result = service.addZhanDFn(data, connectionName).then(values => {
            this.setData({
                isShow: false
            })
            if (values['code'] === 0) {
                utils.showToast('success', '添加成功')
                if (fn) {
                    fn()
                }
            } else {
                utils.showToast('none', values['msg'] || '添加失败')
            }
            if (isReturn) {
                return {
                    code: values['code'],
                    msg: 'success'
                }
            }
        }).catch(err => {
            console.log('添加失败>>>', err)
            utils.showToast('none', '添加失败')
            this.setData({
                isShow: false
            })
            if (isReturn) {
                return {
                    code: -1,
                    msg: '添加失败'
                }
            }
        })
        if (isReturn) {
            return result
        }
    },
    // 编辑数据
    editDataFn(connectionName, data, only, isReturn = false, fn = null) {
        const that = this
        this.setData({
            isShow: true,
            loadingText: '上传数据中'
        })
        const result = service.addEditSearchProject(connectionName, data, only, 1).then(values => {
            that.setData({
                isShow: false
            })
            if (values['code'] === 0) {
                utils.showToast('success', '编辑成功')
                if (fn) {
                    fn()
                }
            } else {
                utils.showToast('none', values['msg'] || '编辑失败')
            }
            if (isReturn) {
                return {
                    code: values['code'],
                    msg: 'success'
                }
            }
        }).catch(err => {
            console.log('编辑失败>>>', err)
            utils.showToast('none', '编辑失败')
            that.setData({
                isShow: false
            })
            if (isReturn) {
                return {
                    code: -1,
                    msg: '编辑失败'
                }
            }
        })
        if (isReturn) {
            return result
        }
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
    // 长按操作
    actionFn(e) {
        console.log('编辑>>>', e)
        const data = e.currentTarget.dataset.data
        if (!data['validity']) {
            return utils.showToast('none', '当前邀请码已失效！')
        }
        this.setData({
            isShare: true,
            code: data['code']
        })
    },
    onShareAppMessage: function (res) {
        if (res.from === 'button') {
            console.log(res.target)
        }
        const code = JSON.parse(JSON.stringify(this.data.code))
        this.setData({
            isShare: false,
            code: null
        })
        return {
            title: `邀请码：${code}`,
            imageUrl: '/images/code_mp.jpg',
            path: `/pages/home/index?currentPage=my&code=${code}`
        }
    },
    // 编辑
    editFn(e) {
        const data = e.currentTarget.dataset.data
        if (this.data.touchEndTime - this.data.touchStartTime < 350) {
            if (!data['validity']) {
                return utils.showToast('none', '当前邀请码已失效！')
            }
            this.setData({
                ['codeObj.isEdit']: true,
                ['codeObj.isShowCode']: true,
                ['codeObj.code']: data['code'],
                ['codeObj.tag']: data['tag'],
                ['codeObj.familyName']: data['familyName'],
                ['codeObj.familyID']: data['familyID'],
                ['codeObj._id']: data['_id']
            })
        }
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
    // 选择家庭
    selectFamilyFn() {
        console.log('选择家庭1>>>')
        const that = this
        wx.navigateTo({
            url: '/pages/my/create_family/index',
            events: {
                refresh: function (data) {
                    console.log('选择家庭', data, data['data']['name'])
                    if (data && JSON.stringify(data) !== '{}') {
                        that.setData({
                            ['codeObj.familyName']: data['data'] && JSON.stringify(data['data']) !== '{}' ? data['data']['name'] : null,
                            ['codeObj.familyID']: data['data'] && JSON.stringify(data['data']) !== '{}' ? data['data']['_id'] : null,
                            isError: false,
                            errorText: null
                        })
                    }
                }
            },
            success: function (res) {
                res.eventChannel.emit('editFn', that.data.codeObj)
            }
        })
    }
})