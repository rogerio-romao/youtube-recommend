/**
 * Recommendations Service
 *
 * Generates channel recommendations based on user's taste profile.
 * Uses LLM to suggest new channels, hidden gems, and content gaps.
 */

import { complete } from './llm'
import type { LLMMessage } from './llm'
import type { TasteCategory } from '../database/schema'

export type RecommendationType = 'channel' | 'hidden_gem' | 'content_gap'

export interface RecommendationItem {
  type: RecommendationType
  channelTitle: string
  channelId?: string
  reason: string
  category: string
  confidenceScore: number
  subscriberCount?: number
}

export interface RecommendationsInput {
  tasteProfile: {
    categories: TasteCategory[]
    analysisSummary: string
  }
  existingSubscriptions: string[] // Channel names to avoid recommending
}

export interface RecommendationsResult {
  recommendations: RecommendationItem[]
}

const SYSTEM_PROMPT = `You are an expert YouTube content curator and recommendation engine. Your task is to recommend YouTube channels based on a user's taste profile.

You must respond with valid JSON only, no markdown formatting or code blocks.

You will generate three types of recommendations:

1. **Channel Recommendations** (type: "channel"): Popular, well-established channels that match the user's interests. These should be high-quality channels with significant followings.

2. **Hidden Gems** (type: "hidden_gem"): Smaller, underrated channels (typically under 500K subscribers) that produce excellent content matching the user's tastes. These are channels they might not discover on their own.

3. **Content Gaps** (type: "content_gap"): Topics or content areas that align with the user's interests but that they haven't explored yet. Suggest specific channels that could fill these gaps.

For each recommendation, provide:
- The actual YouTube channel name (be specific and accurate)
- A personalized reason why this channel matches their tastes
- The category it fits into
- A confidence score (0.0-1.0) indicating how well it matches their profile`

const USER_PROMPT_TEMPLATE = `Based on this user's taste profile, generate personalized YouTube channel recommendations.

## User's Taste Profile

### Summary
{{analysisSummary}}

### Categories (by importance)
{{categories}}

### Channels to EXCLUDE (user already subscribed)
{{existingSubscriptions}}

Generate recommendations in this JSON format:
{
  "recommendations": [
    {
      "type": "channel",
      "channelTitle": "Exact YouTube Channel Name",
      "reason": "Personalized reason based on their specific interests",
      "category": "Category Name",
      "confidenceScore": 0.85
    },
    {
      "type": "hidden_gem",
      "channelTitle": "Smaller Channel Name",
      "reason": "Why this underrated channel is perfect for them",
      "category": "Category Name",
      "confidenceScore": 0.75
    },
    {
      "type": "content_gap",
      "channelTitle": "Channel Name",
      "reason": "How this expands their interests into new territory",
      "category": "New Category",
      "confidenceScore": 0.70
    }
  ]
}

Requirements:
- Generate 3-5 "channel" recommendations (popular channels)
- Generate 2-3 "hidden_gem" recommendations (smaller channels)
- Generate 2-3 "content_gap" recommendations (new areas to explore)
- Use REAL YouTube channel names that actually exist
- Do NOT recommend any channels from the exclude list
- Make reasons specific and personalized, not generic
- Confidence scores should reflect how well the channel matches their profile`

/**
 * Format taste categories for the prompt
 */
function formatCategories(categories: TasteCategory[]): string {
  return categories
    .sort((a, b) => b.weight - a.weight)
    .map((cat) => {
      const percent = Math.round(cat.weight * 100)
      const subs = cat.subCategories?.length
        ? ` (${cat.subCategories.join(', ')})`
        : ''
      return `- ${cat.name} (${percent}%): ${cat.description}${subs}`
    })
    .join('\n')
}

/**
 * Format existing subscriptions for exclusion
 */
function formatExclusions(subscriptions: string[], maxItems = 100): string {
  if (subscriptions.length === 0) {
    return 'None'
  }
  return subscriptions.slice(0, maxItems).join(', ')
}

/**
 * Build the recommendations prompt
 */
function buildPrompt(input: RecommendationsInput): string {
  const categoriesText = formatCategories(input.tasteProfile.categories)
  const exclusionsText = formatExclusions(input.existingSubscriptions)

  return USER_PROMPT_TEMPLATE
    .replace('{{analysisSummary}}', input.tasteProfile.analysisSummary)
    .replace('{{categories}}', categoriesText)
    .replace('{{existingSubscriptions}}', exclusionsText)
}

/**
 * Parse and validate the LLM response
 */
function parseRecommendationsResponse(content: string): RecommendationsResult {
  // Try to extract JSON from the response
  let jsonContent = content.trim()

  // Remove markdown code blocks if present
  if (jsonContent.startsWith('```')) {
    jsonContent = jsonContent.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(jsonContent)
  }
  catch (e) {
    throw new Error(`Failed to parse LLM response as JSON: ${e}`)
  }

  // Validate structure
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('LLM response is not an object')
  }

  const response = parsed as Record<string, unknown>

  if (!Array.isArray(response.recommendations)) {
    throw new Error('LLM response missing recommendations array')
  }

  // Validate and normalize recommendations
  const recommendations: RecommendationItem[] = []

  for (let index = 0; index < response.recommendations.length; index++) {
    const rec = response.recommendations[index]

    if (!rec || typeof rec !== 'object') {
      console.warn(`Recommendation ${index} is not an object, skipping`)
      continue
    }

    const item = rec as Record<string, unknown>

    // Validate required fields
    if (typeof item.channelTitle !== 'string' || !item.channelTitle) {
      console.warn(`Recommendation ${index} missing channelTitle, skipping`)
      continue
    }

    if (typeof item.type !== 'string' || !['channel', 'hidden_gem', 'content_gap'].includes(item.type)) {
      console.warn(`Recommendation ${index} has invalid type, defaulting to 'channel'`)
      item.type = 'channel'
    }

    if (typeof item.reason !== 'string' || !item.reason) {
      console.warn(`Recommendation ${index} missing reason, skipping`)
      continue
    }

    if (typeof item.category !== 'string' || !item.category) {
      item.category = 'General'
    }

    if (typeof item.confidenceScore !== 'number') {
      item.confidenceScore = 0.7
    }

    recommendations.push({
      type: item.type as RecommendationType,
      channelTitle: item.channelTitle,
      channelId: typeof item.channelId === 'string' ? item.channelId : undefined,
      reason: item.reason,
      category: item.category as string,
      confidenceScore: Math.max(0, Math.min(1, item.confidenceScore as number)),
      subscriberCount: typeof item.subscriberCount === 'number' ? item.subscriberCount : undefined,
    })
  }

  if (recommendations.length === 0) {
    throw new Error('No valid recommendations in LLM response')
  }

  return { recommendations }
}

/**
 * Generate recommendations based on user's taste profile
 */
export async function generateRecommendations(
  input: RecommendationsInput,
): Promise<RecommendationsResult> {
  // Validate input
  if (!input.tasteProfile.categories || input.tasteProfile.categories.length === 0) {
    throw new Error('No taste profile available. Please analyze your tastes first.')
  }

  const userPrompt = buildPrompt(input)

  const messages: LLMMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: userPrompt },
  ]

  const response = await complete(messages, {
    temperature: 0.8, // Slightly higher for more creative recommendations
    maxTokens: 3000,
  })

  return parseRecommendationsResponse(response.content)
}
