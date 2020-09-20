const utils = require('./../../../utils/util')
const conf = require('./../../../config/conf')
const service = require('./../server/index')
const app = getApp()

Page({
    data: {
        userInfo: {},
        openid: null,
        isHaveImg: false,
        backgroundImg: conf.STATICIMG
    },
    onLoad: async function (options) {
        console.log('加载图片>>>>', options.backgroundImg)
        this.setData({
            backgroundImg: options.backgroundImg
        })
        // 获取用户信息
        this.setData({
            userInfo: app.globalData.userInfo,
        })
        // 获取用户 openid
        utils.cloudFn('getopenid').then(values => {
            if (values['code'] === 0) {
                this.setData({
                    openid: values['data'] && values['data']['openid'] ? values['data']['openid'] : ''
                })
            }
        })
    },
    selectImg() {
        const that = this
        wx.chooseImage({
            count: 1,
            sizeType: ['original', 'compressed'],
            sourceType: ['album', 'camera'],
            success(res) {
                console.log('选择>>>>', res.tempFilePaths[0])
                that.setData({
                    backgroundImg: res.tempFilePaths[0],
                    isHaveImg: true
                })
            },
            fail(err) {
                that.setData({
                    backgroundImg: conf.STATICIMG,
                    isHaveImg: false
                })
            }
        })
    },
    uploadImg() {
        if (!app.globalData.userInfo) {
            return utils.showToast('none', '请先授权登录后操作')
        }
        const that = this
        wx.cloud.uploadFile({
            cloudPath: `img/background/background_${that.data.openid}_${(new Date()).valueOf()}.png`,
            filePath: that.data.backgroundImg,
            success: res => {
                if (res.errMsg === conf.IMGSUCCESS) {
                    const params = {
                        flagObj: { userOpenId: that.data.openid },
                        params: {
                            userOpenId: that.data.openid,
                            nickname: that.data.userInfo['nickName'] || '',
                            imgFileId: res.fileID,
                            imgSrc: that.data.backgroundImg
                        }
                    }
                    service.uploadImg(params).then(values => {
                        if (values['code'] === 0) {
                            utils.showToast('success', '上传图片成功！')
                            utils.returnToCFromP('my')
                            wx.removeStorageSync('backImg')
                            wx.setStorage({
                                key: 'backImg',
                                data: res.fileID
                            })
                            wx.navigateBack()
                        } else {
                            utils.showToast('success', values['msg'] ? values['msg'] : '上传图片成功！')
                        }
                    })
                } else {
                    utils.showToast('none', '上传背景图片失败！，稍后重试！')
                }
            },
            fail: err => {
                console.log('上传图片失败', err)
                utils.showToast('none', '上传背景图片失败！，稍后重试！')
            }
        })

    }
})