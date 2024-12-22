<template>
  <div class="agent-info-container">
    <el-card>
      <!-- 操作按钮区域 -->
      <div class="operation-area">
        <el-button type="primary" :disabled="!selectedData.length" @click="handleBatchOperation">
          批量操作
        </el-button>
      </div>

      <!-- 表格区域 -->
      <el-table
        v-loading="tableLoading"
        :data="tableData"
        border
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" :selectable="isRowSelectable" />
        <el-table-column prop="uuid" label="UUID" min-width="220" />
        <el-table-column prop="active" label="活跃状态" min-width="100">
          <template #default="{ row }">
            <el-tag :type="row.active === 1 ? 'success' : 'danger'">
              {{ row.active === 1 ? '在线' : '离线' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="platform" label="平台" min-width="100" />
        <el-table-column prop="os" label="操作系统" min-width="100" />
        <el-table-column prop="kernel" label="内核版本" min-width="100" />
        <el-table-column prop="machine_type" label="机器类型" min-width="100" />
        <el-table-column prop="net_ip" label="网络IP" min-width="120" />
        <el-table-column prop="hostname" label="主机名" min-width="150" />
        <el-table-column prop="ipv4_first" label="IPv4" min-width="120" />
        <el-table-column prop="status" label="状态" min-width="150">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="action_detail" label="操作详情" min-width="150" />
        <el-table-column prop="grpc_port" label="GRPC端口" min-width="100" />
        <el-table-column label="操作" min-width="180" fixed="right">
          <template #default="{ row }">
            <el-space>
              <el-button size="small" type="primary" @click="handleDetail(row)">
                实时元数据
              </el-button>
            </el-space>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页区域 -->
      <div class="pagination-area">
        <el-pagination
          v-model:current-page="pagination.currentPage"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
    <!-- 配置下发弹窗 -->
    <el-dialog v-model="dialogVisible_host" title="下发配置" width="50%">
      <ConfigForm v-model:visible="dialogVisible_host" :selected-hosts="selectedData" />
    </el-dialog>
    <!-- 添加详情弹窗 -->
    <el-dialog v-model="detailDialogVisible" :title="display_title_detail" width="80%">
      <div class="metadata-container">
        <vue-json-pretty
          :deep="3"
          :showSelectController="true"
          :highlightMouseoverNode="true"
          path="res"
          :data="detailData"
          :height="700"
          :virtual="true"
          :show-icon="true"
          :editable="false"
          :show-line-number="true"
        />
      </div>
      <el-space>
        <el-button size="small" type="primary" @click="handleDetail2(detailData.uuid, 'stand1')">
          标准类型1(默认)
        </el-button>
        <el-button size="small" type="primary" @click="handleDetail2(detailData.uuid, 'stand2')">
          标准类型2
        </el-button>
      </el-space>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
// 本人前端废物，代码写的很烂，不要学我，所以注释很多！
import { ref, reactive, onMounted, h, watch, nextTick } from 'vue'
import { ElMessage, ElMessageBox, ElNotification } from 'element-plus'
import { getagentinfo, getagentmetadata } from '@/api/login'
import ConfigForm from '@/views/Info/form.vue'
import VueJsonPretty from 'vue-json-pretty'
import 'vue-json-pretty/lib/styles.css'
import { fetchEventSource } from '@microsoft/fetch-event-source'
// 弹出
const dialogVisible_host = ref(false)
// 详情弹窗相关
const detailDialogVisible = ref(false)
const detailData = ref<{ uuid?: string }>({})
const display_title_detail = ref('')

// agent 信息
interface AgentInfo {
  uuid: string
  net_ip: string
  hostname: string
  ipv4_first: string
  active: number
  status: string
  action_detail: string
  grpc_port: string
  platform: string
  machine_type: string
  os: string
  kernel: string
  created_at: string
  updated_at: string
}
// 表格数据
const tableData = ref<AgentInfo[]>([])
const selectedData = ref<AgentInfo[]>([]) // 存储选中的完整数据
const selectedUUIDs = ref<string[]>([]) // 存储选中行的 UUID
const tableLoading = ref(false)

// 分页配置
const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0
})

// 元数据配置
const metadata = reactive({
  uuid: '',
  model_name: 'stand1'
})

// 获取状态标签类型
const getStatusType = (status: string) => {
  if (status.includes('异常')) return 'danger'
  if (status.includes('正常')) return 'success'
  return 'warning'
}

// 处理选择变化
const handleSelectionChange = (rows: AgentInfo[]) => {
  // 深拷贝选中的数据
  selectedData.value = JSON.parse(JSON.stringify(rows))
  // 保存选中行的 UUID
  selectedUUIDs.value = rows.map((row) => row.uuid)
}

// 批量操作
const handleBatchOperation = () => {
  if (selectedData.value.length === 0) {
    ElMessage.warning('请先选择要操作的主机')
    return
  }
  dialogVisible_host.value = true
}

// 分页处理
const handleSizeChange = (val: number) => {
  pagination.pageSize = val
  sseController.abort() // 切换分页时中断连接
  sseController = initSSE()
}

const handleCurrentChange = (val: number) => {
  pagination.currentPage = val
  sseController.abort() // 切换分页时中断连接
  sseController = initSSE()
}

// 只有当active为1时才能勾选
const isRowSelectable = (row: AgentInfo) => {
  return row.active === 1
}

// 修改 initSSE 函数
const initSSE = () => {
  const controller = new AbortController()
  fetchEventSource(
    'http://127.0.0.1:8080/v1/info_sse?page=' +
      pagination.currentPage +
      '&pageSize=' +
      pagination.pageSize,
    {
      signal: controller.signal,
      headers: {
        Accept: 'text/event-stream', // Changed to proper SSE content type
        // 'Cache-Control': 'no-cache',
        // 'Connection': 'keep-alive',
        Authorization: '123456'
      },
      async onopen(response) {
        if (response.ok && response.status === 200) {
          console.log('SSE 连接成功')
        } else if (response.status >= 400 && response.status < 500 && response.status !== 429) {
          throw new Error(`Failed to connect: ${response.status}`)
        }
      },
      onmessage(event) {
        try {
          if (!event.data) {
            console.warn('Empty event data received')
            return
          }
          const data = JSON.parse(event.data)
          updateTableData(data)
        } catch (error) {
          console.error('解析消息失败:', error)
        }
      },
      onclose() {
        console.log('SSE 连接关闭')
        // 可以在这里添加重连逻辑
        setTimeout(initSSE, 1000)
      },
      onerror(err) {
        console.error('SSE 错误:', err)
        ElMessage.error('SSE 连接错误，请检查网络或服务器')
        controller.abort() // 出错时中断连接
      }
    }
  )
  return controller
}
let sseController = initSSE()

const updateTableData = (rep) => {
  if (selectedUUIDs.value.length > 0) {
    console.log('存在勾选项，跳过更新')
    return
  }
  notfiy(rep)
  if (!rep || !rep.data) {
    console.error('Invalid response data')
    ElMessage.error('更新表格数据失败：无效数据')
    return
  }

  tableLoading.value = true
  try {
    tableData.value = rep.data.agentInfos || []
    pagination.total = rep.data.nums ?? pagination.total
  } catch (error) {
    console.error('更新表格数据失败:', error)
    ElMessage.error('更新表格数据失败')
  } finally {
    tableLoading.value = false
  }
}

const notfiy = (data) => {
  console.log('SSE 收到消息:', data)
  data.data.agentInfos.forEach((newAgent) => {
    const oldAgent = tableData.value.find((agent) => agent.uuid === newAgent.uuid)
    if (oldAgent && oldAgent.active !== newAgent.active) {
      ElNotification({
        title: newAgent?.active === 1 ? '设备上线通知' : '设备离线通知',
        message: `设备 ${newAgent?.hostname}(${newAgent?.net_ip}) ${newAgent?.active === 1 ? '已上线' : '已离线'}`,
        type: newAgent?.active === 1 ? 'success' : 'warning',
        duration: 3000,
        position: 'top-right'
      })
    }
  })
}

// 获取表格数据（静态）
const fetchTableData = async () => {
  try {
    tableLoading.value = true
    const params = {
      page: pagination.currentPage,
      pageSize: pagination.pageSize
    }
    const res = await getagentinfo(params)
    tableData.value = res.data.agentInfos
    // 如果后端返回了总数，则更新
    if (res.data.nums) {
      pagination.total = res.data.nums
    }
  } catch (error) {
    console.error('获取数据失败:', error)
    ElMessage.error('获取数据失败，请重试')
  } finally {
    tableLoading.value = false
  }
}

// 获取元数据
const jsonData = async (uuid) => {
  try {
    const params = {
      uuid: uuid,
      model_name: metadata.model_name
    }
    const res = await getagentmetadata(params)
    detailData.value = res.data
  } catch (error) {
    console.error('获取元数据失败:', error)
    ElMessage.error('获取元数据失败，请重试')
  } finally {
  }
}

const jsonData2 = async (uuid, model_name) => {
  try {
    const params = {
      uuid: uuid,
      model_name: model_name
    }
    const res = await getagentmetadata(params)
    detailData.value = res.data
  } catch (error) {
    console.error('获取元数据失败:', error)
    ElMessage.error('获取元数数失败，请重试')
  } finally {
  }
}

// 处理详情按钮点击
const handleDetail2 = (uuid, model_name) => {
  jsonData2(uuid, model_name)
  display_title_detail.value = '当前数据模型：' + model_name
  detailDialogVisible.value = true
}

// 处理详情按钮点击
const handleDetail = (row: AgentInfo) => {
  if (row.active == 0) {
    ElMessage.warning('设备不在线，无法获取实时数据')
    return
  }
  detailData.value = {}
  jsonData(row.uuid)
  display_title_detail.value = '当前数据模型：' + 'stand1'
  detailDialogVisible.value = true
}

onMounted(() => {
  sseController
  // fetchTableData()
})
</script>

<style scoped>
.agent-info-container {
  padding: 20px;
}

.operation-area {
  margin-bottom: 20px;
  display: flex;
  gap: 10px;
}

.pagination-area {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.mt-4 {
  margin-top: 1rem;
}

.metadata-container {
  background-color: #f5f7fa;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  padding: 16px;
  max-height: 600px;
  overflow: auto;
}
</style>
