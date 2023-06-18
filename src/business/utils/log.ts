import { Context } from 'koa'
import axios from 'axios'
import { ImachineType } from '@/types/system/logininfor'
import { addSer } from '../service'
import SysLogininfor from '@/mysql/model/system/logininfor.model'
import { queryMenuMes } from './redis'
import { queryKeyValue } from './auth'
import { IuserTokenType } from '@/types/auth'
import SysOperLog from '@/mysql/model/system/operlog.model'
import { menusType } from '@/types/system/system_menu'

/**
 * 写入日志
 * @param type 登录状态 0 成功 1 失败
 * @param ctx koa请求信息
 * @param data 其他信息
 */
export const writeLog = async (
  type: string,
  ctx: Context,
  data?: { code: string | number; message: string }
) => {
  const user = ctx.state.user as IuserTokenType

  // 写入登录日志
  if (ctx.request.url.split('/').includes('login')) {
    const machine = await queryUserMachine(ctx)
    const loginLog = {
      user_name: type === '0' ? user.userName : ctx.request['body'].userName,
      ipaddr: machine.ip,
      login_location: machine.address,
      browser: machine.browser,
      os: machine.os,
      status: type,
      msg: type === '0' ? '登录成功' : data.message,
      login_time: new Date()
    }
    await addSer(SysLogininfor, loginLog)
  }

  // 写入操作日志
  if (!ctx.request.url.split('/').includes('login') && ctx.request.method !== 'GET') {
    // 1 查询日志所属的 系统模块 操作类型
    const menus = await queryMenuMes()
    const { business_type } = filterModule(menus, ctx)
    // 2 查询 用户信息 拿去请求用户 设备信息
    const userMes = await queryKeyValue(user.session)

    const operLog = {
      title: filterCtxUrl(ctx.request.url, ctx.request.method),
      business_type,
      method: '',
      request_method: ctx.request.method,
      operator_type: '',
      oper_name: userMes.userInfo.userName,
      dept_name: userMes.userInfo.dept.deptName,
      oper_url: ctx.request.url,
      oper_ip: userMes.ip,
      oper_location: userMes.address,
      oper_param: JSON.stringify(ctx.request['body']),
      json_result: JSON.stringify(data),
      status: type,
      error_msg: type === '1' ? data.message : '',
      oper_time: new Date()
    }

    await addSer(SysOperLog, operLog)
  }
}

/**
 * 获取路径
 * @param url
 * @param method 请求方法
 */
export const filterCtxUrl = (url: string, method: string) => {
  if (method === 'DELETE') {
    const urlList = url.split('/')
    urlList.splice(url.split('/').length - 1, 1)

    return urlList.join('/')
  }
  return url
}

/**
 * 获取请求的系统模块及操作类型
 * @param menus
 * @param ctx
 * @returns {title:string,business_type:string}
 */
export const filterModule = (
  menus: menusType[],
  ctx: Context
): { title: string; business_type: string } => {
  const urlList = ctx.request.url.split('/')
  let title = '',
    business_type = ''
  for (let i = 0; i < menus.length; i++) {
    let path = menus[i].path
    if (menus[i].path.indexOf('/:') !== -1) {
      path = menus[i].path.split('/:')[0]
    }
    if (urlList.includes(path)) {
      title = menus[i].menuName
      break
    }
  }

  //
  const specialEvents = [
    {
      type: 'authorization',
      value: '4'
    },
    {
      type: 'export',
      value: '5'
    },
    {
      type: 'import',
      value: '6'
    },
    {
      type: 'logout',
      value: '7'
    },
    {
      type: 'generatedCode',
      value: '8'
    },
    {
      type: 'clean',
      value: '9'
    }
  ]

  for (let i = 0; i < specialEvents.length; i++) {
    if (urlList.includes(specialEvents[i].type)) {
      return {
        title,
        business_type: specialEvents[i].value
      }
    }
  }

  switch (ctx.request.method) {
    case 'POST':
      business_type = '1'
      break
    case 'PUT':
      business_type = '2'
      break
    case 'DELETE':
      business_type = '3'
      break

    default:
      break
  }

  return {
    title,
    business_type
  }
}

/**
 *
 * @param ctx koa请求信息
 * @returns {ip,address,browser,os}
 */
export const queryUserMachine = async (ctx: Context): Promise<ImachineType> => {
  // 用户 ip 及 地址
  const ip = ctx.request.header.origin?.split('//')[1].split(':')[0]
  const address = await queryIpAdress(ip)
  // 浏览器
  const browser = ctx.userAgent._agent.browser + ' ' + ctx.userAgent._agent.version.split('.')[0]
  // 操作系统
  const os = ctx.userAgent._agent.os.split('.')[0]

  return {
    ip,
    address,
    browser,
    os
  }
}

/**
 * 用 ip 查询地址
 * @param ip
 */
export const queryIpAdress = async (ip: string) => {
  try {
    const { data } = await axios.get(`http://ip-api.com/json/${ip}?lang=zh-CN`)

    let address = ''
    if (data.status === 'success') {
      address = `${data.regionName} ${data.city}`
    } else {
      address = '内网IP'
    }
    return address
  } catch (error) {
    console.error(' ip 查询地址失败', error)
  }
}
