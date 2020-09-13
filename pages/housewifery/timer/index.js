const conf = require("../../../config/conf")
const utils = require("./../../../utils/util")
const moment = require('./../../../utils/moment.min')
const service = require('./../../publish/server/index')
const app = getApp()

Page({
    data: {
        isHaveFamily: false,
        isShow: false,
        loadingText: '加载中',
        _id: null,
        startDate: moment().format('YYYY-MM-DD'),
        startTime: moment().format('HH:mm'),
        yesAndCancelList: [{ label: '否', value: 0 }, { label: '是', value: 1 }],
        cycleList: conf.CYCLELIST,
        prevPageFlag: 0, // 上一个操作界面标识，默认首页
        currentTab: 0,
        tableName: null,
        currentData: null,
        parentID: null,
        formData: {
            title: null,
            shortName: null,
            yesOrNo: 0,
            cycle: 0,
            sycczr: null, // 上一次编辑的人
            sycczsj: null, // 上一次操作时间
            sDate: null,
            eDate: null,
            sTime: null,
            eTime: null,
            remark: null
        },
        // 其他数据
        otherData: null,
        isEdit: false,
        isDetail: false
    },
    onLoad: function (options) {
        this.setData({
            isHaveFamily: utils.getFamily()
        })
        if (!this.data.isHaveFamily) {
            return utils.showToast('none', `您尚未加入家庭！`, 1500)
        }
        const that = this
        const eventChannel = this.getOpenerEventChannel()
        eventChannel.on('editFn', function (data) {
            console.log('定时任务设置>>>', data)
            if (!data['prevPageFlag'] && (!data['isEdit'] && !data['isDetail'])) {
                that.seatDataFn(data)
            } else {
                that.formInitFn(data)
            }
        })
    },
    // 初始化表格
    formInitFn(obj) {
        this.setData({
            _id: obj['data']['_id'],
            isEdit: obj['isEdit'],
            isDetail: obj['isDetail'],
            tableName: obj['tableName'],
            currentData: obj['data'],
            currentTab: obj['currentTab'],
            prevPageFlag: obj['prevPageFlag'] || 0,
            parentID: obj['data']['parentID'],
            ['formData.title']: obj['data']['content']            
        })
        if (obj['isEdit']) {
            this.getMapIdTableFn(obj['data']['_id'])
        } else {
            this.setData({
                ['formData.yesOrNo']: obj['data']['yesOrNo'],
                ['formData.cycle']: obj['data']['cycle'] ? obj['data']['cycle'] : (obj['data']['cycle'] === 0 ? 0 : 1),
                ['formData.sycczr']: obj['data']['timeModifyUser'],
                ['formData.sycczsj']: obj['data']['setTimerDate'],
                ['formData.sDate']: obj['data']['sDate'],
                ['formData.eDate']: obj['data']['eDate'],
                ['formData.sTime']: obj['data']['sTime'],
                ['formData.eTime']: obj['data']['eTime'],
                ['formData.remark']: obj['data']['remark']
            })
        }
    },
    matterTitleFn() {
        if (this.data.prevPageFlag === 0) {
            // 事项管理
            return '事项管理'
        }
    },
    seatDataFn(data) {
        if (!this.data.isHaveFamily) {
            return
        }
        this.setData({
            _id: data['data']['_id'],
            prevPageFlag: data['prevPageFlag'] || 0,
            currentTab: data['currentTab'] || 0,
            tableName: data['tableName'],
            currentData: data['data'],
            ['formData.title']: data['data']['title_C'],
        })
        // 获取关系表数据
        const params = { otherTableID: this.data._id, optionUserOpenID: app.globalData.openid, familyID: app.globalData.joinFamily['joinFamilyID'] }
        console.log('获取关系表参数>>>', params)
        this.getCurrentItemDataFn('timer_matter_id_map', params).then(values => {
            const res = utils.cloudDataH(values, '查询成功', '查询失败')
            if (res['code'] !== 0) {
                this.setData({
                    isShow: false
                })
                utils.showToast('none', res['msg'])
            } else {
                const data = res['data'] || []
                if (data.length) {
                    this.getMapIdTableFn(data[0]['timerMatterTableID'])
                } else {
                    this.setData({
                        isShow: false
                    })
                }
            }
        }).catch(err => {
            this.setData({
                isShow: false
            })
            utils.showToast('none', err || '获取关系表数据失败')
        })
    },
    // 获取定时任务列表
    getMapIdTableFn(_id) {
        if (!this.data.isHaveFamily) {
            return
        }
        const params = { _id: _id, optionUserOpenID: app.globalData.openid, familyID: app.globalData.joinFamily['joinFamilyID'] }
        console.log('获取定时任务列表参数>>>', params)
        this.getCurrentItemDataFn('timer_matter', params).then(values => {
            this.setData({
                isShow: false
            })
            const res = utils.cloudDataH(values, '查询成功', '查询失败')
            if (res['code'] !== 0) {
                utils.showToast('none', res['msg'])
                console.log('查询失败》》》', res['msg'] || '查询失败')
            } else {
                const data = res['data'] || []
                if (data.length) {
                    const obj = data[0]
                    this.setData({
                        ['formData.yesOrNo']: obj['yesOrNo'],
                        ['formData.cycle']: obj['cycle'] ? obj['cycle'] : (obj['cycle'] === 0 ? 0 : 1),
                        ['formData.sycczr']: obj['timeModifyUser'],
                        ['formData.sycczsj']: obj['setTimerDate'],
                        ['formData.sDate']: obj['sDate'],
                        ['formData.eDate']: obj['eDate'],
                        ['formData.sTime']: obj['sTime'],
                        ['formData.eTime']: obj['eTime'],
                        ['formData.remark']: obj['remark'],
                        ['formData.shortName']: obj['shortName'],
                        otherData: obj
                    })
                }
            }
        }).catch(err => {
            this.setData({
                isShow: false
            })
            console.log('查询失败》》》', err)
            utils.showToast('none', err || '获取关系表数据失败')
        })
    },
    // 表单相关操作
    inputFn(e) {
        const name = e.currentTarget.dataset.name
        const obj = e.currentTarget.dataset.obj
        const type = e.currentTarget.dataset.type
        if (Number(type) === 0) {
            if (e.detail.value && e.detail.value.length > 20) {
                utils.showToast('none', '输入的文字必须在20个字符之内')
                isTrue = true
            }
            const str = `${obj}.${name}`
            this.setData({
                [str]: e.detail.value || null
            })
        }
    },
    selectFn(e) {
        const type = e.currentTarget.dataset.type
        const str = `formData.${type}`
        this.setData({
            [str]: (type === 'yesOrNo' || type === 'cycle') ? Number(e.detail.value) : e.detail.value
        })
        if (type === 'yesOrNo') {
            this.setData({
                cycle: e.detail.value === '0' ? 1 : 0
            })
        }
    },
    commitForm(e) {
        if (!this.data.isHaveFamily) {
            return
        }
        const params = {
            isTimer: this.data.formData.yesOrNo ? false : true, // 是否取消
            isCycle: this.data.formData.cycle, // 是否周期
            timeSDate: this.data.formData.yesOrNo || !this.data.formData.cycle ? '' : this.data.formData.sDate, // 触发开始日期
            timeEDate: this.data.formData.yesOrNo ? '' : this.data.formData.eDate, // 触发截止日期
            timeSTime: this.data.formData.yesOrNo || !this.data.formData.cycle ? '' : this.data.formData.sTime, // 触发开始时间
            timeETime: this.data.formData.yesOrNo ? '' : this.data.formData.eTime, // 触发截止时间
            timeRemark: this.data.formData.yesOrNo ? '' : e.detail.value.remark, // 备注
            timeModifyUser: app.globalData.userInfo ? app.globalData.userInfo.nickName : '', // 当前设置人名称
            setTimerDate: moment().format('YYYY-MM-DD HH:mm:ss') // 操作时间
        }
        console.log('定时任务表单提交参数>>>', params)
        let errorMsg = this.judgeDateAndTimeFn(params)
        if (errorMsg) {
            return utils.showToast('none', errorMsg)
        }
        this.addNewItemFn(params)
    },
    judgeDateAndTimeFn(obj) {
        const errorMsg = []
        if (!obj.isTimer) {
            return ''
        }
        if (!this.data.formData['shortName']) {
            errorMsg.push('任务简称')
        }
        if (!obj['timeSDate'] && obj['isCycle']) {
            errorMsg.push('开始日期')
        }
        if (!obj['timeSTime'] && obj['isCycle']) {
            errorMsg.push('开始时间')
        }
        if (!obj['timeEDate']) {
            errorMsg.push('结束日期')
        }
        if (!obj['timeETime']) {
            errorMsg.push('结束时间')
        }
        const eD = Number(moment(`${obj['timeEDate']} ${obj['timeETime']}`, 'YYYY-MM-DD HH:mm').format('YYYYMMDDHHmm'))
        if (obj['isCycle']) {
            const sD = Number(moment(`${obj['timeSDate']} ${obj['timeSTime']}`, 'YYYY-MM-DD HH:mm').format('YYYYMMDDHHmm'))
            if (eD < sD) {
                errorMsg.push('开始时间不能小于结束时间')
            }
        }
        if (eD < Number(moment().format('YYYYMMDDHHmm'))) {
            errorMsg.push('结束时间应晚于当前时间')
        }
        if (!this.data.tableName) {
            errorMsg.push('数据库中不存在相应的表，请联系开发者')
        }
        return errorMsg.join(' || ')
    },
    resetForm(e) {
        for (const i in this.data.formData) {
            const str = `formData.${i}`
            this.setData({
                [str]: null
            })
        }
    },
    // 编辑任务
    editTaskFn(collectionName, params) {
        this.setData({
            isShow: false,
            loadingText: '任务设置中'
        })
        service.addEditSearchProject(collectionName, params, { _id: this.data['_id'] }, 1).then(values => {
            this.setData({
                isShow: false
            })
            const that = this;
            if (values['code'] === 0) {
                utils.showToast('success', '设置定时任务成功')
                const eventChannel = this.getOpenerEventChannel()
                const timer = setTimeout(() => {
                    wx.navigateBack({
                        delta: 1
                    });
                    eventChannel.emit('refresh', { flag: that.data.currentTab });
                    clearTimeout(timer)
                }, 1500)
            } else {
                utils.showToast('none', values['msg'] || '设置定时任务失败')
                console.log('设置定时任务失败', values['msg'] || '设置定时任务失败')
            }
        }).catch(err => {
            console.log('设置定时任务失败', err)
            utils.showToast('none', '设置定时任务失败')
            this.setData({
                isShow: false
            })
        })
    },


    // 任务表与事项表关联

    getCurrentItemDataFn(connectionName, value, sort = null) {
        const params = {
            $url: 'publish/getData',
            flag: value ? 0 : 1,
            connectionName: connectionName,
            isSort: sort ? true : false,
            sortList: sort || [],
            data: value
        }
        this.setData({
            isShow: true,
            loadingText: '加载中'
        })
        return utils.cloudFn('help', params)
    },

    // 新增一条记录到关系表
    addRecordToGXTableFn(matterId, params) {
        const data = {
            familyID: app.globalData.joinFamily['joinFamilyID'],
            otherTableID: this.data._id,
            timerMatterTableID: matterId,
            optionUserOpenID: app.globalData.openid
        }
        service.addZhanDFn(data, 'timer_matter_id_map').then(values => {
            if (values['code'] === 0) {
                if (!values['data']) {
                    this.setData({
                        isShow: false
                    })
                    utils.showToast('none', values['msg'] || '插入到关系表失败')
                    console.log('插入到关系表失败>>>', values['msg'] || '插入到关系表失败')
                } else {
                    const that = this
                    const eventChannel = this.getOpenerEventChannel()
                    const timer = setTimeout(() => {
                        wx.navigateBack({
                            delta: 1
                        });
                        eventChannel.emit('refresh', { flag: that.data.currentTab });
                        clearTimeout(timer)
                    }, 1500)
                }
            } else {
                this.setData({
                    isShow: false
                })
                utils.showToast('none', values['msg'] || '插入到关系表失败')
                console.log('插入到关系表失败>>>', values['msg'] || '插入到关系表失败')
            }
        }).catch(err => {
            console.log('插入到关系表失败>>>', err)
            utils.showToast('none', '插入到关系表失败')
            this.setData({
                isShow: false
            })
        })
    },

    addNewItemFn(params) {
        this.setData({
            isShow: true,
            loadingText: '上传数据中'
        })
        if (this.data.otherData) {
            // 编辑
            const data = {
                shortName: this.data.formData.shortName,
                yesOrNo: this.data.formData.yesOrNo,
                cycle: this.data.formData.yesOrNo ? 0 : this.data.formData.cycle,
                sDate: !this.data.formData.cycle ? '' : params['timeSDate'],
                eDate: params['timeEDate'],
                sTime: !this.data.formData.cycle ? '' : params['timeSTime'],
                eTime: params['timeETime'],
                remark: params['timeRemark'],
                timeModifyUser: params['timeModifyUser'],
                setTimerDate: params['setTimerDate'],
                taskSDate: this.data.formData.yesOrNo || !this.data.formData.cycle ? '' : `${params['timeSDate']} ${params['timeSTime']}`,
                taskEDate: this.data.formData.yesOrNo ? '' : `${params['timeEDate']} ${params['timeETime']}`,
                templateID: this.data.currentData['templateID'],
                parentID: this.data.parentID && this.data.isEdit ? this.data.parentID : this.data._id
            }
            console.log('编辑>>>', data)
            // return
            service.addEditSearchProject('timer_matter', data, { _id: this.data.otherData['_id'] }, 1).then(values => {
                this.setData({
                    isShow: false
                })
                if (values['code'] === 0) {
                    const that = this
                    const eventChannel = this.getOpenerEventChannel()
                    const timer = setTimeout(() => {
                        wx.navigateBack({
                            delta: 1
                        });
                        eventChannel.emit('refresh', { flag: that.data.currentTab });
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
            // 新增
            const data = {
                familyID: app.globalData.joinFamily['joinFamilyID'],
                tableName: this.data.tableName,
                actionId: this.data._id,
                title: this.matterTitleFn(),
                content: this.data.formData.title,
                shortName: this.data.formData.shortName,
                desc: this.data.currentData ? this.data.currentData['smallText'] : '--',
                lastEditUser: app.globalData.userInfo ? app.globalData.userInfo.nickName : '',
                lastEditDate: moment().format('YYYY-MM-DD HH:mm:ss'),
                taskSDate: this.data.formData.yesOrNo || !this.data.formData.cycle ? '' : `${params['timeSDate']} ${params['timeSTime']}`,
                taskEDate: this.data.formData.yesOrNo ? '' : `${params['timeEDate']} ${params['timeETime']}`,
                optionUserOpenID: app.globalData.openid,
                // 表单数据
                yesOrNo: this.data.formData.yesOrNo,
                cycle: this.data.formData.cycle,
                sDate: !this.data.formData.cycle ? '' : params['timeSDate'],
                eDate: params['timeEDate'],
                sTime: !this.data.formData.cycle ? '' : params['timeSTime'],
                eTime: params['timeETime'],
                remark: params['timeRemark'] || '',
                timeModifyUser: params['timeModifyUser'],
                setTimerDate: params['setTimerDate'],
                isComplate: false,
                templateID: this.data.currentData['templateID'],
                parentID: this.data._id
            }
            console.log('新增>>>', data)
            service.addZhanDFn(data, 'timer_matter').then(values => {
                if (values['code'] === 0) {
                    if (!values['data']) {
                        this.setData({
                            isShow: false
                        })
                        utils.showToast('none', values['msg'] || '添加失败')
                        console.log('添加失败>>>', values['msg'] || '添加失败')
                    } else {
                        this.addRecordToGXTableFn(values['data'], params)
                    }
                } else {
                    this.setData({
                        isShow: false
                    })
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

    // TODO 暂时不用
    addOrDelFn(params) {
        if (params['isTimer'] && !this.data.currentData.timerMatterID) {
            // 新增
            const data = {
                familyID: app.globalData.joinFamily['joinFamilyID'],
                tableName: this.data.tableName,
                actionId: this.data._id,
                title: this.matterTitleFn(),
                content: this.data.formData.title,
                desc: this.data.currentData ? this.data.currentData['smallText'] : '--',
                lastEditUser: app.globalData.userInfo ? app.globalData.userInfo.nickName : '',
                lastEditDate: moment().format('YYYY-MM-DD HH:mm:ss'),
                taskSDate: `${params['timeSDate']} ${params['timeSTime']}`,
                taskEDate: `${params['timeEDate']} ${params['timeETime']}`,
                remark: params['timeRemark'] || '',
                optionUserOpenID: app.globalData.openid,
            }
            service.addZhanDFn(data, 'timer_matter').then(values => {
                if (values['code'] === 0) {
                    if (!values['data']) {
                        this.setData({
                            isShow: false
                        })
                        utils.showToast('none', values['msg'] || '添加失败')
                        console.log('添加失败>>>', values['msg'] || '添加失败')
                    } else {
                        params['timerMatterID'] = values['data']
                        this.editTaskFn(this.data.tableName, params)
                    }
                } else {
                    this.setData({
                        isShow: false
                    })
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
        } else {
            // 删除
            service.addEditSearchProject('timer_matter', {}, this.data.currentData.timerMatterID, 2).then(values => {
                if (values['code'] === 0) {
                    if (this.data.currentData.timerMatterID && params['isTimer']) {
                        this.setData({
                            ['currentData.timerMatterID']: ''
                        })
                        this.addOrDelFn(params)
                    } else {
                        params['timerMatterID'] = ''
                        this.editTaskFn(this.data.tableName, params)
                    }
                } else {
                    this.setData({
                        isShow: false
                    })
                    utils.showToast('none', '删除失败')
                    console.log('删除失败！', '删除失败')
                }
            }).catch(err => {
                console.log('删除失败！', err)
                utils.showToast('none', '删除失败')
                this.setData({
                    isShow: false
                })
            })
        }
    }
})