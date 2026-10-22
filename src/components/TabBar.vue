<template>
  <div class="tab-bar">
    <router-link to="/" class="tab-item" :class="{ active: route.path === '/' }">
      <span class="tab-icon">🍳</span>
      <span class="tab-label">厨房</span>
    </router-link>
    <router-link to="/fridge" class="tab-item" :class="{ active: route.path === '/fridge' }">
      <span class="tab-icon">🧊</span>
      <span class="tab-label">冰箱</span>
    </router-link>
    <router-link to="/manage" class="tab-item" :class="{ active: route.path === '/manage' }">
      <span class="tab-icon">⚙️</span>
      <span class="tab-label">管理</span>
    </router-link>
  </div>
</template>

<script setup>
import { useRoute } from 'vue-router'

const route = useRoute()
</script>

<style scoped>
.tab-bar {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 768px;
  height: 60px;
  background-color: #fff;
  border-top: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding-bottom: env(safe-area-inset-bottom);
  z-index: 100;
}

.tab-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--text-light);
  transition: color 0.2s ease;
}

.tab-item.active {
  color: var(--primary-color);
}

.tab-icon {
  font-size: 24px;
  line-height: 1;
  margin-bottom: 4px;
}

.tab-label {
  font-size: 12px;
  line-height: 1;
}
</style>
