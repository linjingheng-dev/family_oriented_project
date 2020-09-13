
const cloud = require('wx-server-sdk')
const TcbRouter = require('tcb-router')
const xlsxStyle = require('xlsx-style')
const _ = require('lodash')

cloud.init({
    env: 'qiucheng-afgeg'
})

function successRes(ctx, data) {
	ctx.body = {
		code: 0,
		data: data,
		msg: 'success'
	}
}

function errorRes(ctx, err) {
	ctx.body = {
		code: -1,
		data: null,
		msg: err
	}
}

// 时间戳转换
function timestampChangeFn(timestamp, isSubtract = false) {
	const date = new Date(timestamp)
	const m = date.getMonth() + 1
	const d = isSubtract ? (date.getDate() - 1) : date.getDate()
	const year = date.getFullYear()
	const month = m < 10 ? `0${m}` : m
	const day = d < 10 ? `0${d}` : d
	console.log('时间戳>>>>', timestamp, isSubtract, d)
	return `${year}-${month}-${day}`
}

/**
 *  ==================
 *  导出基础配置函数  Start
 *  ==================
 */

/**
 * @description
 * @author 林景恒
 * @date 2020-08-29
 * @param {boolean} [isBold=true] true -字体加粗、 false -字体不加粗
 * @param {boolean} [isFill=true] true -单元格背景填充、 false -单元格背景不填充
 * @param {string} [color='000000'] 表格标题字体颜色
 * @param {string} [bgColor='b4b1b1'] 标题填充色
 * @returns {object}
 */
function cellStyleFn(isBold = true, isFill = true, color = 'ffffff', bgColor = '07c160') {
	const obj = {
		font: {
			sz: 10,
			color: {
				rgb: isBold ? color : '000000'
			},
			bold: isBold
		},
		alignment: {
			vertical: 'center',
			horizontal: 'center',
			wrapText: true
		},
		border: {
			top: {
				style: 'thin',
				color: {
					rgb: '000000'
				}
			},
			bottom: {
				style: 'thin',
				color: {
					rgb: '000000'
				}
			},
			left: {
				style: 'thin',
				color: {
					rgb: '000000'
				}
			},
			right: {
				style: 'thin',
				color: {
					rgb: '000000'
				}
			}
		}
	}
	if (isFill) {
		obj['fill'] = {
			fgColor: {
				rgb: bgColor
			}
		}
	}
	return obj
}

/**
 * @description 合并单元格
 * @author 林景恒
 * @date 2020-08-29
 * @param {number} [sColumn=0] 开始列
 * @param {number} [sRow=0] 开始行
 * @param {number} [eColumn=0] 结束列
 * @param {number} [eRow=0] 结束行
 * @returns {object}
 */
function mergeCellFn(sColumn = 0, sRow = 0, eColumn = 0, eRow = 0) {
	return {
		s: { // 开始
			c: sColumn,
			r: sRow,
		},
		e: { // 结束
			c: eColumn,
			r: eRow,
		}
	}
}

/**
 * @description 单元格宽度
 * @author 林景恒
 * @date 2020-08-29
 * @param {string} [tableName='jsf'] 表格名
 * @returns {arrary}
 */
function cellWidthConfFn(tableName = 'en_clearfee') {
	if (tableName === 'en_clearfee') {
		return [140, 80, 85, 80, 85, 130, 90, 80]
	}
}

/**
 * @description 单元格宽度
 * @author 林景恒
 * @date 2020-08-29
 * @param {number} [width=180] 单元格宽度
 * @returns {object}
 */
function cellWidthFn(width = 180) {
	return {
		wpx: width
	}
}

/**
 * @description 创建EXCEL -只有一个 sheet
 * @author 林景恒
 * @date 2020-08-29
 * @param {*} headers 表格头
 * @param {*} data 表格体
 * @returns {Buffer}
 */
function createExcel(headers, data, num = 1) {
	var output = Object.assign({}, headers, data)
	var outputPos = Object.keys(output)
	var ref = outputPos[0] + ':' + outputPos[outputPos.length - num]
	var wb = {
		SheetNames: ['账单统计'],
		Sheets: {
			'账单统计': Object.assign({}, output, {
				'!ref': ref
			})
		}
	}
	var buf = xlsxStyle.write(wb, {
		type: 'buffer',
		bookType: "xlsx"
	})
	return buf
}

/**
 * @description 创建表格-多个sheet
 * @author 林景恒
 * @date 2020-08-29
 * @param {*} headers 表头
 * @param {*} data 表格数据
 * @param {number} [num=1]
 * @returns  { Buffer }
 */
function createExcelMoreSheet(headers, data) {
	var wb = {
		SheetNames: [],
		Sheets: {}
	}
	_.forEach(data, item => {
		var output = Object.assign({}, headers, item['data'])
		var outputPos = Object.keys(output)
		var ref = outputPos[0] + ':' + outputPos[outputPos.length - item['num']]
		wb['SheetNames'].push(item['sheetName'])
		wb['Sheets'][item['sheetName']] = Object.assign({}, output, { '!ref': ref })
	})
	var buf = xlsxStyle.write(wb, {
		type: 'buffer',
		bookType: "xlsx"
	})
	return buf
}


/**
 *  ==================
 *  导出基础配置函数  End
 *  ==================
 * */

async function exportExcelFn(ctx, next) {
	try {
		const DB = cloud.database()
		const bodyData = ctx['_req']['event']
		let collection = DB.collection(bodyData['connectionName'])
		const _ = DB.command
		let searchData = bodyData['data']
		// 排序功能
		if (bodyData['isSort'] && bodyData['sortList'].length) {
			bodyData['sortList'].forEach(i => {
				collection = collection.orderBy(i['filed'], i['sortDesc'])
			})
		}
		// 按照日期查询
		if (bodyData['dateQj']) {
			const obj = {}
			if (searchData) {
				searchData[bodyData['dateQj']['file']] = _.and(_.gte(bodyData['dateQj']['startDate']), _.lte(bodyData['dateQj']['endDate']))
			} else {
				obj[bodyData['dateQj']['file']] = _.and(_.gte(bodyData['dateQj']['startDate']), _.lte(bodyData['dateQj']['endDate']))
				searchData = obj
			}
		}
		const result = bodyData['flag'] === 0 ? await collection.where(searchData).get() : await collection.get()

		if (result && result['errMsg'] === 'collection.get:ok') {
			let fileData = null
			if (bodyData['exportFlag'] === 'bcjr') {
				const userObj = await getCqrListFn()
				if (userObj['code'] !== 0) {
					throw (userObj['msg'])
				}
				const returnData = dataHFn(result['data'], userObj['data'], bodyData['dateQj'])
				if (returnData['code'] !== 0) {
					throw (userObj['msg'])
				}
				fileData = await returnData['data']
			}
			successRes(ctx, fileData || [])
		} else {
			errorRes(ctx, '查询失败，稍后重试，可以给开发者留言，^_^')
		}
	} catch (err) {
		console.log('查询报错', err)
		errorRes(ctx, err || '查询失败，稍后重试，可以给开发者留言，^_^')
	}
}

/**
 * 帮衬-帮衬家人-导出
 */

// 获取出钱人的人员信息
async function getCqrListFn() {
	try {
		const DB = cloud.database()
		const collection = DB.collection('bill_member')
		const result = await collection.get()
		let data = {}
		if (result && result['errMsg'] === 'collection.get:ok') {
			result['data'].forEach(i => {
				data[i['_id']] = i['xm']
			})
		}
		return {
			code: 0,
			data: data
		}
	} catch (err) {
		return {
			code: -1,
			msg: '获取出钱人信息失败！'
		}
	}
}

// 数据处理
function dataHFn(resData, userObj, dateObj) {
	try {
		if (!userObj || JSON.stringify(userObj) === '{}') {
			throw ('请先添加成员信息')
		}
		// 获取出钱人相关信息
		const data = resData.filter(i => userObj[i['nameID']])
		const buf = tableDataFn(data, dateObj)
		if (!buf) {
			throw ('生成EXCEL文件失败')
		}
		return {
			code: 0,
			data: cloud.uploadFile({
				cloudPath: 'file/bill/账单汇总.xlsx',
				fileContent: buf
			})
		}
	} catch (err) {
		console.log('导出数据失败>>>', err)
		return {
			code: -1,
			msg: '导出数据失败'
		}
	}
}

function tableHeadDataFn(tableName = 'bcTable') {
	if (tableName === 'bcTable') {
		return [{
			col: "A",
			fieldName: "日期",
			fieldid: "selectDate"
		},
		{
			col: "B",
			fieldName: "理由",
			fieldid: "xmName"
		},
		{
			col: "C",
			fieldName: "出钱人",
			fieldid: "nameName"
		},
		{
			col: "D",
			fieldName: "金额",
			fieldid: "zcje"
		},
		{
			col: "E",
			fieldName: "支出方式",
			fieldid: "zcName"
		},
		{
			col: "F",
			fieldName: "银行卡号",
			fieldid: "bankCard"
		}]
	} else if (tableName === 'total') {
		return [{
			col: "A",
			fieldName: "姓名",
			fieldid: "userName"
		}, {
			col: "B",
			fieldName: "金额",
			fieldid: "money"
		}]
	}
}

function tableDataFn(data, dateObj) {
	const excelData = {
		data: {}
	}
	const ExportHeader = {
		roadShowField: tableHeadDataFn('bcTable')
	}
	// 按照供应商分类
	const groupBySelectDate = _.groupBy(data, item => item['selectDate'])
	let groupList = []
	_.forEach(groupBySelectDate, (item, key) => {
		groupList.push({
			key: key,
			order: key ? key.replace(/-/g, '') : '0',
			data: item
		})
	})
	groupList = _.sortBy(groupList, i => -i['order'])
	if (groupList && groupList.length) {
		let key = 1,
			s = 0,
			e = 0
		const dataList = []
		_.forEach(groupList, (item, i) => {
			const reports = item['data']
			if (reports && reports.length > 0) {
				const copyData = _.cloneDeep(reports)
				let zcje = 0
				_.forEach(copyData, k => {
					zcje += k['zcje'] ? Number(k['zcje']) : 0
				})
				// 表头
				const obj = {
					"selectDate": reports[0]['selectDate'],
					"xmName": "理由",
					"nameName": "出钱人",
					"zcje": "金额",
					"zcName": "支出方式",
					"bankCard": "银行卡号"
				}
				// 汇总数据
				const huiZObj = {
					"selectDate": reports[0]['vc_name'],
					"xmName": "合计",
					"nameName": "合计",
					"zcje": zcje.toFixed(2),
					"zcName": '',
					"bankCard": ''
				}
				reports.unshift(obj)
				reports.push(huiZObj)
				// 表格数据处理
				reports.forEach((d, index) => {
					ExportHeader.roadShowField.forEach(field => {
						excelData.data[field["col"] + key] = {
							v: d[field["fieldid"]],
							s: cellStyleFn(Number(index) === 0 || Number(index) === reports.length - 1 ? true : false, Number(index) === 0 || Number(index) === reports.length - 1 ? true : false)
						}
					})
					key++
				})
				// 合并单元格
				if (!excelData.data['!merges']) {
					excelData.data['!merges'] = [mergeCellFn(0, s, 0, reports.length - 1), mergeCellFn(1, reports.length - 1, 2,
						reports.length - 1)]
					e = reports.length - 1
				} else {
					s = e + 1
					e = s + reports.length - 1
					excelData.data['!merges'] = [...excelData.data['!merges'], mergeCellFn(0, s, 0, e), mergeCellFn(1, e, 2, e)]
				}
				// 单元格宽度配置
				const widthList = cellWidthConfFn('en_clearfee')
				_.forEach(widthList, d => {
					if (!excelData.data['!cols']) {
						excelData.data['!cols'] = [cellWidthFn(d)]
					} else {
						excelData.data['!cols'] = [...excelData.data['!cols'], cellWidthFn(d)]
					}
				})
			}
		})
		// return createExcel({}, excelData.data, groupList.length === 1 ? 3 : 1)
		dataList.push({
			sheetName: `${timestampChangeFn(dateObj['startDate'])}至${timestampChangeFn(dateObj['endDate'], true)}账单汇总`,
			data: excelData.data,
			num: groupList.length === 1 ? 3 : 1
		})
		return totalHuizFn(data, dataList, dateObj)
	}
}

function totalHuizFn(data, dataList, dateObj) {
	const excelData = {
		data: {}
	}
	const ExportHeader = {
		roadShowField: tableHeadDataFn('total')
	}
	const groupByName = _.groupBy(data, item => item['nameName'])
	const groupList = []
	_.forEach(groupByName, (item, key) => {
		groupList.push({
			key: key,
			data: item
		})
	})
	if (groupList && groupList.length) {
		let key = 1
		const totalList = []
		_.forEach(groupList, (item, i) => {
			const reports = item['data']
			let totalNum = 0
			_.forEach(reports, j => {
				totalNum = totalNum + (j['zcje'] ? Number(j['zcje']) : 0)
			})
			totalList.push({
				userName: item['key'],
				money: totalNum ? totalNum.toFixed(2) : ''
			})
		})
		if (totalList && totalList.length > 0) {
			let heji = 0
			_.forEach(totalList, i => {
				heji = heji + (i['money'] ? Number(i['money']) : 0)
			})
			const obj = {
				"userName": '姓名',
				"money": "金额"
			}
			// 汇总数据
			const huiZObj = {
				"userName": '合计',
				"money": heji.toFixed(2)
			}
			totalList.unshift(obj)
			totalList.push(huiZObj)
			totalList.forEach((d, index) => {
				ExportHeader.roadShowField.forEach(field => {
					excelData.data[field["col"] + key] = {
						v: d[field["fieldid"]],
						s: cellStyleFn(Number(index) === 0 || Number(index) === totalList.length - 1 ? true : false, Number(index) === 0 || Number(index) === totalList.length - 1 ? true : false)
					}
				})
				key++
			})
			dataList.push({
				sheetName: `${timestampChangeFn(dateObj['startDate'])}至${timestampChangeFn(dateObj['endDate'], true)}成员汇总数据`,
				data: excelData.data,
				num: groupList.length === 1 ? 3 : 1
			})
			console.log('导出数据>>>', excelData.data)
			return createExcelMoreSheet({}, dataList)
		}
	}
}

// 云函数入口函数
exports.main = async (event, context) => {
	// 初始化路由
	const app = new TcbRouter({
		event
	})
	// 该中间件会适用于所有的路由
	app.use(async (ctx, next) => {
		console.log('进入全局路由>>>>')
		ctx.data = {}
		await next()
		console.log('退出全局路由>>>>')
	})
	app.router('export', exportExcelFn)
	return app.serve()
}