<template>
  <div class="home-page">
    <!-- Banner -->
    <div class="banner">
      <h1>则灵 AI - 聚合多模型 AI 创作平台</h1>
      <p>一站式图片/视频生成，支持 30+ 主流 AI 模型</p>
    </div>

    <!-- 作品广场 -->
    <div class="gallery-section">
      <div class="gallery-header">
        <div class="gallery-title">
          <span class="gallery-label">GALLERY</span>
          <h2>作品广场</h2>
          <span class="gallery-count">共 {{ total }} 件</span>
        </div>
        <div class="gallery-filters">
          <button
            v-for="f in filters"
            :key="f.value"
            class="filter-btn"
            :class="{ active: activeFilter === f.value }"
            @click="activeFilter = f.value; fetchWorks()"
          >
            {{ f.label }}
          </button>
        </div>
        <button class="upload-btn" @click="handleUpload">
          <el-icon><Upload /></el-icon>
          上传作品
        </button>
      </div>

      <!-- 作品网格 -->
      <div class="works-grid" v-if="works.length > 0">
        <div v-for="work in works" :key="work.id" class="work-card">
          <div class="work-media">
            <img v-if="work.type === 'image'" :src="work.media_url" alt="作品" />
            <video v-else :src="work.media_url" muted></video>
            <div class="work-overlay">
              <button class="play-btn" v-if="work.type === 'video'">
                <el-icon :size="28"><VideoPlay /></el-icon>
              </button>
            </div>
            <div class="work-type-tag" v-if="work.type === 'video'">
              <el-icon><VideoCamera /></el-icon>
              VIDEO
            </div>
          </div>
          <div class="work-info">
            <div class="work-author">
              <div class="author-avatar">{{ work.nickname?.charAt(0) || 'U' }}</div>
              <span>{{ work.nickname || '匿名用户' }}</span>
            </div>
            <div class="work-prompt text-ellipsis">{{ work.prompt }}</div>
          </div>
        </div>
      </div>

      <div class="works-empty" v-else>
        <el-icon :size="48"><Picture /></el-icon>
        <p>暂无作品</p>
        <p class="empty-tip">成为第一个上传作品的人吧</p>
      </div>
    </div>

    <!-- 页脚 -->
    <footer class="footer">
      <p>鄂ICP备2026047198号</p>
    </footer>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { workApi } from '@/api'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const works = ref([])
const total = ref(0)
const activeFilter = ref('all')

const filters = [
  { label: '全部', value: 'all' },
  { label: '视频', value: 'video' },
  { label: '图片', value: 'image' }
]

async function fetchWorks() {
  try {
    const res = await workApi.list({ type: activeFilter.value, limit: 50 })
    works.value = res.works
    total.value = res.total
  } catch (err) {
    // 错误已处理
  }
}

function handleUpload() {
  if (!userStore.isLoggedIn) {
    userStore.showLoginDialog = true
    return
  }
  router.push('/create')
  ElMessage.info('在创作页生成作品后会自动展示在广场')
}

onMounted(() => {
  fetchWorks()
})
</script>

<style scoped>
.home-page {
  max-width: 1200px;
  margin: 0 auto;
}

.banner {
  text-align: center;
  padding: 40px 20px;
  margin-bottom: 30px;
}

.banner h1 {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 10px;
}

.banner p {
  color: var(--text-secondary);
  font-size: 15px;
}

.gallery-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.gallery-title {
  display: flex;
  align-items: baseline;
  gap: 12px;
}

.gallery-label {
  font-size: 12px;
  color: var(--text-secondary);
  letter-spacing: 2px;
}

.gallery-title h2 {
  font-size: 22px;
  font-weight: 700;
}

.gallery-count {
  font-size: 14px;
  color: var(--text-secondary);
}

.gallery-filters {
  display: flex;
  gap: 8px;
  margin-left: auto;
}

.filter-btn {
  padding: 6px 16px;
  border: 1px solid var(--border-color);
  background: var(--card-bg);
  border-radius: 20px;
  font-size: 13px;
  cursor: pointer;
  color: var(--text-secondary);
}

.filter-btn.active {
  background: var(--text-primary);
  color: var(--card-bg);
  border-color: var(--text-primary);
}

.upload-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: 1px solid var(--border-color);
  background: var(--card-bg);
  border-radius: 10px;
  font-size: 13px;
  cursor: pointer;
  color: var(--text-primary);
}

.upload-btn:hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.works-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 20px;
}

.work-card {
  background: var(--card-bg);
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid var(--border-color);
  transition: transform 0.2s, box-shadow 0.2s;
}

.work-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.work-media {
  position: relative;
  width: 100%;
  padding-top: 100%;
  overflow: hidden;
}

.work-media img,
.work-media video {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.work-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s;
}

.work-card:hover .work-overlay {
  opacity: 1;
}

.play-btn {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-primary);
}

.work-type-tag {
  position: absolute;
  bottom: 10px;
  left: 10px;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 500;
}

.work-info {
  padding: 12px;
}

.work-author {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.author-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: linear-gradient(135deg, #2b7fff, #6ba8ff);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
}

.work-author span {
  font-size: 13px;
  font-weight: 500;
}

.work-prompt {
  font-size: 12px;
  color: var(--text-secondary);
}

.works-empty {
  text-align: center;
  padding: 60px 20px;
  color: var(--text-secondary);
}

.works-empty p {
  margin-top: 12px;
  font-size: 15px;
}

.empty-tip {
  font-size: 13px !important;
  opacity: 0.7;
}

.footer {
  text-align: center;
  padding: 30px 20px;
  margin-top: 40px;
  color: var(--text-secondary);
  font-size: 12px;
}
</style>
