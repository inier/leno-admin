import { DataTypes } from 'sequelize'
import seq from '@/db/seq.db'

// 创建数据库模型
const Role = seq.define(
  'sys_role',
  {
    role_id: {
      type: DataTypes.BIGINT,
      allowNull: false, // 是否允许空
      unique: true, // 是否为独一无二的
      autoIncrement: true, // id 自动增加
      primaryKey: true, // 是否设置为主键
      comment: '角色ID'
    },
    role_name: {
      type: DataTypes.CHAR(255),
      defaultValue: null,
      comment: '角色名称'
    },
    role_key: {
      type: DataTypes.CHAR(255),
      defaultValue: null,
      comment: '角色权限字符串'
    },
    role_sort: {
      type: DataTypes.BIGINT,
      defaultValue: 0,
      comment: '显示顺序'
    },
    data_scope: {
      type: DataTypes.CHAR(255),
      defaultValue: 1,
      comment:
        '数据范围（1：全部数据权限 2：自定数据权限 3：本部门数据权限 4：本部门及以下数据权限）'
    },
    menu_check_strictly: {
      type: DataTypes.BIGINT,
      defaultValue: 1,
      comment: '菜单树选择项是否关联显示'
    },
    dept_check_strictly: {
      type: DataTypes.BIGINT,
      defaultValue: 1,
      comment: '部门树选择项是否关联显示'
    },
    status: {
      type: DataTypes.CHAR(1),
      defaultValue: '0',
      comment: '部门状态（0正常 1停用）'
    },
    del_flag: {
      type: DataTypes.CHAR(1),
      defaultValue: 0,
      comment: '删除标志（0代表存在 1代表删除）'
    },
    create_by: {
      type: DataTypes.CHAR(64),
      defaultValue: null,
      comment: '创建者'
    },
    update_by: {
      type: DataTypes.CHAR(64),
      defaultValue: null,
      comment: '更新者'
    },
    remark: {
      type: DataTypes.CHAR(255),
      comment: '备注'
    }
  },
  {
    tableName: 'sys_role', // 强制创建表名
    freezeTableName: true // 告诉sequelize不需要自动将表名变成复数
  }
)

// 在数据库创建 数据表
// force: true 如果存在相同名字的表，删除旧的表，新建新的表
Role.sync()

export default Role
