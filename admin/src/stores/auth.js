import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('admin_token') || '')
  const username = ref(localStorage.getItem('admin_username') || '')

  const isLoggedIn = computed(() => !!token.value)

  function setAuth(t, u) {
    token.value = t
    username.value = u
    localStorage.setItem('admin_token', t)
    localStorage.setItem('admin_username', u)
  }

  function logout() {
    token.value = ''
    username.value = ''
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_username')
  }

  return { token, username, isLoggedIn, setAuth, logout }
})
