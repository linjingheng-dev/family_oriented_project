const conf = require('./../../../config/conf')
const utils = require('./../../../utils/util')
const moment = require('./../../../utils/moment.min')
const service = require('./../server/service')
const billS = require('./../../publish/server/index')
const app = getApp()

Page({
    data: {
        isHaveFamily: false,
        CustomBar: null,
        touxiang: conf.TOUXIANG,
        noData: conf.NODATA,
        showContentFlag: 0, // 0 -主页、1 -新增
        isShow: false,
        loadingText: '加载中',
        searchText: null,
        birth: null,
        region: ['广东省', '惠州市', '惠城区'],
        addFormGroup: {
            xm: null, phone: null, wx: null, qq: null, dw: null, zw: null, xxdz: null
        },
        userCardList: [],
        touchStartTime: 0,
        touchEndTime: 0,
        lastTapTime: 0,
        editId: null, // 编辑的ID
        isEdit: false // false -新增、true -编辑
    },
    onLoad: function (options) {
        this.setData({
            CustomBar: app.globalData.CustomBar,
            isHaveFamily: utils.getFamily()
        })
        if (!this.data.isHaveFamily) {
            return utils.showToast('none', `您尚未加入家庭！`, 1500)
        }
        this.getUserDataFn()
    },
    // 搜索
    searchFn(e) {
        this.getUserDataFn()
    },
    // 新增
    addFn() {
        if (!this.data.isHaveFamily) {
            return
        }
        this.setData({
            showContentFlag: 1
        })
    },
    // 取消
    cancleFn(e) {
        if (e.currentTarget.dataset.type === '0') {
            this.setData({
                showContentFlag: 0
            })
            this.resetForm()
        }
    },
    // 日期选择
    dateSelectFn(e) {
        this.setData({
            birth: e.detail.value || null
        })
    },
    // 地址选择
    positionFn(e) {
        this.setData({
            region: e.detail.value
        })
    },
    // 编辑新增
    addEditForm(e) {
        if (!this.data.isHaveFamily) {
            return
        }
        const deatilObj = e.detail.value
        const params = {
            familyID: app.globalData.joinFamily['joinFamilyID'], // 家庭ID
            familyName: app.globalData.joinFamily['joinFamilyName'], // 家庭名称
            xm: deatilObj['xm'], // 姓名
            birth: this.data.birth, // 出生日期
            phone: deatilObj['phone'] ? deatilObj['phone'].replace(/\s/g, '').replace(/....(?!$)/g, '$& ') : '', // 手机号
            wx: deatilObj['wx'], // 微信
            qq: deatilObj['qq'], // QQ
            dw: deatilObj['dw'], // 单位
            zw: deatilObj['zw'], // 职务
            touxiang: '', // 头像
            age: this.data.birth ? utils.accountAgeFn(this.data.birth) : '0', // 周岁
            region: this.data.region.join(','), // 居住
            regionC: this.data.region.join(''), // 居住
            xxdz: deatilObj['xxdz'], // 详细地址
            openid: app.globalData.openid, // 创建人 ID
            nickName: app.globalData.userInfo ? app.globalData.userInfo.nickName : '', // 创建人名称
            createDate: moment().valueOf() // 创建时间戳
        }
        console.log('成员表单体检参数>>>', params)
        const errorMsg = this.fromVerify(params)
        if (errorMsg) {
            utils.showToast('none', `请填写${errorMsg}`, 3000)
            return
        }
        this.actionFn(params)
    },
    // 编辑新增
    actionFn(params) {
        this.setData({
            isShow: true,
            loadingText: '上传数据中'
        })
        service.addMemberFn(params, this.data.isEdit, this.data.editId || '').then(values => {
            this.setData({
                isShow: false
            })
            if (values['code'] === 0) {
                utils.showToast('success', this.data.isEdit ? '编辑成功' : '添加成功')
                const that = this
                const timer = setTimeout(() => {
                    that.resetForm()
                    that.getUserDataFn()
                    that.setData({
                        showContentFlag: 0
                    })
                    clearTimeout(timer)
                }, 1500)
            } else {
                utils.showToast('none', values['msg'] || `${this.data.isEdit ? '编辑' : '添加'}失败`)
            }
        })
    },
    // 表单校验
    fromVerify(data) {
        const errorMsg = []
        if (!data['xm']) {
            errorMsg.push('姓名')
        }
        if (!data['birth']) {
            errorMsg.push('出生')
        }
        if (!data['region']) {
            errorMsg.push('居住')
        }
        if (!data['xxdz']) {
            errorMsg.push('详细地址')
        }
        return errorMsg.join('、')
    },
    // 重置
    resetForm() {
        this.setData({
            editId: null,
            isEdit: false,
            birth: null,
            region: ['广东省', '惠州市', '惠城区'],
            ['addFormGroup.xm']: null,
            ['addFormGroup.phone']: null,
            ['addFormGroup.wx']: null,
            ['addFormGroup.qq']: null,
            ['addFormGroup.dw']: null,
            ['addFormGroup.zw']: null,
            ['addFormGroup.xxdz']: null
        })
    },
    // 获取人员信息
    getUserDataFn() {
        this.search('manage_member', this.data.searchText)
    },
    // 搜索赋值
    inputFn(e) {
        this.setData({
            searchText: e.detail.value ? e.detail.value.toLowerCase() : null
        })
        if (!this.data.searchText) {
            this.getUserDataFn()
        }
    },
    // 查询
    search(collectionName, value) {
        const param = {familyID: app.globalData.joinFamily['joinFamilyID']}
        if (value) {
            param['xm'] = value
        }
        const params = {
            $url: 'publish/getData',
            flag: 0, // 0 -指定查询、1 -全查
            connectionName: collectionName,
            data: param
        }
        console.log('成员查询参数>>>', params)
        this.setData({
            isShow: true,
            loadingText: '加载中'
        })
        utils.cloudFn('help', params).then(values => {
            console.log('成员', values)
            this.setData({
                isShow: false
            })
            const res = utils.cloudDataH(values, '查询成功', '查询失败')
            if (res['code'] !== 0) {
                utils.showToast('none', res['msg'])
                console.log('查询失败>>', res['msg'] || '查询失败')
            } else {
                this.setData({
                    userCardList: res['data'] || []
                })
            }
        })
    },
    // 删除
    deleteFn(e) {
        const data = e.currentTarget.dataset.data
        wx.showModal({
            title: '提示',
            content: `是否删除家庭成员${data['xm']}？`,
            showCancel: true,
            success: res => {
                if (res.confirm) {
                    billS.addEditSearchProject('manage_member', {}, data['_id'], 2).then(values => {
                        if (values['code'] === 0) {
                            const that = this
                            const timer = setTimeout(() => {
                                that.setData({
                                    searchText: null
                                })
                                that.getUserDataFn()
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
    // 点击操作
    touchStart: function (e) {
        this.setData({
            touchStartTime: e.timeStamp
        })
    },
    /// 按钮触摸结束触发的事件
    touchEnd: function (e) {
        this.setData({
            touchEndTime: e.timeStamp
        })
    },
    // 编辑
    editFn(e) {
        const that = this
        if (that.data.touchEndTime - that.data.touchStartTime < 350) {
            const currentTime = e.timeStamp
            const lastTapTime = that.lastTapTime
            that.lastTapTime = currentTime
            // 如果两次点击时间在300毫秒内，则认为是双击事件
            if (currentTime - lastTapTime < 300) {
                const data = e.currentTarget.dataset.data
                const pcq = data['region'].split(',')
                this.setData({
                    editId: data['_id'],
                    isEdit: true,
                    showContentFlag: 1,
                    birth: data['birth'],
                    region: [pcq[0], pcq[1], pcq[2]],
                    addFormGroup: {
                        xm: data['xm'], phone: data['phone'], wx: data['wx'], qq: data['qq'], dw: data['dw'], zw: data['zw'], xxdz: data['xxdz']
                    }
                })
            }
        }
    }
})