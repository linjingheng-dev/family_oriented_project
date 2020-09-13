const util = require("../../../../utils/util")
const moment = require('./../../../../utils/moment.min')
const service = require('./../../../publish/server/index')
const app = getApp()

Page({
    data: {
        isHaveFamily: false,
        isEdit: false,
        isDetail: false,
        isSearch: false,
        _id: null,
        currentTab: 0,
        isShow: false,
        loadingText: '上传数据中',
        artificialBreakIndexList: ['否', '是'],
        yesOrNoRentList: ['否', '是'],
        timer: null,
        roomList: [],
        rentList: [],
        thingList: [],
        allRoomThingList: [],
        currentItem: {},
        isDisBtn: false,
        rentObj: {
            roomIndex: null,
            detailList: [
                { label: '电费', value: null, init: null, prev: null },
                { label: '水费', value: null, init: null, prev: null }
            ],
            rentMoney: null,
            getRentMoneyDate: null,
            isArtificialBreakIndex: 0,
            isTaxes: 1,
            getMoneyRemark: null,
            totalMoney: '0.00'
        },
        // 搜索表单
        searchObj: {
            searchSDate: moment().month(moment().month() - 1).startOf('month').format('YYYY-MM-DD'),
            searchEDate: moment().endOf('month').format('YYYY-MM-DD'),
            roomIndex: null,
            isTaxes: 0,
        }
    },
    onLoad: function (options) {
        this.setData({
            isHaveFamily: util.getFamily()
        })
        if (!this.data.isHaveFamily) {
            return util.showToast('none', `您尚未加入家庭！`, 1500)
        }
        const that = this
        const eventChannel = this.getOpenerEventChannel()
        eventChannel.on('editFn', function (data) {
            if (data['isSearch']) {
                that.data.artificialBreakIndexList.unshift('全部')
                that.setData({
                    isSearch: true,
                    artificialBreakIndexList: that.data.artificialBreakIndexList
                })
                that.getRoomListFn()
            } else {
                that.getRoomListFn(data)
            }
        })
        this.getRoomThingFn()
    },
    formInitFn(data) {
        if (!data['isEdit'] && !data['isDetail']) {
            this.setData({
                currentTab: data['currentTab'],
                roomList: this.data.roomList
            })
            return
        }
        const roomNum = this.data.roomList[data['roomIndex']]
        const findS = data['tenantList'].find(i => i['roomNum'] === roomNum)
        if (!findS) {
            this.setData({
                isDisBtn: true
            })
            return util.showToast('none', `当前房号 ${roomNum} 信息缺失！`)
        }
        const obj = findS
        this.setData({
            isEdit: data['isEdit'],
            isDetail: data['isDetail'],
            _id: data['_id'] || null,
            currentTab: data['currentTab'],
            roomList: this.data.roomList,
            thingList: data['thingList'],
            currentItem: obj,
            ['rentObj.totalMoney']: data['totalMoney'],
            ['rentObj.detailList']: data['detailList'],
            ['rentObj.rentMoney']: obj['rentMoney'],
            ['rentObj.getRentMoneyDate']: data['getRentMoneyDate'] || data[''],
            ['rentObj.isArtificialBreakIndex']: data['isArtificialBreakIndex'] || 0,
            ['rentObj.isTaxes']: data['isTaxes'] || (data['isTaxes'] === 0 ? 0 : 1),
            ['rentObj.roomIndex']: data['roomIndex'] || null,
            ['rentObj.getMoneyRemark']: data['getMoneyRemark'] || ''
        })
    },
    toChange(value, flag) {
        if (flag === 'number') {
            return Number(value)
        }
    },
    // 房间号选择
    changeRoomFn(e) {
        const value = e.detail.value
        this.setData({
            ['rentObj.roomIndex']: value
        })
        this.findThingFn(this.data.roomList[this.data.rentObj['roomIndex']])
        if (!this.data.isEdit && !this.data.isDetail) {
            const obj = this.data.rentList[Number(value)]
            const detailList = obj['detailList']
            this.setData({
                ['rentObj.detailList']: detailList,
                ['rentObj.rentMoney']: obj['rentMoney'],
                currentItem: obj
            })
        }
    },
    selectFn(e) {
        const type = e.currentTarget.dataset.type
        const str = this.data.isSearch ? `searchObj.${type}` : `rentObj.${type}`
        const isNumberList = ['isArtificialBreakIndex', 'isTaxes']
        this.setData({
            [str]: isNumberList.indexOf(type) > -1 ? Number(e.detail.value) : e.detail.value
        })
    },
    // 编辑
    submit(e) {
        if (!this.data.isHaveFamily) {
            return
        }
        if (JSON.stringify(this.data.currentItem) === '{}') {
            return util.showToast('none', `请选择房间号`)
        }
        const that = this
        const data = e.detail.value
        const rentObj = this.data.rentObj
        const detailList = rentObj['detailList']
        const thingList = this.data.thingList
        detailList.forEach((i, index) => {
            i['prev'] = data[`prev${index}`]
            i['newest'] = data[`newest${index}`]
        })
        thingList.forEach((i, index) => {
            i['editValue'] = data[`break${index}`]
        })
        const params = {
            familyID: app.globalData.joinFamily['joinFamilyID'], // 家庭ID
            getRentMoneyDate: rentObj['getRentMoneyDate'], // 收租日期
            getRentMoneyDateTimestamp: rentObj['getRentMoneyDate'] ? moment(rentObj['getRentMoneyDate'], 'YYYY-MM-DD').valueOf() : '', // 收租时间戳
            detailList: detailList, // 详细
            thingList: thingList, // 详细
            isArtificialBreakIndex: rentObj['isArtificialBreakIndex'], // 是否有人为损坏物件
            isTaxes: rentObj['isTaxes'], // 是否交租
            roomIndex: rentObj['roomIndex'], // 房间号
            roomNum: rentObj['roomIndex'] ? this.data.roomList[Number(rentObj['roomIndex'])] : '', // 房间号
            tenant: this.data.currentItem['tenant'],
            phone: this.data.currentItem['phone'],
            getMoneyRemark: data['getMoneyRemark'] || ''
        }
        if (this.data.isEdit) {
            params['modifyDate'] = moment().valueOf()
            params['modifyUser'] = app.globalData.userInfo.nickName
            params['modifyOpenid'] = app.globalData.openid
            params['isLeave'] = false
        } else {
            params['createDate'] = moment().valueOf()
            params['createUser'] = app.globalData.userInfo.nickName
            params['createOpenid'] = app.globalData.openid
        }
        const errMsg = this.judgeMustInputFn(params)
        if (errMsg && errMsg.length) {
            return util.showToast('none', `${errMsg.join('||')} 字段值为空`)
        }
        params['totalMoney'] = this.countTotalMoneyFn(params)
        wx.showModal({
            title: '提示',
            content: `应收房租 ${params['totalMoney']} 元，是否继续提交数据？`,
            showCancel: true,
            success: res => {
                if (res.confirm) {
                    that.setData({
                        isShow: true
                    })
                    that.saveDataFn(params)
                }
            }
        })
    },
    // 重置
    reset() {
        this.setData({
            ['rentObj.roomIndex']: null,
            ['rentObj.detailList']: [
                { label: '电费', value: null, init: null, prev: null },
                { label: '水费', value: null, init: null, prev: null }
            ],
            ['rentObj.thingList']: [],
            ['rentObj.rentMoney']: null,
            ['rentObj.getRentMoneyDate']: null,
            ['rentObj.isArtificialBreakIndex']: 0,
            ['rentObj.isTaxes']: 1,
            ['rentObj.getMoneyRemark']: null,
            ['rentObj.totalMoney']: '0.00'
        })
    },
    // 保存数据
    saveDataFn(data) {
        const that = this
        if (this.data.isEdit) {
            service.addEditSearchProject('rent_get_money', data, { _id: this.data['_id'] }, 1).then(values => {
                this.setData({
                    isShow: false
                })
                if (values['code'] === 0) {
                    util.showToast('success', '编辑成功')
                    const eventChannel = this.getOpenerEventChannel()
                    const timer = setTimeout(() => {
                        wx.navigateBack({
                            delta: 1
                        });
                        eventChannel.emit('refresh', { flag: that.data.currentTab });
                        clearTimeout(timer)
                    }, 1500)
                } else {
                    util.showToast('none', values['msg'] || '编辑失败')
                    console.log('编辑失败>>>', values['msg'] || '编辑失败')
                }
            }).catch(err => {
                console.log('编辑失败>>>', err)
                util.showToast('none', '编辑失败')
                this.setData({
                    isShow: false
                })
            })
        } else {
            service.addZhanDFn(data, 'rent_get_money').then(values => {
                this.setData({
                    isShow: false
                })
                if (values['code'] === 0) {
                    util.showToast('success', '添加成功')
                    const eventChannel = this.getOpenerEventChannel()
                    const timer = setTimeout(() => {
                        wx.navigateBack({
                            delta: 1
                        });
                        eventChannel.emit('refresh', { flag: that.data.currentTab });
                        clearTimeout(timer)
                    }, 1500)
                } else {
                    util.showToast('none', values['msg'] || '添加失败')
                    console.log('添加失败>>>', values['msg'] || '添加失败')
                }
            }).catch(err => {
                console.log('添加失败>>>', err)
                util.showToast('none', '添加失败')
                this.setData({
                    isShow: false
                })
            })
        }
    },
    // 计算总费用
    countTotalMoneyFn(data) {
        let total = 0
        data['detailList'].forEach(i => {
            total = total + ((Number(i['newest']) - Number(i['prev'])) * Number(i['value']))
        })
        total = total + Number(this.data.rentObj.rentMoney)
        return total.toFixed(2)
    },
    // 判断必填项
    judgeMustInputFn(data) {
        const errMsg = []
        if (!data['roomIndex']) {
            errMsg.push('房间号')
        }
        if (!data['getRentMoneyDate']) {
            errMsg.push('收租日期')
        }
        // 费用详细
        data['detailList'].forEach(i => {
            if (!i['prev']) {
                errMsg.push(`${i['label']}_上一次使用`)
            }
            if (!i['newest']) {
                errMsg.push(`${i['label']}_最新一次使用`)
            }
            if (i['prev'] && i['newest'] && (Number(i['newest']) < Number(i['prev']))) {
                errMsg.push(`${i['label']}_最新一次使用小于前一次使用`)
            }
        })
        return errMsg
    },
    // 房间号获取
    async getRoomListFn(obj) {
        if (!this.data.isHaveFamily) {
            return
        }
        const rentObj = await this.search('rent_detail', { isRent: true, familyID: app.globalData.joinFamily['joinFamilyID'] }, [{ filed: 'liveDateTimestamp', sortDesc: 'desc' }])
        const data = rentObj['code'] === 0 && rentObj['data'].length ? rentObj['data'] : []
        this.setData({
            rentList: data
        })
        data.forEach(i => {
            this.data.roomList.push(i['roomNum'])
        })
        this.setData({
            roomList: this.data.roomList
        })
        if (obj) {
            obj['tenantList'] = data
            this.formInitFn(obj)
        }
    },
    search(collectionName, value = null, sort = null) {
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
        return util.cloudFn('help', params).then(values => {
            this.setData({
                isShow: false
            })
            const res = util.cloudDataH(values, '查询成功', '获取房间号失败')
            if (res['code'] !== 0) {
                util.showToast('none', res['msg'])
                console.log('获取房间号失败', res['msg'])
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
            console.log('获取房间号失败', err)
            util.showToast('none', '获取房间号失败')
            return {
                code: -1
            }
        })
    },

    // 物件信息获取
    async getRoomThingFn() {
        if (!this.data.isHaveFamily) {
            return
        }
        const rentObj = await this.search('renting_room', {familyID: app.globalData.joinFamily['joinFamilyID']})
        const data = rentObj['code'] === 0 && rentObj['data'].length ? rentObj['data'] : []
        this.setData({
            allRoomThingList: data
        })
    },

    findThingFn(value) {
        const findS = this.data.allRoomThingList.find(i => i['roomNum'] === value)
        const haveThing = findS && findS['detailList'] && findS['detailList'].length ? true : false
        if (haveThing) {
            findS['detailList'].forEach(i => i['editValue'] = i['value'])
            this.setData({
                thingList: findS['detailList']
            })
        } else {
            this.data.artificialBreakIndexList.splice(1, 1)
            this.setData({
                thingList: [],
                isArtificialBreakIndex: 0,
                artificialBreakIndexList: this.data.artificialBreakIndexList
            })
        }
    },

    /* 搜索 */

    searchSubmit(e) {
        const searchObj = this.data.searchObj
        const params = {
            searchSDate: searchObj['searchSDate'],
            searchEDate: searchObj['searchEDate'],
            roomNum: this.data.roomList[searchObj['roomIndex']],
            isTaxes: searchObj['isTaxes'],
        }
        const eventChannel = this.getOpenerEventChannel()
        wx.navigateBack({
            delta: 1
        });
        eventChannel.emit('refresh', { flag: this.data.currentTab, searchData: params, isSearch: true });
    },
    searchReset() {
        this.setData({
            'searchObj.searchSDate': moment().month(moment().month() - 1).startOf('month').format('YYYY-MM-DD'),
            'searchObj.searchEDate': moment().endOf('month').format('YYYY-MM-DD'),
            'searchObj.isTaxes': null,
            'searchObj.roomIndex': 0
        })
        const eventChannel = this.getOpenerEventChannel()
        wx.navigateBack({
            delta: 1
        });
        eventChannel.emit('refresh', { isSearch: true, isCancel: true });
    }
})