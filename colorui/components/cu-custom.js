const app = getApp();
Component({
  /**
   * 组件的一些选项
   */
  options: {
    addGlobalClass: true,
    multipleSlots: true
  },
  /**
   * 组件的对外属性
   */
  properties: {
    bgColor: {
      type: String,
      default: ''
    },
    isCustom: {
      type: [Boolean, String],
      default: false
    },
    isBack: {
      type: [Boolean, String],
      default: false
    },
    bgImage: {
      type: String,
      default: ''
    },
  },
  /**
   * 组件的初始数据
   */
  data: {
    StatusBar: 20,
    CustomBar: 60,
    Custom: {
      width: 87,
      height: 32,
      left: 223,
      top: 24,
      right: 310,
      bottom: 56
    }
  },
  lifetimes: {
    attached: function () {
      const that = this
      const timer = setTimeout(() => {
        that.setData({
          StatusBar: app.globalData.StatusBar,
          CustomBar: app.globalData.CustomBar,
          Custom: app.globalData.Custom
        })
        clearTimeout(timer)
      }, 0)
    }
  },
  /**
   * 组件的方法列表
   */
  methods: {
    BackPage() {
      wx.navigateBack({
        delta: 1
      });
    },
    toHome() {
      wx.reLaunch({
        url: '/pages/index/index',
      })
    }
  }
})