export interface User {
  id: number
  email: string
  name: string
  avatarUrl: string | null
}

export function useAuth() {
  const user = useState<User | null>('auth-user', () => null)
  const isLoading = useState<boolean>('auth-loading', () => true)

  const isAuthenticated = computed(() => !!user.value)

  async function fetchUser(): Promise<void> {
    isLoading.value = true
    try {
      const response = await $fetch<{ user: User | null }>('/api/auth/session', {
        credentials: 'include',
      })
      user.value = response?.user || null
    }
    catch {
      user.value = null
    }
    finally {
      isLoading.value = false
    }
  }

  function login(): void {
    navigateTo('/api/auth/google', { external: true })
  }

  async function logout(): Promise<void> {
    await $fetch('/api/auth/logout', { method: 'POST' })
    user.value = null
    await navigateTo('/')
  }

  return {
    user: readonly(user),
    isLoading: readonly(isLoading),
    isAuthenticated,
    fetchUser,
    login,
    logout,
  }
}
