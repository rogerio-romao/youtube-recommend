# YouTube Recommend

A web app that analyzes your YouTube subscriptions and liked videos, uses AI to understand your tastes, and recommends new channels you'll love.

## Features

- **Channel Recommendations** - Discover popular channels that match your interests
- **Hidden Gems** - Surface smaller, underrated channels in categories you enjoy
- **Content Gaps** - Find topics you'd probably like but haven't explored yet
- **Taste Profile** - AI-generated analysis of your viewing preferences

## How It Works

1. **Sign in with Google** - Securely connect your YouTube account
2. **Sync your data** - Fetch your subscriptions and liked videos
3. **Analyze your taste** - AI categorizes your interests and viewing patterns
4. **Get recommendations** - Receive personalized channel suggestions with explanations

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Nuxt 4 |
| Frontend | Vue 3 (Composition API), CSS |
| Database | SQLite + Drizzle ORM |
| Auth | Google OAuth 2.0 (YouTube Data API v3) |
| LLM | GitHub Models (default), OpenAI, Anthropic, Ollama |
| Language | TypeScript |

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- Google Cloud project with YouTube Data API v3 enabled
- GitHub token with `models:read` permission (for LLM features)

### Installation

```bash
# Clone the repository
git clone https://github.com/rogerio-romao/youtube-recommend.git
cd youtube-recommend

# Install dependencies
pnpm install

# Copy environment template
cp .env.example .env
```

### Configuration

Edit `.env` with your credentials:

```env
# Google OAuth (required)
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret

# GitHub Models - default LLM provider (required)
GITHUB_TOKEN=your-github-token

# Or use alternative LLM providers
# OPENAI_API_KEY=your-openai-key
# ANTHROPIC_API_KEY=your-anthropic-key
# OLLAMA_BASE_URL=http://localhost:11434
```

### Development

```bash
# Start development server
pnpm dev

# Run tests
pnpm test

# Type checking
pnpm typecheck

# Linting
pnpm lint
```

### Database

```bash
# Generate migrations from schema
pnpm db:generate

# Run migrations
pnpm db:migrate

# Open Drizzle Studio
pnpm db:studio
```

## Project Structure

```
youtube-recommend/
├── app/
│   ├── pages/           # Vue pages
│   ├── components/      # Vue components
│   └── composables/     # Vue composables
├── server/
│   ├── api/             # API routes
│   ├── services/        # Business logic
│   │   ├── llm/         # LLM providers
│   │   ├── analyzer.ts  # Taste analysis
│   │   ├── recommender.ts
│   │   └── youtube.ts   # YouTube API
│   ├── database/        # Drizzle schema
│   └── utils/           # Utilities
└── tests/               # Unit tests
```

## License

MIT
