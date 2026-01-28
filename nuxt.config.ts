// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({

  modules: ['@nuxt/eslint'],
  devtools: { enabled: true },

  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    // Server-only keys (not exposed to client)
    googleClientId: process.env.GOOGLE_CLIENT_ID,
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
    googleRedirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/callback',
    llmProvider: process.env.LLM_PROVIDER || 'openai',
    openaiApiKey: process.env.OPENAI_API_KEY,
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
    ollamaBaseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    databaseUrl: process.env.DATABASE_URL || 'file:./data/youtube-recommend.db',
  },
  compatibilityDate: '2025-01-28',

  typescript: {
    strict: true,
    typeCheck: false, // Run separately via pnpm typecheck
  },

  eslint: {
    config: {
      stylistic: true,
    },
  },
})
