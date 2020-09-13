const conf = require('./../../../config/conf')
const utils = require('./../../../utils/util')
const moment = require('./../../../utils/moment.min')
const bankUtil = require('./../../../config/bank')
const service = require('./../server/index')
const app = getApp()

Page({
    data: {
        isHaveFamily: false,
        noData: conf.NODATA,
        isShow: false,
        loadingText: '数据加载中',
        windowHeight: 0,
        touchStartTime: 0,
        touchEndTime: 0,
        delBtnWidth: 480, // 左滑菜单
        isScroll: true,
        listData: [],
        titleObj: {
            '事项管理': 0
        }
    },
    onLoad: function (options) {
        this.layoutInitFn()
    },
    // 界面布初始化
    layoutInitFn() {
        const that = this;
        wx.getSystemInfo({
            success: function (res) {
                that.setData({
                    windowHeight: res.windowHeight
                })
            }
        })
        that.setData({
            CustomBar: app.globalData.CustomBar,
            isHaveFamily: utils.getFamily()
        })
        if (!this.data.isHaveFamily) {
            return utils.showToast('none', `您尚未加入家庭！`, 1500)
        }
        this.initFn()
    },
    // 数据初始化
    initFn() {
        this.getSubscribeTemplareFn()
    },
    // 获取 subscribe_template 表数据
    async getSubscribeTemplareFn() {
        if (!this.data.isHaveFamily) {
            return
        }
        const params = { num: 1, familyID: app.globalData.joinFamily['joinFamilyID'] }
        const subscribeData = await this.searchDataFn('subscribe_template', params)
        console.log('获取订阅模板相关信息', params)
        if (subscribeData && subscribeData['code'] === 0) {
            if (subscribeData && subscribeData['data'] && subscribeData['data'].length) {
                this.getTimerMatterFn(subscribeData['data'])
            } else {
                this.setData({
                    listData: []
                })
            }
        } else {
            this.setData({
                listData: []
            })
            utils.showToast('none', '查询数据失败')
        }
    },
    // 获取 timer_matter 中的事项数据
    async getTimerMatterFn(data) {
        let listData = []
        for (let i = 0; i < data.length; i++) {
            const params = { parentID: data[i]['matterID'], yesOrNo: 0, familyID: app.globalData.joinFamily['joinFamilyID'] }
            const timerMatterData = await this.searchDataFn(
                'timer_matter', params, [{ filed: 'taskEEDate', sortDesc: 'desc' }]
            )
            console.log('定时任务信息>>>', params)
            if (timerMatterData && timerMatterData['code'] === 0) {
                if (timerMatterData && timerMatterData['data'] && timerMatterData['data'].length) {
                    listData = [...listData, ...timerMatterData['data']]
                }
            }
        }
        console.log('定时任务中的编辑>>', listData)
        this.setData({
            listData: listData
        })
    },
    // 查询数据
    searchDataFn(collectionName, value = null, sort = null) {
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
            loadingText: '数据加载中'
        })
        return utils.cloudFn('help', params).then(values => {
            this.setData({
                isShow: false
            })
            let resData = {}
            const res = utils.cloudDataH(values, '查询成功', '查询失败')
            if (res['code'] !== 0) {
                resData = {
                    code: -1,
                    msg: res['msg'] || '查询数失败'
                }
            } else {
                const data = res['data'] || []
                resData = {
                    code: 0,
                    data: data,
                    msg: 'success'
                }
            }
            return resData
        }).catch(err => {
            console.log('获取数据失败', err)
            return {
                code: -1,
                msg: err || '获取数据失败'
            }
        })

    },
    // 触屏操作
    touchStart: function (e) {
        const touch = e.touches[0]
        for (let index in this.data.listData) {
            const item = this.data.listData[index]
            item.right = 0
        }
        this.setData({
            listData: this.data.listData,
            startX: touch.clientX,
            touchStartTime: e.timeStamp
        })
    },
    touchEnd: function (e) {
        this.setData({
            touchEndTime: e.timeStamp
        })
        const item = this.data.listData[e.currentTarget.dataset.index]
        if (item.right >= this.data.delBtnWidth / 2) {
            item.right = this.data.delBtnWidth
            this.setData({
                isScroll: true,
                listData: this.data.listData,
            })
        } else {
            item.right = 0
            this.setData({
                isScroll: true,
                listData: this.data.listData,
            })
        }
    },
    drawMove: function (e) {
        return
        // const touch = e.touches[0]
        // const item = this.data.listData[e.currentTarget.dataset.index]
        // let disX = this.data.startX - touch.clientX
        // if (disX >= 20) {
        //     if (disX > this.data.delBtnWidth) {
        //         disX = this.data.delBtnWidth
        //     }
        //     item.right = disX
        //     this.setData({
        //         isScroll: false,
        //         listData: this.data.listData
        //     })
        // } else {
        //     item.right = 0
        //     this.setData({
        //         isScroll: true,
        //         listData: this.data.listData
        //     })
        // }
    },
    // 删除
    cancelFn(e) {
        const data = e.currentTarget.dataset.data
        wx.showModal({
            title: '提示',
            content: `是否取消事项在规定时间内推送消息？`,
            showCancel: true,
            success: res => {
                if (res.confirm) {
                    this.actionFn(data)
                }
            }
        })
    },
    // 取消
    async actionFn(data) {
        if (!this.data.isHaveFamily) {
            return
        }
        const params = {
            yesOrNo: 1, // 是否取消
            eDate: '', // 截止日期
            eTime: '', // 截止时间
            optionUserOpenID: app.globalData.openid, // 操作人 ID
            timeModifyUser: app.globalData.userInfo ? app.globalData.userInfo.nickName : '', // 修改者名称
            setTimerDate: moment().format('YYYY-MM-DD HH:mm:ss'), // 设置定时任务的时间
            taskEDate: '' // 任务的截止日期
        }
        let code = await this.editTaskFn('timer_matter', params, { _id: data['_id'], familyID: app.globalData.joinFamily['joinFamilyID'] })
        utils.showToast('none', code === 0 ? '定时任务编辑成功' : '定时任务编辑失败')
        if (code === 0) {
            this.initFn()
        }
    },
    // 编辑、详情
    editFn(e) {
        if (!this.data.isHaveFamily) {
            return
        }
        const that = this
        const data = e.currentTarget.dataset.data
        const sendData = {
            currentTab: 0,
            prevPageFlag: this.data.titleObj[data['title'] || 0],
            data: data, // 数据
            isTimer: true, // 是否是定时任务
            tableName: data['tableName'] // 表名
        }
        console.log('编辑参数>>>', sendData)
        if (that.data.touchEndTime - that.data.touchStartTime < 350) {
            const currentTime = e.timeStamp
            const lastTapTime = that.data.lastTapTime
            that.setData({
                lastTapTime: currentTime
            })
            if (currentTime - lastTapTime < 300) {
                sendData['isEdit'] = data['optionUserOpenID'] === app.globalData.openid ? true : false
                sendData['isDetail'] = data['optionUserOpenID'] === app.globalData.openid ? false : true
                clearTimeout(that.data.timer)
                wx.navigateTo({
                    url: '/pages/housewifery/timer/index',
                    events: {
                        refresh: function (data) {
                            that.initFn()
                        }
                    },
                    success: function (res) {
                        res.eventChannel.emit('editFn', sendData)
                    }
                })
            } else {
                that.setData({
                    timer: setTimeout(() => {
                        sendData['isEdit'] = false
                        sendData['isDetail'] = true
                        wx.navigateTo({
                            url: '/pages/housewifery/timer/index',
                            success: function (res) {
                                res.eventChannel.emit('editFn', sendData)
                            }
                        })
                        clearTimeout(that.timer)
                    }, 300)
                })
            }
        }
    },
    // 编辑
    editTaskFn(tableName, params, data, actionFlag = 1) {
        this.setData({
            isShow: false,
            loadingText: '取消定时中'
        })
        return service.addEditSearchProject(tableName, params, data, actionFlag).then(values => {
            this.setData({
                isShow: false
            })
            if (values['code'] === 0) {
                return 0
            } else {
                return -1
            }
        }).catch(err => {
            console.log('定时任务编辑失败', err)
            this.setData({
                isShow: false
            })
            return -1
        })
    }
})