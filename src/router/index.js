import Vue from 'vue'
import Router from 'vue-router'
import store from '../store'

// in development-env not use lazy-loading, because lazy-loading too many pages will cause webpack hot update too slow. so only in production use lazy-loading;
// detail: https://panjiachen.github.io/vue-element-admin-site/#/lazy-loading

Vue.use(Router)

/* Layout */
import Layout from '../views/layout/Layout'
/**
* hidden: true                   if `hidden:true` will not show in the sidebar(default is false)
* alwaysShow: true               if set true, will always show the root menu, whatever its child routes length
*                                if not set alwaysShow, only more than one route under the children
*                                it will becomes nested mode, otherwise not show the root menu
* redirect: noredirect           if `redirect:noredirect` will no redirect in the breadcrumb
* name:'router-name'             the name is used by <keep-alive> (must set!!!)
* meta : {
    title: 'title'               the name show in submenu and breadcrumb (recommend set)
    icon: 'svg-name'             the icon show in the sidebar,
  }
**/

const constantRouterMap = [
  {
    path: '/assignmentPublish',
    component: Layout,
    redirect: '/assignmentPublish/table',
    name: '任务发布',
    roles: 110,
    meta: { title: '任务发布', icon: 'example' },
    children: [
      {
        path: 'newRoad',
        name: '新增道路',
        component: () => import('@/views/assignmentPublish/newRoad'),
        meta: { title: '新增道路', icon: 'table' }
      },
      {
        path: 'updateRoad',
        name: '更新道路',
        component: () => import('@/views/assignmentPublish/updateRoad'),
        meta: { title: '更新道路', icon: 'tree' }
      },
      {
        path: 'refineRoad',
        name: '精细化道路',
        component: () => import('@/views/table/index'),
        meta: { title: '精细化道路', icon: 'tree' }
      },
      {
        path: 'refineCraft',
        name: '精细化新工艺',
        component: () => import('@/views/table/index'),
        meta: { title: '精细化新工艺', icon: 'tree' }
      },
      {
        path: 'updatePlan',
        name: '更新任务计划',
        component: () => import('@/views/table/index'),
        meta: { title: '更新任务计划', icon: 'tree' }
      }
    ]
  },
  {
    path: '/assignmentAudit',
    component: Layout,
    redirect: '/assignmentAudit/new',
    name: '任务审核',
    roles: 120,
    meta: { title: '任务审核', icon: 'example' },
    children: [
      {
        path: 'new',
        name: '新增任务审核',
        component: () => import('@/views/table/index'),
        meta: { title: '新增任务审核', icon: 'table' }
      },
      {
        path: 'update',
        name: '更新任务审核',
        component: () => import('@/views/table/index'),
        meta: { title: '更新任务审核', icon: 'tree' }
      },
      {
        path: 'updateLocus/without',
        name: '更新轨迹点-外包',
        component: () => import('@/views/table/index'),
        meta: { title: '更新轨迹点-外包', icon: 'tree' }
      },
      {
        path: 'updatePhotoStream/without',
        name: '更新照片流-外包',
        component: () => import('@/views/table/index'),
        meta: { title: '更新照片流-外包', icon: 'tree' }
      },
      {
        path: 'ErrorNewTechnology ',
        name: '报错新工艺',
        component: () => import('@/views/table/index'),
        meta: { title: '报错新工艺', icon: 'tree' }
      },
      {
        path: 'ErrorNewTechnology/without',
        name: '报错新工艺-外包',
        component: () => import('@/views/table/index'),
        meta: { title: '报错新工艺-外包', icon: 'tree' }
      },
      {
        path: 'roadTaskReview',
        name: '道路任务审核',
        component: () => import('@/views/table/index'),
        meta: { title: '道路任务审核', icon: 'tree' }
      },
      {
        path: 'roadTask/without',
        name: '道路任务-外包',
        component: () => import('@/views/table/index'),
        meta: { title: '道路任务-外包', icon: 'tree' }
      },
      {
        path: 'buildingTaskAudit',
        name: '楼栋任务审核',
        component: () => import('@/views/table/index'),
        meta: { title: '楼栋任务审核', icon: 'tree' }
      },
      {
        path: 'buildingTask/without',
        name: '楼栋任务-外包',
        component: () => import('@/views/table/index'),
        meta: { title: '楼栋任务-外包', icon: 'tree' }
      },
      {
        path: 'refinedNewProcess',
        name: '精细化新工艺',
        component: () => import('@/views/table/index'),
        meta: { title: '精细化新工艺', icon: 'tree' }
      },
      {
        path: 'refinedNewProcess/without',
        name: '精细化新工艺-外包',
        component: () => import('@/views/table/index'),
        meta: { title: '精细化新工艺-外包', icon: 'tree' }
      },
      {
        path: 'equipmentCrowdsourcingAudit',
        name: '设备众包审核',
        component: () => import('@/views/table/index'),
        meta: { title: '设备众包审核', icon: 'tree' }
      },
      {
        path: 'deviceLocus/without',
        name: '设备轨迹点-外包',
        component: () => import('@/views/table/index'),
        meta: { title: '设备轨迹点-外包', icon: 'tree' }
      },
      {
        path: 'devicePhotoStream/without',
        name: '设备照片流-外包',
        component: () => import('@/views/table/index'),
        meta: { title: '设备照片流-外包', icon: 'tree' }
      }
    ]
  },
  {
    path: '/auditResult',
    component: Layout,
    roles: 110,
    children: [
      {
        path: 'index',
        name: '审核结果查看',
        component: () => import('@/views/table/index'),
        meta: { title: '审核结果查看', icon: 'form' }
      }
    ]
  },
  {
    path: '/userManagement',
    component: Layout,
    roles: 150,
    children: [
      {
        path: 'index',
        name: '用户管理',
        component: () => import('@/views/table/index'),
        meta: { title: '用户管理', icon: 'form' }
      }
    ]
  },
  {
    path: '/activityOperations',
    component: Layout,
    roles: 160,
    redirect: '/activityOperations/message',
    name: '活动运营',
    meta: {
      title: '活动运营',
      icon: 'nested'
    },
    children: [
      {
        path: 'message',
        name: '消息中心',
        meta: { title: '消息中心' },
        children: [
          {
            path: 'edit',
            component: () => import('@/views/nested/menu1/menu1-2/menu1-2-1'),
            name: '编辑消息',
            meta: { title: '编辑消息' }
          },
          {
            path: 'history',
            component: () => import('@/views/nested/menu1/menu1-2/menu1-2-2'),
            name: '历史消息',
            meta: { title: '历史消息' }
          }
        ]
      },
      {
        path: 'activity',
        name: '活动专区',
        meta: { title: '活动专区' },
        children: [
          {
            path: 'edit',
            component: () => import('@/views/nested/menu1/menu1-2/menu1-2-1'),
            name: '编辑活动',
            meta: { title: '编辑活动' }
          },
          {
            path: 'history',
            component: () => import('@/views/nested/menu1/menu1-2/menu1-2-2'),
            name: '历史活动',
            meta: { title: '历史活动' }
          }
        ]
      },
      {
        path: 'banner',
        component: () => import('@/views/nested/menu1/menu1-3'),
        name: 'banner轮播图',
        meta: { title: 'banner轮播图' }
      }
    ]
  },
  {
    path: '/userFeedback',
    component: Layout,
    roles: 130,
    children: [
      {
        path: 'index',
        name: '用户反馈',
        component: () => import('@/views/table/index'),
        meta: { title: '用户反馈', icon: 'form' }
      }
    ]
  },
  {
    path: '/paymentConfirmation',
    component: Layout,
    redirect: '/paymentConfirmation/newPlanPay',
    name: '支付确认',
    roles: 140,
    meta: { title: '支付确认', icon: 'example' },
    children: [
      {
        path: 'newPlanPay',
        name: '新增任务支付',
        component: () => import('@/views/table/index'),
        meta: { title: '新增任务支付', icon: 'table' }
      },
      {
        path: 'updatePlanPay',
        name: '更新任务支付',
        component: () => import('@/views/table/index'),
        meta: { title: '更新任务支付', icon: 'tree' }
      },
      {
        path: 'refinePlanPay',
        name: '精细化任务支付',
        component: () => import('@/views/table/index'),
        meta: { title: '精细化任务支付', icon: 'tree' }
      },
      {
        path: 'refineNewCraftPay',
        name: '精细化新工艺支付',
        component: () => import('@/views/table/index'),
        meta: { title: '精细化新工艺支付', icon: 'tree' }
      }
    ]
  },
  {
    path: '/billQuery',
    component: Layout,
    roles: 140,
    children: [
      {
        path: 'index',
        name: '账单查询',
        component: () => import('@/views/table/index'),
        meta: { title: '账单查询', icon: 'form' }
      }
    ]
  },
  {
    path: '/inputAmount',
    component: Layout,
    roles: 140,
    children: [
      {
        path: 'index',
        name: '金额录入',
        component: () => import('@/views/table/index'),
        meta: { title: '金额录入', icon: 'form' }
      }
    ]
  },
  {
    path: '/statistics',
    component: Layout,
    redirect: '/statistics/new',
    name: '统计导出',
    roles: 170,
    meta: { title: '统计导出', icon: 'example' },
    children: [
      {
        path: 'new',
        name: '新增任务',
        component: () => import('@/views/table/index'),
        meta: { title: '新增任务', icon: 'table' }
      },
      {
        path: 'update',
        name: '更新任务',
        component: () => import('@/views/tree/index'),
        meta: { title: '更新任务', icon: 'tree' }
      },
      {
        path: 'refine',
        name: '精细化道路任务',
        component: () => import('@/views/tree/index'),
        meta: { title: '精细化道路任务', icon: 'tree' }
      }, {
        path: 'updateGroup',
        name: '更新任务Group',
        component: () => import('@/views/table/index'),
        meta: { title: '更新任务Group', icon: 'table' }
      }, {
        path: 'audit',
        name: '精细化新工艺-审核',
        component: () => import('@/views/table/index'),
        meta: { title: '精细化新工艺-审核', icon: 'table' }
      }, {
        path: 'operation',
        name: '精细化新工艺-运营',
        component: () => import('@/views/table/index'),
        meta: { title: '精细化新工艺-运营', icon: 'table' }
      }, {
        path: 'equipment',
        name: '设备众包',
        component: () => import('@/views/table/index'),
        meta: { title: '设备众包', icon: 'table' }
      }
    ]
  },
  {
    path: '/imgIdentification',
    component: Layout,
    redirect: '/imgIdentification/sorting',
    name: '图像识别',
    roles: 400,
    meta: { title: '图像识别', icon: 'example' },
    children: [
      {
        path: 'sorting',
        name: '图像分拣',
        component: () => import('@/views/collect/publish'),
        meta: { title: '图像分拣', icon: 'table' }
      }
    ]
  },
  {
    path: '/equipmentCrowdsourcing',
    component: Layout,
    redirect: '/equipmentCrowdsourcing/orderManagement',
    name: '设备众包',
    roles: 190,
    meta: { title: '设备众包', icon: 'example' },
    children: [
      {
        path: 'orderManagement',
        name: '订单管理',
        component: () => import('@/views/collect/publish'),
        meta: { title: '订单管理', icon: 'table' }
      },
      {
        path: 'deviceManagement',
        name: '设备管理',
        component: () => import('@/views/collect/publish'),
        meta: { title: '设备管理', icon: 'table' }
      },
      {
        path: 'channelManagement ',
        name: '渠道管理',
        component: () => import('@/views/collect/publish'),
        meta: { title: '渠道管理', icon: 'table' }
      },
      {
        path: 'tacticalManagement',
        name: '策略管理',
        component: () => import('@/views/collect/publish'),
        meta: { title: '策略管理', icon: 'table' }
      },
      {
        path: 'hotUpdateManagement',
        name: '热更新管理',
        component: () => import('@/views/collect/publish'),
        meta: { title: '热更新管理', icon: 'table' }
      }
    ]
  },
  {
    path: '/collect',
    component: Layout,
    redirect: '/collect/publish',
    name: '大采集任务',
    roles: 190,
    meta: { title: '大采集任务', icon: 'example' },
    children: [
      {
        path: 'publish',
        name: '任务发布',
        component: () => import('@/views/collect/publish'),
        meta: { title: '任务发布', icon: 'table' }
      },
      {
        path: 'copy',
        name: '任务复制',
        component: () => import('@/views/tree/index'),
        meta: { title: '任务复制', icon: 'tree' }
      },
      {
        path: 'equipment',
        name: '设备位置',
        component: () => import('@/views/collect/equipment'),
        meta: { title: '设备位置', icon: 'tree' }
      }
    ]
  }
]

export const userRolesRoute = [
  { path: '/login', component: () => import('@/views/login/index'), hidden: true },
  { path: '/404', component: () => import('@/views/404'), hidden: true },
  {
    path: '/',
    component: Layout,
    redirect: '/index',
    name: '首页',
    hidden: true,
    children: [{
      path: '/index',
      component: () => import('@/views/index/index')
    }]
  },
  { path: '*', redirect: '/404', hidden: true }
] // 所有人都拥有的权限

// const userRoles = store.state.user.roles // 获取用户权限  vuex
// 循环判断是否拥有此项权限
// constantRouterMap.map(a => (
//   userRoles.map(b => {
//     if (a.roles === b || a.roles - 1 === b) {
//       if (constantRouterMap.indexOf(a) === -1) {
//         userRolesRoute.push(a)
//       }
//     }
//   })
// ))

constantRouterMap.map(item => {
  userRolesRoute.push(item)
})// 测试把所有权限打开

export default new Router({
  mode: 'history', // 后端支持可开
  scrollBehavior: () => ({ y: 0 }),
  routes: userRolesRoute
})
