<template>
  <div class="settings-page">
    <h1 class="page-title">设置</h1>

    <!-- 用户信息卡片 -->
    <div class="user-card card">
      <div class="user-avatar">{{ avatarText }}</div>
      <div class="user-details">
        <div class="user-name">{{ userStore.user?.nickname || '未登录' }}</div>
        <div class="user-email">{{ userStore.user?.email || '' }}</div>
      </div>
      <div class="user-stats">
        <div class="stat-item">
          <div class="stat-value">{{ userStore.credits }}</div>
          <div class="stat-label">积分余额</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ registerDate }}</div>
          <div class="stat-label">注册日期</div>
        </div>
      </div>
    </div>

    <!-- 个人资料 -->
    <div class="settings-section card">
      <h3>个人资料</h3>
      <p class="section-desc">头像与昵称会展示在创作记录与评论中</p>

      <el-form label-width="100px">
        <el-form-item label="昵称">
          <el-input v-model="profileForm.nickname" maxlength="50" />
          <span class="char-count">{{ profileForm.nickname.length }}/50</span>
        </el-form-item>
        <el-form-item label="头像 URL">
          <el-input v-model="profileForm.avatar" placeholder="留空使用默认渐变头像" />
        </el-form-item>
        <el-form-item label="预设头像">
          <div class="avatar-presets">
            <div
              v-for="(color, idx) in presetColors"
              :key="idx"
              class="preset-avatar"
              :style="{ background: color }"
              @click="selectPresetAvatar(color)"
            >
              {{ avatarText }}
            </div>
          </div>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="saveProfile">保存修改</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 创作偏好 -->
    <div class="settings-section card">
      <h3>创作偏好</h3>
      <p class="section-desc">应用于性价比创作的生成结果</p>

      <div class="preference-item">
        <div class="preference-info">
          <div class="preference-title">作品水印</div>
          <div class="preference-desc">在生成的图片 / 视频右下角添加「则灵 AI」水印</div>
        </div>
        <el-switch v-model="profileForm.watermark_enabled" @change="saveProfile" />
      </div>
    </div>

    <!-- 通知偏好 -->
    <div class="settings-section card">
      <h3>通知偏好</h3>
      <p class="section-desc">选择你希望接收的通知类型</p>

      <div class="preference-item" v-for="item in notificationItems" :key="item.key">
        <div class="preference-info">
          <div class="preference-title">{{ item.title }}</div>
          <div class="preference-desc">{{ item.desc }}</div>
        </div>
        <el-switch v-model="notificationForm[item.key]" @change="saveNotifications" />
      </div>
    </div>

    <!-- 账户安全 -->
    <div class="settings-section card">
      <h3>账户安全</h3>
      <p class="section-desc">登录方式与账户管理</p>

      <div class="security-item">
        <div class="security-info">
          <div class="security-title">登录方式</div>
          <div class="security-desc">邮箱验证码 / 密码登录</div>
        </div>
        <el-tag type="success">已启用</el-tag>
      </div>

      <div class="security-item">
        <div class="security-info">
          <div class="security-title">修改密码</div>
          <div class="security-desc">通过注册邮箱验证码验证身份后设置新密码</div>
        </div>
        <el-button @click="showPasswordDialog = true">修改密码</el-button>
      </div>

      <div class="security-item danger">
        <div class="security-info">
          <div class="security-title">注销账户</div>
          <div class="security-desc">注销后所有作品与积分将被永久删除，且无法恢复</div>
        </div>
        <el-button type="danger" plain @click="handleDeleteAccount">申请注销</el-button>
      </div>
    </div>

    <!-- 修改密码弹窗 -->
    <el-dialog v-model="showPasswordDialog" title="修改密码" width="400px">
      <el-form>
        <el-form-item label="原密码">
          <el-input v-model="passwordForm.old_password" type="password" show-password />
        </el-form-item>
        <el-form-item label="新密码">
          <el-input v-model="passwordForm.new_password" type="password" show-password placeholder="至少 6 位" />
        </el-form-item>
        <el-form-item label="确认密码">
          <el-input v-model="passwordForm.confirm_password" type="password" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showPasswordDialog = false">取消</el-button>
        <el-button type="primary" @click="changePassword">确认修改</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { authApi } from '@/api'

const userStore = useUserStore()

const showPasswordDialog = ref(false)

const profileForm = reactive({
  nickname: '',
  avatar: '',
  watermark_enabled: false
})

const notificationForm = reactive({
  notify_system: true,
  notify_task: true,
  notify_marketing: false
})

const passwordForm = reactive({
  old_password: '',
  new_password: '',
  confirm_password: ''
})

const presetColors = [
  'linear-gradient(135deg, #2b7fff, #6ba8ff)',
  'linear-gradient(135deg, #10b981, #34d399)',
  'linear-gradient(135deg, #f59e0b, #fbbf24)',
  'linear-gradient(135deg, #ef4444, #f87171)',
  'linear-gradient(135deg, #8b5cf6, #a78bfa)',
  'linear-gradient(135deg, #06b6d4, #22d3ee)'
]

const notificationItems = [
  { key: 'notify_system', title: '系统通知', desc: '账户安全、服务变更等重要提醒' },
  { key: 'notify_task', title: '任务完成通知', desc: '图片 / 视频生成完成后提醒' },
  { key: 'notify_marketing', title: '活动与营销', desc: '充值优惠、新功能上线等运营消息' }
]

const avatarText = computed(() => {
  const name = profileForm.nickname || userStore.user?.nickname || 'U'
  return name.charAt(0).toUpperCase()
})

const registerDate = computed(() => {
  return userStore.user?.created_at?.split(' ')[0] || '-'
})

function selectPresetAvatar(color) {
  // 预设头像用颜色标识，实际可存为 data URI
  profileForm.avatar = `preset:${color}`
  ElMessage.info('已选择预设头像，点击保存生效')
}

async function saveProfile() {
  if (!userStore.isLoggedIn) {
    userStore.showLoginDialog = true
    return
  }
  try {
    await authApi.updateProfile({
      nickname: profileForm.nickname,
      avatar: profileForm.avatar,
      watermark_enabled: profileForm.watermark_enabled
    })
    await userStore.fetchUser()
    ElMessage.success('保存成功')
  } catch (err) {
    // 错误已处理
  }
}

async function saveNotifications() {
  if (!userStore.isLoggedIn) return
  try {
    await authApi.updateNotifications({ ...notificationForm })
    ElMessage.success('通知偏好已保存')
  } catch (err) {
    // 错误已处理
  }
}

async function changePassword() {
  if (!passwordForm.old_password || !passwordForm.new_password) {
    ElMessage.warning('请填写完整')
    return
  }
  if (passwordForm.new_password !== passwordForm.confirm_password) {
    ElMessage.warning('两次密码不一致')
    return
  }
  try {
    await authApi.updatePassword({
      old_password: passwordForm.old_password,
      new_password: passwordForm.new_password
    })
    ElMessage.success('密码修改成功')
    showPasswordDialog.value = false
    passwordForm.old_password = ''
    passwordForm.new_password = ''
    passwordForm.confirm_password = ''
  } catch (err) {
    // 错误已处理
  }
}

async function handleDeleteAccount() {
  try {
    await ElMessageBox.confirm(
      '注销后所有作品与积分将被永久删除，且无法恢复。确定要注销账户吗？',
      '注销账户',
      { type: 'warning', confirmButtonText: '确认注销', cancelButtonText: '取消' }
    )
    ElMessage.info('注销功能演示中，请联系管理员')
  } catch {
    // 用户取消
  }
}

onMounted(() => {
  if (userStore.user) {
    profileForm.nickname = userStore.user.nickname
    profileForm.avatar = userStore.user.avatar
    profileForm.watermark_enabled = !!userStore.user.watermark_enabled
    notificationForm.notify_system = !!userStore.user.notify_system
    notificationForm.notify_task = !!userStore.user.notify_task
    notificationForm.notify_marketing = !!userStore.user.notify_marketing
  }
})
</script>

<style scoped>
.settings-page {
  max-width: 800px;
  margin: 0 auto;
}

.page-title {
  font-size: 26px;
  font-weight: 700;
  margin-bottom: 24px;
}

.user-card {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 24px;
  margin-bottom: 20px;
}

.user-avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: linear-gradient(135deg, #2b7fff, #6ba8ff);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: 700;
  flex-shrink: 0;
}

.user-details {
  flex: 1;
}

.user-name {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 4px;
}

.user-email {
  font-size: 14px;
  color: var(--text-secondary);
}

.user-stats {
  display: flex;
  gap: 32px;
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: 22px;
  font-weight: 700;
  color: var(--primary-color);
}

.stat-label {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 4px;
}

.settings-section {
  padding: 24px;
  margin-bottom: 20px;
}

.settings-section h3 {
  font-size: 17px;
  font-weight: 600;
  margin-bottom: 4px;
}

.section-desc {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 20px;
}

.char-count {
  font-size: 12px;
  color: var(--text-secondary);
  margin-left: 8px;
}

.avatar-presets {
  display: flex;
  gap: 12px;
}

.preset-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  border: 3px solid transparent;
  transition: border-color 0.2s;
}

.preset-avatar:hover {
  border-color: var(--primary-color);
}

.preference-item,
.security-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 0;
  border-bottom: 1px solid var(--border-color);
}

.preference-item:last-child,
.security-item:last-child {
  border-bottom: none;
}

.preference-info,
.security-info {
  flex: 1;
}

.preference-title,
.security-title {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 4px;
}

.preference-desc,
.security-desc {
  font-size: 12px;
  color: var(--text-secondary);
}

.security-item.danger .security-title {
  color: var(--danger-color);
}
</style>
