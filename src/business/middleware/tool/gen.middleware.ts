import { Context } from 'koa'
import { getListSer, addSer, putSer, getDetailSer } from '@/business/service'
import { userType, IdictType } from '@/types'
import errors from '@/app/err.type'
import { formatHumpLineTransfer } from '@/business/utils'
const { uploadParamsErr, getListErr, sqlErr, delErr } = errors
import { Op } from 'sequelize'
import {
  genQueryDbSerType,
  genQuerySerType,
  genQueryType,
  GenSerType,
  GenType
} from '@/types/tools/gen'
import ToolGen from '@/mysql/model/tool/gen.model'
import redis from '@/redis'
import sequelize from '@/mysql/db/seq.db'
import { conversionTables, generateCode } from '@/business/utils/tools'
import ToolGenColumn from '@/mysql/model/tool/gen_column.model'

// 查询数据库所有的表 -》 并将表数据转换为代码生成表的数据
export const findAllSqlMid = async (ctx: Context, next: () => Promise<void>) => {
  try {
    const existNames = await redis.smembers('tool_sql_names')
    // const existNames = []
    // 1、获取数据库里面所有的sql名字
    const tables = await sequelize.getQueryInterface().showAllTables()

    // 1-1、 判断sql表是否已经生成过数据了
    tables.forEach((name, index) => {
      if (existNames.findIndex((value) => value === name) !== -1) {
        tables.splice(index)
      } else {
        // 1-1-1、将tables表名存储到redis做缓存
        tables.forEach((name) => {
          redis.sadd('tool_sql_names', name)
        })
      }
    })

    if (tables.length > 0) conversionTables(tables)
  } catch (error) {
    console.error('查询数据库所有的表', error)
    return ctx.app.emit('error', sqlErr, ctx)
  }

  await next()
}

// 获取db列表
export const getListDbMid = async (ctx: Context, next: () => Promise<void>) => {
  try {
    const { pageNum, pageSize, ...params } = ctx.query as unknown as genQueryType
    let newParams = { pageNum, pageSize, is_import: '1' } as genQueryDbSerType

    params.tableName ? (newParams.table_name = params.tableName) : null
    params.tableComment ? (newParams.table_comment = params.tableComment) : null

    const res = await getListSer<genQueryDbSerType>(ToolGen, newParams)

    ctx.state.formatData = res
    await next()
  } catch (error) {
    console.error('查询代码生成列表失败', error)
    return ctx.app.emit('error', getListErr, ctx)
  }
}

// 导入表
export const importTableMid = async (ctx: Context, next: () => Promise<void>) => {
  const list = ctx.request.path.split('/')
  const tableList = list[list.length - 1]
  const tables = tableList.split(',')
  const { userName } = ctx.state.user as userType

  await putSer(ToolGen, { table_name: tables }, { is_import: '0', update_by: userName })

  await next()
}

// 获取列表
export const getListMid = async (ctx: Context, next: () => Promise<void>) => {
  try {
    const { pageNum, pageSize, ...params } = ctx.query as unknown as genQueryType
    let newParams = { pageNum, pageSize, is_import: '0' } as genQuerySerType

    if (params.beginTime) {
      newParams.created_at = {
        [Op.between]: [params.beginTime, params.endTime]
      }
    }
    params.tableName ? (newParams.table_name = params.tableName) : null
    params.tableComment ? (newParams.table_comment = params.tableComment) : null

    const res = await getListSer<genQuerySerType>(ToolGen, newParams)

    ctx.state.formatData = res
    await next()
  } catch (error) {
    console.error('查询代码生成列表失败', error)
    return ctx.app.emit('error', getListErr, ctx)
  }
}

// 获取Sql列表
export const getListSqlMid = async (ctx: Context, next: () => Promise<void>) => {
  try {
    let newParams = { pageNum: 1, pageSize: 1000 } as genQuerySerType

    const res = await getListSer<genQuerySerType>(ToolGen, newParams, {
      include: [
        {
          model: ToolGenColumn,
          as: 'columns'
        }
      ]
    })

    ctx.state.formatData = res
    await next()
  } catch (error) {
    console.error('查询代码生成列表失败', error)
    return ctx.app.emit('error', getListErr, ctx)
  }
}

// 新增
export const getAddMid = async (ctx: Context, next: () => Promise<void>) => {
  try {
    const { userName } = ctx.state.user as userType
    const addContent = ctx.request['body'] as IdictType
    const addContent2 = { ...addContent, createBy: userName }
    const newAddContent = formatHumpLineTransfer(addContent2, 'line')
    await addSer(ToolGen, newAddContent)
    await next()
  } catch (error) {
    console.error('新增失败', error)
    return ctx.app.emit('error', uploadParamsErr, ctx)
  }
}

// 删除
export const delMid = async (ctx: Context, next: () => Promise<void>) => {
  try {
    await putSer(ToolGen, { table_id: ctx.state.ids }, { is_import: '1' })
  } catch (error) {
    console.error('删除失败', error)
    return ctx.app.emit('error', delErr, ctx)
  }

  await next()
}

// 修改用户
export const putMid = async (ctx: Context, next: () => Promise<void>) => {
  try {
    const { userName } = ctx.state.user as userType
    const res = ctx.request['body'] as GenType
    const newRes = formatHumpLineTransfer(res, 'line') as GenSerType

    const { table_id, columns, ...genDate } = newRes

    // 基本信息修改
    await putSer(ToolGen, { table_id }, { ...genDate, update_by: userName })

    // 修改信息
    columns.forEach(async (column) => {
      const { table_id, column_id, created_at, updated_at, create_by, ...data } = column

      await putSer(ToolGenColumn, { column_id }, { ...data, update_by: userName })
    })

    await next()
  } catch (error) {
    console.error('修改失败', error)
    return ctx.app.emit('error', uploadParamsErr, ctx)
  }
}

// 代码预览
export const codePreviewMid = async (ctx: Context, next: () => Promise<void>) => {
  try {
    const id = ctx.state.ids[0]

    // 查找 相关表和表字段的所有数据
    const res = await getDetailSer(
      ToolGen,
      { table_id: id },
      {
        include: [
          {
            model: ToolGenColumn,
            as: 'columns'
          }
        ]
      }
    )
    const newRows = formatHumpLineTransfer(res)
    const code = generateCode(newRows)
    ctx.state.formatData = code

    await next()
  } catch (error) {
    console.error('代码预览查询失败', error)
    return ctx.app.emit('error', sqlErr, ctx)
  }
}
