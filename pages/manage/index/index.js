const app = getApp()
const conf = require('./../../../config/conf')

Component({
    options: {
        addGlobalClass: true,
    },
    data: {
        CustomBar: null,
        iconList: conf.MANAGEMENU
    },
    attached() {
        this.setData({
            CustomBar: app.globalData.CustomBar
        })
    },
    methods: {
        goTo(e) {
            wx.navigateTo({
                url: `${e.currentTarget.dataset.url}?id=${e.currentTarget.dataset.id}`
            })
        }
    }
})