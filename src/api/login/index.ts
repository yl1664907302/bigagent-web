import request from '@/axios'
import type {
  DelRecevier,
  DelRecevier_response,
  SelectMarkDownByStatus,
  SelectMarkDownByStatus_response,
  SelectReceivers_response,
  StepsFormType,
  StepsFormType_response,
  UserType,
  SelectMarkDownByStatus2Time_response,
  SelectMarkDownByStatus2Time,
  CreateRobot,
  CreateRobot_response,
  SelectRobot,
  SelectRobot_response,
  DelRobot,
  DelRobot_response,
  Updatemarkdowntemplate,
  Updatemarkdowntemplate_response,
  Selectmarkdowntemplate,
  Selectmarkdowntemplate_response,
  UpdateRobot,
  UpdateRobot_response,
} from './types'

interface RoleParams {
  roleName: string
}

export const loginApi = (data: UserType): Promise<IResponse<UserType>> => {
  return request.post({ url: '/v1/login', data,
    headers: {
      'Authorization': "123456"
     } }
  )
}

export const loginOutApi = (): Promise<IResponse> => {
  return request.get({ url: '/mock/user/loginOut' })
}

export const getAdminRoleApi = (
  params: RoleParams
): Promise<IResponse<AppCustomRouteRecordRaw[]>> => {
  return request.get({ url: '/mock/role/list', params })
}

export const getTestRoleApi = (params: RoleParams): Promise<IResponse<string[]>> => {
  return request.get({ url: '/mock/role/list2', params })
}

// 提交分步表单
export const poststepsform = (data: StepsFormType): Promise<IResponse<StepsFormType_response>> => {
  return request.post({ url: '/alertmanger/post/stepform', data })
}

// 获取所有的receiver
export const getreceivers = (): Promise<IResponse<SelectReceivers_response>> => {
  return request.get({ url: '/alertmanger/receivers' })
}

// 获取markdownbystatus
export const getmarkdownbystatus = (
  params: SelectMarkDownByStatus
): Promise<IResponse<SelectMarkDownByStatus_response>> => {
  return request.get({ url: '/alertmanger/markdownbystatus', params })
}

// 删除receiver
export const DelRecevierbyIndex = (
  params: DelRecevier
): Promise<IResponse<DelRecevier_response>> => {
  return request.delete({ url: '/alertmanger/del/index', params })
}

// 模糊查询

export const getmarkdownbystatus2time = (
  params: SelectMarkDownByStatus2Time
): Promise<IResponse<SelectMarkDownByStatus2Time_response>> => {
  return request.get({ url: '/alertmanger/markdownbystatus2mohu', params })
}

//创建机器人
export const postcreaterobot = (data: CreateRobot): Promise<IResponse<CreateRobot_response>> => {
  return request.post({ url: '/alertmanger/post/newrobot', data })
}

// 查询机器人

export const getrobots = (params: SelectRobot): Promise<IResponse<SelectRobot_response>> => {
  return request.get({ url: '/alertmanger/robot', params })
}

// 删除机器人
export const delrobots = (params: DelRobot): Promise<IResponse<DelRobot_response>> => {
  return request.delete({ url: '/alertmanger/delrobot', params })
}

// 更新机器人
export const updaterobots = (data: UpdateRobot): Promise<IResponse<UpdateRobot_response>> => {
  return request.post({ url: '/alertmanger/post/updaterobot', data })
}

// 更新markdown模板

export const updatemarktemplate = (
  data: Updatemarkdowntemplate
): Promise<IResponse<Updatemarkdowntemplate_response>> => {
  return request.post({ url: '/alertmanger/post/updatemarkdowntemplate', data })
}

// 查询模板
export const getmarktemplate = (
  params: Selectmarkdowntemplate
): Promise<IResponse<Selectmarkdowntemplate_response>> => {
  return request.get({ url: '/alertmanger/newmarkdowntemplate', params })
}


//bigagent
// 新增配置文件
export const addagentconf = (data: any): Promise<IResponse<any>> => {
  return request.post({ url: '/v1/add', data,    headers: {
      'Authorization': "123456"
    } })
}

// 查询配置文件
export const getagentconf = (params: any): Promise<IResponse<any>> => {
  return request.get({ 
    url: '/v1/get', 
    params,
    headers: {
      'Authorization': "123456",
      'Content-Type': 'application/json',
    },
  })
}

// 下发配置文件
export const pushagentconf = (data: any): Promise<IResponse<any>> => {
  return request.post({ url: '/v1/push', data,    headers: {
      'Authorization': "123456"
    } })
}

// 删除配置文件
export const delagentconf = (params: any): Promise<IResponse<any>> => {
  return request.delete({
    url: '/v1/del',
    params,
    headers: {
      'Authorization': "123456",
      'Content-Type': 'application/json',
    }
  })
}

// 编辑配置文件
export const editagentconf = (data: any): Promise<IResponse<any>> => {
  return request.put({
    url: '/v1/edit',
    data,
    headers: {
      'Authorization': "123456",
      'Content-Type': 'application/json',
    }
  })
}

// 下发指定agent配置
export const pushagentconfbyhost = (data: any): Promise<IResponse<any>> => {
  return request.post({ url: '/v1/push_host', data,    headers: {
      'Authorization': "123456"
    } })
}

// 查询agent信息
export const getagentinfo = (params: any): Promise<IResponse<any>> => {
  return request.get({
    url: '/v1/info',
    params,
    headers: {
      'Authorization': "123456",
      'Content-Type': 'application/json',
    },
  })
}

// 查询agent元数据
export const getagentmetadata = (params: any): Promise<IResponse<any>> => {
  return request.get({
    url: '/v1/agent_id',
    params,
    headers: {
      'Authorization': "123456",
      'Content-Type': 'application/json',
    },
  })
}