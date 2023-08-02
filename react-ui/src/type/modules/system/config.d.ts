// 前端 类型文件
// 所有数据通用
export interface IconfigType {
  pageNum?: number
  pageSize?: number
  configId?: number
  configName?: string
  configKey?: string
  configValue?: string
  configType?: string
  createBy?: string
  createdAt?: {
    beginTime: string
    endTime: string
  }
  updateBy?: string
  updatedAt?: string
  remark?: string
}

// 数据列表
export interface IgetListAPI {
  code: number
  message: string
  result: {
    count: number
    rows: IconfigType[]
  }
}

// 获取详细数据
export interface IgetDetailTypeAPI {
  code: number
  message: string
  result: IconfigType
}

// 新增，修改，删除 成功返回
export interface IsuccessTypeAPI {
  code: number
  message: string
  result?: null
}