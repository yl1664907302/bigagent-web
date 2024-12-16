<template>
  <div class="agent-info-container">
    <el-card>
      <!-- 操作按钮区域 -->
      <div class="operation-area">
        <el-button
          type="primary"
          :disabled="!selectedRows.length"
          @click="handleBatchOperation"
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
      >
        <el-table-column
          type="selection"
          width="55"
        />
        <el-table-column prop="uuid" label="UUID" min-width="220" />
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
    <el-dialog
      v-model="dialogVisible_host"
      title="下发配置"
      width="50%"
    >
      <ConfigForm
        v-model:visible="dialogVisible_host"
        :selected-hosts="selectedRows"
      />
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted, h } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import dayjs from 'dayjs'
import { getagentinfo,pushagentconfbyhost} from "@/api/login";
import ConfigForm from "@/views/Info/form.vue";

// 弹出
var  dialogVisible_host = ref(false)
var  dialogTitle_host = ref("选择配置下发")
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
  created_at: string
  updated_at: string
}

// 添加表单处理函数
const handleSubmit = () => {
  ElMessage.success('提交成功')
  fetchTableData()
}

const handleReset = () => {
  dialogVisible_host.value = false
}

// 表格数据
const tableData = ref<AgentInfo[]>([])
const tableLoading = ref(false)
const selectedRows = ref<AgentInfo[]>([])

// 分页配置
const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0
})

// 格式化日期
const formatDate = (date: string) => {
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss')
}

// 获取状态标签类型
const getStatusType = (status: string) => {
  if (status.includes('异常')) return 'danger'
  if (status.includes('正常')) return 'success'
  return 'warning'
}

// 处理选择变化
const handleSelectionChange = (rows: AgentInfo[]) => {
  selectedRows.value = rows
}



// 批量操作
const handleBatchOperation = () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请先选择要操作的主机')
    return
  }
  dialogVisible_host.value = true
}

// 处理弹窗关闭
const handleDialogClose = () => {
  dialogVisible_host.value = false
}

// 处理配置提交
const handleConfigSubmit = async (data) => {
  try {
    await pushagentconfbyhost({
      hosts: data.hosts.map(h => h.uuid),
      config_id: data.id
    })
    ElMessage.success('配置下发成功')
    dialogVisible_host.value = false
    await fetchTableData()
  } catch (error) {
    ElMessage.error('配置下发失败：' + error)
  }
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

onMounted(() => {
  fetchTableData()
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
</style>