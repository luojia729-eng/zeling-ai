<template>
  <div class="canvas-page" :class="{ dark: true }">
    <!-- 左侧工具栏 -->
    <div class="canvas-toolbar">
      <button class="tool-btn add" @click="showNodeMenu = !showNodeMenu" title="添加节点">
        <el-icon :size="20"><Plus /></el-icon>
      </button>
      <button class="tool-btn" @click="handleUpload" title="上传素材">
        <el-icon :size="20"><Upload /></el-icon>
      </button>
      <button class="tool-btn" @click="undo" title="撤销">
        <el-icon :size="20"><RefreshLeft /></el-icon>
      </button>
      <button class="tool-btn" @click="redo" title="重做">
        <el-icon :size="20"><RefreshRight /></el-icon>
      </button>
      <button class="tool-btn" @click="autoLayout" title="整理">
        <span class="tool-text">整理</span>
      </button>
      <button class="tool-btn" @click="toggleDraw" :class="{ active: isDrawing }" title="画笔">
        <el-icon :size="20"><EditPen /></el-icon>
      </button>
    </div>

    <!-- 节点菜单 -->
    <div v-if="showNodeMenu" class="node-menu">
      <div class="menu-title">添加节点</div>
      <div class="menu-item" @click="addNode('image')">
        <div class="menu-icon image"><el-icon><Picture /></el-icon></div>
        <div>
          <div class="menu-name">图片生成节点</div>
          <div class="menu-desc">输入提示词生成图片</div>
        </div>
      </div>
      <div class="menu-item" @click="addNode('video')">
        <div class="menu-icon video"><el-icon><VideoCamera /></el-icon></div>
        <div>
          <div class="menu-name">视频生成节点</div>
          <div class="menu-desc">输入提示词生成视频</div>
        </div>
      </div>
      <div class="menu-item" @click="handleUpload">
        <div class="menu-icon upload"><el-icon><Upload /></el-icon></div>
        <div>
          <div class="menu-name">上传素材</div>
          <div class="menu-desc">图片 / 视频上传到画布</div>
        </div>
      </div>
    </div>

    <!-- 画布区域 -->
    <div
      class="canvas-area"
      ref="canvasRef"
      @mousedown="handleCanvasMouseDown"
      @mousemove="handleCanvasMouseMove"
      @mouseup="handleCanvasMouseUp"
      @wheel="handleWheel"
      @dblclick="handleDoubleClick"
    >
      <!-- 空状态提示 -->
      <div v-if="nodes.length === 0" class="canvas-empty">
        <el-icon :size="48"><Picture /></el-icon>
        <h3>无限画布 · 自由布局你的灵感</h3>
        <p>点击底部「添加节点」或双击画布创建 · 拖入素材 · 悬停素材可设为参考</p>
      </div>

      <!-- 节点 -->
      <div
        v-for="node in nodes"
        :key="node.id"
        class="canvas-node"
        :class="{ selected: selectedNode === node.id, generating: node.status === 'generating' }"
        :style="{ left: node.x + 'px', top: node.y + 'px' }"
        @mousedown.stop="handleNodeMouseDown($event, node)"
      >
        <div class="node-header" :class="node.type">
          <el-icon><component :is="node.type === 'image' ? 'Picture' : node.type === 'video' ? 'VideoCamera' : 'Upload'" /></el-icon>
          <span>{{ node.type === 'image' ? '图片生成' : node.type === 'video' ? '视频生成' : '素材' }}</span>
          <button class="node-close" @click.stop="removeNode(node.id)">×</button>
        </div>
        <div class="node-body">
          <textarea
            v-model="node.prompt"
            class="node-prompt"
            placeholder="输入提示词…"
            rows="3"
            @mousedown.stop
          ></textarea>
          <div class="node-result" v-if="node.result">
            <img v-if="node.type !== 'video'" :src="node.result" alt="结果" />
            <video v-else :src="node.result" controls></video>
          </div>
          <div class="node-result placeholder" v-else-if="node.status === 'generating'">
            <el-icon class="spin"><Loading /></el-icon>
            <span>生成中…</span>
          </div>
        </div>
        <div class="node-footer">
          <button class="generate-btn" @click.stop="generateNode(node)" :disabled="!node.prompt || node.status === 'generating'">
            生成
          </button>
          <span class="node-cost" v-if="node.type !== 'upload'">≈2积分</span>
        </div>
      </div>
    </div>

    <!-- 底部控制栏 -->
    <div class="canvas-bottom">
      <button class="bottom-add-btn" @click="showNodeMenu = !showNodeMenu">
        <el-icon><Plus /></el-icon>
        添加节点
      </button>
      <div class="zoom-controls">
        <button @click="zoomOut">−</button>
        <span>{{ Math.round(zoom * 100) }}%</span>
        <button @click="zoomIn">+</button>
      </div>
    </div>

    <input ref="fileInput" type="file" accept="image/*,video/*" hidden @change="handleFileChange" />
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { uploadApi } from '@/api'

const canvasRef = ref(null)
const fileInput = ref(null)
const nodes = ref([])
const selectedNode = ref(null)
const showNodeMenu = ref(false)
const isDrawing = ref(false)
const zoom = ref(1)
const pan = reactive({ x: 0, y: 0 })

let nodeIdCounter = 0
let isDragging = false
let dragNode = null
let dragOffset = { x: 0, y: 0 }
let isPanning = false
let panStart = { x: 0, y: 0 }

function addNode(type) {
  const id = ++nodeIdCounter
  nodes.value.push({
    id,
    type,
    x: 200 + Math.random() * 200,
    y: 150 + Math.random() * 150,
    prompt: '',
    result: '',
    status: 'idle'
  })
  showNodeMenu.value = false
  selectedNode.value = id
}

function removeNode(id) {
  nodes.value = nodes.value.filter(n => n.id !== id)
  if (selectedNode.value === id) selectedNode.value = null
}

function handleNodeMouseDown(e, node) {
  isDragging = true
  dragNode = node
  dragOffset = {
    x: e.clientX - node.x,
    y: e.clientY - node.y
  }
  selectedNode.value = node.id
}

function handleCanvasMouseDown(e) {
  if (e.target === canvasRef.value || e.target.classList.contains('canvas-area')) {
    isPanning = true
    panStart = { x: e.clientX - pan.x, y: e.clientY - pan.y }
    selectedNode.value = null
    showNodeMenu.value = false
  }
}

function handleCanvasMouseMove(e) {
  if (isDragging && dragNode) {
    dragNode.x = e.clientX - dragOffset.x
    dragNode.y = e.clientY - dragOffset.y
  }
  if (isPanning) {
    pan.x = e.clientX - panStart.x
    pan.y = e.clientY - panStart.y
  }
}

function handleCanvasMouseUp() {
  isDragging = false
  dragNode = null
  isPanning = false
}

function handleWheel(e) {
  e.preventDefault()
  const delta = e.deltaY > 0 ? -0.1 : 0.1
  zoom.value = Math.max(0.25, Math.min(2, zoom.value + delta))
}

function handleDoubleClick(e) {
  if (e.target === canvasRef.value || e.target.classList.contains('canvas-area')) {
    addNode('image')
  }
}

function zoomIn() {
  zoom.value = Math.min(2, zoom.value + 0.1)
}

function zoomOut() {
  zoom.value = Math.max(0.25, zoom.value - 0.1)
}

function handleUpload() {
  fileInput.value?.click()
  showNodeMenu.value = false
}

async function handleFileChange(e) {
  const file = e.target.files[0]
  if (!file) return
  try {
    const res = await uploadApi.upload(file)
    const id = ++nodeIdCounter
    nodes.value.push({
      id,
      type: 'upload',
      x: 300,
      y: 200,
      prompt: file.name,
      result: res.url,
      status: 'done'
    })
    ElMessage.success('素材已添加到画布')
  } catch (err) {
    // 错误已处理
  }
  e.target.value = ''
}

async function generateNode(node) {
  if (!node.prompt) {
    ElMessage.warning('请输入提示词')
    return
  }
  node.status = 'generating'
  node.result = ''

  // 模拟生成
  setTimeout(() => {
    node.result = `https://picsum.photos/seed/${node.id}/512/512`
    node.status = 'done'
    ElMessage.success('生成完成')
  }, 3000)
}

function undo() {
  ElMessage.info('撤销功能演示中')
}

function redo() {
  ElMessage.info('重做功能演示中')
}

function autoLayout() {
  nodes.value.forEach((node, idx) => {
    node.x = 100 + (idx % 3) * 280
    node.y = 100 + Math.floor(idx / 3) * 280
  })
  ElMessage.success('已自动整理')
}

function toggleDraw() {
  isDrawing.value = !isDrawing.value
  ElMessage.info(isDrawing.value ? '画笔模式已开启' : '画笔模式已关闭')
}
</script>

<style scoped>
.canvas-page {
  position: relative;
  height: calc(100vh - 60px);
  margin: -24px;
  background: #1a1a2e;
  overflow: hidden;
}

/* 工具栏 */
.canvas-toolbar {
  position: absolute;
  top: 20px;
  left: 20px;
  z-index: 100;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.tool-btn {
  width: 40px;
  height: 40px;
  border: none;
  background: transparent;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #333;
}

.tool-btn:hover {
  background: #f0f0f0;
}

.tool-btn.add {
  background: #2b7fff;
  color: white;
}

.tool-btn.add:hover {
  background: #1a5fd9;
}

.tool-btn.active {
  background: #e8f1ff;
  color: #2b7fff;
}

.tool-text {
  font-size: 12px;
  font-weight: 500;
}

/* 节点菜单 */
.node-menu {
  position: absolute;
  top: 80px;
  left: 80px;
  z-index: 100;
  background: white;
  border-radius: 12px;
  padding: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  width: 240px;
}

.menu-title {
  font-size: 13px;
  font-weight: 600;
  color: #666;
  margin-bottom: 8px;
  padding: 0 4px;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  border-radius: 8px;
  cursor: pointer;
}

.menu-item:hover {
  background: #f5f7fa;
}

.menu-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

.menu-icon.image { background: #2b7fff; }
.menu-icon.video { background: #10b981; }
.menu-icon.upload { background: #f59e0b; }

.menu-name {
  font-size: 14px;
  font-weight: 500;
}

.menu-desc {
  font-size: 12px;
  color: #999;
}

/* 画布区域 */
.canvas-area {
  width: 100%;
  height: 100%;
  background-image:
    radial-gradient(circle, #333 1px, transparent 1px);
  background-size: 24px 24px;
  cursor: grab;
  position: relative;
}

.canvas-area:active {
  cursor: grabbing;
}

.canvas-empty {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: rgba(255, 255, 255, 0.5);
  pointer-events: none;
}

.canvas-empty h3 {
  font-size: 18px;
  margin: 16px 0 8px;
  color: rgba(255, 255, 255, 0.7);
}

.canvas-empty p {
  font-size: 13px;
  line-height: 1.6;
}

/* 节点 */
.canvas-node {
  position: absolute;
  width: 240px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  cursor: move;
  border: 2px solid transparent;
  z-index: 10;
}

.canvas-node.selected {
  border-color: #2b7fff;
  box-shadow: 0 0 0 3px rgba(43, 127, 255, 0.2);
}

.node-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  color: white;
  font-size: 13px;
  font-weight: 500;
}

.node-header.image { background: linear-gradient(135deg, #2b7fff, #6ba8ff); }
.node-header.video { background: linear-gradient(135deg, #10b981, #34d399); }
.node-header.upload { background: linear-gradient(135deg, #f59e0b, #fbbf24); }

.node-close {
  margin-left: auto;
  width: 20px;
  height: 20px;
  border: none;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border-radius: 50%;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.node-body {
  padding: 12px;
}

.node-prompt {
  width: 100%;
  padding: 8px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 12px;
  font-family: inherit;
  resize: none;
  outline: none;
}

.node-prompt:focus {
  border-color: #2b7fff;
}

.node-result {
  margin-top: 10px;
  width: 100%;
  aspect-ratio: 1;
  border-radius: 6px;
  overflow: hidden;
  background: #f5f7fa;
}

.node-result img,
.node-result video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.node-result.placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #999;
  font-size: 12px;
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.node-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-top: 1px solid #f0f0f0;
}

.generate-btn {
  padding: 6px 16px;
  background: #2b7fff;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
}

.generate-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.node-cost {
  font-size: 11px;
  color: #f59e0b;
}

/* 底部控制栏 */
.canvas-bottom {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 20px;
  z-index: 100;
}

.bottom-add-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 28px;
  background: #2b7fff;
  color: white;
  border: none;
  border-radius: 24px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(43, 127, 255, 0.4);
}

.bottom-add-btn:hover {
  background: #1a5fd9;
}

.zoom-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.zoom-controls button {
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  border-radius: 50%;
  cursor: pointer;
  font-size: 16px;
  color: #333;
}

.zoom-controls button:hover {
  background: #f0f0f0;
}

.zoom-controls span {
  font-size: 13px;
  min-width: 48px;
  text-align: center;
  color: #333;
}
</style>
