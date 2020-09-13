const conf = require('./../../../config/conf')
const utils = require('./../../../utils/util')
const moment = require('./../../../utils/moment.min')
const service = require('./../server/index')
const app = getApp()

Page({
    data: {
        isHaveFamily: false,
        tableName: 'publish_tijian',
        userTable: 'manage_member',
        isShow: false,
        loadingText: '上传数据中',
        memberList: [],
        // 表单值
        tjdxIndex: null,
        tjyy: null,
        tjDate: null,
        tiks: null,
        sjys: null,
        tjfy: null,
        zysx: null,
        tjgsIndex: null,
        tjImgList: [],
        deleteImg: [],
        editImgList: [],
        fileID: [],
        tjgsList: conf.TJRESULT,
        _id: null,
        isEdit: false,
        isDetail: false,
        isComplete: false,
        isTop: false,
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
        this.initFn()
    },
    // 表单初始化
    formInitFn(data) {
        const copyData = JSON.parse(JSON.stringify(data['tjImgList']))
        this.setData({
            _id: data['_id'],
            isEdit: data['isEdit'],
            isDetail: data['isDetail'],
            tjdxIndex: data['tjdxIndex'],
            tjyy: data['tjyy'],
            tjDate: data['tjyy'],
            tiks: data['tiks'],
            sjys: data['sjys'],
            tjfy: data['tjfy'],
            zysx: data['zysx'],
            tjgsIndex: data['tjgsIndex'],
            tjImgList: data['tjImgList'],
            editImgList: copyData,
            fileID: data['fileID'],
            isComplete: data['isComplete'],
            isTop: data['isTop'],
            matterGradeIndex: data['matterGradeIndex'] || null,
        })
    },
    initFn() {
        this.getUserListFn({familyID: app.globalData.joinFamily['joinFamilyID']})
    },
    // 成员信息
    getUserListFn(value) {
        if (!this.data.isHaveFamily) {
            return
        }
        const params = {
            $url: 'publish/getData',
            flag: value ? 0 : 1, // 0 -指定查询、1 -全查
            connectionName: this.data.userTable,
            data: value
        }
        this.setData({
            isShow: true,
            loadingText: '加载中'
        })
        console.log('获取成员参数>>>', params)
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
    // 选择
    selectFn(e) {
        if (e.currentTarget.dataset.type === 'tjdx') {
            this.setData({
                tjdxIndex: e.detail.value
            })
        } else if (e.currentTarget.dataset.type === 'date') {
            this.setData({
                tjDate: e.detail.value
            })
        } else if (e.currentTarget.dataset.type === 'tjgs') {
            this.setData({
                tjgsIndex: e.detail.value
            })
        }
    },

    /* 图片相关处理 */
    // 图片预览
    viewImage(e) {
        wx.previewImage({
            urls: this.data.tjImgList,
            current: e.currentTarget.dataset.url
        });
    },
    // 删除图片
    delImg(e) {
        let isDelColud = false
        let imgInfo
        if (this.data.tjImgList && this.data.tjImgList.length) {
            imgInfo = this.data.tjImgList[e.currentTarget.dataset.index]
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
                    this.data.tjImgList.splice(e.currentTarget.dataset.index, 1);
                    this.setData({
                        tjImgList: this.data.tjImgList
                    })
                }
            }
        })
    },
    // 选择图片
    chooseImage() {
        wx.chooseImage({
            count: 2,
            sizeType: ['original', 'compressed'],
            sourceType: ['album'],
            success: (res) => {
                if (this.data.tjImgList.length != 0) {
                    this.setData({
                        tjImgList: this.data.tjImgList.concat(res.tempFilePaths)
                    })
                } else {
                    this.setData({
                        tjImgList: res.tempFilePaths
                    })
                }
            }
        });
    },
    // 保存
    submit(e) {
        if (!this.data.isHaveFamily) {
            return
        }
        const data = e.detail.value
        const params = {
            familyID: app.globalData.joinFamily['joinFamilyID'], // 家庭ID
            familyName: app.globalData.joinFamily['joinFamilyName'], // 家庭名称
            tjyy: data['tjyy'], // 医院
            tiks: data['tiks'], // 科别
            sjys: data['sjys'], // 送检医师
            tjfy: data['tjfy'], // 费用
            zysx: data['zysx'], // 注意事项
            tjDate: this.data.tjDate, // 日期
            tjgsIndex: this.data.tjgsIndex, // 体检概述 index
            tjgsName: this.data.tjgsIndex ? this.data.tjgsList[Number(this.data.tjgsIndex)] : '', // 体检概述描述
            tjdxIndex: this.data.tjdxIndex, // 体检者 index
            tjdxName: this.data.tjdxIndex && this.data.memberList.length ? this.data.memberList[Number(this.data.tjdxIndex)] : '', // 体检者名称
            tjImgList: this.data.tjImgList || [], // 体检报告
            openid: app.globalData.openid, // 提交者 ID
            nickName: app.globalData.userInfo.nickName, // 提交者名称
            isComplete: this.data.isComplete, // 是否办结
            isTop: this.data.isTop, // 是否置顶
            createDate: moment().valueOf() // 提交时间戳
        }
        const errorMsg = this.fromVerify(params)
        if (errorMsg) {
            utils.showToast('none', `请填写${errorMsg}`, 3000)
            return
        }
        console.log('体检结果表单提交参数>>>', data, params)
        this.setData({
            isShow: true,
            loadingText: '数据上传中'
        })
        if (!params['tjImgList'].length) {
            params['fileID'] = ''
            this.saveFn(params)
        } else {
            this.uploadImgFn(params)
        }
    },
    // 上传图片
    uploadImgFn(data) {
        utils.uploadFile(data['tjImgList'], `img/tijian/${app.globalData.openid}`).then(promiseData => {
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
                utils.showToast('none', '保存体检结果失败')
            } else {
                data['fileID'] = fileIdList.join(',')
                this.saveFn(data)
            }
        })
    },
    // 保存
    saveFn(params) {
        if (this.data.isEdit) {
            service.addEditSearchProject('publish_tijian', params, { _id: this.data['_id'] }, 1).then(values => {
                this.setData({
                    isShow: false
                })
                if (values['code'] === 0) {
                    utils.showToast('success', '编辑成功')
                    if (this.data.deleteImg.length) {
                        wx.cloud.deleteFile({
                            fileList: this.data.deleteImg
                        })
                    }
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
            service.addZhanDFn(params, 'publish_tijian').then(values => {
                if (values['code'] === 0) {
                    utils.showToast('success', '保存成功')
                    this.reset()
                } else {
                    utils.showToast('none', values['msg'] || '保存失败')
                    console.log('编辑失败>>>', values['msg'] || '保存失败')
                }
                this.setData({
                    isShow: false
                })
            })
        }
    },
    // 表单校验
    fromVerify(data) {
        const errorMsg = []
        if (!data['tjdxName']) {
            errorMsg.push('体检者')
        }
        if (!data['tjyy']) {
            errorMsg.push('医院')
        }
        if (!data['tiks']) {
            errorMsg.push('科别')
        }
        if (!data['sjys']) {
            errorMsg.push('送检医师')
        }
        if (!data['tjDate']) {
            errorMsg.push('日期')
        }
        if (!data['tjgsName']) {
            errorMsg.push('体检概述')
        }
        if (!data['tjfy']) {
            errorMsg.push('费用')
        }
        return errorMsg.join('、')
    },
    // 重置
    reset() {
        this.setData({
            tjdxIndex: null,
            tjyy: null,
            tjDate: null,
            tiks: null,
            sjys: null,
            tjfy: null,
            zysx: null,
            tjgsIndex: null,
            tjImgList: []
        })
    }
})