<script setup lang="ts">
interface Recommendation {
  id: number
  type: 'channel' | 'hidden_gem' | 'content_gap'
  channelTitle: string
  channelId: string | null
  reason: string
  category: string
  confidenceScore: number
  createdAt?: string
}

interface RecommendationsData {
  recommendations: Recommendation[]
  counts: {
    channel: number
    hidden_gem: number
    content_gap: number
    total: number
  }
  hasRecommendations: boolean
}

const { user, isLoading: isAuthLoading, isAuthenticated, fetchUser, logout } = useAuth()

const recommendations = ref<Recommendation[]>([])
const counts = ref({ channel: 0, hidden_gem: 0, content_gap: 0, total: 0 })
const hasRecommendations = ref(false)
const isLoading = ref(true)
const isGenerating = ref(false)
const error = ref<string | null>(null)
const statusMessage = ref<string | null>(null)
const activeTab = ref<'all' | 'channel' | 'hidden_gem' | 'content_gap'>('all')

// Fetch user and recommendations on mount
onMounted(async () => {
  await fetchUser()
  await loadRecommendations()
})

// Redirect to home if not authenticated
watch(isAuthLoading, (loading) => {
  if (!loading && !isAuthenticated.value) {
    navigateTo('/')
  }
})

async function loadRecommendations(): Promise<void> {
  isLoading.value = true
  error.value = null

  try {
    const response = await $fetch<RecommendationsData>('/api/recommendations', {
      credentials: 'include',
    })
    recommendations.value = response.recommendations
    counts.value = response.counts
    hasRecommendations.value = response.hasRecommendations
  }
  catch (e) {
    console.error('Failed to load recommendations:', e)
    error.value = 'Failed to load recommendations'
  }
  finally {
    isLoading.value = false
  }
}

async function generateRecommendations(): Promise<void> {
  isGenerating.value = true
  error.value = null
  statusMessage.value = null

  try {
    const response = await $fetch<{
      success: boolean
      recommendations: Recommendation[]
      counts: { channel: number, hidden_gem: number, content_gap: number }
      message: string
    }>('/api/recommendations', {
      method: 'POST',
      credentials: 'include',
    })

    recommendations.value = response.recommendations
    counts.value = { ...response.counts, total: response.recommendations.length }
    hasRecommendations.value = true
    statusMessage.value = response.message

    setTimeout(() => {
      statusMessage.value = null
    }, 5000)
  }
  catch (e) {
    console.error('Failed to generate recommendations:', e)
    error.value = 'Failed to generate recommendations. Please try again.'
  }
  finally {
    isGenerating.value = false
  }
}

// Filtered recommendations based on active tab
const filteredRecommendations = computed(() => {
  if (activeTab.value === 'all') {
    return recommendations.value
  }
  return recommendations.value.filter(r => r.type === activeTab.value)
})

// Type label mapping
const typeLabels: Record<string, string> = {
  channel: 'Channel',
  hidden_gem: 'Hidden Gem',
  content_gap: 'Content Gap',
}

const typeColors: Record<string, string> = {
  channel: 'type-channel',
  hidden_gem: 'type-hidden-gem',
  content_gap: 'type-content-gap',
}

function getYouTubeSearchUrl(channelTitle: string): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(channelTitle)}`
}

definePageMeta({
  title: 'Recommendations',
})
</script>

<template>
  <div class="recommendations-page">
    <nav class="navbar">
      <div class="container navbar-content">
        <NuxtLink
          to="/dashboard"
          class="navbar-brand"
        >
          YouTube Recommend
        </NuxtLink>

        <div
          v-if="user"
          class="navbar-user"
        >
          <img
            v-if="user.avatarUrl"
            :src="user.avatarUrl"
            :alt="user.name"
            class="user-avatar"
          >
          <span class="user-name">{{ user.name }}</span>
          <button
            class="btn btn-secondary"
            @click="logout"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>

    <main class="main">
      <div class="container">
        <div
          v-if="isAuthLoading || isLoading"
          class="loading"
        >
          <div class="spinner" />
        </div>

        <template v-else>
          <header class="page-header">
            <div class="header-content">
              <NuxtLink
                to="/dashboard"
                class="back-link"
              >
                ← Back to Dashboard
              </NuxtLink>
              <h1>Your Recommendations</h1>
              <p>Personalized channel suggestions based on your taste profile.</p>
            </div>
            <button
              class="btn btn-primary"
              :disabled="isGenerating"
              @click="generateRecommendations"
            >
              <span
                v-if="isGenerating"
                class="btn-loading"
              >
                <span class="spinner-small" />
                Generating...
              </span>
              <span v-else-if="hasRecommendations">
                Refresh Recommendations
              </span>
              <span v-else>
                Generate Recommendations
              </span>
            </button>
          </header>

          <!-- Status Message -->
          <div
            v-if="statusMessage"
            class="status-message success"
          >
            {{ statusMessage }}
          </div>

          <!-- Error Message -->
          <div
            v-if="error"
            class="status-message error"
          >
            {{ error }}
          </div>

          <!-- Empty State -->
          <div
            v-if="!hasRecommendations && !isGenerating"
            class="empty-state"
          >
            <h2>No Recommendations Yet</h2>
            <p>Click the button above to generate personalized channel recommendations based on your taste profile.</p>
          </div>

          <!-- Recommendations Content -->
          <template v-else-if="hasRecommendations">
            <!-- Stats -->
            <div class="stats-bar">
              <div class="stat">
                <span class="stat-value">{{ counts.total }}</span>
                <span class="stat-label">Total</span>
              </div>
              <div class="stat">
                <span class="stat-value">{{ counts.channel }}</span>
                <span class="stat-label">Channels</span>
              </div>
              <div class="stat">
                <span class="stat-value">{{ counts.hidden_gem }}</span>
                <span class="stat-label">Hidden Gems</span>
              </div>
              <div class="stat">
                <span class="stat-value">{{ counts.content_gap }}</span>
                <span class="stat-label">Content Gaps</span>
              </div>
            </div>

            <!-- Tabs -->
            <div class="tabs">
              <button
                class="tab"
                :class="{ active: activeTab === 'all' }"
                @click="activeTab = 'all'"
              >
                All
              </button>
              <button
                class="tab"
                :class="{ active: activeTab === 'channel' }"
                @click="activeTab = 'channel'"
              >
                Channels
              </button>
              <button
                class="tab"
                :class="{ active: activeTab === 'hidden_gem' }"
                @click="activeTab = 'hidden_gem'"
              >
                Hidden Gems
              </button>
              <button
                class="tab"
                :class="{ active: activeTab === 'content_gap' }"
                @click="activeTab = 'content_gap'"
              >
                Content Gaps
              </button>
            </div>

            <!-- Recommendations Grid -->
            <div class="recommendations-grid">
              <div
                v-for="rec in filteredRecommendations"
                :key="rec.id"
                class="recommendation-card"
              >
                <div class="card-header">
                  <span
                    class="type-badge"
                    :class="typeColors[rec.type]"
                  >
                    {{ typeLabels[rec.type] }}
                  </span>
                  <span class="confidence">{{ Math.round(rec.confidenceScore * 100) }}% match</span>
                </div>
                <h3 class="channel-title">
                  {{ rec.channelTitle }}
                </h3>
                <span class="category-tag">{{ rec.category }}</span>
                <p class="reason">
                  {{ rec.reason }}
                </p>
                <a
                  :href="getYouTubeSearchUrl(rec.channelTitle)"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="btn btn-secondary btn-small"
                >
                  Find on YouTube →
                </a>
              </div>
            </div>
          </template>
        </template>
      </div>
    </main>
  </div>
</template>

<style scoped>
.recommendations-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.navbar {
  background-color: var(--color-bg-elevated);
  border-bottom: 1px solid var(--color-border-subtle);
  padding: var(--spacing-md) 0;
  position: sticky;
  top: 0;
  z-index: 100;
}

.navbar-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.navbar-brand {
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--color-text);
  text-decoration: none;
}

.navbar-user {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-full);
}

.user-name {
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.main {
  flex: 1;
  padding: var(--spacing-2xl) 0;
}

/* Page Header */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--spacing-xl);
  gap: var(--spacing-lg);
}

.header-content {
  flex: 1;
}

.back-link {
  color: var(--color-text-muted);
  text-decoration: none;
  font-size: var(--font-size-sm);
  display: inline-block;
  margin-bottom: var(--spacing-sm);
}

.back-link:hover {
  color: var(--color-primary);
}

.page-header h1 {
  margin-bottom: var(--spacing-sm);
}

.page-header p {
  color: var(--color-text-secondary);
}

/* Status Messages */
.status-message {
  padding: var(--spacing-md) var(--spacing-lg);
  border-radius: var(--radius-md);
  margin-bottom: var(--spacing-lg);
  font-size: var(--font-size-sm);
}

.status-message.success {
  background-color: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.3);
  color: #22c55e;
}

.status-message.error {
  background-color: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #ef4444;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: var(--spacing-3xl);
  background-color: var(--color-bg-elevated);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-lg);
}

.empty-state h2 {
  margin-bottom: var(--spacing-md);
}

.empty-state p {
  color: var(--color-text-muted);
}

/* Stats Bar */
.stats-bar {
  display: flex;
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
  padding: var(--spacing-md) var(--spacing-lg);
  background-color: var(--color-bg-elevated);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-md);
}

.stat {
  display: flex;
  align-items: baseline;
  gap: var(--spacing-xs);
}

.stat-value {
  font-size: var(--font-size-lg);
  font-weight: 700;
  color: var(--color-primary);
}

.stat-label {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

/* Tabs */
.tabs {
  display: flex;
  gap: var(--spacing-xs);
  margin-bottom: var(--spacing-lg);
  border-bottom: 1px solid var(--color-border-subtle);
  padding-bottom: var(--spacing-xs);
}

.tab {
  padding: var(--spacing-sm) var(--spacing-md);
  background: none;
  border: none;
  color: var(--color-text-muted);
  cursor: pointer;
  font-size: var(--font-size-sm);
  border-radius: var(--radius-md) var(--radius-md) 0 0;
  transition: color 0.2s, background-color 0.2s;
}

.tab:hover {
  color: var(--color-text);
  background-color: var(--color-bg-elevated);
}

.tab.active {
  color: var(--color-primary);
  background-color: var(--color-bg-elevated);
  font-weight: 600;
}

/* Recommendations Grid */
.recommendations-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: var(--spacing-lg);
}

.recommendation-card {
  background-color: var(--color-bg-elevated);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.type-badge {
  font-size: var(--font-size-xs);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-full);
  font-weight: 600;
}

.type-channel {
  background-color: rgba(59, 130, 246, 0.15);
  color: #3b82f6;
}

.type-hidden-gem {
  background-color: rgba(168, 85, 247, 0.15);
  color: #a855f7;
}

.type-content-gap {
  background-color: rgba(34, 197, 94, 0.15);
  color: #22c55e;
}

.confidence {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.channel-title {
  font-size: var(--font-size-lg);
  font-weight: 600;
  margin: var(--spacing-xs) 0;
}

.category-tag {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  background-color: var(--color-bg);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-full);
  align-self: flex-start;
}

.reason {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  line-height: 1.5;
  flex: 1;
}

.btn-small {
  padding: var(--spacing-sm) var(--spacing-md);
  font-size: var(--font-size-sm);
  align-self: flex-start;
  margin-top: var(--spacing-sm);
}

/* Button Loading State */
.btn-loading {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.spinner-small {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 640px) {
  .page-header {
    flex-direction: column;
  }

  .stats-bar {
    flex-wrap: wrap;
  }

  .tabs {
    overflow-x: auto;
  }
}
</style>
