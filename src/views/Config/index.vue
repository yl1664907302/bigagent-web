<template>
  <div class="agent-config-container">
    <el-card>
      <!-- 操作按钮区域 -->
      <div class="operation-area">
        <el-button type="primary" @click="handleAdd">新增配置</el-button>
      </div>

      <!-- 表格区域 -->
      <el-table
        v-loading="tableLoading"
        :data="tableData"
        border
        style="width: 100%"
      >
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="title" label="配置标题" />
        <el-table-column prop="status" label="状态">
          <template #default="{ row }">
            <el-tag :type="row.status === '有效' ? 'success' : 'danger'">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="times" label="次数" />
        <el-table-column prop="role_name" label="角色" />
        <el-table-column prop="ranges" label="范围" />
        <el-table-column label="接口信息">
          <template #default="{ row }">
             {{ row.host }}
          </template>
        </el-table-column>
        <el-table-column prop="auth_name" label="认证方式" />
        <el-table-column prop="slot_name" label="槽位" />
        <el-table-column prop="data_name" label="数据格式" />
        <el-table-column prop="created_at" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleDo(row)">下发</el-button>
            <el-button type="danger" link @click="handleDel(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页区域 -->
      <div class="pagination-area">
        <el-pagination
          v-model:current-page="pagination.currentPage"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[5,10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
      <div>
        <!-- 弹窗表单 -->
        <el-dialog
          v-model="dialogVisible"
          :title="dialogTitle"
          width="50%"
          :close-on-click-modal="false"
          :destroy-on-close="true"
        >
          <ConfigForm
            @submit="handleSubmit"
            @reset="handleReset"
          />
        </el-dialog>
      </div>
  </div>

</template>

<script lang="ts" setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { delagentconf, getagentconf, pushagentconf } from "@/api/login";
import dayjs from 'dayjs' // 需要安装 dayjs
import ConfigForm from './form.vue'
var  dialogVisible = ref(false)
var dialogTitle = ref('新增agent配置')

interface TableItem {
  id: number
  title: string
  status: string
  times: string
  role_name: string
  details: string
  ranges: string
  auth_name: string
  data_name: string
  slot_name: string
  protocol: string
  host: string
  port: number
  path: string
  token: string
  created_at: string
  updated_at: string
}



// 表格数据
const tableData = ref<TableItem[]>([])
const tableLoading = ref(false)

// 分页配置
const pagination = reactive({
  currentPage: 1,
  pageSize: 5,
  total: 0
})

// 格式化日期
const formatDate = (date: string) => {
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss')
}

// 获取表格数据
const fetchTableData = async () => {
  try {
    tableLoading.value = true
    const params = {
      page: pagination.currentPage,
      pageSize: pagination.pageSize
    }
    const res = await getagentconf(params)
    tableData.value = res.data.configs
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

// 下发配置
const PushConfig = async (id) => {
  try {
    const params = {
      config_id: id,
    }
    const res = await pushagentconf(params)
    ElMessage.success(res.data)
  } catch (error) {
    console.error('配置下发失败:', error)
    ElMessage.error('配置下发失败，请重试')
  }
}

// 删除配置
const DelConfig = async (id) => {
  try {
    const params = {
      config_id: id,
    }
    const res = await delagentconf(params)
    ElMessage.success(res.data)
  } catch (error) {
    console.error('配置删除失败:', error)
    ElMessage.error('配置删除失败，请重试')
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

// 表格操作
const handleAdd = () => {
  dialogVisible.value = true
}

// 添加表单处理函数
const handleSubmit = () => {
  ElMessage.success('提交成功')
  fetchTableData()
}

const handleReset = () => {
  ElMessage.success('已重置')
}


const handleDo = async (row: TableItem) => {
  try {
    await PushConfig(row.id)  // 等待下发配置完成
    await fetchTableData()    // 然后刷新表格数据
  } catch (error) {
    console.error('配置下发操作失败:', error)
  }
}

const handleDel = async (row: TableItem) => {
  try {
    await ElMessageBox.confirm(
      `确认删除配置 "${row.title}" 吗？`,
      '删除确认',
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    // 用户点击确认后执行删除
    await DelConfig(row.id)
    // 可能需要刷新列表
    await fetchTableData()
  } catch (error) {
    // 用户取消或发生错误
    if (error !== 'cancel') {
      ElMessage({
        type: 'error',
        message: '删除失败：' + error
      })
    }
  }
}

onMounted(() => {
  fetchTableData()
})
</script>

<style scoped>
.agent-config-container {
  padding: 20px;
}

.operation-area {
  margin-bottom: 20px;
}

.pagination-area {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>