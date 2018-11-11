<template>
  <div class="app-container">
    <div class="top">
      <el-input
        v-model="searchInput"
        class="search-input"
        placeholder="请输入内容"
        clearable/>
      <el-button type="primary" @click="handleSearch()">搜索</el-button>
      <el-button type="primary" @click="centerDialogVisible = true">过滤</el-button>
      <el-button type="primary" @click="batchRelease()">批量发布</el-button>
      <el-button type="primary" @click="bulkHang()">批量挂起</el-button>
      <el-button type="primary" @click="batchClosed()">批量关闭</el-button>
      <el-button type="primary" @click="batchRollback()">批量回滚</el-button>
    </div>
    <el-table
      ref="multipleTable"
      :data="tableData"
      tooltip-effect="dark"
      style="width: 100%"
      @selection-change="handleSelectionChange">
      <el-table-column
        type="selection"
        width="55"/>
      <el-table-column
        v-for="(item, index) in columns"
        :key="index"
        :prop="item.field"
        :label="item.title"
        :width="item.width"
        align="center"/>
    </el-table>
    <el-dialog
      :visible.sync="centerDialogVisible"
      title="过滤"
      width="50%"
      center>
      <div class="edit">
        <div class="edit_group">
          <div class="edit_label">任务状态</div>
          <el-checkbox-group v-model="filter.taskState" class="edit_collapse">
            <el-checkbox label="未发布">未发布</el-checkbox>
            <el-checkbox label="挂起">挂起</el-checkbox>
            <el-checkbox label="已领取">已领取</el-checkbox>
            <el-checkbox label="采集中">采集中</el-checkbox>
            <el-checkbox label="上传中">上传中</el-checkbox>
            <el-checkbox label="已提交（审核中）">已提交（审核中）</el-checkbox>
            <el-checkbox label="合格（未支付）">合格（未支付）</el-checkbox>
            <el-checkbox label="不合格">不合格</el-checkbox>
            <el-checkbox label="已支付">已支付</el-checkbox>
            <el-checkbox label="用户取消">用户取消</el-checkbox>
            <el-checkbox label="过期">过期</el-checkbox>
            <el-checkbox label="运营释放">运营释放</el-checkbox>   <!-- label改成相应key值， filter.taskState可以自动获取-->
          </el-checkbox-group>
        </div>
        <div class="edit_group">
          <div class="edit_label">回滚原因</div>
          <el-select v-model="filter.rollReason" placeholder="请选择">
            <el-option label="领取未采集" value="选项1"/>
            <el-option label="满足提交限制" value="选项2"/>
            <el-option label="未满足有效限制" value="选项3"/> <!-- value改成相应参数 filter.rollReason可以自动获取-->
          </el-select>
        </div>
        <div class="edit_group">
          <div class="edit_label">回滚任务包ID</div>
          <el-input
            v-model="filter.rollId"
            class="edit_input"
            placeholder="请输入回滚任务包ID"
            clearable/>
        </div>
        <div class="edit_group">
          <div class="edit_label">省份</div>
          <el-cascader
            :options="cityOptin"
            v-model="filter.province"
            placeholder="选择省份"/>
        </div>
        <div class="edit_group">
          <div class="edit_label">用户领取时间</div>
          <el-date-picker
            v-model="filter.receiveTime"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期" />
        </div>
        <div class="edit_group">
          <div class="edit_label">最后提交时间</div>
          <el-date-picker
            v-model="filter.lastPut"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期" />
        </div>
        <div class="edit_group">
          <div class="edit_label">采集用户ID</div>
          <el-input
            v-model="filter.userID"
            class="edit_input"
            placeholder="请输入采集用户ID"
            clearable/>
        </div>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button @click="centerDialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="handleFilter()">过 滤</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
// import { getList } from '@/api/assignmentPublish'
import { citys } from '@/assets/citys.js'

export default {
  name: 'UpdateRoad',
  data() {
    return {
      searchInput: '',
      centerDialogVisible: false,
      filter: {
        taskState: [],
        rollReason: '',
        rollId: '',
        province: [],
        receiveTime: '',
        lastPut: '',
        userID: ''
      },
      cityOptin: [],
      columns: [
        {
          field: 'key',
          title: '序号',
          width: '40'
        },
        {
          field: 'id',
          title: '任务包id',
          width: '120'
        },
        {
          field: 'name',
          title: '任务包名称',
          width: '140'
        },
        {
          field: 'plan_id',
          title: '更新计划ID'
        },
        {
          field: 'plan_name',
          title: '更新计划名称',
          width: '200'
        },
        {
          field: 'province',
          title: '省份'
        },
        {
          field: 'city',
          title: '城市'
        },
        {
          field: 'admincode',
          title: '区域'
        },
        {
          field: 'total_road_mileage',
          title: '预采集公里数'
        },
        {
          field: 'task_num',
          title: 'Link数'
        },
        {
          field: 'total_price',
          title: '预计价格'
        },
        {
          field: 'changPrice',
          title: '调价'
        },
        {
          field: 'orderid',
          title: '订单ID'
        },
        {
          field: 'worker',
          title: '采集用户id'
        },
        {
          field: 'user_pickup_time',
          title: '用户领取日期'
        },
        {
          field: 'expire_time',
          title: '最后提交时限'
        },
        {
          field: 'info_type',
          title: '任务所有权'
        },
        {
          field: 'flag',
          title: '任务状态',
          align: 'center'
        },
        {
          field: 'post',
          title: '任务派发'
        },
        {
          field: 'rollback',
          title: '回滚操作'
        },
        {
          field: 'rollback_date',
          title: '回滚日期'
        },
        {
          field: 'rollback_man',
          title: '回滚操作人'
        }
      ],
      tableData: [],
      multipleSelection: []
    }
  },
  async mounted() {
    // const data = {
    //   page: 1,
    //   limit: 25,
    //   keywords: '',
    //   flag: '',
    //   start_time: '',
    //   end_time: '',
    //   dead_start_time: '',
    //   dead_end_time: '',
    //   rollBackReson: '',
    //   rollPkgId: '',
    //   city: '',
    //   user: '',
    //   _: 1541752065045
    // }
    // get请求接口
    // const res = await getList(data);
    const res = {
      count: 23000,
      infos: [
        {
          admincode: '资阳区',
          city: '益阳市',
          flag: 0,
          id: '18111270074',
          info_type: 0,
          name: '迎春北路_资阳区_湖南省',
          plan_id: '1811127',
          plan_name: '益阳市更新计划2018-11-09',
          province: '湖南省',
          rollback_date: '',
          rollback_man: '',
          task_num: 2215,
          total_price: 986,
          total_road_mileage: 197.396
        },
        {
          admincode: '桃江县',
          city: '益阳市',
          flag: 0,
          id: '18111270073',
          info_type: 0,
          name: '资江路_桃江县_湖南省',
          plan_id: '1811127',
          plan_name: '益阳市更新计划2018-11-09',
          province: '湖南省',
          rollback_date: '',
          rollback_man: '',
          task_num: 883,
          total_price: 401,
          total_road_mileage: 80.397
        },
        {
          admincode: '桃江县',
          city: '益阳市',
          flag: 0,
          id: '18111270072',
          info_type: 0,
          name: '金盆大道_桃江县_湖南省',
          plan_id: '1811127',
          plan_name: '益阳市更新计划2018-11-09',
          province: '湖南省',
          rollback_date: '',
          rollback_man: '',
          task_num: 844,
          total_price: 799,
          total_road_mileage: 159.998
        },
        {
          admincode: '资阳区',
          city: '益阳市',
          flag: 0,
          id: '18111270071',
          info_type: 0,
          name: '_资阳区_湖南省',
          plan_id: '1811127',
          plan_name: '益阳市更新计划2018-11-09',
          province: '湖南省',
          rollback_date: '',
          rollback_man: '',
          task_num: 146,
          total_price: 232,
          total_road_mileage: 46.476
        }
      ],
      state: 0
    }
    this.tableData = res.infos.map((item, index) => ({
      ...item,
      key: index + 1
    }))
    this.cityOptin = citys
  },
  methods: {
    handleSelectionChange(val) {
      this.multipleSelection = val
    },
    handleSearch() {
      if (!this.searchInput) {
        this.$message.error('关键词不能为空')
        return false
      }
    },
    async batchRelease() {
      if (this.multipleSelection.length === 0) {
        this.$message.error('请选择要发布的任务')
        return false
      }
      // const res = await jiekou()
    },
    async bulkHang() {
      if (this.multipleSelection.length === 0) {
        this.$message.error('请选择要挂起的任务')
        return false
      }
    },
    async batchClosed() {
      if (this.multipleSelection.length === 0) {
        this.$message.error('请选择要关闭的任务')
        return false
      }
    },
    async batchRollback() {
      if (this.multipleSelection.length === 0) {
        this.$message.error('请选择要回滚的任务')
        return false
      }
    },
    handleFilter() {
      console.log(this.filter)
    }
  }
}
</script>

<style scoped rel="stylesheet/scss" lang="scss">
.app-container{
  .top{
    .search-input{
      width: 200px;
    }
  }
  .edit{
    .edit_group {
    margin-bottom: 20px;
    .edit_label {
      float: left;
      width: 150px;
      line-height: 40px;
      color: #000;
      font-size: 14px;
    }
    .edit_input{
      width: 400px;
    }
    .edit_collapse{
      min-width: 400px;
      // float: left;
      .edit_creat{
        margin-top: 10px;
      }
    }
  }
  .edit_btns {
    padding-left: 230px;
    Button {
      margin-right: 20px;
    }
  }
  }
}
</style>
