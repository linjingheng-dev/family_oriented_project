# 顾家-一款将分布在五湖四海的家人联系起来，时时刻刻关注大家庭的动态及对大家庭的管理

[注]：  
1. 该小程序样式风格借鉴了 [ColorUI](https://www.color-ui.com/)
2. 开发者：秋城与星辰大海
3. [查看图片配置](https://zhuanlan.zhihu.com/p/107196957)
4. 如果出现订阅消息失败，可以修改配置文件中的模板ID，并在云函数中修改传参除了
```javascript
/* 修改配置文件 */
// config/conf.js
MATTERTEMPLATE: '###' // 能正常使用的模板

/* 修改云函数中推送消息配置 */
// cloud/timer/index.js
// 方法名
pushMsgToSubscribeUserFn
// 修改方法
data: {
    time6: {
        value: data['taskEDate'] || '--' // 日期
    },
    name1: {
        value: data['lastEditUser'] || '--' // 最后一次编辑人
    },
    thing2: {
        value: data['shortName'] || '--' // 内容
    }
}
// 将 time6、name1、thing2 替换成模板中的变量
```

项目介绍
---
### 一、产生背景  
在外漂泊的家人，或是已在外成家立业的亲人，对家里的老人小孩身体状况，父母的事业、及家里大大小小的生活趣事，多多少少会有些信息上的疏漏。此项目开发的目的就是将家庭的生活趣事收集，公示，同时提供了家里人互帮互助信息留底，大家庭的事业规范化管理。  

### 二、开发工具链  
win10 + git + github + vsCode + 微信小程序开发者工具  
[注]：除了win10之外，还可以是你熟悉的操作系统  

### 三、面向人群  
任何以家庭为单元的个体  

### 四、架构  
<img src="https://7169-qiucheng-afgeg-1302850511.tcb.qcloud.la/img/md/%E6%9E%B6%E6%9E%84%E5%9B%BE1.png?sign=cbec091ed899993e3e0f441e370d7b47&t=1600490058">

### 五、主要流程
用户 -> 创建家庭 -> 分享给其他用户 -> 其他用户加入家庭  
[注]：创建者和加入者均可操作公示数据

### 六、效果图
<img height="380" width="190" src="https://7169-qiucheng-afgeg-1302850511.tcb.qcloud.la/img/md/x3.jpg?sign=56007ecae2ca6b7f4ab80d7d2fa18cdb&t=1600495715"> <img height="380" width="190" src="https://7169-qiucheng-afgeg-1302850511.tcb.qcloud.la/img/md/x2.jpg?sign=feaa78320968999a2f737e529869f9a9&t=1600495383"> <img height="380" width="190" src="https://7169-qiucheng-afgeg-1302850511.tcb.qcloud.la/img/md/x6.jpg?sign=48326ddd8c66a7a282c222148abfd26f&t=1600495417">  
<img height="380" width="190" src="https://7169-qiucheng-afgeg-1302850511.tcb.qcloud.la/img/md/x7.jpg?sign=db47d22f92a38619792d8b947aa29092&t=1600495425"> <img height="380" width="190" src="https://7169-qiucheng-afgeg-1302850511.tcb.qcloud.la/img/md/x8.jpg?sign=fcdd2fc6c86c65933f5dd3d125e09443&t=1600495433"> <img height="380" width="190" src="https://7169-qiucheng-afgeg-1302850511.tcb.qcloud.la/img/md/x11.jpg?sign=ff7a399c33459611c60fae3600e09a2d&t=1600495602">

### 七、文件结构  
```javascript
├─cloud                              // 云函数
│  ├─export                          // 导出
│  ├─getopenid                       // 获取登录人 openID
│  ├─help                            // 云数据库操作相关
│  └─timer                           // 定时触发器
├─colorui                            // 样式基础文件
├─config                             // 配置文件
├─images                             // 图片
├─pages
│  ├─help                            // 帮衬模块
│  ├─home                            // 入口文件
│  ├─housewifery
│  │  ├─index                        // 首页列表
│  │  └─timer                        // 定时任务设置
│  ├─index                           // 暂时不用文件
│  ├─login                           // 最初的授权登录文件
│  ├─logs                            // 日志文件夹
│  ├─manage
│  │  ├─index                        // 管理列表
│  │  ├─member                       // 成员管理模块
│  │  ├─rent
│  │  │  ├─add_edit_detail_renter    // 新增租客
│  │  │  ├─home                      // 房屋租赁模块
│  │  │  ├─rent_money                // 房租收取
│  │  │  └─write_room                // 房间号登记
│  │  └─server                       // 服务
│  ├─my
│  │  ├─about_project                // 关于顾家
│  │  ├─author_about                 // 关于作者
│  │  ├─background                   // 背景墙
│  │  ├─create_family                // 创建家庭
│  │  ├─index                        // 我的模块
│  │  ├─invitation_code              // 邀请码
│  │  └─server                       // 服务
│  └─publish
│      ├─bill                        // 账单报表填写
│      ├─index                       // 发布模块
│      ├─matter                      // 事项报表填写
│      ├─physical_examination        // 体检报表填写
│      ├─purchase                    // 采购报表填写
│      ├─server                      // 服务
│      ├─sponsor                     // 赞助报表填写
│      └─timer_task                  // 定时任务列表
├─styles                             // 公共样式
└─utils                              // 工具
```

部署
---
参考[deployment.md](deployment.md)

开源
---
LICENSE：Apache-2.0 License

联系方式
---
QQ邮箱：1829001401@qq.com  
微信:  
<img width=200 height=200 src="https://7169-qiucheng-afgeg-1302850511.tcb.qcloud.la/img/md/%E8%81%94%E7%B3%BB%E6%96%B9%E5%BC%8F.jpg?sign=1cfb401f9ef701cee1d9132ea1c2d9eb&t=1600502374">