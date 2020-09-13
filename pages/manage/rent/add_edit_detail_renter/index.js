const util = require("../../../../utils/util")
const moment = require('./../../../../utils/moment.min')
const service = require('./../../../publish/server/index')
const conf = require("../../../../config/conf")
const app = getApp()

Page({
    data: {
        isHaveFamily: false,
        isEdit: false,
        isDetail: false,
        _id: null,
        currentTab: 0,
        tenantList: [],
        allRoomList: [],
        deleteImg: [],
        isShow: false,
        loadingText: '上传数据中',
        isShowTip: false,
        isShowDetail: false,
        showTipText: '每期交租 = 收租周期 x 月租金',
        collectRentsCycleList: conf.RENTCYCLE,
        imgList: [],
        roomList: [],
        detailObj: {
            detailTab: null,
            money: null,
            init: null
        },
        currentItem: {},
        disBtn: true,
        rentObj: {
            tenant: null,
            phone: null,
            wxNumber: null,
            qqNumber: null,
            roomIndex: null,
            liveDate: null,
            leaseCommencementDate: null,
            toRentDate: null,
            collectRentsCycle: 0,
            deposit: null,
            rentMoney: null,
            remark: null,
            detailList: [
                {label: '电费(度)', value: null, init: null, prev: null, newest: null},
                {label: '水费(吨)', value: null, init: null, prev: null, newest: null}
            ]
        }
    },
    onLoad: function (options) {
        const that = this
        const eventChannel = this.getOpenerEventChannel()
        eventChannel.on('editFn', function (data) {
            that.formInitFn(data)
        })
        this.setData({
            isHaveFamily: util.getFamily()
        })
        if (!this.data.isHaveFamily) {
            return util.showToast('none', `您尚未加入家庭！`, 1500)
        }
    },
    // 表单初始化
    formInitFn(data) {
        if (data['allRoomList'] && data['allRoomList'].length) {
            const roomList = []
            data['allRoomList'].forEach(i => {
                roomList.push(i['roomNum'])
            })
            this.setData({
                roomList: roomList
            })
        }
        if (!data['isEdit'] && !data['isDetail']) {
            this.setData({
                isEdit: data['isEdit'],
                isDetail: data['isDetail'],
                currentTab: data['currentTab'],
                tenantList: data['tenantList'] || [],
                allRoomList: data['allRoomList'] || []
            })
            return
        }
        this.setData({
            isEdit: data['isEdit'],
            isDetail: data['isDetail'],
            currentTab: data['currentTab'],
            tenantList: data['tenantList'] || [],
            allRoomList: data['allRoomList'] || [],
            _id: data['_id'],
            currentItem: data,
            imgList: data['fileID'] ? data['fileID'].split(',') : [],
            ['rentObj.tenant']: data['tenant'],
            ['rentObj.phone']: data['phone'],
            ['rentObj.wxNumber']: data['wxNumber'],
            ['rentObj.qqNumber']: data['qqNumber'],
            ['rentObj.roomIndex']: data['roomIndex'],
            ['rentObj.liveDate']: data['liveDate'],
            ['rentObj.leaseCommencementDate']: data['leaseCommencementDate'],
            ['rentObj.toRentDate']: data['toRentDate'],
            ['rentObj.collectRentsCycle']: data['collectRentsCycle'],
            ['rentObj.deposit']: data['deposit'],
            ['rentObj.rentMoney']: data['rentMoney'],
            ['rentObj.detailList']: data['detailList'],
            ['rentObj.remark']: data['remark']
        })
    },
    selectFn(e) {
        const type = e.currentTarget.dataset.type
        const str = `rentObj.${type}`
        this.setData({
            [str]: type === 'cycle' ? Number(e.detail.value) : e.detail.value
        })
    },
    showInfo(e) {
        const type = e.currentTarget.dataset.type
        if (type === '0') {
            this.setData({
                isShowTip: true,
                showTipText: '每期交租 = 收租周期 x 月租金'
            })
        }
    },
    // 图片预览
    viewImage(e) {
        wx.previewImage({
            urls: this.data.imgList,
            current: e.currentTarget.dataset.url
        });
    },
    // 删除图片
    delImg(e) {
        let isDelColud = false
        let imgInfo
        if (this.data.imgList && this.data.imgList.length) {
            imgInfo = this.data.imgList[e.currentTarget.dataset.index]
            if (imgInfo.indexOf('cloud://') > -1) {
                isDelColud = true
            }
        }
        wx.showModal({
            title: '提示信息',
            content: isDelColud ? `第 ${e.currentTarget.dataset.index + 1} 张图片删除将会将云端数据删除，是否继续？` : `确定删除第 ${e.currentTarget.dataset.index + 1} 张图片？`,
            cancelText: '取消',
            confirmText: '确定',
            success: res => {
                if (res.confirm) {
                    if (isDelColud) {
                        this.data.deleteImg.push(imgInfo)
                    }
                    this.data.imgList.splice(e.currentTarget.dataset.index, 1);
                    this.setData({
                        imgList: this.data.imgList
                    })
                }
            }
        })
    },
    // 选择图片
    chooseImage() {
        wx.chooseImage({
            count: 5,
            sizeType: ['original', 'compressed'],
            sourceType: ['album'],
            success: (res) => {
                if (this.data.imgList.length != 0) {
                    this.setData({
                        imgList: this.data.imgList.concat(res.tempFilePaths)
                    })
                } else {
                    this.setData({
                        imgList: res.tempFilePaths
                    })
                }
            }
        });
    },
    // 添加明细
    addDetail() {
        this.setData({
            isShowDetail: true
        })
    },
    addAcyionFn(e) {
        const type = e.currentTarget.dataset.flag
        if (type === '1' && !this.data.detailObj.detailTab) {
            return util.showToast('none', '请输入标签名')
        }
        if (type === '1') {
            const findS = this.data.rentObj['detailList'].find(i => i['label'] === this.data.detailObj.detailTab)
            if (findS) {
                util.showToast('none', '已存在同名标签')
            } else {
                const data = this.data.rentObj['detailList']
                data.push({
                    label: this.data.detailObj.detailTab, value: this.data.detailObj.money || null, init: this.data.detailObj.init || null, prev: null, newest: null
                })
                this.setData({
                    'rentObj.detailList': data
                })
            }
        }
        this.setData({
            isShowDetail: false
        })
    },
    // 删除明细
    delDetail(e) {
        const index = e.currentTarget.dataset.index
        if (Number(index) === 0) {
            return
        }
        const data = this.data.rentObj['detailList']
        data.splice(index, 1)
        this.setData({
            'rentObj.detailList': data
        })
    },
    // 明细输入
    inputFn(e) {
        const type = e.currentTarget.dataset.type
        if (type === 'detailTab') {
            let isTrue = false
            if (e.detail.value && e.detail.value.length > 5) {
                util.showToast('none', '输入的文字必须在5个字符之内')
                isTrue = true
            }
            this.setData({
                ['detailObj.detailTab']: e.detail.value || null,
                disBtn: !e.detail.value || isTrue ? true : false
            })
        } else if (type !== 'roomIndex') {
            this.setData({
                [`detailObj.${type}`]: e.detail.value || null
            })
        } else {
            const isTrue = this.findSameRoomFn(e.detail.value)
            if (isTrue) {
                util.showToast('none', '已存在相同房间号！')
            }
        }
    },
    findSameRoomFn(value) {
        const findS = this.data.tenantList.find(i => i['roomNum'] === value)
        return findS ? true : false
    },
    closeTip() {
        this.setData({
            isShowTip: false
        })
    },
    submit(e) {
        if (!this.data.isHaveFamily) {
            return
        }
        const data = e.detail.value
        const rentObj = this.data.rentObj
        const detailList = rentObj['detailList']
        detailList.forEach((i, index) => {
            i['value'] = data[`detail${index}`]
            i['init'] = data[`init${index}`]
            i['prev'] = null
            i['newest'] = null
        })
        const params = {
            familyID: app.globalData.joinFamily['joinFamilyID'], // 家庭ID
            tenant: data['tenant'], // 承租人
            phone: data['phone'], // 电话
            wxNumber: data['wxNumber'] || '', // 微信
            qqNumber: data['qqNumber'] || '', // QQ
            roomIndex: rentObj['roomIndex'], // 房间index
            roomNum: this.data.roomList[rentObj['roomIndex']], // 房间号
            liveDate: rentObj['liveDate'], // 入住日期
            liveDateTimestamp: moment(rentObj['liveDate'], 'YYYY-MM-DD').valueOf(), // 入住时间戳
            leaseCommencementDate: rentObj['leaseCommencementDate'], // 起租日期
            leaseCommencementDateTimestamp: moment(rentObj['leaseCommencementDate'], 'YYYY-MM-DD').valueOf(), // 起租时间戳
            toRentDate: rentObj['toRentDate'], // 到租日期
            toRentDateTimestamp: moment(rentObj['toRentDate'], 'YYYY-MM-DD').valueOf(), // 到租时间戳
            collectRentsCycle: rentObj['collectRentsCycle'], // 收租周期index
            collectRentsCycleName: this.data.collectRentsCycleList[rentObj['collectRentsCycle']]['label'], // 收租周期
            deposit: data['deposit'], // 押金
            rentMoney: data['rentMoney'], // 租金
            remark: data['remark'] || '', // 备注
            detailList: detailList, // 详细
            imgList: this.data.imgList || [], // 相关租房资料
            isRent: true // 是否在租
        }
        if (this.data.isEdit) {
            params['modifyDate'] = moment().valueOf()
            params['modifyUser'] = app.globalData.userInfo.nickName
            params['modifyOpenid'] = app.globalData.openid   
        } else {
            params['createDate'] = moment().valueOf()
            params['createUser'] = app.globalData.userInfo.nickName
            params['createOpenid'] = app.globalData.openid       
        }
        const errMsg = this.judgeMustInputFn(params)
        if (errMsg && errMsg.length) {
            return util.showToast('none', `${errMsg.join('||')}为空`)
        }
        if (Number(moment(params['toRentDate'], 'YYYY-MM-DD').format('YYYYMMDD')) < Number(moment().format('YYYYMMDD'))) {
            return util.showToast('none', `到租日期应大于当前日期`)
        }
        const isTrue = this.findSameRoomFn(params['roomNum'])
        if (isTrue && this.data.currentItem['roomNum'] !== params['roomNum']) {
            return util.showToast('none', '已存在相同房间号！')
        }
        this.setData({
            isShow: true
        })
        if (params['imgList'].length) {
            this.uploadImgFn(params)
        } else {
            params['fileID'] = ''
            this.saveDataFn(params)
        }
    },
    // 上传图片
    uploadImgFn(data) {
        util.uploadFile(data['imgList'], `img/rent/${app.globalData.openid}`).then(promiseData => {
            const fileIdList = []
            let errorNum = 0
            promiseData.forEach(item => {
                if (item['code'] === 0) {
                    fileIdList.push(item['data'])
                } else {
                    errorNum += 1
                }
            })
            if (errorNum === promiseData.length) {
                this.setData({
                    isShow: false
                })
                util.showToast('none', '新增租客信息失败')
            } else {
                data['fileID'] = fileIdList.join(',')
                this.saveDataFn(data)
            }
        })
    },
    // 保存数据
    saveDataFn(data) {
        const that = this
        if (that.data.isEdit) {
            service.addEditSearchProject('rent_detail', data, { _id: that.data['_id'] }, 1).then(values => {
                that.setData({
                    isShow: false
                })
                if (values['code'] === 0) {
                    util.showToast('success', '编辑成功')
                    that.getRoomListFn(data)
                    if (that.data.deleteImg.length) {
                        wx.cloud.deleteFile({
                            fileList: that.data.deleteImg
                        })
                    }
                    const eventChannel = that.getOpenerEventChannel()
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
                that.setData({
                    isShow: false
                })
            })
        } else {
			service.addZhanDFn(data, 'rent_detail').then(values => {
				that.setData({
					isShow: false
				})
				if (values['code'] === 0) {
					util.showToast('success', '添加成功')
                    that.getRoomListFn(data)
                    const eventChannel = that.getOpenerEventChannel()
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
				that.setData({
					isShow: false
				})
			})
        }
    },
    // 判断必填项
    judgeMustInputFn(data) {
        const fileList = [
            { en: 'tenant', cn: '承租人' },
            { en: 'phone', cn: '手机号' },
            { en: 'roomNum', cn: '房间号' },
            { en: 'liveDate', cn: '入住日期' },
            { en: 'leaseCommencementDate', cn: '起租日期' },
            { en: 'toRentDate', cn: '到期日期' },
            { en: 'deposit', cn: '押金' },
            { en: 'toRentDate', cn: '到期日期' },
            { en: 'rentMoney', cn: '租金' }
        ]
        const errMsg = []
        fileList.forEach(i => {
            if (!data[i['en']]) {
                errMsg.push(i['cn'])
            }
        })
        return errMsg
    },
    reset() {
        const resObj = {
            collectRentsCycle: 0,
            rentMoney: null,
            detailList: [
                {label: '电费(度)', value: null, init: null, prev: null, newest: null},
                {label: '水费(吨)', value: null, init: null, prev: null, newest: null}
            ]
        }
        for (const i in this.data.rentObj) {
            const str = `rentObj.${i}`
            this.setData({
                [str]: resObj[i] || null
            })
        }
        this.setData({
            imgList: [],
            ['detailObj.detailTab']: null,
            ['detailObj.money']: null,
            ['detailObj.init']: null,
            ['detailObj.prev']: null,
            ['detailObj.newest']: null,
            disBtn: false,
            isShowDetail:false
        })
    },
    // 房间号相关信息
    async getRoomListFn(data) {
        const params = { roomNum: data['roomNum'], familyID: app.globalData.joinFamily['joinFamilyID'] }
        const rentObj = await this.search('renting_room', params)
        const list = rentObj['code'] === 0 && rentObj['data'].length ? rentObj['data'] : []
        if (list.length) {
            const editObj = { isRent: true }
            const code = await this.editDataFn('renting_room', editObj,
                { roomNum: data['roomNum'], familyID: app.globalData.joinFamily['joinFamilyID'] }, null, true, true)
            console.log(code === 0 ? '房号编辑成功' : '房间信息编辑失败')
        }
    },
    // 查询
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
        return util.cloudFn('help', params).then(values => {
            this.setData({
                isShow: false
            })
            const res = util.cloudDataH(values, '查询成功', '查询失败')
            if (res['code'] !== 0) {
                util.showToast('none', res['msg'])
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
            util.showToast('none', '查询数据失败')
            return {
                code: -1
            }
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
                util.showToast('success', '编辑成功')
                if (fn) {
                    fn()
                }
            } else {
                util.showToast('none', values['msg'] || '编辑失败')
                console.log('编辑失败>>>', values['msg'] || '编辑失败')
            }
            if (isReturn) {
                return values['code']
            }
        }).catch(err => {
            console.log('编辑失败>>>', err)
            util.showToast('none', '编辑失败')
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
    }
})