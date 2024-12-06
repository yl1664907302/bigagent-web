<template>
  <el-table :data="tableData" style="width: 100%" max-height="250">
    <el-table-column fixed prop="title" label="配置标题" width="150" />
    <el-table-column prop="status" label="状态" width="100" />
    <el-table-column prop="times" label="次数" width="100" />
    <el-table-column prop="role_name" label="角色" width="120" />
    <el-table-column prop="ranges" label="范围" width="120" />
    <el-table-column prop="host" label="主机地址" width="150" />
    <el-table-column prop="protocol" label="协议" width="100" />
    <el-table-column prop="port" label="端口" width="100" />
    <el-table-column prop="details" label="备注" width="150" />
    <el-table-column fixed="right" label="操作" width="120">
      <template #default="scope">
        <el-button link type="primary" size="small" @click.prevent="pushConf(scope.$index)">
          下发
        </el-button>
      </template>
    </el-table-column>
  </el-table>
  <el-button class="mt-4" style="width: 100%" @click="onAddItem">
    新增配置
  </el-button>
</template>

<script lang="ts" setup>

import { reactive } from "vue";

const tableData =reactive({
  id: "",
  title: "",
  status: "",
  times: "",
  role_name: "",
  details: "",
  ranges: "",
  auth_name: "",
  data_name: "",
  protocol: "",
  host: "",
  port: "",
  path: "",
  token: ""
})



const pushConf =() =>{

}

const onAddItem = () => {
}
</script>
