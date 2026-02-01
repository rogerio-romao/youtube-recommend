# YouTube Recommend - Project Plan

## Overview

A Nuxt 3 web app that analyzes your YouTube subscriptions and liked videos, uses AI to categorize your tastes, and recommends new channels.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Nuxt 3 |
| Frontend | Vue 3 (Composition API), plain CSS |
| Database | SQLite + Drizzle ORM |
| Auth | Google OAuth 2.0 (YouTube Data API v3) |
| LLM | GitHub Models (default), OpenAI, Anthropic, Ollama (configurable via env) |
| Language | TypeScript |
| Deployment | Local-first, cloud-ready |

## MVP Features (Phase 1)

1. **Channel Recommendations** - "Based on your tastes, you might like these channels"
2. **Hidden Gems** - Surface smaller/underrated channels in categories you enjoy
3. **Content Gaps** - Identify topics you'd probably like but have zero subscriptions in

## Future Features (Phase 2+)

4. Natural Language Search ("find me relaxing coding channels")
5. Taste Profile visualization
6. Subscription Audit
7. Trend Detection

## Project Structure

```
youtube-recommend/
├── nuxt.config.ts
├── .env.example
├── drizzle.config.ts
├── package.json
│
├── server/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── google.get.ts        # OAuth initiate
│   │   │   ├── callback.get.ts      # OAuth callback
│   │   │   └── logout.post.ts
│   │   ├── youtube/
│   │   │   ├── subscriptions.get.ts # Fetch user subs
│   │   │   └── liked.get.ts         # Fetch liked videos
│   │   ├── analyze/
│   │   │   └── index.post.ts        # Trigger LLM analysis
│   │   └── recommendations/
│   │       ├── index.get.ts         # Get recommendations
│   │       ├── hidden-gems.get.ts
│   │       └── content-gaps.get.ts
│   ├── database/
│   │   ├── schema.ts                # Drizzle schema
│   │   └── index.ts                 # DB connection
│   ├── services/
│   │   ├── youtube.ts               # YouTube API wrapper
│   │   ├── llm/
│   │   │   ├── index.ts             # LLM factory
│   │   │   ├── types.ts             # LLM interfaces
│   │   │   ├── github.ts            # GitHub Models provider (default)
│   │   │   ├── openai.ts            # (planned)
│   │   │   ├── anthropic.ts         # (planned)
│   │   │   └── ollama.ts            # (planned)
│   │   ├── analyzer.ts              # Taste analysis logic
│   │   └── recommender.ts           # Recommendation generation
│   └── utils/
│       └── auth.ts
│
├── pages/
│   ├── index.vue                    # Landing / login
│   ├── dashboard.vue                # Main dashboard
│   └── recommendations/
│       ├── index.vue                # Channel recs
│       ├── hidden-gems.vue
│       └── content-gaps.vue
│
├── components/
│   ├── ChannelCard.vue              # Rich channel display
│   ├── CategoryTag.vue
│   ├── TasteProfile.vue             # Visual taste breakdown
│   ├── LoadingState.vue
│   └── Navbar.vue
│
├── composables/
│   ├── useAuth.ts
│   ├── useYouTube.ts
│   └── useRecommendations.ts
│
├── assets/
│   └── css/
│       └── main.css                 # Global styles, dark theme
│
└── public/
    └── favicon.ico

├── vitest.config.ts                 # Test configuration
├── tests/
│   ├── setup.ts                     # Global test setup
│   ├── mocks/
│   │   ├── llm.ts                   # LLM mock utilities
│   │   └── youtube.ts               # YouTube mock utilities
│   └── unit/
│       └── services/                # Service unit tests
```

## Database Schema

### users
| Column | Type | Description |
|--------|------|-------------|
| id | integer | Primary key |
| google_id | text | Unique Google ID |
| email | text | User email |
| name | text | Display name |
| avatar_url | text | Profile picture |
| created_at | timestamp | Creation date |
| updated_at | timestamp | Last update |

### subscriptions
| Column | Type | Description |
|--------|------|-------------|
| id | integer | Primary key |
| user_id | integer | Foreign key to users |
| channel_id | text | YouTube channel ID |
| channel_title | text | Channel name |
| channel_thumbnail | text | Thumbnail URL |
| subscriber_count | integer | Subscriber count |
| video_count | integer | Number of videos |
| fetched_at | timestamp | When data was fetched |

### liked_videos
| Column | Type | Description |
|--------|------|-------------|
| id | integer | Primary key |
| user_id | integer | Foreign key to users |
| video_id | text | YouTube video ID |
| video_title | text | Video title |
| channel_id | text | Channel ID |
| channel_title | text | Channel name |
| fetched_at | timestamp | When data was fetched |

### taste_profiles
| Column | Type | Description |
|--------|------|-------------|
| id | integer | Primary key |
| user_id | integer | Foreign key to users |
| categories | json | AI-generated categories with weights |
| analysis_summary | text | Text summary of tastes |
| analyzed_at | timestamp | When analysis was performed |

### recommendations
| Column | Type | Description |
|--------|------|-------------|
| id | integer | Primary key |
| user_id | integer | Foreign key to users |
| type | text | 'channel', 'hidden_gem', or 'content_gap' |
| channel_id | text | YouTube channel ID |
| channel_title | text | Channel name |
| channel_thumbnail | text | Thumbnail URL |
| subscriber_count | integer | Subscriber count |
| reason | text | Why this was recommended |
| category | text | Associated category |
| confidence_score | real | 0-1 confidence score |
| created_at | timestamp | When recommendation was generated |

## Environment Variables

```env
# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/callback

# LLM Provider (openai | anthropic | ollama)
LLM_PROVIDER=openai

# GitHub Models (default LLM provider)
GITHUB_TOKEN=                        # GitHub PAT with models:read permission
GITHUB_MODEL=openai/gpt-4o           # Optional: override default model

# LLM API Keys
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
OLLAMA_BASE_URL=http://localhost:11434

# Database
DATABASE_URL=file:./data/youtube-recommend.db
```

## API Flow

```
1. User clicks "Login with Google"
   └─> /api/auth/google → redirects to Google OAuth

2. Google redirects back
   └─> /api/auth/callback → stores user, redirects to /dashboard

3. Dashboard loads
   └─> /api/youtube/subscriptions → fetches & caches subs
   └─> /api/youtube/liked → fetches & caches liked videos

4. User clicks "Analyze My Taste"
   └─> /api/analyze → sends data to LLM → generates categories & profile

5. Dashboard shows recommendations
   └─> /api/recommendations → channel recs
   └─> /api/recommendations/hidden-gems → smaller channels
   └─> /api/recommendations/content-gaps → new categories to explore
```

## LLM Analysis Strategy

The analyzer will send a structured prompt to the LLM with:
- List of subscribed channels (name, description, category hints)
- Sample of liked videos (titles, channels)

The prompt will ask the LLM to:
1. Generate custom categories that describe the user's interests
2. Weight each category by how much content falls into it
3. Identify cross-category patterns (e.g., "educational comedy")
4. Suggest content gaps (categories adjacent to interests but missing)
5. Recommend specific channels with reasoning

## MVP Build Order

| Phase | Tasks |
|-------|-------|
| **1. Setup** | Init Nuxt 3, configure TypeScript, setup SQLite + Drizzle |
| **2. Auth** | Google OAuth flow, user persistence |
| **3. YouTube Integration** | Fetch subscriptions & liked videos via API |
| **4. Database Layer** | Store fetched data, cache appropriately |
| **5. LLM Integration** | Build flexible provider system (OpenAI/Anthropic/Ollama) |
| **6. Analyzer** | Taste profiling & category generation |
| **7. Recommendations** | Channel recs, hidden gems, content gaps endpoints |
| **8. UI - Dashboard** | Main layout, dark theme, loading states |
| **9. UI - Components** | ChannelCard, CategoryTag, TasteProfile |
| **10. UI - Pages** | Dashboard, recommendation views |
| **11. Polish** | Error handling, edge cases, responsive design |

## Design Direction

- **Style**: Minimal, clean (lots of whitespace)
- **Theme**: Dark mode
- **Components**: Rich channel cards with thumbnails, subscriber counts, category tags

## Future Enhancements

These are optional improvements to implement after the MVP is complete:

### High Priority
- [x] **Add tests** - Unit tests for core services (analyzer, recommender, youtube, llm/github) using Vitest
- [x] **Initialize git repo** - Set up git with proper .gitignore and initial commit
- [x] **GitHub Models provider** - Default LLM provider for GitHub Copilot subscribers

### UX Improvements
- [ ] **Loading skeletons** - Replace spinners with skeleton loaders for better perceived performance
- [ ] **Error boundaries** - Add Vue error boundaries for graceful error handling
- [ ] **Better feedback** - Toast notifications, progress indicators during LLM analysis

### Feature Enhancements
- [ ] **Save/dismiss recommendations** - Let users save favorites or dismiss unwanted recommendations
- [ ] **Fetch real channel data** - Use YouTube API to get actual thumbnails and subscriber counts for recommended channels
- [ ] **Recommendation caching** - Cache recommendations with TTL to avoid regenerating on every visit
- [ ] **Pagination** - Add pagination for users with many recommendations

### LLM Providers
- [ ] **OpenAI provider** - Implement `server/services/llm/openai.ts` (interfaces ready)
- [ ] **Anthropic provider** - Implement `server/services/llm/anthropic.ts` (interfaces ready)
- [ ] **Ollama provider** - Implement `server/services/llm/ollama.ts` for local LLM support

### Phase 2 Features (from original plan)
- [ ] **Natural Language Search** - "find me relaxing coding channels"
- [ ] **Taste Profile visualization** - Visual breakdown of user interests
- [ ] **Subscription Audit** - Identify inactive or redundant subscriptions
- [ ] **Trend Detection** - Identify emerging topics in user's interest areas

---

## Session Log

### 2026-02-01: Testing Foundation
- Set up Vitest with `@nuxt/test-utils`, `happy-dom`, `@vue/test-utils`
- Created test infrastructure: `vitest.config.ts`, `tests/setup.ts`, mock utilities
- Added 106 unit tests covering: `analyzer.ts`, `recommender.ts`, `youtube.ts`, `llm/github.ts`
- Exported pure functions from analyzer/recommender for testability
- **Not yet tested:** `llm/index.ts`, `server/utils/auth.ts`, API routes, composables
