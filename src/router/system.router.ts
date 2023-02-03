import Router from 'koa-router'
import auth from '@/middleware/auth.middleware'
// 格式转换
import { formatHandle } from '@/middleware/formatHandle'
// user
import {
  getUserListCon,
  delUserCon,
  getdeptTreeCon,
  getAddUserCon
} from '@/controller/system/user.controller'
import {
  getUserListMid,
  userIdSchema,
  deptTreeMid,
  getAddUserMid
} from '@/middleware/system/user.middleware'
// menu
import { getRoutersCon } from '@/controller/system/menu.controller'
import { getRouterMid } from '@/middleware/system/menu.middleware'
const router = new Router({ prefix: '/system' })

// #region 用户管理
// 查询列表用户
router.get('/user/list', auth, getUserListMid, formatHandle, getUserListCon)

// 删除用户
router.delete(`/user/:id`, auth, userIdSchema, delUserCon)

// 查询部门下拉树结构
router.get('/dept/treeselect', auth, deptTreeMid, formatHandle, getdeptTreeCon)

// 新增用户
router.get('/user', auth, getAddUserMid, formatHandle, getAddUserCon)
// #endregion

// 新增用户弹窗内岗位及角色数据获取
router.get('/menu/getRouters', auth, getRouterMid, getRoutersCon)

module.exports = router
