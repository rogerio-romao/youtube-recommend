<script setup lang="ts">
definePageMeta({
  title: 'YouTube Recommend',
})
</script>

<template>
  <div class="landing">
    <div class="container">
      <div class="hero">
        <h1>YouTube Recommend</h1>
        <p class="hero-subtitle">
          Discover new channels based on your subscriptions and likes.
          AI-powered recommendations tailored to your tastes.
        </p>

        <div class="features">
          <div class="feature">
            <div class="feature-icon">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <h3>Channel Recommendations</h3>
            <p>Get personalized channel suggestions based on your YouTube activity</p>
          </div>

          <div class="feature">
            <div class="feature-icon">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </div>
            <h3>Hidden Gems</h3>
            <p>Discover smaller, underrated channels in categories you love</p>
          </div>

          <div class="feature">
            <div class="feature-icon">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <circle
                  cx="11"
                  cy="11"
                  r="8"
                />
                <path d="M21 21l-4.35-4.35" />
                <path d="M11 8v6" />
                <path d="M8 11h6" />
              </svg>
            </div>
            <h3>Content Gaps</h3>
            <p>Find topics you might enjoy but haven&apos;t explored yet</p>
          </div>
        </div>

        <div class="cta">
          <a
            href="/api/auth/google"
            class="btn btn-primary btn-lg"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Sign in with Google
          </a>
          <p class="cta-note">
            We only access your subscriptions and liked videos. No data is shared.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.landing {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xl) 0;
}

.hero {
  text-align: center;
  max-width: 800px;
  margin: 0 auto;
}

.hero h1 {
  margin-bottom: var(--spacing-md);
  background: linear-gradient(135deg, var(--color-text) 0%, var(--color-text-secondary) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-subtitle {
  font-size: var(--font-size-lg);
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-2xl);
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

.features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-2xl);
}

.feature {
  padding: var(--spacing-lg);
  background-color: var(--color-bg-elevated);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-lg);
  text-align: left;
  transition: border-color var(--transition-fast);
}

.feature:hover {
  border-color: var(--color-border);
}

.feature-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-primary-muted);
  color: var(--color-primary);
  border-radius: var(--radius-md);
  margin-bottom: var(--spacing-md);
}

.feature h3 {
  font-size: var(--font-size-base);
  margin-bottom: var(--spacing-sm);
}

.feature p {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

.cta {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-md);
}

.cta .btn {
  gap: var(--spacing-sm);
}

.cta-note {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}
</style>
