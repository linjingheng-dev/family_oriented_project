部署教程
---
### 一、基础准备
[申请账号](https://developers.weixin.qq.com/miniprogram/dev/framework/quickstart/getstart.html#%E7%94%B3%E8%AF%B7%E5%B8%90%E5%8F%B7) -> [安装开发者工具](https://developers.weixin.qq.com/miniprogram/dev/framework/quickstart/getstart.html#%E5%AE%89%E8%A3%85%E5%BC%80%E5%8F%91%E5%B7%A5%E5%85%B7) -> [安装 vscode](https://code.visualstudio.com/) -> [安装 git](https://git-scm.com/) -> [安装 node](https://nodejs.org/en/)

### 二、本地运行项目

1.新增一个文件夹，运行git，输入：
```javascript
git clone https://github.com/lidegejing/family_oriented_project.git
```
2.进入云函数文件夹，在文件夹所在目录下执行：
```javascript
/* cloud/export */
/* cloud/getopenid */
/* cloud/help */
/* cloud/timer */
npm i
```
3.修改项目APPID、环境变量  
```javascript
/* APPID修改 */

// project.config.json
appid: '###'

/* 环境变量修改 */
/* cloud/export/index.js */
/* cloud/getopenid/index.js */
/* cloud/help/index.js */
/* cloud/timer/index.js */
cloud.init({
    env: '###'
})
/* config/conf.js */
_ENV: '###'

// [注]可以使用作者提供的环境变量命名：qiucheng-afgeg
```
4.打开微信开发者工具，填写APPID后导入项目

### 二、云数据库搭建
[注]：可参考[微信官方提供的文档](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/basis/getting-started.html)操作  
在微信开发者工具上，点击云开发，选择云数据库，添加集合：  
|集合名称|说明
|:------|:------
|background_img|[我的]背景墙设置
|bill_deatil|发布-账单-项目
|bill_member|发布-账单-成员
|bill_write|账单明细
|family_info|家庭信息
|inviation_user|受邀人员
|invitation_code|邀请码
|manage_member|管理-家庭成员
|publish_matter|事项
|publish_purchase|采购
|publish_sponsor|赞助
|publish_tijian|体检
|rent_detail|管理-租赁管理-新增租客
|rent_get_money|管理-租赁管理-房租收取
|renting_room|管理-租赁管理-出租房间
|set_expire|管理-租赁管理-收租到期前几天
|subscribe_template|定时任务-模板消息关联事项
|timer_matter|定时任务
|timer_matter_id_map|定时任务与事项表映射关系
