const app = getApp()
const conf = require('./../../../config/conf')

Component({
    options: {
        addGlobalClass: true,
    },
    data: {
        CustomBar: app.globalData.CustomBar,
        iconList: conf.PUBLISHMENU
    },
    attached() {
        this.setData({
            CustomBar: app.globalData.CustomBar
        })
    },
    methods: {
        goTo(e) {
            console.log('点击>>>', e.currentTarget.dataset.id)
            wx.navigateTo({
                url: `${e.currentTarget.dataset.url}?id=${e.currentTarget.dataset.id}`
            })
        }
    }
})