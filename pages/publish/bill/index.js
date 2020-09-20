const conf = require('./../../../config/conf')
const utils = require('./../../../utils/util')
const moment = require('./../../../utils/moment.min')
const bankUtil = require('./../../../config/bank')
const service = require('./../server/index')
const app = getApp()

let touchStartTime = 0
let touchEndTime = 0
let lastTapTime = 0
let isInit = true
let showList = []

Page({
    data: {
        isHaveFamily: false,
        isShow: false,
        loadingText: '加载中',
        currentTab: 0,
        scrollLeft: 0,
        memberList: [],
        xmmcList: [],
        isInit: true,
        showList: [],
        xmList: [],
        zcje: null,
        nameList: [],
        zcList: conf.GATHERINGTYPE,
        xmIndex: null,
        nameIndex: null,
        sqNameIndex: null,
        zjrIndex: null,
        zcIndex: null,
        currentDate: moment().format('YYYY-MM-DD'),
        selectDate: null,
        bankCard: null,
        // 添加项目
        xmmc: null,
        // 添加成员
        xm: null,
        isTop: false,
        isComplete: false,
        isEdit: false,
        isDetail: false,
        _id: null
    },
    onLoad: function (options) {
        const that = this
        const eventChannel = this.getOpenerEventChannel()
        eventChannel.on('editFn', function (data) {
            that.formInitFn(data)
        })
        this.setData({
            isHaveFamily: utils.getFamily()
        })
        if (!this.data.isHaveFamily) {
            return utils.showToast('none', `您尚未加入家庭！`, 1500)
        }
        this.init()
    },
    // 表单初始化
    formInitFn(data) {
        this.setData({
            _id: data['_id'],
            isEdit: data['isEdit'],
            isDetail: data['isDetail'],
            xmIndex: data['xmIndex'],
            nameIndex: data['nameIndex'],
            sqNameIndex: data['sqNameIndex'],
            zjrIndex: data['zjrIndex'],
            zcje: data['zcje'],
            zcIndex: data['zcIndex'],
            bankCard: data['bankCard'],
            selectDate: data['selectDate'],
            isComplete: data['isComplete'] || false,
            isTop: data['isTop'] || false
        })
    },
    // 初始化
    init() {
        this.memberSearch()
        this.searchProjectFn()
        this.setData({
            isInit: false
        })
    },
    // 银行卡号输入
    bankInput(e) {
        this.setData({
            bankCard: e.detail.value ? e.detail.value.replace(/\s/g, '').replace(/....(?!$)/g, '$& ') : null
        })
    },
    // tab 选择
    tabSelect(e) {
        const id = Number(e.currentTarget.dataset.id)
        this.setData({
            currentTab: id,
            scrollLeft: (id - 1) * 60,
            showList: id === 1 ? this.data.memberList : (id === 2 ? this.data.xmmcList : [])
        })
        if (id === 0) {
            this.projectFormReset()
            this.memberFormReset()
        }
    },
    // 查询、添加
    projectSubmit(e) {
        if (!this.data.isHaveFamily) {
            return
        }
        const value = e.detail.value.xmmc
        if (e.detail.target.dataset.type === 'project_s') {
            this.searchProjectFn(value)
        } else {
            this.addProjectFn(value)
        }
    },
    // 项目新增
    addProjectFn(value) {
        if (!value) {
            return utils.showToast('none', '请先输入项目名称后再进行操作')
        }
        this.add(1, 'bill_deatil', value)
    },
    // 项目查询
    searchProjectFn(value = '') {
        this.search(1, 'bill_deatil', value ? {xmmc: value} : {})
    },
    // 项目表单重置
    projectFormReset() {
        this.setData({
            xmmc: null
        })
        this.searchProjectFn()
    },
    // 查询、添加
    memberSubmit(e) {
        if (!this.data.isHaveFamily) {
            return
        }
        const value = e.detail.value.xm
        if (e.detail.target.dataset.type === 'member_s') {
            this.memberSearch(value)
        } else {
            this.memberAddFn(value)
        }
    },
    // 成员新增
    memberAddFn(value) {
        if (!value) {
            return utils.showToast('none', '请先输入姓名后再进行操作')
        }
        this.add(0, 'bill_member', value)
    },
    // 成员查询
    memberSearch(value = '') {
        this.search(0, 'bill_member', value ? {xm: value} : {})
    },
    // 成员表单重置
    memberFormReset() {
        this.setData({
            xm: null
        })
        this.memberSearch()
    },
    // 新增
    add(flag, collectionName, value) {
        if (!value) {
            return utils.showToast('none', `请先输入${flag !== 0 ? '项目名称' : '姓名'}后再进行操作`)
        }
        const params = {
            familyID: app.globalData.joinFamily['joinFamilyID'], // 家庭ID
            familyName: app.globalData.joinFamily['joinFamilyName'], // 家庭名称
            createUserID: app.globalData.openid, // 创建人 ID
            createUserName: app.globalData.userInfo.nickName, // 创建人名称
            createDate: moment().valueOf(), // 创建时间戳
            createDate: moment().format('YYYY-MM-DD HH:mm:ss') // 创建日期
        }
        params[`${flag !== 0 ? 'xmmc' : 'xm'}`] = value // 姓名 / 项目名称
        this.setData({
            isShow: true,
            loadingText: '上传数据中'
        })
        const sObj = flag === 0 ? { xm: params['xm'] } : { xmmc: params['xmmc'] }
        service.addEditSearchProject(collectionName, params, sObj, 0).then(values => {
            this.setData({
                isShow: false
            })
            if (values['code'] === 0) {
                if (flag === 0) {
                    this.setData({
                        xm: null
                    })
                } else {
                    this.setData({
                        xmmc: null
                    })
                }
                const that = this
                const timer = setTimeout(() => {
                    flag !== 0 ? that.searchProjectFn() : that.memberSearch()
                    clearTimeout(timer)
                }, 1500)
                utils.showToast('success', '新增成功')
            } else {
                console.log('添加失败>>>', values['msg'] || '操作成员失败')
                utils.showToast('none', values['msg'] ? values['msg'] : '新增失败，请反馈给开发者，^_^')
            }
        })
    },
    // 查询
    search(flag, collectionName, value = {}) {
        value['familyID'] = app.globalData.joinFamily['joinFamilyID']
        const params = {
            $url: 'publish/getData',
            flag: value ? 0 : 1, // 0 -指定查询、1 -全查
            connectionName: collectionName,
            data: value
        }
        this.setData({
            isShow: true,
            loadingText: '加载中'
        })
        console.log('账单查询参数>>>', params)
        utils.cloudFn('help', params).then(values => {
            this.setData({
                isShow: false
            })
            const res = utils.cloudDataH(values, '查询成功', '查询失败')
            if (res['code'] !== 0) {
                utils.showToast('none', res['msg'])
            } else {
                if (flag === 0) {
                    this.setData({
                        memberList: res['data'] || [],
                        nameList: this.getValueFn(res['data'], 'xm') || []
                    })
                } else if (flag === 1) {
                    this.setData({
                        xmmcList: res['data'] || [],
                        xmList: this.getValueFn(res['data'], 'xmmc') || []
                    })
                }
                if (!this.data.isInit) {
                    this.setData({
                        showList: flag === 0 ? this.data.memberList : (flag === 1 ? this.data.xmmcList : [])
                    })
                }
            }
        })
    },
    getValueFn(data, key) {
        const dList = []
        data.forEach(item => {
            dList.push(item[`${key}`])
        })
        return dList
    },
    // 点击操作
    touchStart: function (e) {
        this.touchStartTime = e.timeStamp
    },
    /// 按钮触摸结束触发的事件
    touchEnd: function (e) {
        this.touchEndTime = e.timeStamp
    },
    // 编辑
    editFn(e) {
        // const that = this
        // if (that.touchEndTime - that.touchStartTime < 350) {
        //     const currentTime = e.timeStamp
        //     const lastTapTime = that.lastTapTime
        //     that.lastTapTime = currentTime
        //     // 如果两次点击时间在300毫秒内，则认为是双击事件
        //     if (currentTime - lastTapTime < 300) {
        //         console.log('编辑', e)
        //         wx.showModal({
        //             title: '提示',
        //             content: '是否编辑',
        //             showCancel: true
        //         })
        //     }
        // }
    },
    // 删除
    deleteFn(e) {
        wx.showModal({
            title: '提示',
            content: '确认删除？',
            showCancel: true,
            success: res => {
                if (res.confirm) {
                    const data = e.currentTarget.dataset.data
                    service.addEditSearchProject(this.data.currentTab === 1 ? 'bill_member' : 'bill_deatil', {}, data['_id'], 2).then(values => {
                        if (values['code'] === 0) {
                            if (this.data.currentTab === 1) {
                                this.setData({
                                    xm: null
                                })
                            } else {
                                this.setData({
                                    xmmc: null
                                })
                            }
                            const that = this
                            const timer = setTimeout(() => {
                                this.data.currentTab === 2 ? that.searchProjectFn() : that.memberSearch()
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
    // 项目选择
    xmSelectFn(e) {
        if (e.currentTarget.dataset.type === 'xm') {
            this.setData({
                nameIndex: e.detail.value
            })
        } else if (e.currentTarget.dataset.type === 'sqxm') {
            this.setData({
                sqNameIndex: e.detail.value
            })
        } else if (e.currentTarget.dataset.type === 'zjr') {
            this.setData({
                zjrIndex: e.detail.value
            })
        } else if (e.currentTarget.dataset.type === 'zc') {
            this.setData({
                zcIndex: e.detail.value
            })
        } else if (e.currentTarget.dataset.type === 'date') {
            this.setData({
                selectDate: e.detail.value
            })
        } else {
            this.setData({
                xmIndex: e.detail.value
            })
        }
    },
    // 表单提交
    addForm(data) {
        if (!this.data.isHaveFamily) {
            return
        }
        const bankObj = (this.data.zcIndex === '2' && data.detail.value.bankCard) ? bankUtil.bankCardAttribution(data.detail.value.bankCard) : null
        const params = {
            familyID: app.globalData.joinFamily['joinFamilyID'], // 家庭ID
            familyName: app.globalData.joinFamily['joinFamilyName'], // 家庭名称
            xmIndex: this.data.xmIndex, // 项目 index
            xmName: this.data.xmIndex && this.data.xmList.length ? this.data.xmList[this.data.xmIndex] : '', // 项目名称
            xmID: this.data.xmIndex && this.data.xmList.length ? this.data.xmmcList[this.data.xmIndex]['_id'] : '', // 项目的 _id
            nameIndex: this.data.nameIndex, // 出钱者 index
            nameName: this.data.nameIndex && this.data.nameList.length ? this.data.nameList[this.data.nameIndex] : '', // 出钱者名称
            nameID: this.data.nameIndex && this.data.nameList.length ? this.data.memberList[this.data.nameIndex]['_id'] : '', // 出钱者 _id
            sqNameIndex: this.data.sqNameIndex, // 收钱者 index
            sqNameName: this.data.sqNameIndex && this.data.nameList.length ? this.data.nameList[this.data.sqNameIndex] : '', // 收钱者名称
            sqNameID: this.data.sqNameIndex && this.data.nameList.length ? this.data.memberList[this.data.sqNameIndex]['_id'] : '', // 收钱者 _id
            zjrIndex: this.data.zjrIndex, // 中间人 index
            zjrName: this.data.zjrIndex && this.data.nameList.length ? this.data.nameList[this.data.zjrIndex] : '', // 中间人名称
            zjrNameID: this.data.zjrIndex && this.data.nameList.length ? this.data.memberList[this.data.zjrIndex]['_id'] : '', // 中间人 _id
            zcje: data.detail.value.zcje, // 金额
            zcIndex: this.data.zcIndex, // 方式 index
            zcName: this.data.zcIndex ? conf.GATHERINGTYPEObj[this.data.zcIndex.toString()] : '', // 方式名称
            bankCard: this.data.zcIndex === '2' ? data.detail.value.bankCard : '', // 银行卡号
            bankName: bankObj ? bankObj['bankName'] : '', // 银行卡所属行
            bankCode: bankObj ? bankObj['bankCode'] : '', // 银行卡代码
            bankcardType: bankObj ? bankObj['cardType'] : '', // 银行卡类型
            bankcardTypeName: bankObj ? bankObj['cardTypeName'] : '', // 银行卡类型名称
            selectDate: this.data.selectDate || '', // 日期
            isComplete: this.data.isComplete, // 是否办结
            isTop: this.data.isTop // 是否置顶
        }
        if (this.data.isEdit) {
            params['modifyDate'] = moment().valueOf() // 修改时间戳
            params['modifyUser'] = app.globalData.userInfo.nickName // 修改人名称
            params['modifyOpenid'] = app.globalData.openid // 修改人 _id
        } else {
            params['createDate'] = moment().valueOf() // 创建时间戳
            params['nickName'] = app.globalData.userInfo.nickName // 创建人名称
            params['openid'] = app.globalData.openid // 创建人 _id
        }
        console.log('账单表单提交>>>', params)
        const errorMsg = this.fromVerify(params)
        if (errorMsg) {
            utils.showToast('none', `请填写${errorMsg}`, 3000)
            return
        }
        this.addAndEditFn(params)
    },
    // 编辑和新增
    addAndEditFn(data) {
        this.setData({
            isShow: true,
            loadingText: '上传数据中'
        })
        if (this.data.isEdit) {
            service.addEditSearchProject('bill_write', data, { _id: this.data['_id'] }, 1).then(values => {
                this.setData({
                    isShow: false
                })
                if (values['code'] === 0) {
                    utils.showToast('success', '编辑成功')
                    const eventChannel = this.getOpenerEventChannel()
                    const timer = setTimeout(() => {
                        wx.navigateBack({
                            delta: 1
                        });
                        eventChannel.emit('refresh', { flag: 1 });
                        clearTimeout(timer)
                    }, 1500)
                } else {
                    utils.showToast('none', values['msg'] || '编辑失败')
                    console.log('编辑失败>>>', values['msg'] || '编辑失败')
                }
            }).catch(err => {
                console.log('编辑失败>>>', err)
                utils.showToast('none', '编辑失败')
                this.setData({
                    isShow: false
                })
            })
        } else {
			service.addZhanDFn(data, 'bill_write').then(values => {
				this.setData({
					isShow: false
				})
				if (values['code'] === 0) {
					utils.showToast('success', '添加成功')
                    this.resetForm()
				} else {
					utils.showToast('none', values['msg'] || '添加失败')
                    utils.showToast('none', values['msg'] || '添加失败')
				}
			}).catch(err => {
				console.log('添加失败>>>', err)
				utils.showToast('none', '添加失败')
				this.setData({
					isShow: false
				})
			})
        }
    },
    // 表单校验
    fromVerify(data) {
        const errorMsg = []
        if (!data['xmName']) {
            errorMsg.push('项目')
        }
        if (!data['nameName']) {
            errorMsg.push('出钱者')
        }
        if (!data['sqNameName']) {
            errorMsg.push('收钱者')
        }
        if (!data['zcje']) {
            errorMsg.push('金额')
        }
        if (!data['zcName']) {
            errorMsg.push('方式')
        }
        if (data['zcIndex'] === '2' && !data['bankCard']) {
            errorMsg.push('银行卡号')
        }
        if (!data['selectDate']) {
            errorMsg.push('日期')
        }
        return errorMsg.join('、')
    },
    resetForm() {
        this.setData({
            xmIndex: null,
            nameIndex: null,
            sqNameIndex: null,
            zjrIndex: null,
            zcje: null,
            zcIndex: null,
            selectDate: null
        })
    }

})