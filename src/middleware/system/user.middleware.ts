import { Context } from 'koa'
import {
  getUserListSer,
  getdeptTreeSer,
  getPostSer,
  getRoleSer,
  addUserRoleSer,
  addUserPostSer,
  addUserSer,
  getUserPostSer,
  getUserRoleSer,
  putUserSer,
  delUserRole,
  delUserPost
} from '@/service/system/user.service'
import { userListType, deptType, userType, IUserDetail } from '@/types'
import {
  userIdJudge,
  addUserJudg,
  checkPwdJudg,
  putUserJudg
} from '@/schema/system/sys.user.schema'
import { updatePassword, getAllUserInfoSer } from '@/service/user.service'
import errors from '@/constants/err.type'
import { formatHumpLineTransfer } from '@/utils'
const {
  checkUserIdErr,
  getDeptTreeErr,
  addUserErr,
  getPostRoleErr,
  checkPwdErr,
  sqlErr,
  putUserErr
} = errors

// 生成用户列表
const getUserListMid = async (ctx: Context, next: () => Promise<void>) => {
  try {
    const { pageNum, pageSize } = ctx.query as {
      pageNum: string
      pageSize: string
    }

    const res = (await getUserListSer(pageNum, pageSize)) as userListType

    ctx.state.formatData = res
    await next()
  } catch (error) {
    console.error('查询部门角色失败', error)
    return ctx.app.emit('error', getPostRoleErr, ctx)
  }
}

// 判断用户名id是否正确
const userIdSchema = async (ctx: Context, next: () => Promise<void>) => {
  try {
    const list = ctx.request.path.split('/')
    const userId = list[list.length - 1]
    await userIdJudge.validateAsync({ userId })
    ctx.state.userId = userId
  } catch (error) {
    console.error('用户名id格式错误!', ctx.request['body'])
    return ctx.app.emit('error', checkUserIdErr, ctx)
  }
  await next()
}

// 查询部门下拉树结构
const deptTreeMid = async (ctx: Context, next: () => Promise<void>) => {
  try {
    const res = (await getdeptTreeSer()) as unknown as deptType[]
    console.log(58, res)

    // 将部门进行树状结构数据
    const deptTree = []

    for (let i = 0; i < res.length; i++) {
      if (res[i].parent_id === 0) {
        const newObj = {
          key: res[i].dept_id,
          title: res[i].dept_name
        }
        // 此步骤减少递归次数，增加性能
        res.splice(i, 1)
        i ? (i = 0) : i--
        // 递归查找子集结构
        checkChild(newObj, newObj.key)
        function checkChild(obj, parent_id) {
          // 判断 子 父 结构的 parent_id 是否相等
          for (let j = 0; j < res.length; j++) {
            if (res[j].parent_id === parent_id) {
              const newObj = {
                key: res[j].dept_id,
                title: res[j].dept_name
              }
              if (!(obj.children instanceof Array)) obj.children = []
              obj.children.push(newObj)
              res.splice(j, 1)
              j ? (j = 0) : j--
              checkChild(newObj, newObj.key)
            }
          }
        }
        deptTree.push(newObj)
      }
    }

    ctx.state.formatData = deptTree
  } catch (error) {
    console.error('查询部门失败!', ctx.request['body'])
    return ctx.app.emit('error', getDeptTreeErr, ctx)
  }
  await next()
}
// 岗位及角色数据获取
const getPostRoleMid = async (ctx: Context, next: () => Promise<void>) => {
  try {
    const postRes = await getPostSer()
    const roleRes = await getRoleSer()
    ctx.state.formatData = {
      posts: postRes,
      roles: roleRes
    }
    await next()
  } catch (error) {
    console.error('获取部门和角色信息失败', error)
    return ctx.app.emit('error', addUserErr, ctx)
  }
}

// 检查新增用户上传参数
const addUserSchema = async (ctx: Context, next: () => Promise<void>) => {
  try {
    const userList = ctx.request['body'] as userType
    await addUserJudg.validateAsync(userList)
  } catch (error) {
    console.error('新增用户上传参数出错', error)
    return ctx.app.emit('error', addUserErr, ctx)
  }
  await next()
}

// 检查新增用户上传参数
const putUserSchema = async (ctx: Context, next: () => Promise<void>) => {
  try {
    const userList = ctx.request['body'] as userType
    await putUserJudg.validateAsync(userList)
  } catch (error) {
    console.error('修改用户上传参数出错', error)
    return ctx.app.emit('error', putUserErr, ctx)
  }
  await next()
}

// 新增用户
const getAddUserMid = async (ctx: Context, next: () => Promise<void>) => {
  try {
    const { postIds, roleIds, ...user } = ctx.request['body'] as userType
    const newUser = formatHumpLineTransfer(user, 'line')
    const { user_id } = await addUserSer(newUser)
    // //绑定角色岗位关系
    if (roleIds?.length > 0) {
      const createRole = []

      roleIds?.forEach((item) => {
        createRole.push({
          user_id: user_id,
          role_id: item
        })
      })
      await addUserRoleSer(createRole)
    }
    if (postIds?.length > 0) {
      const createPost = []
      postIds?.forEach((item) => {
        createPost.push({
          user_id: user_id,
          post_id: item
        })
      })
      await addUserPostSer(createPost)
    }
    await next()
  } catch (error) {
    console.error('新增用户失败', error)
    return ctx.app.emit('error', addUserErr, ctx)
  }
}

// 修改密码
const updatePwdMid = async (ctx: Context, next: () => Promise<void>) => {
  const { password, userId } = ctx.request['body']
  try {
    await checkPwdJudg.validateAsync({ password })
  } catch (error) {
    console.error('密码参数错误', error)
    return ctx.app.emit('error', checkPwdErr, ctx)
  }

  try {
    await updatePassword({ newPwd: password, userId })
  } catch (error) {
    console.error('服务器错误', error)
    return ctx.app.emit('error', sqlErr, ctx)
  }

  await next()
}

// 获取用户个人详细数据
const userInfoMid = async (ctx: Context, next: () => Promise<void>) => {
  const path = ctx.request.path
  const userId = path.split('/')[path.split('/').length - 1]
  let finRes = {} as IUserDetail

  try {
    await userIdJudge.validateAsync({ userId })
  } catch (error) {
    console.error('用户上传id错误', error)
    return ctx.app.emit('error', checkUserIdErr, ctx)
  }

  try {
    const { password, ...res } = await getAllUserInfoSer({ userId })
    finRes = { ...res }
  } catch (error) {
    console.error('用户个人信息查询错误', error)
    return ctx.app.emit('error', sqlErr, ctx)
  }

  try {
    const res = await getUserPostSer(userId)
    const postIds = [],
      roleIds = []
    res.forEach((item) => postIds.push(item.dataValues.post_id))
    finRes.postIds = postIds
    const res2 = await getPostSer()
    finRes.posts = res2 as any
    const roleRes = await getUserRoleSer(userId)
    roleRes.forEach((item) => roleIds.push(item.dataValues.role_id))
    finRes.roleIds = roleIds as number[]
    const roleRes2 = await getRoleSer()
    finRes.roles = roleRes2 as any
  } catch (error) {
    console.error('查询用户岗位与角色信息错误', error)
    return ctx.app.emit('error', sqlErr, ctx)
  }

  ctx.state.formatData = finRes
  await next()
}

// 修改用户
const putUserMid = async (ctx: Context, next: () => Promise<void>) => {
  try {
    const { postIds, roleIds, ...user } = ctx.request['body'] as userType
    await putUserSer(user)
    // 重新绑定 用户与岗位&角色关系
    if (roleIds?.length > 0) {
      await delUserRole(user.userId)
      const createRole = []
      roleIds?.forEach((item) => {
        createRole.push({
          user_id: user.userId,
          role_id: item
        })
      })
      await addUserRoleSer(createRole)
    }
    if (postIds?.length > 0) {
      await delUserPost(user.userId)
      const createPost = []
      postIds?.forEach((item) => {
        createPost.push({
          user_id: user.userId,
          post_id: item
        })
      })
      await addUserPostSer(createPost)
    }

    await next()
  } catch (error) {
    console.error('修改用户失败', error)
    return ctx.app.emit('error', putUserErr, ctx)
  }
}

export {
  getUserListMid,
  userIdSchema,
  deptTreeMid,
  getAddUserMid,
  getPostRoleMid,
  addUserSchema,
  updatePwdMid,
  userInfoMid,
  putUserSchema,
  putUserMid
}
