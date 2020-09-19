const conf = require('../../../../config/conf')
const utils = require('../../../../utils/util')
const moment = require('../../../../utils/moment.min')
const service = require('./../../../publish/server/index')
const app = getApp()

Page({
    data: {
        isHaveFamily: false,
        isShow: false,
        loadingText: '加载数据中',
        scrollLeft: 0,
        currentTab: 0,
        touchStartTime: 0,
        touchEndTime: 0,
        lastTapTime: 0,
        timer: null,
        isScroll: true, // 房租收取
        touxiang: conf.TOUXIANG,
        rentList: conf.RENTLIST,
        CustomBar: 60,
        screenHeight: '120',
        screenWidth: '120',
        tenantList: [],
        rentMoneyList: [],
        expireRenterList: [],
        rentingRoomList: [],
        setExpireObj: {
            isSetExpire: false,
            expireDays: 5
        },
        tab2Obj: {
            totalMoney: 0,
            haveRent: 0,
            noRent: 0,
            startDate: moment().month(moment().month() - 1).startOf('month').format('YYYY-MM-DD'),
            endDate: moment().endOf('month').format('YYYY-MM-DD'),
        },
        tab3Obj: {
            empityNum: 0,
            haveRentingNum: 0
        },
        allRoomList: [],
        rentCycle: conf.RENTCYCLE
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
        this.setData({
            isHaveFamily: utils.getFamily()
        })
        if (!this.data.isHaveFamily) {
            return utils.showToast('none', `您尚未加入家庭！`, 1500)
        }
        this.getRentListFn()
        this.getExpireDays()
        this.getRentingInitRoomFn()
    },
    tabSelect(e) {
        const id = Number(e.currentTarget.dataset.id)
        this.data.rentList.forEach(i => {
            const currentCheck = `rentList[${i['id']}].isCheck`
            this.setData({
                [currentCheck]: id === i['id'] ? true : false
            })
        })
        this.setData({
            currentTab: id,
            scrollLeft: (id - 1) * 120
        })
        if (id === 0) {
            this.getRentListFn()
        } else if (id === 1) {
            const dateQj = {
                file: 'getRentMoneyDateTimestamp',
                startDate: moment(this.data.tab2Obj.startDate, 'YYYY-MM-DD').valueOf(),
                endDate: moment(this.data.tab2Obj.endDate, 'YYYY-MM-DD').valueOf()
            }
            this.getRentMoneyListFn(null, dateQj)
        } else if (id === 2) {
            this.getExpireListFn()
        } else if (id === 3) {
            this.getRentingRoomFn()
            this.getRentingInitRoomFn()
        }
    },
    pagePathFn() {
        const id = this.data.currentTab
        if (id === 0) {
            return {
                path: '/pages/manage/rent/add_edit_detail_renter/index',
                desc: '租客', table: 'rent_detail'
            }
        } else if (id === 1) {
            return {
                path: '/pages/manage/rent/rent_money/index',
                desc: '房租', table: 'rent_get_money'
            }
        } else if (id === 3) {
            return {
                path: '/pages/manage/rent/write_room/index',
                desc: '房间', table: 'renting_room'
            }
        }
    },
    refreshDataFn() {
        const id = this.data.currentTab
        if (id === 0) {
            this.getRentListFn()
        } else if (id === 1) {
            const dateQj = {
                file: 'getRentMoneyDateTimestamp',
                startDate: moment(this.data.tab2Obj.startDate, 'YYYY-MM-DD').valueOf(),
                endDate: moment(this.data.tab2Obj.endDate, 'YYYY-MM-DD').valueOf()
            }
            this.getRentMoneyListFn(null, dateQj)
        } else if (id === 2) {
            this.getExpireListFn()
        } else if (id === 3) {
            this.getRentingRoomFn()
            this.getRentingInitRoomFn()
        }
    },
    // 删除
    deleteFn(e) {
        if (this.data.currentTab === 1) {
            return
        }
        const that = this
        const data = e.currentTarget.dataset.data
        const tipObj = {
            '0': `是否继续删除家租客${data['tenant']}？`,
            '3': `是否继续删除房间号 [${data['roomNum']}] 的数据？`
        }
        const currentTab = that.data.currentTab
        wx.showModal({
            title: '提示',
            content: tipObj[currentTab.toString()] || '确认删除？',
            showCancel: true,
            success: res => {
                if (res.confirm) {
                    if (this.data.currentTab === 0) {
                        that.deleteMemberFn(data)
                    } else if (this.data.currentTab === 3) {
                        that.delRoomFn(data)
                    } else {
                        that.delDataFn(data, false)
                    }
                }
            }
        })
    },
    // 删除房间
    async delRoomFn(data) {
        const params = { isRent: true, roomNum: data['roomNum'], familyID: app.globalData.joinFamily['joinFamilyID'] }
        const rentObj = await this.search('rent_detail', params)
        const result = rentObj['code'] === 0 && rentObj['data'].length ? rentObj['data'] : []
        console.log('删除房间>>>', result)
        if (result.length) {
            return utils.showToast('none', '请确认当前房客是否在租')
        }
        code = await this.delDataFn(data, true)
        if (code === -1) {
            return utils.showToast('none', '删除房间信息失败！')
        }
    },

    // 删除租客信息及相关存储
    async deleteMemberFn(data) {
        let code = 0
        // 获取租金历史
        let params = { tenant: data['tenant'] }
        let rentObj = await this.search('rent_get_money', params)
        let list = rentObj['code'] === 0 && rentObj['data'].length ? rentObj['data'] : []
        if (list.length) {
            const editObj = { isLeave: true }
            code = await this.editDataFn('rent_get_money', editObj,
                { tenant: data['tenant'], familyID: app.globalData.joinFamily['joinFamilyID'] }, null, true, true)
        }
        if (code === -1) {
            return utils.showToast('none', '删除租客信息失败！')
        }
        // 房间信息
        params = { roomNum: data['roomNum'], familyID: app.globalData.joinFamily['joinFamilyID'] }
        rentObj = await this.search('renting_room', params)
        list = rentObj['code'] === 0 && rentObj['data'].length ? rentObj['data'] : []
        if (list.length) {
            const editObj = { isRent: false }
            code = await this.editDataFn('renting_room', editObj,
                { roomNum: data['roomNum'], familyID: app.globalData.joinFamily['joinFamilyID'] }, null, true, true)
        }
        // 删除成员
        code = await this.delDataFn(data, true)
        if (code === -1) {
            return utils.showToast('none', '删除租客信息失败！')
        }
        // 获取该租客相关存储资料并删除
        const fileList = data['fileID'] ? data['fileID'].split(',') : []
        if (fileList.length) {
            code = await utils.delColudFile(fileList)
        }
        if (code === -1) {
            return utils.showToast('none', '删除租客信息失败！')
        }
    },
    // 编辑
    editFn(e) {
        const that = this
        const data = e.currentTarget.dataset.data
        const obj = data
        obj['currentTab'] = this.data.currentTab
        obj['tenantList'] = this.data.tenantList
        obj['rentingRoomList'] = this.data.rentingRoomList,
            obj['allRoomList'] = this.data.allRoomList
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
                wx.navigateTo({
                    url: that.pagePathFn()['path'],
                    events: {
                        refresh: function (data) {
                            that.setData({
                                currentTab: data['flag']
                            })
                            that.refreshDataFn()
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
                            url: that.pagePathFn()['path'],
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
    // 增加租客
    addRenter() {
        if (!this.data.allRoomList || !this.data.allRoomList.length) {
            return utils.showToast('none', '请先添加房间号！')
        }
        const params = {
            isEdit: false,
            isDetail: false,
            currentTab: this.data.currentTab,
            tenantList: this.data.tenantList,
            allRoomList: this.data.allRoomList
        }
        this.goToNextPageFn(this.pagePathFn()['path'], params)
    },
    // 删除租客
    async delDataFn(data, isReturn = false) {
        const that = this
        const code = await service.addEditSearchProject(that.pagePathFn()['table'], {}, data['_id'], 2).then(values => {
            if (values['code'] === 0) {
                const timer = setTimeout(() => {
                    that.refreshDataFn()
                    clearTimeout(timer)
                }, 1500)
                utils.showToast('success', '删除成功')
                if (isReturn) {
                    return 0
                }
            } else {
                utils.showToast('none', values['msg'] ? values['msg'] : '删除失败，请反馈给开发者，^_^')
                if (isReturn) {
                    return -1
                }
            }
        })
        if (isReturn) {
            return code
        }
    },
    // 进入下一个页面
    goToNextPageFn(pagePath, sendData = null) {
        const that = this
        wx.navigateTo({
            url: pagePath,
            events: {
                refresh: function (data) {
                    that.setData({
                        currentTab: data['flag']
                    })
                    that.refreshDataFn()
                }
            },
            success: function (res) {
                res.eventChannel.emit('editFn', sendData)
            }
        })
    },
    // 查询
    async getRentListFn() {
        if (!this.data.isHaveFamily) {
            return
        }
        const rentObj = await this.search('rent_detail', { isRent: true, familyID: app.globalData.joinFamily['joinFamilyID'] }, [{ filed: 'liveDateTimestamp', sortDesc: 'desc' }])
        const data = rentObj['code'] === 0 && rentObj['data'].length ? rentObj['data'] : []
        this.setData({
            tenantList: data
        })
    },
    async getRentMoneyListFn(searchData = null, dateQj = null) {
        if (!this.data.isHaveFamily) {
            return
        }
        let params = searchData
        if (!searchData) {
            params = { familyID: app.globalData.joinFamily['joinFamilyID'], isLeave: false }
        } else {
            searchData['familyID'] = app.globalData.joinFamily['joinFamilyID']
            searchData['isLeave'] = false
        }
        console.log('收租>>>', params, dateQj)
        const rentObj = await this.search('rent_get_money', params, [{ filed: 'getRentMoneyDateTimestamp', sortDesc: 'desc' }], dateQj)
        const data = rentObj['code'] === 0 && rentObj['data'].length ? rentObj['data'] : []
        let haveRent = 0
        let noRent = 0
        let totalMoney = 0
        data.forEach(i => {
            const tabList = []
            if (i['totalMoney']) {
                tabList.push({ name: `总金额：${i['totalMoney']}`, color: 'gray' })
            }
            if (i['getRentMoneyDate']) {
                tabList.push({ name: `收租日期：${i['getRentMoneyDate']}`, color: 'orange' })
            }
            i['isTaxes'] !== 1 ? (noRent = noRent + 1) : (haveRent = haveRent + 1)
            if (i['isTaxes'] === 1) {
                totalMoney = (i['totalMoney'] ? Number(i['totalMoney']) : 0) + totalMoney
            }
            tabList.push({ name: `${i['isTaxes'] !== 1 ? '未交租' : '已交租'}`, color: `${i['isTaxes'] !== 1 ? 'red' : 'green'}` })
            i['tabList'] = tabList
        })
        this.setData({
            ['tab2Obj.totalMoney']: totalMoney.toFixed(2),
            ['tab2Obj.haveRent']: haveRent,
            ['tab2Obj.noRent']: noRent,
            rentMoneyList: data
        })
    },
    async getExpireListFn() {
        if (!this.data.isHaveFamily) {
            return
        }
        const rentObj = await this.search('rent_detail', { isRent: true, familyID: app.globalData.joinFamily['joinFamilyID'] }, [{ filed: 'liveDateTimestamp', sortDesc: 'desc' }])
        const data = rentObj['code'] === 0 && rentObj['data'].length ? rentObj['data'] : []
        console.log('获取到期时间>>>', data)
        const newData = data.filter(i => {
            const currentDate = Number(moment().format('YYYYMMDD'))
            const toRentDate = Number(moment(i['toRentDate'], 'YYYY-MM-DD').format('YYYYMMDD'))
            i['tabList'] = [
                { name: `当前：${moment().format('YYYY-MM-DD')}`, color: 'gray' },
                { name: `到期：${i['toRentDate']}`, color: 'green' }
            ]
            let isTrue = false
            if (Number(this.data.setExpireObj.expireDays) === 0) {
                isTrue = toRentDate === currentDate ? true : false
                i['tabList'].push({ name: `今日到期`, color: 'red' })
            } else {
                isTrue = toRentDate - currentDate < (Number(this.data.setExpireObj.expireDays)) ? true : false
                if (isTrue) {
                    i['tabList'].push({ name: `${moment().format('YYYY-MM-DD') === i['toRentDate'] ? '今日到期' : '即将到期'}`, color: 'red' })
                }
            }
            return isTrue
        })
        this.setData({
            expireRenterList: newData
        })
    },
    async getExpireDays(isReturn = false) {
        if (!this.data.isHaveFamily) {
            return
        }
        const rentObj = await this.search('set_expire', { createOpenid: app.globalData.openid, familyID: app.globalData.joinFamily['joinFamilyID'] })
        const data = rentObj['code'] === 0 && rentObj['data'].length ? rentObj['data'] : []
        if (!isReturn) {
            this.setData({
                ['setExpireObj.expireDays']: data && data.length ? data[0]['expireDay'] : 5
            })
            this.refreshDataFn()
        } else {
            return data && data.length ? data[0] : null
        }
    },
    async getRentingRoomFn() {
        if (!this.data.isHaveFamily) {
            return
        }
        const rentObj = await this.search('renting_room', { familyID: app.globalData.joinFamily['joinFamilyID'] }, [{ filed: 'roomNum', sortDesc: 'desc' }])
        const data = rentObj['code'] === 0 && rentObj['data'].length ? rentObj['data'] : []
        let empityNum = 0
        let haveRentingNum = 0
        data.forEach(i => {
            const tabList = [
                { name: `${i['isRent'] ? '有人' : '空闲'}`, color: `${i['isRent'] ? 'green' : 'red'}` },
                { name: `${i['detailList'].length ? '已记录房间物件' : '未记录房间物件'}`, color: `${i['detailList'].length ? 'orange' : 'gray'}` },
            ]
            i['tabList'] = tabList
            i['isRent'] ? (haveRentingNum += 1) : (empityNum += 1)
        })
        this.setData({
            rentingRoomList: data,
            ['tab3Obj.haveRentingNum']: haveRentingNum,
            ['tab3Obj.empityNum']: empityNum
        })
    },
    async getRentingInitRoomFn() {
        if (!this.data.isHaveFamily) {
            return
        }
        const rentObj = await this.search('renting_room', { familyID: app.globalData.joinFamily['joinFamilyID'] }, [{ filed: 'roomNum', sortDesc: 'desc' }])
        const data = rentObj['code'] === 0 && rentObj['data'].length ? rentObj['data'] : []
        this.setData({
            allRoomList: data
        })
    },
    // 获取到期设置
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
                console.log('查询数据失败', res['msg'] || '查询失败')
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

    /* 房租收取情况 */

    // 查询
    rentActionFn(e) {
        const that = this
        const flag = e.currentTarget.dataset.flag
        if (flag === '1' && (!this.data.allRoomList || !this.data.allRoomList.length)) {
            return utils.showToast('none', '请先添加房间号！')
        }
        const obj = {
            isEdit: false,
            isDetail: false,
            currentTab: this.data.currentTab,
            tenantList: this.data.tenantList,
            isSearch: flag === '0' ? true : false
        }
        wx.navigateTo({
            url: that.pagePathFn()['path'],
            events: {
                refresh: function (data) {
                    if (data['isSearch'] && !data['isCancel']) {
                        const dateQj = {
                            file: 'getRentMoneyDateTimestamp',
                            startDate: moment(data['searchData']['searchSDate'], 'YYYY-MM-DD').valueOf(),
                            endDate: moment(data['searchData']['searchEDate'], 'YYYY-MM-DD').valueOf()
                        }
                        const newParams = {}
                        if (data['searchData']['isTaxes'] !== 0) {
                            newParams['isTaxes'] = data['searchData']['isTaxes'] - 1
                        }
                        if (data['searchData']['roomNum']) {
                            newParams['isTaxes'] = data['searchData']['roomNum']
                        }
                        that.setData({
                            ['tab2Obj.startDate']: data['searchData']['searchSDate'],
                            ['tab2Obj.endDate']: data['searchData']['searchEDate']
                        })
                        that.getRentMoneyListFn(JSON.stringify(newParams) !== '{}' ? newParams : null, dateQj)
                    } else if (!data['isCancel']) {
                        that.setData({
                            currentTab: data['flag']
                        })
                        that.refreshDataFn()
                    }
                }
            },
            success: function (res) {
                res.eventChannel.emit('editFn', obj)
            }
        })
    },

    /* 即将到期的房客记录 */

    settingFn(e) {
        const that = this
        const flag = e.currentTarget.dataset.flag
        this.setData({
            ['setExpireObj.isSetExpire']: true,
            ['setExpireObj.expireDays']: this.data.setExpireObj['expireDays'] || 0
        })
    },
    inputFn(e) {
        const type = e.currentTarget.dataset.type
        const obj = e.currentTarget.dataset.obj
        const str = `${obj}.${type}`
        this.setData({
            [`${str}`]: e.detail.value || null
        })
    },
    async addAcyionFn(e) {
        const type = e.currentTarget.dataset.flag
        if (type === '1') {
            this.refreshDataFn()
            const returnData = await this.getExpireDays(true)
            if (returnData) {
                const params = {
                    familyID: app.globalData.joinFamily['joinFamilyID'],
                    modifyDate: moment().format('YYYY-MM-DD'),
                    modifyDateTimestamp: moment().valueOf(),
                    modifyUser: app.globalData.userInfo.nickName,
                    modifyOpenid: app.globalData.openid,
                    expireDay: this.data.setExpireObj['expireDays']
                }
                this.editDataFn('set_expire', params, { _id: returnData['_id'] }, () => {
                    this.getExpireDays()
                })
            } else {
                const params = {
                    familyID: app.globalData.joinFamily['joinFamilyID'],
                    createDate: moment().format('YYYY-MM-DD'),
                    createDateTimestamp: moment().valueOf(),
                    createUser: app.globalData.userInfo.nickName,
                    createOpenid: app.globalData.openid,
                    expireDay: this.data.setExpireObj['expireDays']
                }
                this.addItem('set_expire', params, () => {
                    this.getExpireDays()
                })
            }
        }
        this.setData({
            ['setExpireObj.isSetExpire']: false
        })
    },
    // 保存数据
    addItem(connectionName, data, fn = null) {
        this.setData({
            isShow: true,
            loadingText: '上传数据中'
        })
        service.addZhanDFn(data, connectionName).then(values => {
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
                console.log('添加失败>>>', values['msg'] || '添加失败')
            }
        }).catch(err => {
            console.log('添加失败>>>', err)
            utils.showToast('none', '添加失败')
            this.setData({
                isShow: false
            })
        })
    },
    // 编辑数据
    editDataFn(connectionName, data, only, fn = null, isReturn = false, isC = false) {
        const that = this
        this.setData({
            isShow: true,
            loadingText: '上传数据中'
        })
        const result = service.addEditSearchProject(connectionName, data, only, isC ? 4 : 1).then(values => {
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
                console.log('编辑失败>>>', values['msg'] || '编辑失败')
            }
            if (isReturn) {
                return values['code']
            }
        }).catch(err => {
            console.log('编辑失败>>>', err)
            utils.showToast('none', '编辑失败')
            that.setData({
                isShow: false
            })
            if (isReturn) {
                return -1
            }
        })
        if (isReturn) {
            return result
        }
    },

    /* 房间管理 */
    goTo(e) {
        console.log('房间管理>>>', e)
    },
    writeRoomFn(e) {
        const that = this
        const params = {
            isEdit: false,
            isDetail: false,
            currentTab: this.data.currentTab,
            rentingRoomList: this.data.rentingRoomList,
            isSearch: false
        }
        wx.navigateTo({
            url: that.pagePathFn()['path'],
            events: {
                refresh: function (data) {
                    that.getRentingRoomFn()
                    that.getRentingInitRoomFn()
                }
            },
            success: function (res) {
                res.eventChannel.emit('editFn', params)
            }
        })
    }
})