<template>
  <el-dialog
    :model-value="visible"
    @update:model-value="$emit('update:visible', $event)"
    width="460px"
    class="recharge-dialog"
  >
    <div class="recharge-header">
      <h3>积分充值</h3>
      <p>当前余额 <span class="balance">{{ userStore.credits }}</span> 积分</p>
    </div>

    <div class="package-grid">
      <div
        v-for="pkg in packages"
        :key="pkg.credits"
        class="package-card"
        :class="{ active: selectedPackage === pkg.credits, popular: pkg.popular }"
        @click="selectPackage(pkg)"
      >
        <div class="package-credits">{{ pkg.credits }}<span>积分</span></div>
        <div class="package-price">¥{{ pkg.price }}</div>
        <div v-if="pkg.popular" class="popular-tag">最受欢迎</div>
      </div>

      <div class="package-card custom" :class="{ active: selectedPackage === 'custom' }" @click="selectedPackage = 'custom'">
        <div class="custom-label">自定义金额</div>
        <div class="custom-input">
          <span class="yuan">¥</span>
          <input v-model.number="customAmount" type="number" min="1" placeholder="输入金额" @click.stop />
        </div>
        <div class="custom-rate">按 1 元 = 10 积分到账</div>
      </div>
    </div>

    <div class="payment-section">
      <div class="payment-label">支付方式</div>
      <div class="payment-method" :class="{ active: true }">
        <div class="alipay-icon">支</div>
        <span>支付宝</span>
        <el-icon class="check-icon"><Check /></el-icon>
      </div>
    </div>

    <el-button
      type="primary"
      size="large"
      class="pay-btn"
      :loading="loading"
      @click="handlePay"
    >
      立即支付 ¥{{ payAmount }}
    </el-button>

    <p class="pay-tip">点击支付后将前往支付宝收银台完成付款 · 自定义金额按 1 元 = 10 积分到账</p>
  </el-dialog>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { creditApi } from '@/api'

const props = defineProps({ visible: Boolean })
const emit = defineEmits(['update:visible'])

const userStore = useUserStore()
const loading = ref(false)
const selectedPackage = ref(500)
const customAmount = ref(10)

const packages = [
  { credits: 100, price: 10 },
  { credits: 500, price: 49, popular: true },
  { credits: 1000, price: 98 }
]

const payAmount = computed(() => {
  if (selectedPackage.value === 'custom') {
    return customAmount.value || 0
  }
  const pkg = packages.find(p => p.credits === selectedPackage.value)
  return pkg?.price || 0
})

function selectPackage(pkg) {
  selectedPackage.value = pkg.credits
}

async function handlePay() {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    userStore.showLoginDialog = true
    return
  }
  if (payAmount.value <= 0) {
    ElMessage.warning('请选择充值金额')
    return
  }

  loading.value = true
  try {
    // 模拟支付：直接调用充值接口
    const res = await creditApi.recharge({ amount: payAmount.value })
    userStore.updateCredits(res.new_balance)
    ElMessage.success(`充值成功，获得 ${res.credits_added} 积分`)
    emit('update:visible', false)
  } catch (err) {
    // 错误已处理
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.recharge-dialog :deep(.el-dialog__body) {
  padding: 0 24px 24px;
}

.recharge-header {
  background: linear-gradient(135deg, #2b7fff, #1a5fd9);
  margin: -20px -24px 20px;
  padding: 24px;
  border-radius: 12px 12px 0 0;
  color: white;
}

.recharge-header h3 {
  font-size: 18px;
  margin-bottom: 6px;
}

.recharge-header p {
  font-size: 13px;
  opacity: 0.9;
}

.balance {
  font-size: 18px;
  font-weight: 600;
}

.package-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 20px;
}

.package-card {
  position: relative;
  border: 2px solid var(--border-color);
  border-radius: 10px;
  padding: 16px;
  cursor: pointer;
  text-align: center;
  transition: all 0.2s;
}

.package-card:hover {
  border-color: var(--primary-color);
}

.package-card.active {
  border-color: var(--primary-color);
  background: var(--primary-light);
}

.package-credits {
  font-size: 22px;
  font-weight: 700;
  margin-bottom: 4px;
}

.package-credits span {
  font-size: 13px;
  font-weight: 400;
  color: var(--text-secondary);
  margin-left: 2px;
}

.package-price {
  color: var(--primary-color);
  font-size: 16px;
  font-weight: 600;
}

.popular-tag {
  position: absolute;
  top: -1px;
  right: -1px;
  background: linear-gradient(135deg, #ff6b6b, #ff8e53);
  color: white;
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 0 10px 0 8px;
}

.custom {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 6px;
}

.custom-label {
  font-size: 14px;
  color: var(--text-secondary);
}

.custom-input {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.custom-input .yuan {
  font-size: 18px;
  font-weight: 600;
}

.custom-input input {
  width: 80px;
  border: none;
  background: transparent;
  font-size: 20px;
  font-weight: 700;
  text-align: center;
  outline: none;
}

.custom-rate {
  font-size: 11px;
  color: var(--text-secondary);
}

.payment-section {
  margin-bottom: 20px;
}

.payment-label {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 10px;
}

.payment-method {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border: 2px solid var(--border-color);
  border-radius: 10px;
  cursor: pointer;
}

.payment-method.active {
  border-color: var(--primary-color);
}

.alipay-icon {
  width: 28px;
  height: 28px;
  background: #1677ff;
  border-radius: 6px;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 14px;
}

.check-icon {
  margin-left: auto;
  color: var(--primary-color);
}

.pay-btn {
  width: 100%;
  height: 46px;
  font-size: 16px;
  background: linear-gradient(135deg, #2b7fff, #1a5fd9);
  border: none;
}

.pay-tip {
  text-align: center;
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 12px;
}
</style>
