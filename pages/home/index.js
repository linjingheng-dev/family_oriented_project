//index.js
//获取应用实例
const app = getApp()
const utils = require('../../utils/util')
const conf = require('./../../config/conf')

let isLogin = false

Page({
    data: {
        headTitle: conf.HEADTITLE,
        StatusBar: null,
        CustomBar: null,
        // currentPage: 'housewifery',
        currentPage: 'my',
        myParams: {}
    },
    //事件处理函数
    bindViewTap: function () {
        wx.navigateTo({
            url: '../logs/logs'
        })
    },
    onLoad: async function (options) {
        this.setData({
            StatusBar: app.globalData.StatusBar,
            CustomBar: app.globalData.CustomBar
        })
        utils.showToast('none', `欢迎使用 ${this.data.headTitle}`, 1500)
        if (options && JSON.stringify(options) !== '{}') {
            this.setData({
                currentPage: options['currentPage']
            })
            console.log('分享>>>', options)
            const cO = this.selectComponent(`#${options['currentPage']}`)
            cO.inviteCode(options['code'])
        }
    },
    onShow: function () {
        const family = wx.getStorageSync('joinFamily')
        const userInfoMsg = wx.getStorageSync('userInfoMsg')
        console.log('每一次打开>>>', family, '====', userInfoMsg, '+++')
        this.getDataFn(app.globalData.isComponent)
        if (!userInfoMsg) {
            return utils.showToast('none', `您当前还未登录！`, 3000)
        } else if (!family) {
            return utils.showToast('none', `您当前还未加入家庭！`, 3000)
        }
        app.globalData.joinFamily = family
    },
    getDataFn(key) {
        let id = key || '';
        if (id) {
            const cO = this.selectComponent(`#${id}`)
            cO.init()
        }
    },
    NavChange(e) {
        this.setData({
            currentPage: e.currentTarget.dataset.cur
        })
    },
    onShareAppMessage() {
        return {
            title: '顾家',
            imageUrl: '/images/share.jpg',
            path: '/pages/index/index'
        }
    }
})
