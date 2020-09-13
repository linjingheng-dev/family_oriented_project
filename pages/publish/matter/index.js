const conf = require('./../../../config/conf')
const utils = require('./../../../utils/util')
const moment = require('./../../../utils/moment.min')
const bankUtil = require('./../../../config/bank')
const service = require('./../server/index')
const app = getApp()

Page({
    data: {
        isHaveFamily: false,
        userTable: 'manage_member',
        isShow: false,
        loadingText: '上传数据中',
        memberList: [],
        // 表单
        title: null,
        typeIndex: null,
        typeList: conf.SXTYPE,
        matterDate: null,
        time: null,
        zxzIndex: null,
        dd: null,
        bz: null,
        matterGradeIndex: null,
        matterGrade: conf.MATTERGRADE,
        isEdit: false,
        isDetail: false,
        _id: null,
        isComplete: false,
        isTop: false
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
        this.getUserListFn()
    },
    // 表单初始化
    formInitFn(data) {
        this.setData({
            _id: data['_id'],
            isEdit: data['isEdit'],
            isDetail: data['isDetail'],
            title: data['title'] || null,
            typeIndex: data['typeIndex'] || null,
            matterDate: data['matterDate'] || null,
            time: data['time'] || null,
            zxzIndex: data['zxzIndex'] || null,
            dd: data['dd'] || null,
            bz: data['bz'] || null,
            isComplete: data['isComplete'] || false,
            isTop: data['isTop'] || false,
            matterGradeIndex: data['matterGradeIndex'] || null,
        })
    },
    /* 表单相关 */
    selectFn(e) {
        if (e.currentTarget.dataset.type === 'type') {
            this.setData({
                typeIndex: e.detail.value
            })
        } else if (e.currentTarget.dataset.type === 'date') {
            this.setData({
                matterDate: e.detail.value
            })
        } else if (e.currentTarget.dataset.type === 'time') {
            this.setData({
                time: e.detail.value
            })
        } else if (e.currentTarget.dataset.type === 'zxz') {
            this.setData({
                zxzIndex: e.detail.value
            })
        } else if (e.currentTarget.dataset.type === 'grade') {
            this.setData({
                matterGradeIndex: e.detail.value
            })
        }
    },
    submit(e) {
        if (!this.data.isHaveFamily) {
            return
        }
        const deatilObj = e.detail.value
        const params = {
            familyID: app.globalData.joinFamily['joinFamilyID'], // 家庭ID
            familyName: app.globalData.joinFamily['joinFamilyName'], // 家庭名称
            title: deatilObj['title'], // 事项标题
            dd: deatilObj['dd'], // 地点
            bz: deatilObj['bz'], // 备注
            typeIndex: this.data.typeIndex, // 类型 index
            typeName: this.data.typeIndex ? this.data.typeList[this.data.typeIndex] : '', // 类型名称
            matterGradeIndex: this.data.matterGradeIndex, // 等级 index
            matterGradeName: this.data.matterGradeIndex ? this.data.matterGrade[this.data.matterGradeIndex] : '', // 等级名称
            matterDate: this.data.matterDate, // 日期
            time: this.data.time, // 时间
            zxzIndex: this.data.zxzIndex, // 体检对象 / 主要执行者 index
            zxzName: this.data.zxzIndex ? this.data.memberList[this.data.zxzIndex] : '', // 体检对象 / 主要执行者名称
            isWait: false, // 是否待办
            isTop: this.data.isTop, // 是否置顶
            isTimeTask: false, // 是否定时任务
            isComplete: this.data.isComplete, // 是否办结
            openid: app.globalData.openid, // 创建人 ID
            nickName: app.globalData.userInfo ? app.globalData.userInfo.nickName : '', // 创建人名称
            createDate: moment().valueOf() // 创建时间戳
        }
        console.log('事项表单提交参数>>>', params)
        const errorMsg = this.fromVerify(params)
        if (errorMsg) {
            utils.showToast('none', `请填写${errorMsg}`, 3000)
            return
        }
        this.saveFn(params)
    },
    saveFn(params) {
        this.setData({
            isShow: true,
            loadingText: '上传数据中'
        })
        if (this.data.isEdit) {
            service.addEditSearchProject('publish_matter', params, { _id: this.data['_id'] }, 1).then(values => {
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
                        eventChannel.emit('refresh', { flag: 0 });
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
            service.addZhanDFn(params, 'publish_matter').then(values => {
                this.setData({
                    isShow: false
                })
                if (values['code'] === 0) {
                    utils.showToast('success', '添加成功')
                    this.reset()
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
        }
    },
    // 表单校验
    fromVerify(data) {
        const errorMsg = []
        if (!data['title']) {
            errorMsg.push('标题')
        }
        if (!data['typeName']) {
            errorMsg.push('类型')
        }
        if (!data['matterGradeName']) {
            errorMsg.push('等级')
        }
        if (!data['matterDate']) {
            errorMsg.push('日期')
        }
        if (!data['time']) {
            errorMsg.push('时间')
        }
        if (!data['zxzName']) {
            errorMsg.push(data['typeIndex'] === '0' ? '体检对象' : '主要执行者')
        }
        return errorMsg.join('、')
    },
    reset() {
        this.setData({
            title: null,
            typeIndex: null,
            matterDate: null,
            zxzIndex: null,
            matterGradeIndex: null,
            time: null,
            dd: null,
            bz: null
        })
    },
    /* 请求相关 */
    getUserListFn(value = '') {
        if (!this.data.isHaveFamily) {
            return
        }
        const params = {
            $url: 'publish/getData',
            flag: value ? 0 : 1, // 0 -指定查询、1 -全查
            connectionName: this.data.userTable,
            data: {
                xm: value || '',
                familyID: app.globalData.joinFamily['joinFamilyID']
            }
        }
        this.setData({
            isShow: true,
            loadingText: '加载中'
        })
        console.log('成员查询参数>>>', params)
        utils.cloudFn('help', params).then(values => {
            this.setData({
                isShow: false
            })
            const res = utils.cloudDataH(values, '查询成功', '查询失败')
            if (res['code'] !== 0) {
                utils.showToast('none', res['msg'])
            } else {
                const data = res['data'] || []
                const userList = []
                data.forEach(i => userList.push(i['xm']))
                this.setData({
                    memberList: userList
                })
            }
        })
    },
})