// 模型数据 - 从则灵 AI 原站提取
const imageModels = [
  {
    id: 'seedream-5.0-pro',
    name: 'Seedream 5.0 Pro',
    type: 'image',
    resolutions: ['1K', '2K'],
    aspect_ratios: ['1:1', '16:9', '9:16', '4:3', '3:4', '5:4', '4:5', '3:2', '2:3', '21:9'],
    resolution_prices: { '1K': 2, '2K': 4.1 },
    max_refs: { image: 9, video: 0, audio: 0 },
    description: '图片'
  },
  {
    id: 'nano-banana-2',
    name: 'Nano Banana 2',
    type: 'image',
    resolutions: ['1K', '2K', '4K'],
    aspect_ratios: ['1:1', '16:9', '9:16'],
    resolution_prices: { '1K': 3, '2K': 3.6, '4K': 5.04 },
    max_refs: { image: 9, video: 0, audio: 0 },
    description: '图片'
  },
  {
    id: 'gpt-image-2-stable',
    name: 'gpt-image-2稳定版',
    type: 'image',
    resolutions: ['1K', '2K', '4K'],
    aspect_ratios: ['1:1', '16:9', '9:16', '4:3', '3:4', '5:4', '4:5', '3:2', '2:3', '21:9', '2:1', '1:2', '3:1', '1:3', '9:21'],
    resolution_prices: { '1K': 0.6, '2K': 1.2, '4K': 1.8 },
    max_refs: { image: 9, video: 0, audio: 0 },
    description: '图片'
  },
  {
    id: 'gpt-image-2.5',
    name: 'GPT Image 2.5',
    type: 'image',
    resolutions: ['1K', '2K', '4K'],
    aspect_ratios: ['1:1', '16:9', '9:16', '4:3', '5:4', '4:5', '3:2', '2:3', '21:9'],
    resolution_prices: { '1K': 0.7, '2K': 0.85, '4K': 1 },
    max_refs: { image: 9, video: 0, audio: 0 },
    description: '图片'
  },
  {
    id: 'gpt-image-2.5-flare',
    name: 'GPT Image 2.5 Flare',
    type: 'image',
    resolutions: ['1K', '2K', '4K'],
    aspect_ratios: ['1:1', '16:9', '9:16', '4:3', '5:4', '4:5', '3:2', '2:3', '21:9'],
    resolution_prices: { '1K': 1, '2K': 1.15, '4K': 1.3 },
    max_refs: { image: 9, video: 0, audio: 0 },
    description: '图片'
  },
  {
    id: 'gpt-image-2.5-sunburst',
    name: 'GPT Image 2.5 Sunburst',
    type: 'image',
    resolutions: ['1K', '2K', '4K'],
    aspect_ratios: ['1:1', '16:9', '9:16', '4:3', '5:4', '4:5', '3:2', '2:3', '21:9'],
    resolution_prices: { '1K': 1, '2K': 1.15, '4K': 1.3 },
    max_refs: { image: 9, video: 0, audio: 0 },
    description: '图片'
  },
  {
    id: 'gpt-image-2-official',
    name: 'gpt-image-2 官方版',
    type: 'image',
    resolutions: ['1K', '2K', '4K'],
    aspect_ratios: ['1:1', '16:9', '9:16', '4:3', '5:4', '4:5', '3:2', '2:3', '21:9'],
    resolution_prices: { '1K': 0.8, '2K': 1.5, '4K': 2.2 },
    max_refs: { image: 9, video: 0, audio: 0 },
    description: '图片'
  },
  {
    id: 'midjourney-v8.2',
    name: '悠船 V8.2',
    type: 'image',
    resolutions: [],
    aspect_ratios: ['1:1', '3:2', '2:3', '4:3', '3:4', '16:9', '9:16', '5:4', '4:5', '21:9', '9:21'],
    price: 4.2,
    max_refs: { image: 0, video: 0, audio: 0 },
    description: '图片'
  },
  {
    id: 'midjourney-v8.2-fast',
    name: '悠船 V8.2 Fast',
    type: 'image',
    resolutions: [],
    aspect_ratios: ['1:1', '3:2', '2:3', '4:3', '3:4', '16:9', '9:16', '5:4', '4:5', '21:9', '9:21'],
    price: 7.2,
    max_refs: { image: 0, video: 0, audio: 0 },
    description: '图片'
  },
  {
    id: 'midjourney-v8.2-turbo',
    name: '悠船 V8.2 Turbo',
    type: 'image',
    resolutions: [],
    aspect_ratios: ['1:1', '3:2', '2:3', '4:3', '3:4', '16:9', '9:16', '5:4', '4:5', '21:9', '9:21'],
    price: 11.4,
    max_refs: { image: 0, video: 0, audio: 0 },
    description: '图片'
  }
]

const videoModels = [
  {
    id: 'seedance-2.0-mini-2',
    name: 'seedance-2.0-mini（933不卡脸）',
    type: 'video',
    durations: [12, 10, 8, 5],
    resolutions: ['720p'],
    aspect_ratios: ['16:9', '9:16', '1:1', '4:3'],
    price: 12,
    max_refs: { image: 9, video: 0, audio: 3 },
    description: '视频'
  },
  {
    id: 'dola2.5-720p-15s',
    name: 'dola2.5-720p-15s',
    type: 'video',
    durations: [15, 10, 5],
    resolutions: ['720p'],
    aspect_ratios: ['16:9', '9:16', '1:1'],
    price: 21,
    max_refs: { image: 9, video: 0, audio: 0 },
    description: '视频'
  },
  {
    id: 'wan-3.0',
    name: 'wan-3.0',
    type: 'video',
    durations: [30, 25, 20, 15, 10, 5],
    resolutions: ['720p', '1080p'],
    aspect_ratios: ['16:9', '9:16', '1:1'],
    price: 40,
    max_refs: { image: 10, video: 5, audio: 5 },
    description: '视频'
  },
  {
    id: 'sd2.5',
    name: 'sd2.5（9图，不卡脸）',
    type: 'video',
    durations: [30],
    resolutions: ['720p'],
    aspect_ratios: ['16:9', '9:16'],
    price: 25,
    max_refs: { image: 9, video: 0, audio: 0 },
    description: '视频'
  }
]

const videoPerSecModels = [
  {
    id: 'cvd-seedance-2.0',
    name: 'DC 全能视频 2.0 M 超分',
    type: 'videoPerSec',
    durations: [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
    resolutions: ['480p', '720p', '1080p'],
    aspect_ratios: ['1:1', '21:9', '16:9', '9:16', '3:4', '4:3'],
    resolution_prices: { '480p': 1.8, '720p': 2.9, '1080p': 4.5 },
    max_refs: { image: 9, video: 3, audio: 3 },
    description: '视频·按秒'
  },
  {
    id: 'wan3.0-video-720p',
    name: 'wan3.0-video 720P 官',
    type: 'videoPerSec',
    durations: [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 20, 25, 30],
    resolutions: ['720p'],
    aspect_ratios: ['16:9', '9:16', '1:1', '4:3', '3:4'],
    price: 4.3,
    max_refs: { image: 10, video: 5, audio: 5 },
    description: '视频·按秒'
  },
  {
    id: 'minimax-h3-768p',
    name: 'minimax-h3 768P',
    type: 'videoPerSec',
    durations: [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
    resolutions: ['768p'],
    aspect_ratios: ['1:1', '16:9', '9:16'],
    price: 0.5,
    max_refs: { image: 30, video: 0, audio: 10 },
    description: '视频·按秒'
  }
]

function getAllModels() {
  return {
    video: videoModels,
    videoPerSec: videoPerSecModels,
    image: imageModels
  }
}

function findModel(id) {
  const all = [...imageModels, ...videoModels, ...videoPerSecModels]
  return all.find(m => m.id === id)
}

module.exports = { getAllModels, findModel, imageModels, videoModels, videoPerSecModels }
