import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi, creditApi } from '@/api'

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('token') || '')
  const user = ref(JSON.parse(localStorage.getItem('user') || 'null'))
  const showLoginDialog = ref(false)

  const isLoggedIn = computed(() => !!token.value && !!user.value)
  const credits = computed(() => user.value?.credits || 0)

  function setAuth(data) {
    token.value = data.token
    user.value = data.user
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(data.user))
  }

  function logout() {
    token.value = ''
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  async function login(email, password) {
    const data = await authApi.login({ email, password })
    setAuth(data)
    return data
  }

  async function register(email, password, nickname) {
    const data = await authApi.register({ email, password, nickname })
    setAuth(data)
    return data
  }

  async function fetchUser() {
    if (!isLoggedIn.value) return
    const data = await authApi.getMe()
    user.value = data
    localStorage.setItem('user', JSON.stringify(data))
  }

  async function refreshCredits() {
    if (!isLoggedIn.value) return
    const data = await creditApi.getBalance()
    if (user.value) {
      user.value.credits = data.balance
      localStorage.setItem('user', JSON.stringify(user.value))
    }
  }

  function updateCredits(amount) {
    if (user.value) {
      user.value.credits = amount
      localStorage.setItem('user', JSON.stringify(user.value))
    }
  }

  return {
    token,
    user,
    showLoginDialog,
    isLoggedIn,
    credits,
    setAuth,
    logout,
    login,
    register,
    fetchUser,
    refreshCredits,
    updateCredits
  }
})
