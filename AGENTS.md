# AGENTS.md

Guidelines for AI coding agents working on the YouTube Recommend project.

## Project Overview

YouTube Recommend is a Nuxt 3 web app that analyzes YouTube subscriptions and liked videos, uses AI to categorize user tastes, and recommends new channels.

See `PROJECT_PLAN.md` for full architecture and implementation details.

## Tech Stack

- **Framework**: Nuxt 4
- **Frontend**: Vue 3 (Composition API), plain CSS
- **Database**: SQLite + Drizzle ORM
- **Auth**: Google OAuth 2.0 (YouTube Data API v3)
- **LLM**: OpenAI, Anthropic, Ollama (configurable)
- **Language**: TypeScript (strict mode)

---

## Build / Lint / Test Commands

```bash
# Install dependencies
pnpm install

# Development server (http://localhost:3000)
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview

# Type checking
pnpm typecheck

# Linting
pnpm lint
pnpm lint:fix

# Run all tests
pnpm test

# Run a single test file
pnpm test path/to/file.test.ts

# Run tests matching a pattern
pnpm test -t "pattern"

# Run tests in watch mode
pnpm test:watch

# Database migrations
pnpm db:generate    # Generate migrations from schema
pnpm db:migrate     # Run migrations
pnpm db:studio      # Open Drizzle Studio
```

---

## Code Style Guidelines

### File Naming

- **Vue components**: PascalCase (`ChannelCard.vue`, `TasteProfile.vue`)
- **Composables**: camelCase with `use` prefix (`useAuth.ts`, `useYouTube.ts`)
- **API routes**: kebab-case with HTTP method suffix (`subscriptions.get.ts`, `hidden-gems.get.ts`)
- **Services/Utils**: camelCase (`youtube.ts`, `analyzer.ts`)
- **Types**: PascalCase (`User`, `Subscription`, `TasteProfile`)

### TypeScript

- Use strict mode (`strict: true` in tsconfig)
- Always define explicit return types for functions
- Prefer interfaces over types for object shapes
- Use `unknown` over `any` when type is uncertain
- Define types in `types/` directory or co-located with usage

### Vue Components

- Use `<script setup lang="ts">` syntax
- Define props with `defineProps<T>()` for type safety
- Define emits with `defineEmits<T>()`
- Use composables for shared logic
- Keep components focused and single-purpose

### Composables

- Prefix with `use`
- Return reactive refs and functions
- Handle cleanup in `onUnmounted` if needed

### API Routes (Nuxt Server)

- Use `defineEventHandler` for all routes
- Validate input with runtime checks
- Return typed responses
- Handle errors with `createError()` for HTTP errors

### Imports

- Use absolute imports from `~/` (Nuxt alias)
- Group imports: external packages, then internal modules
- Auto-imports are available for Vue, Nuxt, and configured directories

### CSS Guidelines

- Use plain CSS (no preprocessors)
- Scope styles in Vue components with `<style scoped>`
- Use CSS custom properties for theming (see `app/assets/css/main.css`)
- Mobile-first responsive design

### Error Handling

- Use try/catch for async operations
- Throw `createError()` in API routes for HTTP errors
- Log errors server-side, show user-friendly messages client-side
- Never expose internal error details to users

### Database (Drizzle)

- Define schema in `server/database/schema.ts`
- Use migrations for schema changes
- Always use parameterized queries (Drizzle handles this)
- Keep queries in service files, not in API routes directly

### LLM Integration

- Abstract provider details behind a common interface
- Store API keys in environment variables only
- Implement retry logic with exponential backoff
- Set reasonable timeouts
- Cache results when appropriate

---

## Environment Variables

Required variables are documented in `.env.example`. Never commit actual secrets.

```env
GOOGLE_CLIENT_ID=         # Required: Google OAuth client ID
GOOGLE_CLIENT_SECRET=     # Required: Google OAuth client secret
LLM_PROVIDER=             # Required: openai | anthropic | ollama
OPENAI_API_KEY=           # Required if LLM_PROVIDER=openai
ANTHROPIC_API_KEY=        # Required if LLM_PROVIDER=anthropic
OLLAMA_BASE_URL=          # Required if LLM_PROVIDER=ollama
```

---

## Project Conventions

1. **Keep components small** - If a component exceeds ~150 lines, consider splitting
2. **Co-locate related files** - Tests next to source, types near usage
3. **Document complex logic** - Add comments explaining "why", not "what"
4. **Fail fast** - Validate inputs early, throw descriptive errors
5. **No magic strings** - Use constants or enums for repeated values
6. **Optimize later** - Write clear code first, optimize when needed
