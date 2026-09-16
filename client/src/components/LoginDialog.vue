<template>
  <el-dialog
    :model-value="visible"
    @update:model-value="$emit('update:visible', $event)"
    width="420px"
    :show-close="true"
    class="login-dialog"
  >
    <div class="login-header">
      <div class="login-logo">✦</div>
      <h2>{{ isRegister ? '注册账号' : '欢迎登录' }}</h2>
      <p>使用邮箱{{ isRegister ? '注册 ZeLing AI' : '登录 ZeLing AI' }}</p>
    </div>

    <el-form @submit.prevent="handleSubmit">
      <el-form-item>
        <el-input
          v-model="form.email"
          placeholder="邮箱地址"
          size="large"
          type="email"
        />
      </el-form-item>
      <el-form-item v-if="isRegister">
        <el-input
          v-model="form.nickname"
          placeholder="昵称（选填）"
          size="large"
        />
      </el-form-item>
      <el-form-item>
        <el-input
          v-model="form.password"
          type="password"
          placeholder="请输入密码（至少 6 位）"
          size="large"
          show-password
        />
      </el-form-item>
      <el-form-item v-if="isRegister">
        <el-input
          v-model="form.confirmPassword"
          type="password"
          placeholder="确认密码"
          size="large"
          show-password
        />
      </el-form-item>
      <div v-if="!isRegister" class="form-options">
        <el-checkbox v-model="rememberMe">记住账号密码</el-checkbox>
        <a class="forgot-link">忘记密码？</a>
      </div>
      <el-button
        type="primary"
        size="large"
        class="submit-btn"
        :loading="loading"
        @click="handleSubmit"
      >
        {{ isRegister ? '注册' : '登录' }}
      </el-button>
    </el-form>

    <div class="login-footer">
      <span>{{ isRegister ? '已有账号？' : '还没有账号？' }}</span>
      <a @click="toggleMode" class="register-link">{{ isRegister ? '去登录' : '立即注册' }}</a>
    </div>

    <div class="login-agreement">
      登录即代表同意 <a>《服务协议》</a> 与 <a>《隐私政策》</a>
    </div>
  </el-dialog>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'

const props = defineProps({ visible: Boolean })
const emit = defineEmits(['update:visible'])

const userStore = useUserStore()
const isRegister = ref(false)
const loading = ref(false)
const rememberMe = ref(false)

const form = reactive({ email: '', password: '', confirmPassword: '', nickname: '' })

function toggleMode() {
  isRegister.value = !isRegister.value
  form.password = ''
  form.confirmPassword = ''
}

async function handleSubmit() {
  if (!form.email || !form.password) {
    ElMessage.warning('请输入邮箱和密码')
    return
  }
  if (form.password.length < 6) {
    ElMessage.warning('密码至少 6 位')
    return
  }
  if (isRegister.value && form.password !== form.confirmPassword) {
    ElMessage.warning('两次输入的密码不一致')
    return
  }

  loading.value = true
  try {
    if (isRegister.value) {
      await userStore.register(form.email, form.password, form.nickname || undefined)
      ElMessage.success('注册成功，已自动登录')
    } else {
      await userStore.login(form.email, form.password)
      ElMessage.success('登录成功')
    }
    emit('update:visible', false)
  } catch (err) {
    // 错误已在拦截器处理
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-dialog :deep(.el-dialog__body) {
  padding: 0 30px 30px;
}

.login-header {
  text-align: center;
  padding: 30px 0 20px;
}

.login-logo {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #ff6b6b, #ff8e53);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
  margin: 0 auto 16px;
}

.login-header h2 {
  font-size: 22px;
  margin-bottom: 6px;
}

.login-header p {
  color: var(--text-secondary);
  font-size: 14px;
}

.login-tabs {
  margin-bottom: 10px;
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  font-size: 13px;
}

.forgot-link {
  color: var(--primary-color);
  cursor: pointer;
}

.code-input-wrap {
  display: flex;
  gap: 10px;
}

.code-input-wrap .el-input {
  flex: 1;
}

.submit-btn {
  width: 100%;
  height: 44px;
  font-size: 16px;
  background: linear-gradient(135deg, #2b7fff, #1a5fd9);
  border: none;
}

.login-footer {
  text-align: center;
  margin-top: 20px;
  font-size: 14px;
  color: var(--text-secondary);
}

.register-link {
  color: var(--primary-color);
  cursor: pointer;
  margin-left: 4px;
}

.login-agreement {
  text-align: center;
  margin-top: 16px;
  font-size: 12px;
  color: var(--text-secondary);
}

.login-agreement a {
  color: var(--primary-color);
  cursor: pointer;
}
</style>
