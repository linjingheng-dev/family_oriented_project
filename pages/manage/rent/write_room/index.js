const util = require("../../../../utils/util")
const moment = require('./../../../../utils/moment.min')
const service = require('./../../../publish/server/index')
const app = getApp()

Page({
    data: {
        isHaveFamily: false,
        isEdit: false,
        isDetail: false,
        isShow: false,
        _id: null,
        currentItem: null,
        loadingText: '上传数据中',
        yesNoList: ['是', '否'],
        isShowDetail: false,
        disBtn: true,
        isDisSelect: false,
        rentingRoomList: [],
        currentTab: 3,
        roomObj: {
            roomNum: null,
            peopleNum: 1,
            isRentIndex: '0',
            detailList: [
                { label: '床', value: null, num: 1 },
                { label: '钥匙', value: null, num: 1 }
            ],
            remark: null
        },
        detailObj: {
            detailTab: null,
            money: null,
            trademark: null,
            num: 1
        },
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
    },
    formInitFn(data) {
        console.log('编辑>>>', data)
        this.setData({
            currentItem: data,
            _id: data['_id'],
            isEdit: data['isEdit'],
            isDetail: data['isDetail'],
            currentTab: data['currentTab'],
            rentingRoomList: data['rentingRoomList'] || [],
            ['roomObj.roomNum']: data['roomNum'],
            ['roomObj.peopleNum']: data['peopleNum'] || 1,
            ['roomObj.isRentIndex']: data['isRent'] ? '1' : '0',
            ['roomObj.detailList']: data['detailList'] || [],
            ['roomObj.remark']: data['remark'],
            isDisSelect: data['isRent'] || false
        })
    },
    selectFn(e) {
        const type = e.currentTarget.dataset.type
        const obj = e.currentTarget.dataset.obj
        const str = `${obj}.${type}`
        const isNumberList = ['isArtificialBreakIndex', 'isTaxes']
        this.setData({
            [str]: isNumberList.indexOf(type) > -1 ? Number(e.detail.value) : e.detail.value
        })
    },
    // 添加明细
    addDetail() {
        this.setData({
            isShowDetail: true
        })
    },
    // 明细输入
    inputFn(e) {
        const type = e.currentTarget.dataset.type
        if (type === 'detailTab') {
            let isTrue = false
            if (e.detail.value && e.detail.value.length > 15) {
                util.showToast('none', '输入的文字必须在5个字符之内')
                isTrue = true
            }
            this.setData({
                ['detailObj.detailTab']: e.detail.value || null,
                disBtn: !e.detail.value || isTrue ? true : false
            })
        } else if (type !== 'roomNum') {
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
        const findS = this.data.rentingRoomList.find(i => i['roomNum'] === value)
        return findS ? true : false
    },
    addAcyionFn(e) {
        const type = e.currentTarget.dataset.flag
        if (type === '1' && !this.data.detailObj.detailTab) {
            return util.showToast('none', '请输入标签名')
        }
        if (type === '1') {
            const findS = this.data.roomObj['detailList'].find(i => i['label'] === this.data.detailObj.detailTab)
            if (findS) {
                util.showToast('none', '已存在同名标签')
            } else {
                const data = this.data.roomObj['detailList']
                data.push({
                    label: this.data.detailObj.detailTab, value: this.data.detailObj.money || null, trademark: this.data.detailObj.trademark || null, num: this.data.detailObj.num || 1
                })
                this.setData({
                    'roomObj.detailList': data
                })
            }
        }
        this.setData({
            isShowDetail: false,
            ['detailObj.detailTab']: null,
            ['detailObj.money']: null,
            ['detailObj.trademark']: null,
            ['detailObj.num']: 1
        })
    },
    // 删除明细
    delDetail(e) {
        const index = e.currentTarget.dataset.index
        const data = this.data.roomObj['detailList']
        data.splice(index, 1)
        this.setData({
            'roomObj.detailList': data
        })
    },
    submit(e) {
        if (!this.data.isHaveFamily) {
            return util.showToast('none', `您尚未加入家庭！`, 1500)
        }
        const data = e.detail.value
        const roomObj = this.data.roomObj
        const detailList = roomObj['detailList'] || []
        detailList.forEach((i, index) => {
            i['value'] = data[`detail${index}`]
            i['num'] = data[`num${index}`],
            i['trademark'] = ''
        })
        const params = {
            familyID: app.globalData.joinFamily['joinFamilyID'],
            roomNum: data['roomNum'],
            peopleNum: data['peopleNum'],
            isRentIndex: roomObj['isRentIndex'] || '0',
            isRent: roomObj['isRentIndex'] === '1' ? true : false,
            detailList: detailList,
            remark: data['remark'] || ''
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
            return util.showToast('none', errMsg.join('||'))
        }
        const isTrue = this.findSameRoomFn(params['roomNum'])
        if (isTrue && this.data.currentItem['roomNum'] !== params['roomNum']) {
            return util.showToast('none', '已存在相同房间号！')
        }
        this.setData({
            isShow: true
        })
        this.saveDataFn(params)
    },
    // 判断必填项
    judgeMustInputFn(data) {
        const fileList = [
            { en: 'roomNum', cn: '房间号' },
            { en: 'peopleNum', cn: '几人住' }
        ]
        const errMsg = []
        fileList.forEach(i => {
            if (!data[i['en']]) {
                errMsg.push(i['cn'])
            }
        })
        return errMsg
    },
    // 保存数据
    saveDataFn(data) {
        const that = this
        if (that.data.isEdit) {
            service.addEditSearchProject('renting_room', data, { _id: that.data['_id'] }, 1).then(values => {
                that.setData({
                    isShow: false
                })
                if (values['code'] === 0) {
                    util.showToast('success', '编辑成功')
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
			service.addZhanDFn(data, 'renting_room').then(values => {
				that.setData({
					isShow: false
				})
				if (values['code'] === 0) {
					util.showToast('success', '添加成功')
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
    }
})