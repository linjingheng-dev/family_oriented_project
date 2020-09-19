const conf = require("../../../config/conf")
const utils = require("./../../../utils/util")
const moment = require('./../../../utils/moment.min')
const service = require('./../../publish/server/index')
const app = getApp()

Component({
    options: {
        addGlobalClass: true,
    },
    data: {
        isHaveFamily: false,
        CustomBar: null,
        isShow: false,
        loadingText: '加载中',
        noData: conf.NODATA,
        homeStatusList: conf.HOMESTATUS,
        leftMoveList: conf.HOMELEFTMOVE,
        matterTemplateID: conf.MATTERTEMPLATE,
        isAuthModal: false,
        // tab
        scrollLeft: 0,
        scrollLeft1: 0,
        currentTab: 0,
        homeTab: conf.HOMETAB,
        // tab content
        showList: [],
        matterList: [],
        tijianList: [],
        caigouList: [],
        // 分页
        page: 1,
        pageSize: 5,
        totalPage: 0,
        // 点击操作
        touchStartTime: 0,
        touchEndTime: 0,
        lastTapTime: 0,
        timer: null,
        matterType: '0',
        // 滑动
        delBtnWidth: 480,
        isScroll: true,
        windowHeight: 0,
    },
    attached() {
        const that = this;
        that.setData({
            CustomBar: app.globalData.CustomBar,
            isHaveFamily: utils.getFamily()
        })
        if (!that.data.isHaveFamily) {
            return utils.showToast('none', `您尚未加入家庭！`, 1500)
        }
        wx.getSystemInfo({
            success: function (res) {
                that.setData({
                    windowHeight: res.windowHeight
                })
            }
        })
        // const timer = setTimeout(() => {
        //     that.init()
        //     clearTimeout(timer)
        // }, 1500)
        that.init()
    },
    methods: {
        // 组件刷新数据
        init(isChange = false) {
            if (!this.data.isHaveFamily) {
                return
            }
            if (isChange) {
                this.resetData()
            }
            this.getMatterList()
        },
        // 重置数据
        resetData() {
            this.setData({
                scrollLeft: 0,
                scrollLeft1: 0,
                currentTab: 0,
                homeTab: conf.HOMETAB,
                showList: [],
                matterList: [],
                tijianList: [],
                caigouList: []
            })
        },
        tabSelect(e) {
            const id = Number(e.currentTarget.dataset.id)
            this.data.homeTab.forEach(i => {
                const currentCheck = `homeTab[${i['id']}].isCheck`
                this.setData({
                    [currentCheck]: id === i['id'] ? true : false
                })
            })
            this.setData({
                currentTab: id,
                scrollLeft: (id - 1) * 60,
                homeStatusList: id === 0 ? conf.HOMESTATUS : conf.HOMETIJIAN,
                matterType: id === 0 ? '0' : '6'
            })
            this.getMatterList()
        },
        filterFn(e) {
            const type = e.currentTarget.dataset.type
            this.setData({
                matterType: type,
                scrollLeft1: (Number(type) - 1) * 60
            })
            this.getMatterList()
            utils.cloudFn('timer', {}).then(values => {});
        },
        // 事项列表
        getMatterList() {
            if (!this.data.isHaveFamily) {
                return
            }
            let params = { matterGradeIndex: this.data.matterType, isComplete: false }
            let sortList = null
            if (this.data.matterType === '3') {
                params = { isTop: true, isComplete: false }
                sortList = [
                    { filed: 'matterDate', sortDesc: 'desc' },
                    { filed: 'time', sortDesc: 'desc' }
                ]
            } else if (this.data.matterType === '4') {
                params = { isTimeTask: true, isComplete: false }
                sortList = [
                    { filed: 'isTop', sortDesc: 'desc' },
                    { filed: 'matterDate', sortDesc: 'desc' },
                    { filed: 'time', sortDesc: 'desc' }
                ]
            } else if (this.data.matterType === '5') {
                params = { isComplete: true }
                sortList = [
                    { filed: 'completeTime', sortDesc: 'desc' }
                ]
            } else if (this.data.matterType === '6') {
                params = { isComplete: false }
                sortList = [
                    { filed: 'tjfy', sortDesc: 'asc' }
                ]
            } else if (this.data.matterType === '7') {
                params = { isComplete: false }
                sortList = [
                    { filed: 'tjfy', sortDesc: 'desc' }
                ]
            } else if (this.data.matterType === '8') {
                params = {}
                sortList = [
                    { filed: 'isTop', sortDesc: 'desc' },
                    { filed: 'matterDate', sortDesc: 'desc' },
                    { filed: 'time', sortDesc: 'desc' }
                ]
            } else {
                sortList = [
                    { filed: 'isTop', sortDesc: 'desc' }
                ]
            }
            params['familyID'] = app.globalData.joinFamily['joinFamilyID']
            console.log('获取列表参数>>>', params)
            this.search(this.returnTableName()['tableName'], params, 1, sortList)
        },
        returnTableName() {
            if (this.data.currentTab === 0) {
                return {
                    tableName: 'publish_matter',
                    editDetailPage: `/pages/publish/matter/index`
                }
            } else if (this.data.currentTab === 1) {
                return {
                    tableName: 'publish_tijian',
                    editDetailPage: `/pages/publish/physical_examination/index`
                }
            } else if (this.data.currentTab === 2) {
                return {
                    tableName: 'publish_purchase',
                    editDetailPage: `/pages/publish/purchase/index`
                }
            }
        },
        /**
         * @description 获取数据
         * @author 林景恒
         * @date 2020-08-22
         * @param {*} collectionName 集合名
         * @param {*} value 查询的值
         */
        search(collectionName, value, page = null, sort = null) {
            const params = {
                $url: 'publish/getData',
                flag: value ? 0 : 1,
                connectionName: collectionName,
                isSort: sort ? true : false,
                sortList: sort || [],
                data: value
            }
            this.setData({
                isShow: true,
                loadingText: '加载中'
            })
            utils.cloudFn('help', params).then(values => {
                this.setData({
                    isShow: false
                })
                const res = utils.cloudDataH(values, '查询成功', '查询失败')
                if (res['code'] !== 0) {
                    utils.showToast('none', res['msg'])
                    console.log('获取列表信息失败', res['msg'] || '获取列表失败')
                } else {
                    const data = res['data'] || []
                    this.seatValue(data)
                }
            }).catch(err => {
                console.log('获取列表信息失败', err)
                this.setData({
                    isShow: false
                })
                // wx.stopPullDownRefresh()
            })
        },
        seatValue(data) {
            switch (this.data.currentTab) {
                case 0:
                    data.forEach(i => {
                        i['titleColor'] = i['isComplete'] ? '' : (i['matterGradeIndex'] === '0' ? 'text-red' : (i['matterGradeIndex'] === '1' ? 'text-cyan' : 'text-green'))
                        i['title_C'] = i['title']
                        i['smallText'] = `[${i['nickName']}] 于 ${i['isComplete'] ? moment(i['completeTime']).format('YYYY-MM-DD HH:mm:ss') : moment(i['createDate']).format('YYYY-MM-DD HH:mm:ss')} ${i['isComplete'] ? '办结' : '创建'}，该事项执行时间为：${i['matterDate']} ${i['time']}`
                        const tbalList = [
                            { name: i['typeName'], color: 'gray' },
                            { name: i['matterGradeName'], color: i['matterGradeIndex'] === '0' ? 'red' : (i['matterGradeIndex'] === '1' ? 'cyan' : 'green') }
                        ]
                        if (i['isComplete']) {
                            tbalList.push({ name: '办结', color: 'gray' })
                        }
                        if (i['isTop']) {
                            tbalList.push({ name: '置顶', color: 'yellow' })
                        }
                        if (i['isTimer']) {
                            tbalList.push({ name: '定时任务', color: 'blue' })
                        }
                        i['tabList'] = tbalList
                    })
                    this.setData({
                        matterList: data,
                        showList: data,
                        // page: data.length ? data[0]['page'] : 1,
                        // totalPage: data.length ? data[0]['totalPage'] : 0
                    })
                    break
                case 1:
                    data.forEach(i => {
                        i['titleColor'] = ''
                        i['title_C'] = `${i['tjdxName']}的${i['tjDate']}的体检结论为 [${i['tjgsName']}]`
                        i['smallText'] = `[${i['nickName']}] 于 ${moment(i['completeTime']).format('YYYY-MM-DD HH:mm:ss') || moment(i['createDate']).format('YYYY-MM-DD HH:mm:ss')} ${i['completeTime'] ? '办结' : '填报'}，送检医师是${i['tjyy']}/${i['tiks']} 的${i['sjys']}`
                        const tbalList = [
                            { name: `体检费用：${i['tjfy']}`, color: 'gray' }
                        ]
                        if (i['isComplete']) {
                            tbalList.push({ name: '办结', color: 'gray' })
                        }
                        if (i['isTop']) {
                            tbalList.push({ name: '置顶', color: 'yellow' })
                        }
                        if (i['isTimer']) {
                            tbalList.push({ name: '定时任务', color: 'blue' })
                        }
                        i['tabList'] = tbalList
                    })
                    this.setData({
                        matterList: data,
                        showList: data,
                        // page: data.length ? data[0]['page'] : 1,
                        // totalPage: data.length ? data[0]['totalPage'] : 0
                    })
                    break
                case 2:
                    data.forEach(i => {
                        i['titleColor'] = ''
                        i['title_C'] = i['title']
                        i['smallText'] = `[${i['nickName']}] 于 ${moment(i['completeTime']).format('YYYY-MM-DD HH:mm:ss') || moment(i['createDate']).format('YYYY-MM-DD HH:mm:ss')} ${i['completeTime'] ? '办结' : '填报'}${i['cgrName'] ? '，' : ''} ${i['cgrName']}于${i['cgDate']} ${i['time']} ${i['money'] ? '采购' : '计划采购'}`
                        const tbalList = [
                            { name: `采购金额：${i['money'] ? Number(i['money']).toFixed(2) : '0.00'}`, color: 'gray' }
                        ]
                        if (i['isComplete']) {
                            tbalList.push({ name: '办结', color: 'gray' })
                        }
                        if (i['isTop']) {
                            tbalList.push({ name: '置顶', color: 'yellow' })
                        }
                        if (i['isTimer']) {
                            tbalList.push({ name: '定时任务', color: 'blue' })
                        }
                        i['tabList'] = tbalList
                    })
                    this.setData({
                        matterList: data,
                        showList: data
                    })
                    break
            }
        },
        // 删除
        deleteFn(e) {
            const data = e.currentTarget.dataset.data
            if (data.isComplete) {
                utils.showToast('none', '该任务是办结任务，请联系管理人进行删除！')
                return
            }
            wx.showModal({
                title: '提示',
                content: `是否删除${this.data.currentTab === 0 ? '事项' : (this.data.currentTab === 1 ? '体检' : '采购')}：${data['title_C']}？`,
                showCancel: true,
                success: res => {
                    if (res.confirm) {
                        const connectionName = this.returnTableName()['tableName']
                        service.addEditSearchProject(connectionName, {}, data['_id'], 2).then(values => {
                            if (values['code'] === 0) {
                                if (this.data.currentTab !== 0) {
                                    // 删除附件
                                    if (data['fileID']) {
                                        wx.cloud.deleteFile({
                                            fileList: data['fileID'].split(',')
                                        })
                                    }
                                }
                                const that = this
                                const timer = setTimeout(() => {
                                    that.getMatterList()
                                    clearTimeout(timer)
                                }, 1500)
                                utils.showToast('success', '删除成功')
                            } else {
                                utils.showToast('none', values['msg'] ? values['msg'] : '删除失败，请反馈给开发者，^_^')
                            }
                        })
                    }
                }
            })
        },
        // 删除掉定时任务中的数据
        delSubscribeFn(_id) {
            service.addEditSearchProject('timer_matter', {}, {parentID: data['_id']}, 3)
            service.addEditSearchProject('timer_matter_id_map', {}, {otherTableID: data['_id']}, 3)
            service.addEditSearchProject('subscribe_template', {}, {matterID: data['_id']}, 3)
        },
        // 编辑
        editFn(e) {
            const that = this
            const data = e.currentTarget.dataset.data
            const obj = that.editParams(data)
            if (that.data.touchEndTime - that.data.touchStartTime < 350) {
                const currentTime = e.timeStamp
                const lastTapTime = that.data.lastTapTime
                that.setData({
                    lastTapTime: currentTime
                })
                // 如果两次点击时间在300毫秒内，则认为是双击事件
                if (currentTime - lastTapTime < 300) {
                    obj['isEdit'] = true
                    obj['isDetail'] = false
                    clearTimeout(that.data.timer)
                    if (e.currentTarget.dataset.data.isComplete) {
                        utils.showToast('none', '已办结的任务不能再次修改！')
                        return
                    }
                    wx.navigateTo({
                        url: that.returnTableName()['editDetailPage'],
                        events: {
                            refresh: function (data) {
                                that.setData({
                                    currentTab: data['flag']
                                })
                                that.getMatterList()
                            }
                        },
                        success: function (res) {
                            res.eventChannel.emit('editFn', obj)
                        }
                    })
                } else {
                    that.setData({
                        timer: setTimeout(() => {
                            obj['isEdit'] = false
                            obj['isDetail'] = true
                            wx.navigateTo({
                                url: that.returnTableName()['editDetailPage'],
                                success: function (res) {
                                    res.eventChannel.emit('editFn', obj)
                                }
                            })
                            clearTimeout(that.timer)
                        }, 300)
                    })
                }
            }
        },
        // 点击操作
        touchStart: function (e) {
            const touch = e.touches[0]
            for (let index in this.data.showList) {
                const item = this.data.showList[index]
                item.right = 0
            }
            this.setData({
                showList: this.data.showList,
                startX: touch.clientX,
                touchStartTime: e.timeStamp
            })
        },
        // 按钮触摸结束触发的事件
        touchEnd: function (e) {
            this.setData({
                touchEndTime: e.timeStamp
            })
            const item = this.data.showList[e.currentTarget.dataset.index]
            if (item.right >= this.data.delBtnWidth / 2) {
                item.right = this.data.delBtnWidth
                this.setData({
                    isScroll: true,
                    showList: this.data.showList,
                })
            } else {
                item.right = 0
                this.setData({
                    isScroll: true,
                    showList: this.data.showList,
                })
            }
        },
        // 编辑参数
        editParams(data) {
            if (this.data.currentTab === 0) {
                return {
                    title: data['title'],
                    typeIndex: data['typeIndex'],
                    typeName: data['typeName'],
                    matterGradeIndex: data['matterGradeIndex'],
                    matterGradeName: data['matterGradeName'],
                    matterDate: data['matterDate'],
                    time: data['time'],
                    zxzIndex: data['zxzIndex'],
                    zxzName: data['zxzName'],
                    dd: data['dd'],
                    bz: data['bz'],
                    isComplete: data['isComplete'] || false,
                    isTop: data['isTop'] || false,
                    _id: data['_id']
                }
            } else if (this.data.currentTab === 1) {
                const copyData = JSON.parse(JSON.stringify(data['fileID']))
                return {
                    tjdxIndex: data['tjdxIndex'],
                    tjyy: data['tjyy'],
                    tjDate: data['tjDate'],
                    tiks: data['tiks'],
                    sjys: data['sjys'],
                    tjfy: data['tjfy'],
                    zysx: data['zysx'],
                    tjgsIndex: data['tjgsIndex'],
                    tjImgList: data['fileID'] ? data['fileID'].split(',') : [],
                    fileID: copyData ? copyData.split(',') : [],
                    isComplete: data['isComplete'] || false,
                    isTop: data['isTop'] || false,
                    _id: data['_id']
                }
            } else if (this.data.currentTab === 2) {
                return {
                    title: data['title'],
                    typeIndex: data['typeIndex'],
                    cgDate: data['cgDate'],
                    time: data['time'],
                    cgrIndex: data['cgrIndex'],
                    fwdxIndex: data['fwdxIndex'],
                    shopTypeIndex: data['shopTypeIndex'],
                    shopUrl: data['shopUrl'],
                    money: data['money'],
                    detail: data['detail'],
                    imgList: data['fileID'] ? data['fileID'].split(',') : [],
                    isComplete: data['isComplete'] || false,
                    isTop: data['isTop'] || false,
                    _id: data['_id']
                }
            }
        },
        // 左滑操作
        drawMove: function (e) {
            if (e.currentTarget.dataset.data['isComplete']) {
                return
            }
            const touch = e.touches[0]
            const item = this.data.showList[e.currentTarget.dataset.index]
            let disX = this.data.startX - touch.clientX
            if (disX >= 20) {
                if (disX > this.data.delBtnWidth) {
                    disX = this.data.delBtnWidth
                }
                item.right = disX
                this.setData({
                    isScroll: false,
                    showList: this.data.showList
                })
            } else {
                item.right = 0
                this.setData({
                    isScroll: true,
                    showList: this.data.showList
                })
            }
        },
        btnAction: function (e) {
            const key = e.currentTarget.dataset.key
            const data = e.currentTarget.dataset.data
            if (key === '2') {
                return this.selectSubscribeFn(data, this.data.matterTemplateID)
            }
            this.editTaskFn(key, data)
        },
        // 设置定时任务
        setTimerFn(itemData) {
            if (!this.data.isHaveFamily) {
                return
            }
            const sendData = {
                currentTab: this.data.currentTab,
                prevPageFlag: 0,
                data: itemData,
                tableName: this.returnTableName()['tableName']
            }
            const that = this
            wx.navigateTo({
                url: '/pages/housewifery/timer/index',
                events: {
                    refresh: function (data) {
                        that.setData({
                            currentTab: data['flag']
                        })
                        that.getMatterList()
                    }
                },
                success: function (res) {
                    res.eventChannel.emit('editFn', sendData)
                }
            })
        },
        editTaskFn(key, data) {
            if (!this.data.isHaveFamily) {
                return
            }
            let params = {}
            if (key === '0') {
                params['isTop'] = data['isTop'] ? false : true
                params['isTopTime'] = moment().valueOf()
            } else if (key === '1') {
                params['isComplete'] = true
                params['completeTime'] = moment().valueOf()
                params['completeUsearNickname'] = app.globalData.userInfo['nickName']
            }
            this.setData({
                isShow: false,
                loadingText: '上传数据中'
            })
            const sendData = {_id: data['_id'], familyID: app.globalData.joinFamily['joinFamilyID']}
            service.addEditSearchProject(this.returnTableName()['tableName'], params, sendData, 1).then(values => {
                this.setData({
                    isShow: false
                })
                if (values['code'] === 0) {
                    utils.showToast('success', `${key === '0' ? (params['isTop'] ? '置顶' : '取消置顶') : '办结'}成功`)
                    const that = this
                    const timer = setTimeout(() => {
                        that.getMatterList()
                        clearTimeout(timer)
                    }, 1500)
                } else {
                    utils.showToast('none', values['msg'] || `${key === '0' ? (params['isTop'] ? '置顶' : '取消置顶') : '办结'}失败`)
                }
            }).catch(err => {
                console.log(`${key === '0' ? (params['isTop'] ? '置顶' : '取消置顶') : '办结'}失败`, err)
                utils.showToast('none', `${key === '0' ? (params['isTop'] ? '置顶' : '取消置顶') : '办结'}失败`)
                this.setData({
                    isShow: false
                })
            })
        },
        // 消息订阅
        subscriptionFn() {
            const currentData = wx.getStorageSync('matterKey')
            console.log('模板调用>>>', currentData)
            const that = this
            wx.removeStorageSync('matterKey')
            wx.requestSubscribeMessage({
                tmplIds: [currentData['templateID']],
                success(res) {
                    if (res[currentData['templateID']] === 'reject') {
                        utils.showToast('none', '因为没有授权，因此不能进行定时任务的设置')
                    } else {
                        that.addSubscribeFn(currentData['data'], currentData['templateID'])
                    }
                },
                fail(err) {
                    console.log('授权失败》》》》', err)
                    utils.showToast('none', '授权失败！')
                }
            })
            this.setData({
                isAuthModal: false
            })
        },
        selectSubscribeFn(data, templateID) {
            if (!this.data.isHaveFamily) {
                return
            }
            const params = {
                $url: 'publish/getData',
                flag: 0,
                connectionName: 'subscribe_template',
                data: {
                    templateID: templateID, // 模板 ID
                    currentUserOpenID: app.globalData.openid, // 当前操作人
                    matterID: data['_id'], // 事项 ID
                    familyID: app.globalData.joinFamily['joinFamilyID'] // 家庭 ID
                }
            }
            console.log('获取模板消息参数>>>', params)
            this.setData({
                isShow: true,
                loadingText: '查询数据中'
            })
            utils.cloudFn('help', params).then(values => {
                this.setData({
                    isShow: false
                })
                const res = utils.cloudDataH(values, '', '查询授权数据失败')
                if (res['code'] !== 0) {
                    utils.showToast('none', res['msg'])
                    console.log('获取模板消息失败>>>', res['msg'] || '获取模板消息失败')
                } else {
                    const result = res['data'] || []
                    data['templateID'] = templateID
                    if (result.length) {
                        this.setTimerFn(data)
                    } else {
                        wx.setStorage({
                            key: 'matterKey',
                            data: {
                                data,
                                templateID
                            }
                        })
                        this.setData({
                            isAuthModal: true
                        })
                    }
                }
            }).catch(err => {
                this.setData({
                    isShow: false
                })
                console.log('查询订阅次数失败！', err)
                utils.showToast('none', '获取订阅次数失败！')
            })

        },
        authAction() {
            wx.removeStorageSync('matterKey')
            this.setData({
                isAuthModal: false
            })
        },
        addSubscribeFn(data, templateID) {
            if (!this.data.isHaveFamily) {
                return
            }
            const params = {
                templateID: templateID,
                currentUserOpenID: app.globalData.openid,
                matterID: data['_id'],
                num: 1,
                familyID: app.globalData.joinFamily['joinFamilyID']
            }
            this.setData({
                isShow: true,
                loadingText: '授权记录中'
            })
            service.addZhanDFn(params, 'subscribe_template').then(values => {
                this.setData({
                    isShow: false
                })
                if (values['code'] === 0) {
                    this.setTimerFn(data)
                } else {
                    utils.showToast('none', values['msg'] || '记录权限信息失败')
                }
            }).catch(err => {
                this.setData({
                    isShow: false
                })
                console.log('记录权限信息失败>>>', err)
                utils.showToast('none', '记录权限信息失败')
            })
        }

    }
})