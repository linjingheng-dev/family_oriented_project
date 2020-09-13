const app = getApp()
const utils = require('./../../../utils/util')
const conf = require('./../../../config/conf')
const moment = require('./../../../utils/moment.min')
const service = require('./../../publish/server/index')

Component({
    options: {
        addGlobalClass: true
    },
    data: {
        isLogin: false,
        userInfo: {},
        isShowGif: false,
        blGif: conf.BLGIF,
        backgroundImg: conf.BACKIMG,
        touxiang: conf.TOUXIANG,
        canIUse: wx.canIUse('button.open-type.getUserInfo'),
        codeObj: {
            isShowCode: false,
            familyID: null,
            family: null,
            showCode: null,
            code: null,
            inviterID: null,
            inviterName: null,
            validity: false
        }
    },
    attached() {
        if (app.globalData.userInfo) {
            console.log('进入1>>')
            this.setValueFn()
        } else if (this.data.canIUse) {
            console.log('进入2>>')
            app.userInfoReadyCallback = res => {
                app.globalData.userInfo = res.userInfo
                this.setValueFn()
            }
        } else {
            console.log('进入3>>')
            wx.getUserInfo({
                success: res => {
                    app.globalData.userInfo = res.userInfo
                    this.setValueFn()
                }
            })
        }
    },
    methods: {
        /* 用户登录信息 */

        getUserInfo(e) {
            if (e.detail.errMsg !== 'getUserInfo:ok') {
                return utils.showToast('none', '当前还未登录')
            }
            console.log('进入>>>')
            app.globalData.userInfo = e.detail.userInfo
            wx.setStorage({
                key: 'userInfoMsg',
                data: e.detail.userInfo
            })
            this.setData({
                userInfo: e.detail.userInfo,
                isLogin: app.globalData.userInfo ? true : false
            })
            this.getBackgroundImg()
            this.getJoinInfoFn()
        },
        async getJoinInfoFn() {
            const joinObj = await this.getIsInviteFn()
            console.log('加入的家族>>>', joinObj)
            const code = wx.getStorageSync('inviteCode')
            wx.removeStorageSync('joinFamily')
            if (joinObj['code'] === 0) {
                app.globalData.joinFamily = { joinFamilyID: joinObj['data']['joinFamilyID'], joinFamilyName: joinObj['data']['joinFamilyName'] }
                wx.setStorage({
                    key: 'joinFamily',
                    data: app.globalData.joinFamily
                })
            } else if (!code) {
                utils.showToast('none', `您当前还未加入家庭！`, 1500)
            } else {
                this.getFamilFn(code)
            }
        },

        /* 获取背景图片的相关操作 */

        setValueFn() {
            wx.removeStorageSync('inviteCode')
            wx.removeStorageSync('userInfoMsg')
            this.setData({
                userInfo: app.globalData.userInfo,
                isLogin: app.globalData.userInfo ? true : false
            })
            wx.setStorage({
                key: 'userInfoMsg',
                data: app.globalData.userInfo
            })
            const timer = setTimeout(() => {
                this.init()
                this.getJoinInfoFn()
                clearTimeout(timer)
            }, 500)
        },
        init() {
            if (app.globalData.userInfo) {
                this.getBackgroundImg()
            }
        },
        getBackgroundImg() {
            const params = {
                userOpenId: app.globalData.openid
            }
            const that = this
            utils.cloudDB('background_img', 11, params).then(values => {
                if (values['code'] === 0) {
                    if (values['data'] && values['data'].length) {
                        wx.cloud.getTempFileURL({
                            fileList: [values['data'][0]['imgFileId']],
                            success: res => {
                                that.setData({
                                    isShowGif: values['data'][0]['imgFileId'] ? true : false,
                                    backgroundImg: res && res.fileList && res.fileList.length && values['data'][0]['imgFileId'] ? res.fileList[0]['tempFileURL'] : conf.STATICIMG
                                })
                            },
                            fail: err => {
                                console.log('获取背景图片失败', err)
                                utils.showToast('none', '获取背景图片失败')
                            }
                        })
                    }
                } else {
                    utils.showToast('none', '获取背景图片失败')
                }
            }).catch(err => {
                console.log('获取背景图片失败', err)
            })
        },

        /* 邀请码处理 */

        async getIsInviteFn() {
            const searchData = { inviteeID: app.globalData.openid }
            const inviteCodeObj = await this.search('publish/inviteCode', 'inviation_user', searchData)
            console.log('加入的家庭参数>>>', searchData, inviteCodeObj)
            const data = inviteCodeObj['code'] === 0 && inviteCodeObj['data'].length ? inviteCodeObj['data'] : []
            let joinObj = { code: -1, data: null }
            if (data && data.length && data[0]) {
                joinObj = { code: 0, data: data[0] }
            }
            return joinObj
        },
        async inviteCode(code) {
            wx.removeStorageSync('inviteCode')
            wx.setStorage({
                key: 'inviteCode',
                data: code
            })
            this.setData({
                ['codeObj.code']: code
            })
            if (!app.globalData.userInfo) {
                return utils.showToast('none', `您当前还未授权登录！`, 1500)
            }
            const searchData = { code: code, inviteeID: app.globalData.openid }
            const inviteCodeObj = await this.search('publish/inviteCode', 'inviation_user', searchData)
            const data = inviteCodeObj['code'] === 0 && inviteCodeObj['data'].length ? inviteCodeObj['data'] : []
            if (!data.length) {
                this.getFamilFn(code)
            }
        },
        async getFamilFn(code) {
            const params = { code: code }
            const result = await this.search('publish/inviteCode', 'invitation_code', params)
            const data = result['code'] === 0 && result['data'].length && result['data'][0] ? result['data'][0] : null
            const currentDate = Number(moment().format('YYYYMMDD'))
            this.setData({
                ['codeObj.isShowCode']: true,
                ['codeObj.showCode']: code ? code.replace(/(\d{4})\d{4}\d{4}(\d{1})/g, '$1********$2') : null,
                ['codeObj.family']: data['familyName'],
                ['codeObj.familyID']: data['familyID'],
                ['codeObj.inviterID']: data['createOpenid'],
                ['codeObj.inviterName']: data['createUser'],
                ['codeObj.validity']: currentDate - Number(moment(data['createDate'], 'YYYY-MM-DD HH:mm:ss').format('YYYYMMDD')) > 1 ? false :
                    (code ? true : false)
            })
        },
        async addActionFn(e) {
            const type = e.currentTarget.dataset.flag
            if (type === '0') {
                this.setData({
                    ['codeObj.isShowCode']: false
                })
            } else {
                const codeObj = this.data.codeObj
                const params = {
                    inviterID: codeObj['inviterID'],
                    inviterName: codeObj['inviterName'],
                    code: codeObj['code'],
                    joinFamilyID: codeObj['familyID'],
                    joinFamilyName: codeObj['family'],
                    inviteeID: app.globalData.openid,
                    inviteeName: app.globalData.userInfo['nickName'],
                    joinDate: moment().format('YYYY-MM-DD HH:mm:ss'),
                    joinTimestamp: moment().valueOf()
                }
                const result = await this.addItem('inviation_user', params)
                if (result['code'] === 0) {
                    app.globalData.joinFamily = { joinFamilyID: params['joinFamilyID'], joinFamilyName: params['joinFamilyName'] }
                    this.setData({
                        ['codeObj.isShowCode']: false
                    })
                    wx.removeStorageSync('inviteCode')
                    wx.removeStorageSync('joinFamily')
                    wx.setStorage({
                        key: 'joinFamily',
                        data: app.globalData.joinFamily
                    })
                }
            }
        },
        addItem(connectionName, data) {
            return service.addZhanDFn(data, connectionName).then(values => {
                if (values['code'] === 0) {
                    utils.showToast('success', '添加成功')
                    return {
                        code: 0
                    }
                } else {
                    utils.showToast('none', values['msg'] || '添加失败')
                    return {
                        code: -1
                    }
                }
            }).catch(err => {
                console.log('添加失败>>>', err)
                utils.showToast('none', '添加失败')
                return {
                    code: -1
                }
            })
        },



        // 获取家庭ID
        async getFamilyIDFn() { },
        // 查询
        search(url, collectionName, value, sort = null, dateQj = null) {
            const params = {
                $url: url,
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
    }
})