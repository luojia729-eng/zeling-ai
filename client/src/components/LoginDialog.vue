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
      <h2>欢迎登录 / 注册</h2>
      <p>使用邮箱继续登录 ZeLing AI</p>
    </div>

    <el-tabs v-model="activeTab" class="login-tabs">
      <el-tab-pane label="密码登录" name="password">
        <el-form @submit.prevent="handleLogin">
          <el-form-item>
            <el-input
              v-model="loginForm.email"
              placeholder="邮箱地址"
              size="large"
              type="email"
            />
          </el-form-item>
          <el-form-item>
            <el-input
              v-model="loginForm.password"
              type="password"
              placeholder="请输入密码（至少 6 位）"
              size="large"
              show-password
            />
          </el-form-item>
          <div class="form-options">
            <el-checkbox v-model="rememberMe">记住账号密码</el-checkbox>
            <a class="forgot-link">忘记密码？</a>
          </div>
          <el-button
            type="primary"
            size="large"
            class="submit-btn"
            :loading="loading"
            @click="handleLogin"
          >
            登录
          </el-button>
        </el-form>
      </el-tab-pane>

      <el-tab-pane label="邮箱登录" name="code">
        <el-form @submit.prevent="handleCodeLogin">
          <el-form-item>
            <el-input
              v-model="codeForm.email"
              placeholder="邮箱地址"
              size="large"
              type="email"
            />
          </el-form-item>
          <el-form-item>
            <div class="code-input-wrap">
              <el-input
                v-model="codeForm.code"
                placeholder="验证码"
                size="large"
              />
              <el-button
                size="large"
                :disabled="codeCountdown > 0"
                @click="sendCode"
              >
                {{ codeCountdown > 0 ? `${codeCountdown}s` : '获取验证码' }}
              </el-button>
            </div>
          </el-form-item>
          <el-button
            type="primary"
            size="large"
            class="submit-btn"
            :loading="loading"
            @click="handleCodeLogin"
          >
            登录 / 注册
          </el-button>
        </el-form>
      </el-tab-pane>
    </el-tabs>

    <div class="login-footer">
      <span>还没有账号？</span>
      <a @click="activeTab = 'code'" class="register-link">立即注册</a>
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
const activeTab = ref('password')
const loading = ref(false)
const rememberMe = ref(false)
const codeCountdown = ref(0)

const loginForm = reactive({ email: '', password: '' })
const codeForm = reactive({ email: '', code: '' })

async function handleLogin() {
  if (!loginForm.email || !loginForm.password) {
    ElMessage.warning('请输入邮箱和密码')
    return
  }
  loading.value = true
  try {
    await userStore.login(loginForm.email, loginForm.password)
    ElMessage.success('登录成功')
    emit('update:visible', false)
  } catch (err) {
    // 错误已在拦截器处理
  } finally {
    loading.value = false
  }
}

function sendCode() {
  if (!codeForm.email) {
    ElMessage.warning('请输入邮箱')
    return
  }
  ElMessage.info('验证码功能演示中，注册请使用密码登录标签页')
  codeCountdown.value = 60
  const timer = setInterval(() => {
    codeCountdown.value--
    if (codeCountdown.value <= 0) clearInterval(timer)
  }, 1000)
}

async function handleCodeLogin() {
  ElMessage.info('验证码登录演示中，请使用密码登录或注册')
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
