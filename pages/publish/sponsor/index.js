const conf = require('./../../../config/conf')
const utils = require('./../../../utils/util')
const moment = require('./../../../utils/moment.min')
const bankUtil = require('./../../../config/bank')
const service = require('./../server/index')
const app = getApp()

Page({
    data: {
        gatheringIndex: null,
        gatheringList: conf.GATHERINGTYPE,
        sqgs: null,
        sqr: null,
        sqje: null,
        sqsx: null,
        bankCard: null,
        zzr: [],
        zzrStr: null,
        imgList: [],
        isShow: false,
        isComplete: false,
        isTop: false,
        formError: conf.FORMERROR,
        isEdit: false,
        isDetail: false,
        _id: null,
        deleteImg: []
    },
    onLoad: function (options) {
        const that = this
        const eventChannel = this.getOpenerEventChannel()
        eventChannel.on('editFn', function (data) {
            that.formInitFn(data)
        })
    },
    // 表单初始化
    formInitFn(data) {
        if (data['zzr'] && data['zzr'].length) {
            let strList = []
            data['zzr'].forEach(i => {
                strList.push(`[${i['zzuNickname']}] 赞助：${i['chuqian']}`)
            })
            this.setData({
                zzrStr: strList.join('；')
            })
        }
        this.setData({
            _id: data['_id'],
            isEdit: data['isEdit'],
            isDetail: data['isDetail'],
            sqgs: data['sqgs'],
            sqr: data['sqr'],
            sqje: data['sqje'],
            gatheringIndex: data['gatheringIndex'],
            sqsx: data['sqsx'],
            bankCard: data['bankCard'],
            zzr: data['zzr'] || [], // 赞助人
            imgList: data['imgList'],
            isComplete: data['isComplete'],
            isTop: data['isTop']
        })
    },
    // 收款方式
    gatheringFn(e) {
        this.setData({
            gatheringIndex: e.detail.value
        })
    },
    // 银行卡号输入
    bankInput(e) {
        this.setData({
            bankCard: e.detail.value ? e.detail.value.replace(/\s/g, '').replace(/....(?!$)/g, '$& ') : null
        })
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
            count: 2,
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
    // 确定
    submit(data) {
        const isHaveFamily = utils.getFamily()
        if (!isHaveFamily) {
            return utils.showToast('none', `您尚未加入家庭！`, 1500)
        }
        const bankObj = this.data.gatheringIndex === '2' && data.detail.value.bankCard ?
            bankUtil.bankCardAttribution(data.detail.value.bankCard) : ''
        const params = {
            familyID: app.globalData.joinFamily['joinFamilyID'], // 家庭ID
            familyName: app.globalData.joinFamily['joinFamilyName'], // 家庭名称
            sqgs: data.detail.value.sqgs, // 申请概述
            sqr: data.detail.value.sqr, // 申请人
            sqje: data.detail.value.sqje || '0.00', // 申请金额
            gatheringIndex: this.data.gatheringIndex, // 收款方式 index
            gatheringName: this.data.gatheringIndex ? conf.GATHERINGTYPEObj[this.data.gatheringIndex.toString()] : '', // 收款方式名称
            bankCard: this.data.gatheringIndex === '2' ? data.detail.value.bankCard : '', // 银行卡号
            bankName: bankObj ? bankObj['bankName'] : '', // 银行卡所属行
            bankCode: bankObj ? bankObj['bankCode'] : '', // 银行卡代码
            bankcardType: bankObj ? bankObj['cardType'] : '', // 银行卡类型
            bankcardTypeName: bankObj ? bankObj['cardTypeName'] : '', // 银行卡类型名称
            sqsx: data.detail.value.sqsx, // 申请事项
            imgList: this.data.imgList || [], // 相关申请资料
            isComplete: this.data.isComplete, // 是否办结
            isTop: this.data.isTop, // 是否置顶
            zzr: this.data.zzr // 赞助人
        }
        if (this.data.isEdit) {
            params['modifyDate'] = moment().valueOf() // 修改时间戳
            params['modifyUser'] = app.globalData.userInfo.nickName // 修改人
            params['modifyOpenid'] = app.globalData.openid // 修改人 ID
        } else {
            params['createDate'] = moment().valueOf() // 新增时间戳
            params['nickName'] = app.globalData.userInfo.nickName // 创建人
            params['openid'] = app.globalData.openid // 创建人 ID
        }
        const errorMsg = this.fromVerify(params)
        if (errorMsg) {
            utils.showToast('none', `请填写${errorMsg}`, 3000)
            return
        }
        console.log('赞助传参>>>', data, params)
        this.setData({
            isShow: true
        })
        if (params['imgList'].length) {
            this.commitFormFn(params)
        } else {
            params['fileID'] = ''
            this.saveDataFn(params)
        }
    },
    // 重置
    reset() {
        this.setData({
            gatheringIndex: null,
            sqr: null,
            sqgs: null,
            sqje: null,
            sqsx: null,
            bankCard: null,
            imgList: []
        })
    },
    // 表单校验
    fromVerify(data) {
        const errorMsg = []
        if (!data['sqgs']) {
            errorMsg.push('申请概述')
        }
        if (!data['sqr']) {
            errorMsg.push('申请人')
        }
        if (!data['sqje']) {
            errorMsg.push('申请金额')
        }
        if (!data['gatheringIndex']) {
            errorMsg.push('收款方式')
        }
        if (data['gatheringIndex'] === '2' && !data['bankCard']) {
            errorMsg.push('银行卡号')
        }
        if (!data['sqsx']) {
            errorMsg.push('申请事项')
        }
        return errorMsg.join('、')
    },
    hideModal() {
        this.setData({
            isShow: false
        })
    },
    // 表单提交
    commitFormFn(data) {
        utils.uploadFile(data['imgList'], `img/sponsor/${app.globalData.openid}`).then(promiseData => {
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
                utils.showToast('none', '赞助申请失败')
            } else {
                data['fileID'] = fileIdList.join(',')
                this.saveDataFn(data)
            }
        })
    },
    saveDataFn(data) {
        if (this.data.isEdit) {
            service.addEditSearchProject('publish_sponsor', data, { _id: this.data['_id'] }, 1).then(values => {
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
                        eventChannel.emit('refresh', { flag: 0 });
                        clearTimeout(timer)
                    }, 1500)
                } else {
                    utils.showToast('none', values['msg'] || '编辑失败')
                    utils.showToast('none', values['msg'] || '编辑失败')
                }
            }).catch(err => {
                console.log('编辑失败>>>', err)
                utils.showToast('none', '编辑失败')
                this.setData({
                    isShow: false
                })
            })
        } else {
            service.addZhanDFn(data, 'publish_sponsor').then(values => {
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
    }

})