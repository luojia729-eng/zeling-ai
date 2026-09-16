<template>
  <div class="layout" :class="{ collapsed: sidebarCollapsed, dark: isDark }">
    <!-- 侧边栏 -->
    <aside class="sidebar">
      <div class="logo">
        <div class="logo-icon">✦</div>
        <span v-if="!sidebarCollapsed" class="logo-text">则灵 AI</span>
      </div>

      <div class="workspace-label" v-if="!sidebarCollapsed">WORKSPACE</div>

      <nav class="nav-menu">
        <router-link
          v-for="item in menuItems"
          :key="item.path"
          :to="item.path"
          class="nav-item"
          :class="{ active: isActive(item.path) }"
        >
          <el-icon :size="18"><component :is="item.icon" /></el-icon>
          <span v-if="!sidebarCollapsed">{{ item.label }}</span>
        </router-link>
      </nav>

      <div class="sidebar-bottom">
        <button class="nav-item collapse-btn" @click="sidebarCollapsed = !sidebarCollapsed">
          <el-icon :size="18"><Fold v-if="!sidebarCollapsed" /><Expand v-else /></el-icon>
          <span v-if="!sidebarCollapsed">收起侧边栏</span>
        </button>
      </div>
    </aside>

    <!-- 主内容区 -->
    <div class="main-area">
      <!-- 顶部栏 -->
      <header class="topbar">
        <div class="search-box" @click="handleSearch">
          <el-icon><Search /></el-icon>
          <span>搜索模型、模板、作品、提示词…</span>
          <kbd>⌘K</kbd>
        </div>

        <div class="topbar-actions">
          <button class="icon-btn" @click="toggleDark" title="切换明暗主题">
            <el-icon :size="18"><Moon v-if="!isDark" /><Sunny v-else /></el-icon>
          </button>

          <button class="recharge-btn" @click="showRecharge = true">
            充值
          </button>

          <button class="credits-btn" @click="showRecharge = true">
            <span class="credits-num">{{ userStore.credits }}</span>
            <span class="credits-label">积分</span>
          </button>

          <!-- 未登录 -->
          <template v-if="!userStore.isLoggedIn">
            <button class="login-btn" @click="userStore.showLoginDialog = true">
              登录 / 注册
            </button>
          </template>

          <!-- 已登录 -->
          <template v-else>
            <el-dropdown trigger="click" @command="handleUserCommand">
              <div class="user-info">
                <div class="avatar">{{ avatarText }}</div>
                <span class="username">{{ userStore.user?.nickname }}</span>
              </div>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="settings">设置</el-dropdown-item>
                  <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </div>
      </header>

      <!-- 页面内容 -->
      <main class="content">
        <router-view />
      </main>
    </div>

    <!-- 登录弹窗 -->
    <LoginDialog v-model:visible="userStore.showLoginDialog" />

    <!-- 充值弹窗 -->
    <RechargeDialog v-model:visible="showRecharge" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import LoginDialog from '@/components/LoginDialog.vue'
import RechargeDialog from '@/components/RechargeDialog.vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const sidebarCollapsed = ref(false)
const isDark = ref(false)
const showRecharge = ref(false)

const menuItems = [
  { path: '/home', label: '首页', icon: 'HomeFilled' },
  { path: '/create', label: '性价比创作', icon: 'MagicStick' },
  { path: '/canvas', label: '无限画布', icon: 'Picture' },
  { path: '/api-access', label: 'API接入', icon: 'Connection' },
  { path: '/settings', label: '设置', icon: 'Setting' }
]

const avatarText = computed(() => {
  const name = userStore.user?.nickname || 'U'
  return name.charAt(0).toUpperCase()
})

function isActive(path) {
  return route.path.startsWith(path)
}

function toggleDark() {
  isDark.value = !isDark.value
  document.documentElement.classList.toggle('dark', isDark.value)
}

function handleSearch() {
  // 搜索功能暂用提示
}

function handleUserCommand(command) {
  if (command === 'settings') {
    router.push('/settings')
  } else if (command === 'logout') {
    userStore.logout()
    router.push('/home')
  }
}

onMounted(() => {
  if (userStore.isLoggedIn) {
    userStore.fetchUser()
  }
})
</script>

<style scoped>
.layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

/* 侧边栏 */
.sidebar {
  width: 220px;
  background: var(--sidebar-bg);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease;
  flex-shrink: 0;
}

.layout.collapsed .sidebar {
  width: 64px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 20px 16px;
  font-size: 18px;
  font-weight: 700;
}

.logo-icon {
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #ff6b6b, #ff8e53);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 16px;
  flex-shrink: 0;
}

.workspace-label {
  font-size: 11px;
  color: var(--text-secondary);
  padding: 8px 20px 4px;
  letter-spacing: 1px;
}

.nav-menu {
  flex: 1;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border-radius: 8px;
  color: var(--text-secondary);
  font-size: 14px;
  cursor: pointer;
  border: none;
  background: transparent;
  text-align: left;
  width: 100%;
}

.nav-item:hover {
  background: var(--bg-color);
  color: var(--text-primary);
}

.nav-item.active {
  background: var(--primary-light);
  color: var(--primary-color);
  font-weight: 500;
}

.sidebar-bottom {
  padding: 8px;
  border-top: 1px solid var(--border-color);
}

.collapse-btn {
  color: var(--text-secondary);
}

/* 主内容区 */
.main-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 顶部栏 */
.topbar {
  height: 60px;
  background: var(--sidebar-bg);
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  flex-shrink: 0;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 320px;
  height: 38px;
  padding: 0 14px;
  background: var(--bg-color);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  color: var(--text-secondary);
  font-size: 13px;
  cursor: pointer;
}

.search-box kbd {
  margin-left: auto;
  padding: 2px 6px;
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  font-size: 11px;
}

.topbar-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.icon-btn {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  border: 1px solid var(--border-color);
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-btn:hover {
  background: var(--bg-color);
  color: var(--text-primary);
}

.recharge-btn {
  height: 38px;
  padding: 0 18px;
  background: linear-gradient(135deg, #2b7fff, #1a5fd9);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}

.recharge-btn:hover {
  opacity: 0.9;
}

.credits-btn {
  height: 38px;
  padding: 0 14px;
  background: var(--bg-color);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
}

.credits-num {
  font-size: 15px;
  font-weight: 600;
  color: var(--primary-color);
}

.credits-label {
  font-size: 12px;
  color: var(--text-secondary);
}

.login-btn {
  height: 38px;
  padding: 0 16px;
  background: transparent;
  border: 1px solid var(--border-color);
  border-radius: 10px;
  color: var(--text-primary);
  font-size: 14px;
  cursor: pointer;
}

.login-btn:hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 10px;
}

.user-info:hover {
  background: var(--bg-color);
}

.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #2b7fff, #6ba8ff);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
}

.username {
  font-size: 14px;
  color: var(--text-primary);
}

/* 内容区 */
.content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}
</style>
