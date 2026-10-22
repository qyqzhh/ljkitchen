import { createRouter, createWebHashHistory } from 'vue-router'
import Kitchen from '../views/Kitchen.vue'
import Fridge from '../views/Fridge.vue'
import Manage from '../views/Manage.vue'

const routes = [
  {
    path: '/',
    name: 'Kitchen',
    component: Kitchen,
    meta: { title: '厨房' }
  },
  {
    path: '/fridge',
    name: 'Fridge',
    component: Fridge,
    meta: { title: '冰箱' }
  },
  {
    path: '/manage',
    name: 'Manage',
    component: Manage,
    meta: { title: '管理' }
  },
  {
    path: '/dish/:id',
    name: 'DishDetail',
    component: () => import('../views/DishDetail.vue'),
    meta: { title: '菜品详情' }
  },
  {
    path: '/dish/edit/:id?',
    name: 'DishEdit',
    component: () => import('../views/DishEdit.vue'),
    meta: { title: '编辑菜品' }
  },
  {
    path: '/ingredient/edit/:id?',
    name: 'IngredientEdit',
    component: () => import('../views/IngredientEdit.vue'),
    meta: { title: '编辑食材' }
  },
  {
    path: '/ingredient/categories',
    name: 'IngredientCategoryManage',
    component: () => import('../views/IngredientCategoryManage.vue'),
    meta: { title: '食材类别管理' }
  },
  {
    path: '/manage/dishes',
    name: 'DishManage',
    component: () => import('../views/DishManage.vue'),
    meta: { title: '菜品管理' }
  },
  {
    path: '/manage/categories',
    name: 'DishCategoryManage',
    component: () => import('../views/DishCategoryManage.vue'),
    meta: { title: '菜品分类管理' }
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  if (to.meta.title) {
    document.title = to.meta.title + ' - LJKitchen 个人厨房'
  }
  next()
})

export default router
