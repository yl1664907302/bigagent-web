<template>
  <div class="agent-info-container">
    <!-- 添加统计卡片区域 -->
    <el-card class="statistics-card">
      <el-row :gutter="16" class="statistics-row">
        <el-col :span="8">
          <div class="statistic-item">
            <el-statistic :value="statistics.totalAgents">
              <template #title>
                <div style="display: inline-flex; align-items: center">
                  总主机数
                  <el-tooltip effect="dark" content="系统中注册的总主机数量" placement="top">
                    <el-icon style="margin-left: 4px" :size="12"><Warning /></el-icon>
                  </el-tooltip>
                </div>
              </template>
            </el-statistic>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="statistic-item">
            <el-statistic :value="statistics.onlineAgents" value-style="color: #67C23A">
              <template #title>
                <div style="display: inline-flex; align-items: center">
                  在线主机数
                  <el-tooltip effect="dark" content="当前在线的主机数量" placement="top">
                    <el-icon style="margin-left: 4px" :size="12"><Warning /></el-icon>
                  </el-tooltip>
                </div>
              </template>
            </el-statistic>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="statistic-item">
            <el-statistic :value="statistics.offlineAgents" value-style="color: #F56C6C">
              <template #title>
                <div style="display: inline-flex; align-items: center">
                  离线主机数
                  <el-tooltip effect="dark" content="当前离线的主机数量" placement="top">
                    <el-icon style="margin-left: 4px" :size="12"><Warning /></el-icon>
                  </el-tooltip>
                </div>
              </template>
            </el-statistic>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <el-card class="table-card">
      <!-- 操作按钮区域 -->
      <div class="operation-area">
        <el-button
          type="primary"
          :disabled="!selectedData.length"
          @click="handleBatchOperation"
          :icon="Plus"
        >
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
        :header-cell-style="headerCellStyle"
        :cell-style="cellStyle"
        highlight-current-row
        stripe
      >
        <el-table-column
          type="selection"
          width="55"
          :selectable="isRowSelectable"
        />
        <el-table-column prop="uuid" label="UUID" min-width="220" />
        <el-table-column prop="platform" label="平台" min-width="100"/>
        <el-table-column prop="os" label="操作系统" min-width="100"/>
        <el-table-column prop="kernel" label="内核版本" min-width="100"/>
        <el-table-column prop="machine_type" label="机器类型" min-width="100"/>
        <el-table-column prop="net_ip" label="网络IP" min-width="120" />
        <el-table-column prop="hostname" label="主机名" min-width="150" />
        <el-table-column prop="ipv4_first" label="IPv4" min-width="120" />
        <el-table-column prop="active" label="活跃状态" min-width="100">
          <template #default="{ row }">
            <el-tag :type="row.active === 1 ? 'success' : 'danger'">
              {{ row.active === 1 ? '在线' : '离线' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" min-width="150">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="action_detail" label="操作详情" min-width="150" />
        <el-table-column prop="grpc_port" label="GRPC端口" min-width="100" />
<!--        <el-table-column prop="created_at" label="创建时间" min-width="180">-->
<!--          <template #default="{ row }">-->
<!--            {{ formatDate(row.created_at) }}-->
<!--          </template>-->
<!--        </el-table-column>-->
        <el-table-column label="操作" min-width="180" fixed="right">
          <template #default="{ row }">
            <el-space>
              <el-button
                size="small"
                type="primary"
                @click="handleDetail(row)"
              >
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
          background
        />
      </div>
    </el-card>
    <!-- 配置下发弹窗 -->
    <el-dialog
      v-model="dialogVisible_host"
      title="下发配置"
      width="50%"
    >
      <ConfigForm
        v-model:visible="dialogVisible_host"
        :selected-hosts="selectedData"
      />
    </el-dialog>
    <!-- 添加详情弹窗 -->
    <el-dialog
      v-model="detailDialogVisible"
      :title=display_title_detail
      width="80%"
    >
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
          <el-button
            size="small"
            type="primary"
            @click="handleDetail2(detailData.uuid,'stand1')"
          >
            标准类型1(默认)
          </el-button>
          <el-button
            size="small"
            type="primary"
            @click="handleDetail2(detailData.uuid,'stand2')"
          >
            标准类型2
          </el-button>
        </el-space>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
// 本人前端废物，代码写的很烂，不要学我，所以注释很多！
import { ref, reactive, onMounted, h, watch, nextTick } from "vue";
import { ElMessage, ElMessageBox, ElNotification } from "element-plus";
import { getagentinfo,getagentmetadata} from "@/api/login";
import ConfigForm from "@/views/Info/form.vue";
import VueJsonPretty from "vue-json-pretty";
import "vue-json-pretty/lib/styles.css";
import { fetchEventSource } from '@microsoft/fetch-event-source';
import { Plus, Warning } from '@element-plus/icons-vue'

// 弹出
const dialogVisible_host = ref(false)
watch(dialogVisible_host, (newVal) => {
  if (newVal) {
    // 弹窗打开时，中断 SSE 连接
    if (sseController.value) {
      sseController.value.abort()
    }
  } else {
    // 保存当前选中状态
    const currentSelected = [...selectedData.value]
    
    // 弹窗关闭时，重新建立 SSE 连接并刷新数据
    sseController.value = initSSE()
    fetchTableData().then(() => {
      // 数据刷新后恢复选中状态
      nextTick(() => {
        const table: any = document.querySelector('.el-table')?.__vueParentComponent?.proxy
        if (table) {
          table.clearSelection()
          tableData.value.forEach(row => {
            if (currentSelected.some(selected => selected.uuid === row.uuid) && row.active === 1) {
              table.toggleRowSelection(row, true)
            }
          })
        }
      })
    })
  }
})

// 详情弹窗相关
const detailDialogVisible = ref(false)
const detailData = ref<{ uuid?: string }>({})
const display_title_detail =ref("")

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
  machine_type:  string,
  os:           string,
  kernel: string,
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
  uuid: "",
  model_name: "stand1"
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
  selectedUUIDs.value = rows.map(row => row.uuid)
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
  fetchTableData()
}

const handleCurrentChange = (val: number) => {
  pagination.currentPage = val
  fetchTableData()
}

// 只有当active为1时才能勾选
const isRowSelectable = (row: AgentInfo) => {
  return row.active === 1; 
}

// 添加 SSE 控制器引用
const sseController = ref(null)

// 修改 initSSE 函数
const initSSE = () => {
  const controller = new AbortController()
  fetchEventSource('http://127.0.0.1:8080/v1/info_sse?page='+pagination.currentPage+'&pageSize='+pagination.pageSize, {
    signal: controller.signal,
    headers: {
      'Accept': 'text/event-stream',  // Changed to proper SSE content type
      // 'Cache-Control': 'no-cache',
      // 'Connection': 'keep-alive',
      "Authorization": "123456"
    },
    async onopen(response) {
      if (response.ok && response.status === 200) {
        console.log('SSE 连接成功');
      } else if (response.status >= 400 && response.status < 500 && response.status !== 429) {
        throw new Error(`Failed to connect: ${response.status}`);
      }
    },
    onmessage(event) {
      try {
        if (!event.data) {
          console.warn('Empty event data received');
          return;
        }
        const data = JSON.parse(event.data);
        console.log('SSE 收到消息:', data);
        updateTableData(data);
      } catch (error) {
        console.error('解析消息失败:', error);
      }
    },
    onclose() {
      console.log('SSE 连接关闭');
      // 可以在这里添加重连逻辑
      setTimeout(initSSE, 1000);
    },
    onerror(err) {
      console.error('SSE 错误:', err);
      ElMessage.error('SSE 连接错误，请检查网络或服务器');
      controller.abort();  // 出错时中断连接
    },
  })
  return controller
}

// 添加统计数据
const statistics = reactive({
  totalAgents: 0,
  onlineAgents: 0,
  offlineAgents: 0
})

// 修改 updateTableData 函数
const updateTableData = (rep) => {
  // 如果弹窗正在显示，不更新数据
  if (dialogVisible_host.value || detailDialogVisible.value) {
    return
  }

  if (!rep || !rep.data) {
    console.error('Invalid response data')
    ElMessage.error('更新表格数据失败：无效数据')
    return
  }

  try {
    const oldData = [...tableData.value]
    // 保存当前选中的 UUID 列表，而不是完整数据
    const currentSelectedUUIDs = selectedUUIDs.value
    
    const newData = rep.data.agentInfos || []
    
    const changedDevices = newData.filter(newRow => {
      const oldRow = oldData.find(row => row.uuid === newRow.uuid)
      return oldRow && oldRow.active !== newRow.active
    })

    tableData.value = newData
    pagination.total = rep.data.nums ?? pagination.total

    // 更新统计数据
    statistics.totalAgents = newData.length
    statistics.onlineAgents = newData.filter(agent => agent.active === 1).length
    statistics.offlineAgents = newData.filter(agent => agent.active === 0).length
    
    nextTick(() => {
      // 只恢复之前选中的行
      const table: any = document.querySelector('.el-table')?.__vueParentComponent?.proxy
      if (table) {
        table.clearSelection()
        tableData.value.forEach(row => {
          if (currentSelectedUUIDs.includes(row.uuid) && row.active === 1) {
            table.toggleRowSelection(row, true)
          }
        })
      }
      
      // 通知逻辑保持不变
      changedDevices.forEach(device => {
        ElNotification({
          title: device.active === 1 ? '设备上线通知' : '设备离线通知',
          message: `设备 ${device.hostname}(${device.net_ip}) ${device.active === 1 ? '已上线' : '已离线'}`,
          type: device.active === 1 ? 'success' : 'warning',
          duration: 3000,
          position: 'top-right'
        })
      })
    })
  } catch (error) {
    console.error('更新表格数据失败:', error)
    ElMessage.error('更新表格数据失败')
  } finally {
    tableLoading.value = false
  }
}

// 获取表格数据
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
      model_name: metadata.model_name,
    }
    const res = await getagentmetadata(params)
    detailData.value = res.data
  } catch (error) {
    console.error('获取元数据失败:', error)
    ElMessage.error('获取元数据失败，请重试')
  } finally {
  }
}

const jsonData2 = async (uuid,model_name) => {
  try {
    const params = {
      uuid: uuid,
      model_name: model_name,
    }
    const res = await getagentmetadata(params)
    detailData.value = res.data
  } catch (error) {
    console.error('获取元数据失败:', error)
    ElMessage.error('获取元数据失败，请重试')
  } finally {
  }
}

// 处理详情按钮点击
const handleDetail2 = (uuid,model_name) => {
  jsonData2(uuid,model_name)
  display_title_detail.value = "当前数据模型："+model_name
  detailDialogVisible.value = true
}


// 处理详情按钮点击
const handleDetail = (row: AgentInfo) => {
  if (row.active==0) {
    ElMessage.warning('设备不在线，无法获取实时数据')
    return
  }
  detailData.value={}
   jsonData(row.uuid)
  display_title_detail.value = "当前数据模型："+"stand1"
  detailDialogVisible.value = true
}

// 添加表格样式配置
const headerCellStyle = {
  backgroundColor: '#f5f7fa',
  color: '#606266',
  fontWeight: 'bold',
  fontSize: '14px',
  height: '45px',
  padding: '8px'
}

const cellStyle = {
  fontSize: '14px',
  padding: '8px'
}

watch(detailDialogVisible, (newVal) => {
  if (newVal) {
    if (sseController.value) {
      sseController.value.abort()
    }
  } else {
    // 保存当前选中状态
    const currentSelected = [...selectedData.value]
    
    sseController.value = initSSE()
    fetchTableData().then(() => {
      nextTick(() => {
        const table: any = document.querySelector('.el-table')?.__vueParentComponent?.proxy
        if (table) {
          table.clearSelection()
          tableData.value.forEach(row => {
            if (currentSelected.some(selected => selected.uuid === row.uuid) && row.active === 1) {
              table.toggleRowSelection(row, true)
            }
          })
        }
      })
    })
  }
})

onMounted(() => {
  sseController.value = initSSE()
  // fetchTableData()
})
</script>

<style scoped>
.agent-info-container {
  padding: 10px;
}

/* 更新统计卡片样式 */
.statistics-card {
  margin-bottom: 20px;
  border-radius: 4px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
}

.statistics-row {
  margin: 0 !important;  /* 移除外边距 */
}

.statistic-item {
  padding: 20px;
  text-align: center;
  position: relative;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

/* 添加分隔线 */
.statistic-item:not(:last-child)::after {
  content: '';
  position: absolute;
  right: 0;
  top: 20%;
  height: 60%;
  width: 1px;
  background-color: var(--el-border-color-lighter);
}

.el-statistic {
  --el-statistic-content-font-size: 28px;
}

/* 表格相关样式 */
.table-card {
  border-radius: 4px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
}

.operation-area {
  margin-bottom: 15px;
  display: flex;
  gap: 10px;
  padding: 0 5px;
}

.pagination-area {
  margin-top: 15px;
  display: flex;
  justify-content: flex-end;
  padding: 5px;
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

/* 滚动条美化 */
:deep(.el-table__body-wrapper::-webkit-scrollbar) {
  width: 8px;
  height: 8px;
}

:deep(.el-table__body-wrapper::-webkit-scrollbar-thumb) {
  background-color: #dcdfe6;
  border-radius: 4px;
}

:deep(.el-table__body-wrapper::-webkit-scrollbar-track) {
  background-color: #f5f7fa;
}

/* 表格交互效果 */
:deep(.el-table__row:hover) {
  background-color: #f5f7fa !important;
  transition: background-color 0.3s;
}

:deep(.el-table) {
  border-radius: 4px;
  overflow: hidden;
}

/* 按钮效果 */
.el-button {
  transition: all 0.3s;
}

.el-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* 表格内边距调整 */
:deep(.el-table .el-table__cell) {
  padding: 6px 0;
}

:deep(.el-table th.el-table__cell) {
  padding: 8px 0;
}
</style>