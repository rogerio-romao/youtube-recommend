<script setup lang="ts">
const { user, isLoading: isAuthLoading, isAuthenticated, fetchUser, logout } = useAuth()
const { data: youtubeData, isSyncing, isAnalyzing, error: youtubeError, fetchData, syncData, analyzeData } = useYouTube()

const statusMessage = ref<string | null>(null)
const statusSuccess = ref<boolean | null>(null)

// Fetch user and YouTube data on mount
onMounted(async () => {
  await fetchUser()
  // Load existing YouTube data
  await fetchData()
})

// Redirect to home if not authenticated
watch(isAuthLoading, (loading) => {
  if (!loading && !isAuthenticated.value) {
    navigateTo('/')
  }
})

async function handleSync(): Promise<void> {
  statusMessage.value = null
  statusSuccess.value = null

  const result = await syncData()
  statusMessage.value = result.message
  statusSuccess.value = result.success

  // Clear message after 5 seconds
  setTimeout(() => {
    statusMessage.value = null
    statusSuccess.value = null
  }, 5000)
}

async function handleAnalyze(): Promise<void> {
  statusMessage.value = null
  statusSuccess.value = null

  const result = await analyzeData()
  statusMessage.value = result.message
  statusSuccess.value = result.success

  // Clear message after 5 seconds
  setTimeout(() => {
    statusMessage.value = null
    statusSuccess.value = null
  }, 5000)
}

// Computed properties for display
const subscriptionCount = computed(() => youtubeData.value?.subscriptions.count ?? 0)
const likedVideoCount = computed(() => youtubeData.value?.likedVideos.count ?? 0)
const hasSyncedData = computed(() => youtubeData.value?.hasSyncedData ?? false)
const hasTasteProfile = computed(() => youtubeData.value?.tasteProfile !== null)
const tasteProfile = computed(() => youtubeData.value?.tasteProfile ?? null)

definePageMeta({
  title: 'Dashboard',
})
</script>

<template>
  <div class="dashboard">
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
          v-if="isAuthLoading"
          class="loading"
        >
          <div class="spinner" />
        </div>

        <template v-else-if="user">
          <header class="dashboard-header">
            <h1>Welcome, {{ user.name.split(' ')[0] }}</h1>
            <p>Analyze your YouTube activity and discover new channels.</p>
          </header>

          <!-- Status Message -->
          <div
            v-if="statusMessage"
            class="sync-message"
            :class="{ 'sync-success': statusSuccess, 'sync-error': !statusSuccess }"
          >
            {{ statusMessage }}
          </div>

          <!-- YouTube Error Message -->
          <div
            v-if="youtubeError"
            class="sync-message sync-error"
          >
            {{ youtubeError }}
          </div>

          <!-- Data Stats (shown after sync) -->
          <section
            v-if="hasSyncedData"
            class="data-stats"
          >
            <div class="stat-card">
              <div class="stat-number">
                {{ subscriptionCount }}
              </div>
              <div class="stat-label">
                Subscriptions
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-number">
                {{ likedVideoCount }}
              </div>
              <div class="stat-label">
                Liked Videos
              </div>
            </div>
            <div class="stat-card">
              <div
                class="stat-icon"
                :class="{ 'stat-ready': hasTasteProfile }"
              >
                {{ hasTasteProfile ? '✓' : '—' }}
              </div>
              <div class="stat-label">
                Taste Profile
              </div>
            </div>
          </section>

          <section class="dashboard-actions">
            <div
              class="action-card"
              :class="{ 'action-complete': hasSyncedData }"
            >
              <h3>Step 1: Fetch Your Data</h3>
              <p>We'll analyze your subscriptions and liked videos to understand your tastes.</p>
              <button
                class="btn btn-primary"
                :disabled="isSyncing"
                @click="handleSync"
              >
                <span
                  v-if="isSyncing"
                  class="btn-loading"
                >
                  <span class="spinner-small" />
                  Syncing...
                </span>
                <span v-else-if="hasSyncedData">
                  Re-sync Data
                </span>
                <span v-else>
                  Fetch YouTube Data
                </span>
              </button>
              <span
                v-if="hasSyncedData"
                class="action-status"
              >
                Data synced
              </span>
            </div>

            <div
              class="action-card"
              :class="{ 'action-disabled': !hasSyncedData, 'action-complete': hasTasteProfile }"
            >
              <h3>Step 2: Analyze Tastes</h3>
              <p>Our AI will categorize your interests and create your taste profile.</p>
              <button
                class="btn btn-primary"
                :disabled="!hasSyncedData || isAnalyzing"
                @click="handleAnalyze"
              >
                <span
                  v-if="isAnalyzing"
                  class="btn-loading"
                >
                  <span class="spinner-small" />
                  Analyzing...
                </span>
                <span v-else-if="hasTasteProfile">
                  Re-analyze
                </span>
                <span v-else>
                  Analyze My Tastes
                </span>
              </button>
              <span
                v-if="!hasSyncedData"
                class="coming-soon"
              >Sync data first</span>
              <span
                v-else-if="hasTasteProfile"
                class="action-status"
              >Profile generated</span>
            </div>

            <div
              class="action-card"
              :class="{ 'action-disabled': !hasTasteProfile, 'action-complete': hasTasteProfile }"
            >
              <h3>Step 3: Get Recommendations</h3>
              <p>Discover new channels, hidden gems, and content gaps.</p>
              <NuxtLink
                v-if="hasTasteProfile"
                to="/recommendations"
                class="btn btn-primary"
              >
                View Recommendations
              </NuxtLink>
              <button
                v-else
                class="btn btn-primary"
                disabled
              >
                View Recommendations
              </button>
              <span
                v-if="!hasTasteProfile"
                class="coming-soon"
              >Analyze tastes first</span>
            </div>
          </section>

          <!-- Taste Profile Display -->
          <section
            v-if="tasteProfile"
            class="taste-profile"
          >
            <h2>Your Taste Profile</h2>
            <p class="taste-summary">
              {{ tasteProfile.analysisSummary }}
            </p>

            <div class="taste-categories">
              <div
                v-for="category in tasteProfile.categories"
                :key="category.name"
                class="taste-category"
              >
                <div class="category-header">
                  <span class="category-name">{{ category.name }}</span>
                  <span class="category-weight">{{ Math.round(category.weight * 100) }}%</span>
                </div>
                <div class="category-bar">
                  <div
                    class="category-bar-fill"
                    :style="{ width: `${category.weight * 100}%` }"
                  />
                </div>
                <p class="category-description">
                  {{ category.description }}
                </p>
                <div
                  v-if="category.subCategories?.length"
                  class="subcategories"
                >
                  <span
                    v-for="sub in category.subCategories"
                    :key="sub"
                    class="subcategory-tag"
                  >{{ sub }}</span>
                </div>
              </div>
            </div>
          </section>
        </template>
      </div>
    </main>
  </div>
</template>

<style scoped>
.dashboard {
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

.dashboard-header {
  margin-bottom: var(--spacing-xl);
}

.dashboard-header h1 {
  margin-bottom: var(--spacing-sm);
}

.dashboard-header p {
  color: var(--color-text-secondary);
}

/* Sync Messages */
.sync-message {
  padding: var(--spacing-md) var(--spacing-lg);
  border-radius: var(--radius-md);
  margin-bottom: var(--spacing-lg);
  font-size: var(--font-size-sm);
}

.sync-success {
  background-color: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.3);
  color: #22c55e;
}

.sync-error {
  background-color: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #ef4444;
}

/* Data Stats */
.data-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-xl);
}

.stat-card {
  background-color: var(--color-bg-elevated);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-md);
  padding: var(--spacing-lg);
  text-align: center;
}

.stat-number {
  font-size: var(--font-size-2xl);
  font-weight: 700;
  color: var(--color-primary);
}

.stat-icon {
  font-size: var(--font-size-2xl);
  color: var(--color-text-muted);
}

.stat-icon.stat-ready {
  color: #22c55e;
}

.stat-label {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  margin-top: var(--spacing-xs);
}

/* Action Cards */
.dashboard-actions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--spacing-lg);
}

.action-card {
  background-color: var(--color-bg-elevated);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-lg);
  padding: var(--spacing-xl);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  transition: border-color 0.2s ease;
}

.action-card.action-complete {
  border-color: rgba(34, 197, 94, 0.3);
}

.action-card.action-disabled {
  opacity: 0.6;
}

.action-card h3 {
  font-size: var(--font-size-lg);
}

.action-card p {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  flex: 1;
}

.action-card .btn {
  align-self: flex-start;
}

.action-card .btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-status {
  font-size: var(--font-size-xs);
  color: #22c55e;
}

.coming-soon {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  font-style: italic;
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

/* Taste Profile */
.taste-profile {
  margin-top: var(--spacing-2xl);
  padding-top: var(--spacing-2xl);
  border-top: 1px solid var(--color-border-subtle);
}

.taste-profile h2 {
  margin-bottom: var(--spacing-md);
}

.taste-summary {
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-xl);
  line-height: 1.6;
}

.taste-categories {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.taste-category {
  background-color: var(--color-bg-elevated);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-md);
  padding: var(--spacing-lg);
}

.category-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-sm);
}

.category-name {
  font-weight: 600;
  font-size: var(--font-size-md);
}

.category-weight {
  font-size: var(--font-size-sm);
  color: var(--color-primary);
  font-weight: 600;
}

.category-bar {
  height: 6px;
  background-color: var(--color-bg);
  border-radius: var(--radius-full);
  margin-bottom: var(--spacing-sm);
  overflow: hidden;
}

.category-bar-fill {
  height: 100%;
  background-color: var(--color-primary);
  border-radius: var(--radius-full);
  transition: width 0.5s ease;
}

.category-description {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  margin-bottom: var(--spacing-sm);
}

.subcategories {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
}

.subcategory-tag {
  font-size: var(--font-size-xs);
  background-color: var(--color-bg);
  color: var(--color-text-secondary);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-full);
}
</style>
