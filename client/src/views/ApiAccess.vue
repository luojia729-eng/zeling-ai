<template>
  <div class="api-page">
    <div class="page-header">
      <h1>API接入</h1>
      <p>通过 API Key 调用本站生成接口，按密钥归属账户计费</p>
      <button class="create-key-btn" @click="showCreateKey = true">
        <el-icon><Plus /></el-icon>
        创建 API Key
      </button>
    </div>

    <!-- API Key 列表 -->
    <div class="section card">
      <h3>访问密钥</h3>
      <p class="section-tip">完整密钥只在创建或重置时显示一次，请妥善保管。</p>

      <div v-if="apiKeys.length > 0" class="key-list">
        <div v-for="key in apiKeys" :key="key.id" class="key-item">
          <div class="key-info">
            <div class="key-name">{{ key.name }}</div>
            <div class="key-value">{{ maskKey(key.api_key) }}</div>
          </div>
          <div class="key-meta">
            <el-tag :type="key.status === 'active' ? 'success' : 'info'" size="small">
              {{ key.status === 'active' ? '正常' : '已停用' }}
            </el-tag>
            <span class="key-time">{{ key.created_at }}</span>
          </div>
          <div class="key-actions">
            <el-button size="small" @click="copyKey(key.api_key)">复制</el-button>
            <el-button size="small" type="warning" plain @click="disableKey(key.id)" v-if="key.status === 'active'">停用</el-button>
            <el-button size="small" type="danger" plain @click="deleteKey(key.id)">删除</el-button>
          </div>
        </div>
      </div>
      <div v-else class="empty-keys">
        <el-icon :size="36"><Key /></el-icon>
        <p>暂无 API Key</p>
        <p class="empty-tip">点击右上角创建你的第一个 API Key</p>
      </div>
    </div>

    <!-- 可调用模型 -->
    <div class="section card">
      <h3>可调用模型</h3>
      <div class="model-table-wrap">
        <table class="model-table">
          <thead>
            <tr>
              <th>客户端名称</th>
              <th>API 模型名称</th>
              <th>类型</th>
              <th>时长</th>
              <th>清晰度</th>
              <th>比例</th>
              <th>参考素材</th>
              <th>积分</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="model in allModels" :key="model.id">
              <td>{{ model.name }}</td>
              <td><code>{{ model.id }}</code></td>
              <td>{{ model.description }}</td>
              <td>{{ model.durations?.join('/') || '-' }}</td>
              <td>{{ model.resolutions?.join('/') || '-' }}</td>
              <td class="ratio-cell">{{ model.aspect_ratios?.slice(0, 3).join('/') }}{{ model.aspect_ratios?.length > 3 ? '...' : '' }}</td>
              <td>图{{ model.max_refs?.image || 0 }} / 视{{ model.max_refs?.video || 0 }} / 音{{ model.max_refs?.audio || 0 }}</td>
              <td class="price-cell">{{ getPriceText(model) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 接口文档 -->
    <div class="section card">
      <div class="doc-header">
        <h3>接口文档</h3>
        <button class="copy-doc-btn" @click="copyDoc">
          <el-icon><DocumentCopy /></el-icon>
          复制文档
        </button>
      </div>
      <p class="section-tip">参数随平台模型动态更新，以「可调用模型」表格为准。</p>

      <div class="doc-content">
        <h4>则灵 AI 开放接口</h4>
        <p><strong>Base URL：</strong> https://www.zeling.online</p>
        <p><strong>认证方式：</strong> 请求头携带 <code>Authorization: Bearer &lt;你的 API Key&gt;</code></p>
        <p><strong>通用约定：</strong> 所有接口返回 JSON；出错时统一返回 <code>{ "error": "原因" }</code>。</p>

        <h5>1. 获取模型列表</h5>
        <p><code>GET /api/hz/models</code>（公开端点，无需鉴权）</p>
        <p>返回三组模型清单：video（按次视频）、videoPerSec（按秒视频）、image（图片）。</p>

        <h5>2. AI 视频接口</h5>
        <p><code>POST /api/hz/tasks</code>（需鉴权）</p>
        <p>请求体：type=video, model, prompt, aspect_ratio, resolution, duration, image_refs 等。</p>

        <h5>3. AI 图片接口</h5>
        <p><code>POST /api/hz/tasks</code>（需鉴权）</p>
        <p>请求体：type=image, model, prompt, aspect_ratio, resolution 等。</p>

        <h5>4. 查询任务</h5>
        <p><code>GET /api/hz/tasks</code>（需鉴权）</p>
        <p>支持 type、status 过滤。任务状态：queued → in_progress → completed / failed。</p>

        <h5>5. 上传参考素材</h5>
        <p><code>POST /api/hz/uploads?kind=image&name=文件名</code>（公开端点）</p>
        <p>单文件 ≤9MB，返回 <code>{ "url": "/files/uploads/xxx.png" }</code>。</p>

        <h5>错误码</h5>
        <ul>
          <li><code>400</code> 参数错误</li>
          <li><code>401</code> API Key 无效</li>
          <li><code>403</code> 未授权调用此模型</li>
          <li><code>409</code> 积分余额不足</li>
          <li><code>413</code> 文件超过 9MB</li>
          <li><code>502</code> 上游暂时不可用</li>
        </ul>
      </div>
    </div>

    <!-- 创建 API Key 弹窗 -->
    <el-dialog v-model="showCreateKey" title="创建 API Key" width="400px">
      <el-form>
        <el-form-item label="密钥名称">
          <el-input v-model="newKeyName" placeholder="例如：我的项目" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateKey = false">取消</el-button>
        <el-button type="primary" @click="createKey">创建</el-button>
      </template>
    </el-dialog>

    <!-- 新创建的 Key 显示 -->
    <el-dialog v-model="showNewKey" title="API Key 创建成功" width="500px">
      <p class="new-key-tip">请立即复制并妥善保管，关闭后将无法再次查看完整密钥。</p>
      <div class="new-key-value">
        <code>{{ newKeyValue }}</code>
        <el-button size="small" @click="copyKey(newKeyValue)">复制</el-button>
      </div>
      <template #footer>
        <el-button type="primary" @click="showNewKey = false">我已保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { apiKeyApi, modelApi } from '@/api'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

const apiKeys = ref([])
const models = ref({ image: [], video: [], videoPerSec: [] })
const showCreateKey = ref(false)
const showNewKey = ref(false)
const newKeyName = ref('')
const newKeyValue = ref('')

const allModels = computed(() => [
  ...models.value.video,
  ...models.value.videoPerSec,
  ...models.value.image
])

function maskKey(key) {
  if (!key) return ''
  return key.slice(0, 6) + '...' + key.slice(-4)
}

function getPriceText(model) {
  if (model.resolution_prices) {
    const prices = Object.values(model.resolution_prices)
    return `${Math.min(...prices)}-${Math.max(...prices)} 积分/${model.type === 'videoPerSec' ? '秒' : '次'}`
  }
  return `${model.price} 积分/${model.type === 'videoPerSec' ? '秒' : '次'}`
}

async function fetchKeys() {
  if (!userStore.isLoggedIn) return
  try {
    const res = await apiKeyApi.list()
    apiKeys.value = res.keys
  } catch (err) {
    // 错误已处理
  }
}

async function fetchModels() {
  try {
    const res = await modelApi.getModels()
    models.value = res
  } catch (err) {
    // 错误已处理
  }
}

async function createKey() {
  try {
    const res = await apiKeyApi.create({ name: newKeyName.value || '默认密钥' })
    newKeyValue.value = res.api_key
    showCreateKey.value = false
    showNewKey.value = true
    newKeyName.value = ''
    fetchKeys()
  } catch (err) {
    // 错误已处理
  }
}

async function disableKey(id) {
  try {
    await apiKeyApi.disable(id)
    ElMessage.success('已停用')
    fetchKeys()
  } catch (err) {
    // 错误已处理
  }
}

async function deleteKey(id) {
  try {
    await apiKeyApi.remove(id)
    ElMessage.success('已删除')
    fetchKeys()
  } catch (err) {
    // 错误已处理
  }
}

function copyKey(key) {
  navigator.clipboard.writeText(key)
  ElMessage.success('已复制到剪贴板')
}

function copyDoc() {
  ElMessage.info('文档复制功能演示中')
}

onMounted(() => {
  fetchKeys()
  fetchModels()
})
</script>

<style scoped>
.api-page {
  max-width: 1100px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 24px;
  position: relative;
}

.page-header h1 {
  font-size: 26px;
  font-weight: 700;
  margin-bottom: 8px;
}

.page-header p {
  color: var(--text-secondary);
  font-size: 14px;
}

.create-key-btn {
  position: absolute;
  top: 0;
  right: 0;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  cursor: pointer;
}

.section {
  padding: 24px;
  margin-bottom: 20px;
}

.section h3 {
  font-size: 17px;
  font-weight: 600;
  margin-bottom: 8px;
}

.section-tip {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 16px;
}

.key-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.key-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: var(--bg-color);
  border-radius: 10px;
}

.key-info {
  flex: 1;
}

.key-name {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 4px;
}

.key-value {
  font-size: 13px;
  color: var(--text-secondary);
  font-family: monospace;
}

.key-meta {
  display: flex;
  align-items: center;
  gap: 12px;
}

.key-time {
  font-size: 12px;
  color: var(--text-secondary);
}

.key-actions {
  display: flex;
  gap: 8px;
}

.empty-keys {
  text-align: center;
  padding: 40px;
  color: var(--text-secondary);
}

.empty-keys p {
  margin-top: 12px;
  font-size: 14px;
}

.empty-tip {
  font-size: 12px !important;
  opacity: 0.7;
}

.model-table-wrap {
  overflow-x: auto;
}

.model-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.model-table th,
.model-table td {
  padding: 10px 12px;
  text-align: left;
  border-bottom: 1px solid var(--border-color);
}

.model-table th {
  background: var(--bg-color);
  font-weight: 600;
  white-space: nowrap;
}

.model-table code {
  background: var(--bg-color);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
}

.ratio-cell {
  max-width: 120px;
}

.price-cell {
  color: #f59e0b;
  font-weight: 500;
  white-space: nowrap;
}

.doc-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.copy-doc-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border: 1px solid var(--border-color);
  background: transparent;
  border-radius: 8px;
  font-size: 13px;
  cursor: pointer;
  color: var(--text-secondary);
}

.doc-content {
  font-size: 13px;
  line-height: 1.8;
}

.doc-content h4 {
  font-size: 16px;
  margin: 16px 0 8px;
}

.doc-content h5 {
  font-size: 14px;
  margin: 16px 0 8px;
  color: var(--primary-color);
}

.doc-content code {
  background: var(--bg-color);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
}

.doc-content ul {
  padding-left: 20px;
}

.new-key-tip {
  font-size: 13px;
  color: var(--warning-color);
  margin-bottom: 16px;
}

.new-key-value {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: var(--bg-color);
  border-radius: 8px;
}

.new-key-value code {
  flex: 1;
  word-break: break-all;
  font-size: 13px;
}
</style>
