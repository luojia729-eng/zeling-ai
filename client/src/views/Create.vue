<template>
  <div class="create-page">
    <!-- 顶部 Tab -->
    <div class="create-tabs">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        class="tab-btn"
        :class="{ active: activeTab === tab.key }"
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
      </button>
      <button class="credits-indicator" @click="$emit('showRecharge')">
        <el-icon><Coin /></el-icon>
        {{ userStore.credits }} 积分
      </button>
    </div>

    <div class="create-content">
      <!-- 左侧：创作面板 -->
      <div class="create-panel">
        <h2 class="panel-title">{{ currentTabLabel }}</h2>

        <!-- 模型选择 -->
        <div class="section">
          <div class="section-label">选择模型</div>
          <div class="model-grid">
            <div
              v-for="model in currentModels"
              :key="model.id"
              class="model-card"
              :class="{ active: selectedModel?.id === model.id }"
              @click="selectModel(model)"
            >
              <div class="model-name">{{ model.name }}</div>
              <div class="model-meta">
                <span class="model-type">{{ model.description }}</span>
                <span class="model-price">{{ getModelPriceText(model) }}</span>
              </div>
              <div class="model-favorite" @click.stop>
                <el-icon :size="14"><Star /></el-icon>
              </div>
            </div>
          </div>
        </div>

        <!-- 参考素材 -->
        <div class="section">
          <div class="section-label">参考素材（点击上传或 Ctrl+V 粘贴）</div>
          <div class="upload-area">
            <div
              v-for="(img, idx) in refImages"
              :key="idx"
              class="upload-item"
            >
              <img :src="resolveFileUrl(img)" alt="参考图" />
              <button class="remove-btn" @click="removeRefImage(idx)">×</button>
            </div>
            <div v-if="refImages.length < 9" class="upload-btn" @click="triggerUpload">
              <el-icon :size="24"><Plus /></el-icon>
              <span>上传</span>
            </div>
            <input ref="fileInput" type="file" accept="image/*" multiple hidden @change="handleFileUpload" />
          </div>
          <div class="upload-count">{{ refImages.length }} / 9</div>
        </div>

        <!-- 参数设置 -->
        <div class="section params-section">
          <div class="param-row">
            <div class="param-label">比例</div>
            <div class="param-options">
              <button
                v-for="ratio in availableRatios"
                :key="ratio"
                class="param-btn"
                :class="{ active: params.aspect_ratio === ratio }"
                @click="params.aspect_ratio = ratio"
              >
                {{ ratio }}
              </button>
            </div>
          </div>

          <div class="param-row" v-if="availableResolutions.length > 0">
            <div class="param-label">清晰度</div>
            <div class="param-options">
              <button
                v-for="res in availableResolutions"
                :key="res"
                class="param-btn"
                :class="{ active: params.resolution === res }"
                @click="params.resolution = res"
              >
                {{ res }}
                <span class="param-price">· {{ getResolutionPrice(res) }}积分/次</span>
              </button>
            </div>
          </div>

          <div class="param-row" v-if="activeTab === 'image'">
            <div class="param-label">生成数量</div>
            <div class="param-options">
              <button
                v-for="n in [1, 2, 3, 4]"
                :key="n"
                class="param-btn"
                :class="{ active: params.count === n }"
                @click="params.count = n"
              >
                {{ n }}
              </button>
            </div>
          </div>
        </div>

        <!-- 提示词 -->
        <div class="section">
          <div class="prompt-header">
            <span class="section-label">提示词</span>
            <button class="clear-btn" @click="prompt = ''">清空</button>
          </div>
          <textarea
            v-model="prompt"
            class="prompt-input"
            placeholder="描述你想要生成的内容，越详细效果越好…"
            maxlength="32000"
            rows="5"
          ></textarea>
          <div class="prompt-count">{{ prompt.length }}/32000</div>
        </div>

        <!-- 生成按钮 -->
        <div class="generate-section">
          <button
            class="generate-btn"
            :class="{ disabled: !canGenerate }"
            :disabled="!canGenerate || generating"
            @click="handleGenerate"
          >
            <template v-if="generating">
              <el-icon class="loading-icon"><Loading /></el-icon>
              生成中…
            </template>
            <template v-else>
              {{ generateBtnText }}
            </template>
          </button>
          <div class="cost-estimate" v-if="estimatedCost > 0">
            预估消耗 <strong>{{ estimatedCost }}</strong> 积分
            <span v-if="!userStore.isLoggedIn" class="login-tip">· 登录后可生成</span>
            <span v-else-if="userStore.credits < estimatedCost" class="insufficient-tip">
              · 积分不足，<a @click="$emit('showRecharge')">点击充值</a>
            </span>
          </div>
        </div>
      </div>

      <!-- 右侧：任务日志 -->
      <div class="task-panel">
        <div class="task-header">
          <span>任务日志</span>
          <span class="task-count">共 {{ tasks.length }} 条</span>
          <div class="task-actions">
            <button class="icon-btn" @click="fetchTasks" title="刷新">
              <el-icon><Refresh /></el-icon>
            </button>
            <el-select v-model="statusFilter" size="small" class="filter-select" @change="fetchTasks">
              <el-option label="全部" value="" />
              <el-option label="生成中" value="generating" />
              <el-option label="已完成" value="completed" />
              <el-option label="失败" value="failed" />
            </el-select>
            <el-select v-model="typeFilter" size="small" class="filter-select" @change="fetchTasks">
              <el-option label="全部" value="" />
              <el-option label="图片" value="image" />
              <el-option label="视频" value="video" />
            </el-select>
          </div>
        </div>

        <div class="task-list" v-if="tasks.length > 0">
          <div v-for="task in tasks" :key="task.id" class="task-item">
            <div class="task-thumb" v-if="task.media_url">
              <img v-if="task.type === 'image'" :src="task.media_url" alt="结果" />
              <video v-else :src="task.media_url" controls></video>
            </div>
            <div class="task-thumb placeholder" v-else>
              <el-icon :size="32"><Picture /></el-icon>
            </div>
            <div class="task-info">
              <div class="task-model">{{ getModelName(task.model) }}</div>
              <div class="task-prompt text-ellipsis">{{ task.prompt }}</div>
              <div class="task-meta">
                <span class="task-status" :class="task.status">{{ getStatusText(task.status) }}</span>
                <span v-if="task.status === 'in_progress'" class="task-progress">{{ task.progress }}%</span>
                <span class="task-credits">-{{ task.credits_charged }}积分</span>
                <span class="task-time">{{ task.created_at }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="task-empty" v-else>
          <el-icon :size="48"><FolderOpened /></el-icon>
          <p>暂无任务</p>
          <p class="empty-tip">生成的作品会显示在这里</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { modelApi, taskApi, uploadApi, resolveFileUrl } from '@/api'

const emit = defineEmits(['showRecharge'])

const userStore = useUserStore()

const tabs = [
  { key: 'image', label: '创作图片' },
  { key: 'video', label: '创作视频/按次' },
  { key: 'videoPerSec', label: '创作视频/按秒' }
]

const activeTab = ref('image')
const models = ref({ image: [], video: [], videoPerSec: [] })
const selectedModel = ref(null)
const refImages = ref([])
const prompt = ref('')
const generating = ref(false)
const fileInput = ref(null)

const params = reactive({
  aspect_ratio: '1:1',
  resolution: '1K',
  count: 1,
  duration: 5
})

// 任务列表
const tasks = ref([])
const statusFilter = ref('')
const typeFilter = ref('')

const currentTabLabel = computed(() => tabs.find(t => t.key === activeTab.value)?.label || '')
const currentModels = computed(() => models.value[activeTab.value] || [])

const availableRatios = computed(() => selectedModel.value?.aspect_ratios || ['1:1'])
const availableResolutions = computed(() => selectedModel.value?.resolutions || [])

const estimatedCost = computed(() => {
  if (!selectedModel.value) return 0
  const model = selectedModel.value
  if (model.type === 'image') {
    let unit = model.price || 2
    if (model.resolution_prices && params.resolution) {
      unit = model.resolution_prices[params.resolution] || unit
    }
    return unit * params.count
  }
  if (model.type === 'video') {
    return model.price || 12
  }
  if (model.type === 'videoPerSec') {
    const perSec = model.resolution_prices
      ? (model.resolution_prices[params.resolution] || model.price || 2)
      : (model.price || 2)
    return perSec * 1.05 * (params.duration || 5)
  }
  return 0
})

const canGenerate = computed(() => {
  return selectedModel.value && prompt.value.trim() && userStore.isLoggedIn && userStore.credits >= estimatedCost.value
})

const generateBtnText = computed(() => {
  if (!userStore.isLoggedIn) return '登录后生成'
  if (!selectedModel.value) return '请选择模型'
  if (!prompt.value.trim()) return '请输入提示词'
  if (userStore.credits < estimatedCost.value) return '积分不足'
  return `立即生成（预估 ${estimatedCost.value} 积分）`
})

function getModelPriceText(model) {
  if (model.resolution_prices) {
    const prices = Object.values(model.resolution_prices)
    return `${Math.min(...prices)}-${Math.max(...prices)} 积分/次`
  }
  return `${model.price} 积分/次`
}

function getResolutionPrice(res) {
  if (selectedModel.value?.resolution_prices) {
    return selectedModel.value.resolution_prices[res] || ''
  }
  return selectedModel.value?.price || ''
}

function getModelName(modelId) {
  const all = [...models.value.image, ...models.value.video, ...models.value.videoPerSec]
  return all.find(m => m.id === modelId)?.name || modelId
}

function getStatusText(status) {
  const map = { queued: '排队中', in_progress: '生成中', completed: '已完成', failed: '失败' }
  return map[status] || status
}

function selectModel(model) {
  selectedModel.value = model
  params.aspect_ratio = model.aspect_ratios[0]
  if (model.resolutions?.length) {
    params.resolution = model.resolutions[0]
  }
  if (model.durations?.length) {
    params.duration = model.durations[0]
  }
}

function triggerUpload() {
  fileInput.value?.click()
}

async function handleFileUpload(e) {
  const files = Array.from(e.target.files)
  for (const file of files) {
    if (refImages.value.length >= 9) break
    try {
      const res = await uploadApi.upload(file)
      refImages.value.push(res.url)
    } catch (err) {
      // 错误已处理
    }
  }
  e.target.value = ''
}

function removeRefImage(idx) {
  refImages.value.splice(idx, 1)
}

async function handleGenerate() {
  if (!userStore.isLoggedIn) {
    userStore.showLoginDialog = true
    return
  }
  if (!selectedModel.value || !prompt.value.trim()) return
  if (userStore.credits < estimatedCost.value) {
    emit('showRecharge')
    return
  }

  generating.value = true
  try {
    const taskData = {
      type: activeTab.value === 'image' ? 'image' : 'video',
      model: selectedModel.value.id,
      prompt: prompt.value,
      aspect_ratio: params.aspect_ratio,
      resolution: params.resolution,
      count: params.count,
      image_refs: refImages.value
    }
    if (activeTab.value !== 'image') {
      taskData.duration = params.duration
    }

    await taskApi.create(taskData)
    ElMessage.success('任务已提交')
    await userStore.refreshCredits()
    fetchTasks()
  } catch (err) {
    // 错误已处理
  } finally {
    generating.value = false
  }
}

async function fetchTasks() {
  if (!userStore.isLoggedIn) return
  try {
    const params = {}
    if (statusFilter.value) params.status = statusFilter.value
    if (typeFilter.value) params.type = typeFilter.value
    const res = await taskApi.list(params)
    tasks.value = res.tasks
  } catch (err) {
    // 错误已处理
  }
}

// 轮询任务状态
let pollTimer = null
function startPolling() {
  stopPolling()
  pollTimer = setInterval(() => {
    const hasGenerating = tasks.value.some(t => t.status === 'queued' || t.status === 'in_progress')
    if (hasGenerating) {
      fetchTasks()
    }
  }, 2000)
}

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
}

watch(activeTab, () => {
  selectedModel.value = null
  params.aspect_ratio = '1:1'
  params.resolution = '1K'
})

onMounted(() => {
  // 加载模型（不阻塞任务列表）
  modelApi.getModels().then(res => {
    models.value = res
    if (res.image?.length) {
      selectModel(res.image[0])
    }
  }).catch(() => {})

  // 加载任务列表
  if (userStore.isLoggedIn) {
    fetchTasks()
    startPolling()
  }
})

// 监听登录状态
watch(() => userStore.isLoggedIn, (val) => {
  if (val) {
    fetchTasks()
    startPolling()
  } else {
    stopPolling()
    tasks.value = []
  }
})
</script>

<style scoped>
.create-page {
  max-width: 1400px;
  margin: 0 auto;
}

.create-tabs {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 20px;
}

.tab-btn {
  padding: 10px 20px;
  border: 1px solid var(--border-color);
  background: var(--card-bg);
  border-radius: 10px;
  font-size: 14px;
  cursor: pointer;
  color: var(--text-secondary);
}

.tab-btn.active {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
  font-weight: 500;
}

.credits-indicator {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  font-size: 14px;
  cursor: pointer;
  color: var(--primary-color);
  font-weight: 500;
}

.create-content {
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 20px;
}

.create-panel {
  background: var(--card-bg);
  border-radius: 12px;
  padding: 24px;
  border: 1px solid var(--border-color);
}

.panel-title {
  font-size: 22px;
  font-weight: 700;
  margin-bottom: 20px;
}

.section {
  margin-bottom: 24px;
}

.section-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 12px;
}

.model-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.model-card {
  position: relative;
  padding: 14px;
  border: 2px solid var(--border-color);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
}

.model-card:hover {
  border-color: var(--primary-color);
}

.model-card.active {
  border-color: var(--primary-color);
  background: var(--primary-light);
}

.model-name {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 6px;
}

.model-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.model-type {
  font-size: 11px;
  padding: 2px 8px;
  background: var(--bg-color);
  border-radius: 4px;
  color: var(--text-secondary);
}

.model-price {
  font-size: 12px;
  color: #f59e0b;
  font-weight: 500;
}

.model-favorite {
  position: absolute;
  top: 10px;
  right: 10px;
  color: #ccc;
  cursor: pointer;
}

.upload-area {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  min-height: 80px;
}

.upload-item {
  position: relative;
  width: 72px;
  height: 72px;
  border-radius: 8px;
  overflow: hidden;
}

.upload-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.remove-btn {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  border: none;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.upload-btn {
  width: 72px;
  height: 72px;
  border: 2px dashed var(--border-color);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  cursor: pointer;
  color: var(--text-secondary);
  font-size: 12px;
}

.upload-btn:hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.upload-count {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 8px;
}

.params-section {
  background: var(--bg-color);
  border-radius: 10px;
  padding: 16px;
}

.param-row {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 16px;
}

.param-row:last-child {
  margin-bottom: 0;
}

.param-label {
  width: 60px;
  font-size: 14px;
  color: var(--text-secondary);
  padding-top: 6px;
  flex-shrink: 0;
}

.param-options {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.param-btn {
  padding: 6px 14px;
  border: 1px solid var(--border-color);
  background: var(--card-bg);
  border-radius: 8px;
  font-size: 13px;
  cursor: pointer;
  color: var(--text-primary);
}

.param-btn:hover {
  border-color: var(--primary-color);
}

.param-btn.active {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

.param-price {
  font-size: 11px;
  opacity: 0.8;
  margin-left: 2px;
}

.prompt-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.clear-btn {
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: 13px;
  cursor: pointer;
}

.clear-btn:hover {
  color: var(--danger-color);
}

.prompt-input {
  width: 100%;
  padding: 14px;
  border: 1px solid var(--border-color);
  border-radius: 10px;
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
  background: var(--card-bg);
  color: var(--text-primary);
  outline: none;
}

.prompt-input:focus {
  border-color: var(--primary-color);
}

.prompt-count {
  text-align: right;
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 6px;
}

.generate-section {
  text-align: center;
}

.generate-btn {
  width: 100%;
  height: 48px;
  background: linear-gradient(135deg, #2b7fff, #1a5fd9);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.generate-btn:hover:not(.disabled) {
  opacity: 0.9;
}

.generate-btn.disabled {
  background: var(--border-color);
  cursor: not-allowed;
}

.loading-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.cost-estimate {
  margin-top: 12px;
  font-size: 13px;
  color: var(--text-secondary);
}

.cost-estimate strong {
  color: var(--primary-color);
  font-size: 15px;
}

.insufficient-tip {
  color: var(--danger-color);
}

.insufficient-tip a {
  color: var(--primary-color);
  cursor: pointer;
}

/* 任务面板 */
.task-panel {
  background: var(--card-bg);
  border-radius: 12px;
  border: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 180px);
}

.task-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px;
  border-bottom: 1px solid var(--border-color);
  font-weight: 600;
  font-size: 15px;
}

.task-count {
  font-size: 12px;
  color: var(--text-secondary);
  font-weight: 400;
}

.task-actions {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 8px;
}

.icon-btn {
  width: 32px;
  height: 32px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
}

.filter-select {
  width: 90px;
}

.task-list {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

.task-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  border-radius: 10px;
  margin-bottom: 10px;
  background: var(--bg-color);
}

.task-thumb {
  width: 64px;
  height: 64px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
}

.task-thumb img,
.task-thumb video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.task-thumb.placeholder {
  background: var(--border-color);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
}

.task-info {
  flex: 1;
  min-width: 0;
}

.task-model {
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 4px;
}

.task-prompt {
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 6px;
}

.task-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  color: var(--text-secondary);
  flex-wrap: wrap;
}

.task-status {
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 500;
}

.task-status.queued {
  background: #fef3c7;
  color: #92400e;
}

.task-status.in_progress {
  background: #dbeafe;
  color: #1e40af;
}

.task-status.completed {
  background: #d1fae5;
  color: #065f46;
}

.task-status.failed {
  background: #fee2e2;
  color: #991b1b;
}

.task-progress {
  color: var(--primary-color);
  font-weight: 500;
}

.task-credits {
  color: #f59e0b;
}

.task-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  gap: 8px;
}

.task-empty p {
  font-size: 14px;
}

.empty-tip {
  font-size: 12px !important;
  opacity: 0.7;
}
</style>
