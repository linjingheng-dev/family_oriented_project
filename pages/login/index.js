
const conf = require('./../../config/conf')
const utils = require('./../../utils/util')
const app = getApp()

Page({
    data: {
        loginGif: conf.LOGINGIF,
        headTitle: conf.HEADTITLE,
        userInfo: {},
        hasUserInfo: false,
        canIUse: wx.canIUse('button.open-type.getUserInfo'),
        homeSrc: './../home/index'
    },
    onLoad(options) {
        if (app.globalData.userInfo) {
            this.goToHome()
        } else if (this.data.canIUse) {
            app.userInfoReadyCallback = res => {
                app.globalData.userInfo = res.userInfo
                console.log('用户信息1>>>', app.globalData.userInfo)
                this.goToHome()
            }
        } else {
            wx.getUserInfo({
                success: res => {
                    app.globalData.userInfo = res.userInfo
                    console.log('用户信息2>>>', app.globalData.userInfo)
                    this.goToHome()
                }
            })
        }
    },
    getUserInfo(e) {
        app.globalData.userInfo = e.detail.userInfo
        console.log('用户信息3>>>', app.globalData.userInfo)
        this.goToHome()
    },
    goToHome() {
        if (Object.prototype.toString.call(app.globalData.CustomBar) !== '[object Number]') {
            wx.clearStorage()
            return
        }
        const timer = setTimeout(() => {
            wx.reLaunch({
                url: this.data.homeSrc
            })
            clearTimeout(timer)
        }, 800)
    }
})