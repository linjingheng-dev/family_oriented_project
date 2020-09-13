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
        scrollLeft: 0,
        homeTab: conf.HELPHOMEPAGE,
        currentTab: 0,
        windowHeight: 0,
        isShowMoney: false,
        showList: [],
        zanZhuList: [],
        helpList: [],

        touchStartTime: 0,
        touchEndTime: 0,
        lastTapTime: 0,
        delBtnWidth: 480,
        isScroll: true,
        timer: null,
        noData: conf.NODATA,
        editData: null,
        helpMoney: null,
        // 条件选择
        startDate: moment(moment().month(moment().month() - 1).endOf('month').valueOf()).format('YYYY-MM-DD'),
        endDate: moment().format('YYYY-MM-DD')
    },
    attached() {
        this.setData({
            CustomBar: app.globalData.CustomBar,
            isHaveFamily: utils.getFamily()
        })
        if (!this.data.isHaveFamily) {
            return utils.showToast('none', `您尚未加入家庭！`, 1500)
        }
        const that = this;
        wx.getSystemInfo({
            success: function (res) {
                that.setData({
                    windowHeight: res.windowHeight
                })
            }
        })
        this.init()
    },
    methods: {
        init() {
            this.getListFn()
        },
        // tab 选择
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
                scrollLeft: (id - 1) * 60
            })
            this.getListFn()
        },
        // 日期选择
        selectDateFn(e) {
            if (!this.data.isHaveFamily) {
                return
            }
            const type = e.currentTarget.dataset.type
            if (type === '0') {
                this.setData({
                    startDate: e.detail.value
                })
            } else if (type === '1') {
                this.setData({
                    endDate: e.detail.value
                })
            } else if (type === '2') {
                this.getListFn()
            } else {
                this.exportFn('export', this.returnTableName()['tableName'])
            }
        },
        // 列表触摸操作
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
        drawMove: function (e) {
            if (e.currentTarget.dataset.data['isComplete'] || this.data.currentTab === 1) {
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
        // 删除
        deleteFn(e) {
            if (!this.data.isHaveFamily) {
                return
            }
            const data = e.currentTarget.dataset.data
            if (data.isComplete) {
                utils.showToast('none', '该任务是办结任务，请联系管理人进行删除！')
                return
            }
            wx.showModal({
                title: '提示',
                content: `是否删除${this.data.currentTab === 0 ? '赞助家人' : '帮衬家人'}：${data['title_C']}？`,
                showCancel: true,
                success: res => {
                    if (res.confirm) {
                        const connectionName = this.returnTableName()['tableName']
                        this.setData({
                            isShow: true,
                            loadingText: '删除数据中'
                        })
                        service.addEditSearchProject(connectionName, {}, data['_id'], 2).then(values => {
                            this.setData({
                                isShow: false
                            })
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
                                    that.getListFn()
                                    clearTimeout(timer)
                                }, 1500)
                                utils.showToast('success', '删除成功')
                            } else {
                                utils.showToast('none', values['msg'] ? values['msg'] : '删除失败，请反馈给开发者，^_^')
                                console.log('删除数据失败', values['msg'] || '删除失败')
                            }
                        }).catch(err => {
                            console.log('删除数据失败', err)
                            this.setData({
                                isShow: false
                            })
                            utils.showToast('none', values['msg'] ? values['msg'] : '删除失败，请反馈给开发者，^_^')
                        })
                    }
                }
            })
        },
        editParams(obj) {
            if (this.data.currentTab === 0) {
                return {
                    sqgs: obj['sqgs'],
                    sqr: obj['sqr'],
                    sqje: obj['sqje'],
                    gatheringIndex: obj['gatheringIndex'],
                    sqsx: obj['sqsx'],
                    bankCard: obj['bankCard'],
                    zzr: obj['zzr'] || [], // 赞助人
                    imgList: obj['fileID'] ? obj['fileID'].split(',') : [],
                    isComplete: obj['isComplete'] || false,
                    isTop: obj['isTop'] || false,
                    _id: obj['_id']
                }
            } else if (this.data.currentTab === 1) {
                return {
                    xmIndex: obj['xmIndex'],
                    nameIndex: obj['nameIndex'],
                    sqNameIndex: obj['sqNameIndex'],
                    zjrIndex: obj['zjrIndex'],
                    zcje: obj['zcje'],
                    zcIndex: obj['zcIndex'],
                    bankCard: obj['bankCard'],
                    selectDate: obj['selectDate'],
                    isComplete: obj['isComplete'] || false,
                    isTop: obj['isTop'] || false,
                    _id: obj['_id']
                }
            }
        },
        // 编辑
        editFn(e) {
            if (!this.data.isHaveFamily) {
                return
            }
            const that = this
            const data = e.currentTarget.dataset.data
            const obj = that.editParams(data)
            if (that.data.touchEndTime - that.data.touchStartTime < 350) {
                const currentTime = e.timeStamp
                const lastTapTime = that.data.lastTapTime
                that.setData({
                    lastTapTime: currentTime
                })
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
                                that.getListFn()
                            }
                        },
                        success: function (res) {
                            res.eventChannel.emit('editFn', obj)
                        }
                    })
                } else {
                    // 单击
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
        // 置顶、取消置顶、赞助、办结
        btnAction: function (e) {
            if (!this.data.isHaveFamily) {
                return
            }
            const key = e.currentTarget.dataset.key
            const data = e.currentTarget.dataset.data
            this.editTaskFn(key, data)
        },
        editTaskFn(key, data) {
            const params = {}
            if (key === '0') {
                params['isTop'] = data['isTop'] ? false : true
                params['isTopTime'] = moment().valueOf()
                this.editItemFn(key, params, data)
            } else if (key === '1') {
                params['isZzu'] = true
                params['zzuDate'] = moment().valueOf()
                params['zzuNickname'] = app.globalData.userInfo['nickName']
                params['zzuOpenid'] = app.globalData.openid
                params['chuqian'] = ''
                this.setData({
                    isShowMoney: true,
                    editData: {
                        params: params,
                        data: data,
                        key: key
                    }
                })
            } else if (key === '2') {
                params['isComplete'] = true
                params['completeTime'] = moment().valueOf()
                params['completeUsearNickname'] = app.globalData.userInfo['nickName']
                params['completeUsearOpenid'] = app.globalData.openid
                wx.showModal({
                    title: '提示',
                    content: `是否继续办结任务？`,
                    showCancel: true,
                    success: res => {
                        if (res.confirm) {
                            this.editItemFn(key, params, data)
                        }
                    }
                })
            }
        },
        // 赞助金额输入
        bankInput(e) {
            this.setData({
                helpMoney: e.detail.value || null
            })
        },
        helpModalFn(e) {
            if (e.currentTarget.dataset.flag === '0') {
                this.setData({
                    isShowMoney: false,
                    editData: null,
                    helpMoney: null
                })
            } else {
                if (!this.data.isHaveFamily) {
                    return
                }
                const key = this.data.editData['key']
                const params = this.data.editData['params']
                const data = this.data.editData['data']
                const money = this.data.helpMoney
                wx.showModal({
                    title: '提示',
                    content: `是否继续给 [${data['sqr']}] 提供赞助？[注]：如需删除，请联系管理员`,
                    showCancel: true,
                    success: res => {
                        if (res.confirm) {
                            this.setData({
                                isShowMoney: false,
                                editData: null,
                                helpMoney: null
                            })
                            params['chuqian'] = money
                            data['zzr'].push(params)
                            this.editItemFn(key, { zzr: data['zzr'] }, data)
                        }
                    }
                })
            }
        },
        // 编辑记录
        editItemFn(key, params, data) {
            let tipMsg = ''
            if (key === '0') {
                tipMsg = params['isTop'] ? '置顶' : '取消置顶'
            } else if (key === '1') {
                tipMsg = this.data.currentTab === 0 ? '赞助' : '帮衬'
            } else if (key === '2') {
                tipMsg = '办结'
            }
            this.setData({
                isShow: true,
                loadingText: '上传数据中'
            })
            service.addEditSearchProject(this.returnTableName()['tableName'], params, { _id: data['_id'] }, 1).then(values => {
                this.setData({
                    isShow: false
                })
                if (values['code'] === 0) {
                    utils.showToast('success', `${tipMsg}成功${key === '1' ? '，请及时给' + data['sqr'] + '打款' : ''}`)
                    const that = this
                    const timer = setTimeout(() => {
                        that.getListFn()
                        clearTimeout(timer)
                    }, 1500)
                } else {
                    utils.showToast('none', values['msg'] || `${tipMsg}失败`)
                    console.log(`${tipMsg}失败`, values['msg'] || `${tipMsg}失败`)
                }
            }).catch(err => {
                console.log(`${tipMsg}失败`, err)
                utils.showToast('none', `${tipMsg}失败`)
                this.setData({
                    isShow: false
                })
            })
        },
        // 获取数据相关配置
        returnTableName() {
            if (this.data.currentTab === 0) {
                return {
                    tableName: 'publish_sponsor',
                    editDetailPage: `/pages/publish/sponsor/index`
                }
            } else if (this.data.currentTab === 1) {
                return {
                    tableName: 'bill_write',
                    editDetailPage: `/pages/publish/bill/index`
                }
            }
        },
        getListFn() {
            if (!this.data.isHaveFamily) {
                return
            }
            const sortList = [
                { filed: 'isTop', sortDesc: 'desc' }
            ]
            this.search(this.returnTableName()['tableName'], {familyID: app.globalData.joinFamily['joinFamilyID']}, sortList)
        },
        /**
         * 获取列表数据
         * @param {string} collectionName 集合名
         * @param {object} value 查询条件
         * @param {array} sort 排序
         */
        search(collectionName, value, sort = null) {
            const params = {
                $url: 'publish/getData',
                flag: 0,
                connectionName: collectionName,
                data: value,
                dateQj: {
                    file: 'createDate',
                    startDate: moment(this.data.startDate).valueOf(),
                    endDate: moment(moment(this.data.endDate, 'YYYY-MM-DD').add(1, 'days')).valueOf()
                }
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
                    console.log('获取列表信息失败', res['msg'] || '查询失败')
                } else {
                    const data = res['data'] || []
                    this.seatValue(data)
                }
            }).catch(err => {
                console.log('获取列表信息失败', err)
                this.setData({
                    isShow: false
                })
            })
        },
        // 数据的设置
        seatValue(data) {
            switch (this.data.currentTab) {
                case 0:
                    data.forEach(i => {
                        i['titleColor'] = ''
                        i['title_C'] = `${i['sqr']}于${moment(i['createDate']).format('YYYY-MM-DD HH:mm:ss')}申请赞助，需要赞助金额为：${i['sqje']}元${i['sqgs'] ? '，' + '主要用于：' + i['sqgs'] : ''}`
                        i['smallText'] = `[${i['nickName']}] 于 ${i['isComplete'] ? moment(i['completeTime']).format('YYYY-MM-DD HH:mm:ss') : moment(i['createDate']).format('YYYY-MM-DD HH:mm:ss')} ${i['isComplete'] ? '办结' : '创建'}${i['isComplete'] ? '' : '，可以通过' + i['gatheringName'] + '进行转账'}`
                        const tbalList = [
                            { name: `申请金额：${i['sqje']}`, color: 'gray' },
                            { name: `收钱方式：${i['gatheringName']}`, color: 'green' }
                        ]
                        if (i['bankName']) {
                            tbalList.push({ name: i['bankName'], color: 'orange' }),
                                tbalList.push({ name: i['bankCard'], color: 'orange' })
                        }
                        if (i['isComplete']) {
                            tbalList.push({ name: '赞助结束', color: 'gray' })
                            if (i['zzr'] && i['zzr'].length) {
                                let total = 0
                                for (let j = 0; j < i['zzr'].length; j++) {
                                    total = total + (i['zzr'][j]['chuqian'] ? Number(i['zzr'][j]['chuqian']) : 0)
                                }
                                tbalList.unshift({ name: `收到金额：${total.toFixed(2)}`, color: 'red' })
                            }
                        }
                        if (i['isTop']) {
                            tbalList.push({ name: '置顶', color: 'yellow' })
                        }
                        i['tabList'] = tbalList
                    })
                    this.setData({
                        zanZhuList: data,
                        showList: data
                    })
                    break
                case 1:
                    data.forEach(i => {
                        i['titleColor'] = ''
                        i['title_C'] = `${i['nameName']}出了${i['zcje']}元，用于对${i['sqNameName']}进行${i['xmName']}的帮助`
                        i['smallText'] = `[${i['nickName']}] 于 ${i['isComplete'] ? moment(i['completeTime']).format('YYYY-MM-DD HH:mm:ss') : moment(i['createDate']).format('YYYY-MM-DD HH:mm:ss')} ${i['isComplete'] ? '办结' : '创建'}，该次帮助是通过${i['zcName']}转账的方式进行`
                        const tbalList = [
                            { name: `出钱数目：${i['zcje']}`, color: 'gray' },
                            { name: `出钱方式：${i['zcName']}`, color: 'green' }
                        ]
                        if (i['isComplete']) {
                            tbalList.push({ name: '办结', color: 'gray' })
                        }
                        if (i['isTop']) {
                            tbalList.push({ name: '置顶', color: 'yellow' })
                        }
                        i['tabList'] = tbalList
                    })
                    this.setData({
                        helpList: data,
                        showList: data
                    })
                    break
            }
        },
        // 导出
        exportFn(nodeName, collectionName) {
            const params = {
                $url: 'export',
                flag: 0,
                connectionName: collectionName,
                data: {familyID: app.globalData.joinFamily['joinFamilyID']},
                dateQj: {
                    file: 'createDate',
                    startDate: moment(this.data.startDate).valueOf(),
                    endDate: moment(moment(this.data.endDate, 'YYYY-MM-DD').add(1, 'days')).valueOf()
                },
                exportFlag: 'bcjr'
            }
            this.setData({
                isShow: true,
                loadingText: '导出数据中'
            })
            utils.cloudFn(nodeName, params).then(values => {
                this.setData({
                    isShow: false
                })
                const res = utils.cloudDataH(values, '导出成功', '导出失败')
                if (res['code'] !== 0) {
                    utils.showToast('none', res['msg'])
                } else {
                    if (res['data'] && res['data']['fileID']) {
                        wx.cloud.downloadFile({
                            fileID: res['data']['fileID'], //仅为示例，并非真实的资源
                            success(res) {
                                wx.openDocument({
                                    filePath: res['tempFilePath'],
                                    fileType: 'xlsx',
                                    success: function (res) {
                                        utils.showToast('none', '打开文件成功')
                                    },
                                    fail: err => {
                                        utils.showToast('none', '打开文件失败')
                                        console.log('导出数据失败', '打开文件失败')
                                    }
                                })
                            },
                            fail: err => {
                                utils.showToast('none', err)
                                console.log('导出数据失败', err)
                            }
                        })
                    } else {
                        utils.showToast('none', '导出失败')
                        console.log('导出数据失败', '导出失败')
                    }
                }
            }).catch(err => {
                console.log('导出数据失败', err)
                utils.showToast('none', '导出数据失败')
                this.setData({
                    isShow: false
                })
            })
        }
    }
})