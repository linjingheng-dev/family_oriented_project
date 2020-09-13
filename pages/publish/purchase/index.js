const conf = require('./../../../config/conf')
const utils = require('./../../../utils/util')
const moment = require('./../../../utils/moment.min')
const service = require('./../server/index')
const app = getApp()

Page({
	data: {
		isHaveFamily: false,
		userTable: 'manage_member',
		isShow: false,
		loadingText: '上传数据中',
		memberList: [],
		fwdxList: [],
		imgList: [],
		// 表单
		title: null,
		typeIndex: null,
		cgDate: null,
		time: null,
		cgrIndex: null,
		fwdxIndex: null,
		shopTypeIndex: null,
		shopUrl: null,
		money: null,
		detail: null,
		purchaseType: conf.PURCHASETYPE,
		shopTypeList: conf.SHOPTYPE,
		_id: null,
		isEdit: false,
		isDetail: false,
		isComplete: false,
		isTop: false,
		deleteImg: []
	},
	onLoad: function (options) {
		const that = this
		const eventChannel = this.getOpenerEventChannel()
		eventChannel.on('editFn', function (data) {
			that.formInitFn(data)
		})
        this.setData({
            isHaveFamily: utils.getFamily()
        })
        if (!this.data.isHaveFamily) {
            return utils.showToast('none', `您尚未加入家庭！`, 1500)
        }
		this.getUserListFn()
	},
	// 表单初始化
	formInitFn(data) {
		const copyData = JSON.parse(JSON.stringify(data['imgList']))
		this.setData({
			_id: data['_id'],
			isEdit: data['isEdit'],
			isDetail: data['isDetail'],
			title: data['title'],
			typeIndex: data['typeIndex'],
			cgDate: data['cgDate'],
			time: data['time'],
			cgrIndex: data['cgrIndex'],
			fwdxIndex: data['fwdxIndex'],
			shopTypeIndex: data['shopTypeIndex'],
			shopUrl: data['shopUrl'],
			money: data['money'],
			detail: data['detail'],
			imgList: data['imgList'],
            isComplete: data['isComplete'],
            isTop: data['isTop'],
			matterGradeIndex: data['matterGradeIndex'] || null,
		})
	},
	/* 图片相关 */
	// 图片预览
	viewImage(e) {
		wx.previewImage({
			urls: this.data.imgList,
			current: e.currentTarget.dataset.url
		});
	},
	// 删除图片
	delImg(e) {
		let isDelColud = false
		let imgInfo
		if (this.data.imgList && this.data.imgList.length) {
			imgInfo = this.data.imgList[e.currentTarget.dataset.index]
			if (imgInfo.indexOf('cloud://') > -1) {
				isDelColud = true
			}
		}
		wx.showModal({
			title: '提示信息',
			content: isDelColud ? `第 ${e.currentTarget.dataset.index + 1} 张图片删除将会将云端数据删除，是否继续？` : `确定删除第 ${e.currentTarget.dataset.index + 1} 张图片？`,
			cancelText: '取消',
			confirmText: '确定',
			success: res => {
				if (res.confirm) {
					if (isDelColud) {
						this.data.deleteImg.push(imgInfo)
					}
					this.data.imgList.splice(e.currentTarget.dataset.index, 1)
					this.setData({
						imgList: this.data.imgList
					})
				}
			}
		})
	},
	// 选择图片
	chooseImage() {
		wx.chooseImage({
			count: 2,
			sizeType: ['original', 'compressed'],
			sourceType: ['album'],
			success: (res) => {
				if (this.data.imgList.length != 0) {
					this.setData({
						imgList: this.data.imgList.concat(res.tempFilePaths)
					})
				} else {
					this.setData({
						imgList: res.tempFilePaths
					})
				}
			}
		});
	},
	/* 表单相关 */
	selectFn(e) {
		if (e.currentTarget.dataset.type === 'type') {
			this.setData({
				typeIndex: e.detail.value
			})
		} else if (e.currentTarget.dataset.type === 'date') {
			this.setData({
				cgDate: e.detail.value
			})
		} else if (e.currentTarget.dataset.type === 'time') {
			this.setData({
				time: e.detail.value
			})
		} else if (e.currentTarget.dataset.type === 'cgr') {
			this.setData({
				cgrIndex: e.detail.value
			})
		} else if (e.currentTarget.dataset.type === 'fwdx') {
			this.setData({
				fwdxIndex: e.detail.value
			})
		} else if (e.currentTarget.dataset.type === 'shopType') {
			this.setData({
				shopTypeIndex: e.detail.value
			})
		}
	},
	submit(data) {
        if (!this.data.isHaveFamily) {
            return
        }
		const params = {
            familyID: app.globalData.joinFamily['joinFamilyID'], // 家庭ID
            familyName: app.globalData.joinFamily['joinFamilyName'], // 家庭名称
			title: data.detail.value.title, // 标题
			typeIndex: this.data.typeIndex, // 类型 index
			typeName: this.data.typeIndex ? this.data.purchaseType[this.data.typeIndex] : '', // 类型名称
			cgDate: this.data.cgDate, // 日期
			time: this.data.time, // 时间
			cgrIndex: this.data.cgrIndex || '', // 采购人 index
			cgrName: this.data.cgrIndex ? this.data.memberList[this.data.cgrIndex] : '', // 采购人名称
			fwdxIndex: this.data.fwdxIndex || '', // 服务对象 index
			fwdxName: this.data.fwdxIndex ? this.data.fwdxList[this.data.fwdxIndex] : '', // 服务对象名称
			shopTypeIndex: this.data.shopTypeIndex || '', // 店铺类型 index
			shopTypeName: this.data.shopTypeIndex ? this.data.shopTypeList[this.data.shopTypeIndex] : '', // 店铺类型名称
			shopUrl: data.detail.value.shopUrl || '', // 店铺网址
			money: data.detail.value.money || '0.00', // 金额
			detail: data.detail.value.detail || '', // 采购明细
			imgList: this.data.imgList || [], // 采购票据
			openid: app.globalData.openid, // 创建人 ID
			isComplete: this.data.isComplete, // 是否办结
			isTop: this.data.isTop, // 是否置顶
			nickName: app.globalData.userInfo.nickName, // 创建人名称
			createDate: moment().valueOf() // 创建时间戳
		}
		const errorMsg = this.fromVerify(params)
		if (errorMsg) {
			utils.showToast('none', `请填写${errorMsg}`, 3000)
			return
		}
		console.log('采购表单提交参数>>>>', params)
		this.setData({
			isShow: true
		})
		if (params['imgList'].length) {
			this.commitFormFn(params)
		} else {
			params['fileID'] = ''
			this.saveFn(params)
		}
	},
	// 表单提交
	commitFormFn(data) {
		utils.uploadFile(data['imgList'], `img/purchase/${app.globalData.openid}`).then(promiseData => {
			const fileIdList = []
			let errorNum = 0
			promiseData.forEach(item => {
				if (item['code'] === 0) {
					fileIdList.push(item['data'])
				} else {
					errorNum += 1
				}
			})
			if (errorNum === promiseData.length) {
				this.setData({
					isShow: false
				})
				utils.showToast('none', '采购填写失败')
			} else {
				data['fileID'] = fileIdList.join(',')
				this.saveFn(data)
			}
		}).catch(err => {
			console.log('上传图片失败', err)
			utils.showToast('none', '上传图片失败')
			this.setData({
				isShow: false
			})
		})
	},
	saveFn(params) {
		if (this.data.isEdit) {
			service.addEditSearchProject('publish_purchase', params, { _id: this.data['_id'] }, 1).then(values => {
				this.setData({
					isShow: false
				})
				if (values['code'] === 0) {
					utils.showToast('success', '编辑成功')
					if (this.data.deleteImg.length) {
						wx.cloud.deleteFile({
							fileList: this.data.deleteImg
						})
					}
					const eventChannel = this.getOpenerEventChannel()
					const timer = setTimeout(() => {
						wx.navigateBack({
							delta: 1
						});
						eventChannel.emit('refresh', { flag: 2 });
						clearTimeout(timer)
					}, 1500)
				} else {
					utils.showToast('none', values['msg'] || '编辑失败')
					console.log('编辑失败>>>', values['msg'] || '编辑失败')
				}
			}).catch(err => {
				console.log('编辑失败>>>', err)
				utils.showToast('none', '编辑失败')
				this.setData({
					isShow: false
				})
			})
		} else {
			service.addZhanDFn(params, 'publish_purchase').then(values => {
				this.setData({
					isShow: false
				})
				if (values['code'] === 0) {
					utils.showToast('success', '添加成功')
					this.reset()
				} else {
					utils.showToast('none', values['msg'] || '添加失败')
					console.log('添加失败>>>', values['msg'] || '添加失败')
				}
			}).catch(err => {
				console.log('添加失败>>>', err)
				utils.showToast('none', '添加失败')
				this.setData({
					isShow: false
				})
			})
		}
	},
	// 表单校验
	fromVerify(data) {
		const errorMsg = []
		if (!data['title']) {
			errorMsg.push('标题')
		}
		if (!data['typeName']) {
			errorMsg.push('类型')
		}
		if (!data['cgDate']) {
			errorMsg.push('日期')
		}
		if (!data['time']) {
			errorMsg.push('时间')
		}
		if (!data['cgrIndex']) {
			errorMsg.push('采购人')
		}
		return errorMsg.join('、')
	},
	reset() {
		this.setData({
			imgList: [],
			title: null,
			typeIndex: null,
			cgDate: null,
			time: null,
			cgrIndex: null,
			fwdxIndex: null,
			shopTypeIndex: null,
			shopUrl: null,
			money: null,
			detail: null
		})
	},
	/* 请求相关 */
	getUserListFn(value = '') {
        if (!this.data.isHaveFamily) {
            return
        }
		const params = {
			$url: 'publish/getData',
			flag: value ? 0 : 1, // 0 -指定查询、1 -全查
			connectionName: this.data.userTable,
			data: {
				xm: value || '',
				familyID: app.globalData.joinFamily['joinFamilyID']
			}
		}
		console.log('采购查询入参>>>', params)
		this.setData({
			isShow: true,
			loadingText: '加载中'
		})
		utils.cloudFn('help', params).then(values => {
			this.setData({
				isShow: false
			})
			const res = utils.cloudDataH(values, '查询成功', '查询失败')
			if (res['code'] !== 0) {
				utils.showToast('none', res['msg'])
				console.log('查询失败>>>', res['msg'] || '查询失败')
			} else {
				const data = res['data'] || []
				const userList = []
				let fwdxList = [];
				data.forEach(i => {
					userList.push(i['xm'])
					fwdxList.push(i['xm'])
				})
				fwdxList = ['全部家人', '自家亲戚'].concat(fwdxList)
				this.setData({
					memberList: userList,
					fwdxList: fwdxList
				})
			}
		})
	},
})