module.exports = {
    // 作者头像
    AUTHORTOUXIANG: 'https://7169-qiucheng-afgeg-1302850511.tcb.qcloud.la/img/system/user.png? sign=3c17dcc265a121a44f80ea75fa4e10c2&t=1599960134',
    // 模板ID
    MATTERTEMPLATE: 'KRaMNBZOZvgpvX350YqctcrBFVDWVKORzeTJXEqJALk',
    HEADTITLE: '顾家',
    LOGINGIF: 'https://7169-qiucheng-js-213aw-1302850511.tcb.qcloud.la/img/a_meng.gif?sign=165c8cd6e8b42a4f273653583ebab935&t=1597671345',
    FORMERROR: 'https://7169-qiucheng-js-213aw-1302850511.tcb.qcloud.la/img/system/form_error.gif?sign=06cb1fdc0e7c468c20125590416a4635&t=1597909589',
    IMGSUCCESS: 'cloud.uploadFile:ok',
    GETSUCCESS: 'collection.get:ok',
    ADDSUCCESS: 'collection.add:ok',
    STATICIMG: '/images/background_default.png',
    BLGIF: '/images/wave.gif',
    // 头像
    TOUXIANG: 'https://7169-qiucheng-js-213aw-1302850511.tcb.qcloud.la/img/system/touxiang.gif?sign=efdb8121969226c345bc4e60aec4291e&t=1597997152',
    // 默认背景墙
    BACKIMG: 'https://7169-qiucheng-afgeg-1302850511.tcb.qcloud.la/img/system/background_default.png?sign=cd5557c47c6d464ccc2c0a6245361dc8&t=1599882622',
    // 云环境
    _ENV: 'qiucheng-afgeg', // 'qiucheng-js-213aw',
    // 发布菜单配置
    PUBLISHMENU: [
        {icon: 'sponsorfill', color: 'olive', title: '赞助', url: '/pages/publish/sponsor/index', id: 0 },
        {icon: 'formfill', color: 'yellow', title: '账单', url: '/pages/publish/bill/index', id: 1 },
        {icon: 'attentionfavorfill', color: 'red', title: '体检', url: '/pages/publish/physical_examination/index', id: 2 },
        {icon: 'tagfill', color: 'cyan', title: '事项', url: '/pages/publish/matter/index', id: 3 },
        {icon: 'writefill', color: 'orange', title: '采购', url: '/pages/publish/purchase/index', id: 4 },
        {icon: 'timefill', color: 'blue', title: '定时任务', url: '/pages/publish/timer_task/index', id: 4 }
        // {icon: 'emojifill', color: 'blue', title: '出游', url: '', id: 5 }, // 属于事项
        // {icon: 'communityfill', color: 'pink', title: '会议', url: '', id: 6 }, // 属于事项
        // {icon: 'shopfill', color: 'brown', title: '聚餐', url: '', id: 7 } // 属于事项
    ],
    // 收款方式
    GATHERINGTYPE: ['微信', '支付宝', '银行卡'],
    GATHERINGTYPEObj: {'0': '微信', '1': '支付宝', '2': '银行卡'},
    // 管理菜单
    MANAGEMENU: [
        {icon: 'peoplefill', color: 'olive', title: '家庭成员', url: '/pages/manage/member/index', id: 0 },
        // {icon: 'moneybagfill', color: 'yellow', title: '生意', url: '', id: 1 },
        {icon: 'goodsnewfill', color: 'red', title: '房屋租赁', url: '/pages/manage/rent/home/index', id: 2 }
    ],
    // 体检结果
    TJRESULT: ['体检正常', '休息调养', '定期检查', '住院观察'],
    // 事项类型
    SXTYPE: ['体检', '旅游', '商讨', '聚餐', '看病', '出钱', '出力', '采购', '做客'],
    // 事项等级
    MATTERGRADE: ['紧急', '一般', '常规'],
    // 采购类型
    PURCHASETYPE: ['生意生存', '家用电器', '图书教育', '婴儿用品', '老人用品', '营养食品', '生鲜蔬菜', '办公设备', '维修材料', '移动设备', '交通出行', '服装鞋子', '饮料酒水'],
    // 店铺类型
    SHOPTYPE: ['网店', '门店', '自家店铺', '其他'],
    // 首页的tab
    HOMETAB: [
        { icon: 'tagfill', title: '事项', id: 0, isCheck: true },
        { icon: 'attentionfavorfill', title: '体检', id: 1, isCheck: false },
        { icon: 'writefill', title: '采购', id: 2, isCheck: false }
    ],
    // 无数据
    NODATA: '无数据，去添加一条数据吧 ^_^',
    // 首页左滑菜单
    HOMELEFTMOVE: [
        { title: '置顶', key: '0', color: 'green' },
        { title: '办结', key: '1', color: 'blue' },
        { title: '定时', key: '2', color: 'pink' }
    ],
    // 首页-事项状态栏
    HOMESTATUS: [
        { title: '紧急', type: '0', color: 'red' },
        { title: '一般', type: '1', color: 'cyan' },
        { title: '常规', type: '2', color: 'green' },
        // { title: '置顶', type: '3', color: 'yellow' },
        { title: '定时', type: '4', color: 'orange' },
        { title: '办结', type: '5', color: 'gray'},
        { title: '全部', type: '8', color: 'yellow'}
    ],
    // 首页-体检状态栏
    HOMETIJIAN: [
        { title: '费用升序', type: '6', color: 'green' },
        { title: '费用降序', type: '7', color: 'pink' },
        { title: '办结', type: '5', color: 'gray'},
        { title: '全部', type: '8', color: 'yellow'}
    ],
    // 帮衬页面
    HELPHOMEPAGE: [
        { icon: 'appreciatefill', title: '赞助家人', id: 0, isCheck: true },
        { icon: 'group_fill', title: '帮衬家人', id: 1, isCheck: false }
    ],
    // 周期
    CYCLELIST:  [
        { label: '截止时间触发', value: 0, unit: 'h' },
        { label: '30分钟', value: 0.5, unit: 'h' },
        { label: '1小时', value: 0.5, unit: 'h' }
    ],
    RENTLIST: [
        { icon: 'group_fill', title: '租客签约信息', id: 0, isCheck: true },
        { icon: 'moneybagfill', title: '房租收取管理', id: 1, isCheck: false },
        { icon: 'noticefill', title: '即将到期房客', id: 2, isCheck: false },
        { icon: 'homefill', title: '房间管理', id: 3, isCheck: false }
    ],
    // 收租周期
    RENTCYCLE: [
        { label: '1月', value: 0 },
        { label: '3月', value: 1 },
        { label: '半年', value: 2 },
        { label: '一年', value: 3 }
    ]
}