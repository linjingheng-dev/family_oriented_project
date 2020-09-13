const conf = require('./../../../config/conf')

Page({
    data: {
        authorImg: conf.AUTHORTOUXIANG
    },
    onLoad: function (options) {

    },
    viewImage(e) {
        wx.previewImage({
            urls: [this.data.authorImg],
            current: e.currentTarget.dataset.url
        });
    }
})