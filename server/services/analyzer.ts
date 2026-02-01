/**
 * Taste Analyzer Service
 *
 * Analyzes user's YouTube subscriptions and liked videos using LLM
 * to generate a taste profile with categorized interests.
 */

import { complete } from './llm'
import type { LLMMessage } from './llm'
import type { TasteCategory } from '../database/schema'

export interface ChannelData {
  channelTitle: string
  channelDescription: string | null
  subscriberCount: number | null
  videoCount: number | null
}

export interface VideoData {
  videoTitle: string
  channelTitle: string
}

export interface TasteAnalysisInput {
  subscriptions: ChannelData[]
  likedVideos: VideoData[]
}

export interface TasteAnalysisResult {
  categories: TasteCategory[]
  analysisSummary: string
}

const SYSTEM_PROMPT = `You are an expert content analyst specializing in understanding user preferences and interests based on their YouTube activity. Your task is to analyze a user's YouTube subscriptions and liked videos to create a detailed taste profile.

You must respond with valid JSON only, no markdown formatting or code blocks.

Analyze the provided data and identify:
1. Major interest categories (e.g., Technology, Gaming, Music, Education, Entertainment, Sports, etc.)
2. Subcategories within each major category
3. The relative weight/importance of each category (0.0 to 1.0, all weights should sum to 1.0)
4. A brief description of what specifically interests them in each category

Be specific and insightful. Don't just list generic categories - identify the specific niches and themes that emerge from their viewing habits.`

const USER_PROMPT_TEMPLATE = `Analyze this YouTube activity data and create a taste profile:

## Subscribed Channels ({{subscriptionCount}} total):
{{subscriptions}}

## Liked Videos ({{likedVideoCount}} total, showing sample):
{{likedVideos}}

Respond with JSON in this exact format:
{
  "categories": [
    {
      "name": "Category Name",
      "weight": 0.25,
      "description": "Specific description of their interest in this area",
      "subCategories": ["Subcategory 1", "Subcategory 2"]
    }
  ],
  "analysisSummary": "A 2-3 sentence summary of their overall content preferences and what makes their taste unique."
}

Important:
- Include 4-8 categories
- Weights must sum to 1.0
- Be specific, not generic
- Base analysis on actual channel/video names provided`

/**
 * Format subscription data for the prompt
 * @internal Exported for testing
 */
export function formatSubscriptions(subscriptions: ChannelData[], maxItems = 50): string {
  const items = subscriptions.slice(0, maxItems)
  return items
    .map((sub) => {
      const parts = [`- ${sub.channelTitle}`]
      if (sub.channelDescription) {
        // Truncate long descriptions
        const desc = sub.channelDescription.slice(0, 100)
        parts.push(`(${desc}${sub.channelDescription.length > 100 ? '...' : ''})`)
      }
      return parts.join(' ')
    })
    .join('\n')
}

/**
 * Format liked videos for the prompt
 * @internal Exported for testing
 */
export function formatLikedVideos(videos: VideoData[], maxItems = 30): string {
  const items = videos.slice(0, maxItems)
  return items
    .map(video => `- "${video.videoTitle}" by ${video.channelTitle}`)
    .join('\n')
}

/**
 * Build the analysis prompt from input data
 * @internal Exported for testing
 */
export function buildAnalysisPrompt(input: TasteAnalysisInput): string {
  const subscriptionsText = formatSubscriptions(input.subscriptions)
  const likedVideosText = formatLikedVideos(input.likedVideos)

  return USER_PROMPT_TEMPLATE
    .replace('{{subscriptionCount}}', String(input.subscriptions.length))
    .replace('{{subscriptions}}', subscriptionsText || 'No subscriptions available')
    .replace('{{likedVideoCount}}', String(input.likedVideos.length))
    .replace('{{likedVideos}}', likedVideosText || 'No liked videos available')
}

/**
 * Parse and validate the LLM response
 * @internal Exported for testing
 */
export function parseAnalysisResponse(content: string): TasteAnalysisResult {
  // Try to extract JSON from the response (handle markdown code blocks if present)
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

  if (!Array.isArray(response.categories)) {
    throw new Error('LLM response missing categories array')
  }

  if (typeof response.analysisSummary !== 'string') {
    throw new Error('LLM response missing analysisSummary string')
  }

  // Validate and normalize categories
  const categories: TasteCategory[] = response.categories.map((cat: unknown, index: number) => {
    if (!cat || typeof cat !== 'object') {
      throw new Error(`Category ${index} is not an object`)
    }

    const category = cat as Record<string, unknown>

    if (typeof category.name !== 'string') {
      throw new Error(`Category ${index} missing name`)
    }

    if (typeof category.weight !== 'number') {
      throw new Error(`Category ${index} missing weight`)
    }

    if (typeof category.description !== 'string') {
      throw new Error(`Category ${index} missing description`)
    }

    return {
      name: category.name,
      weight: Math.max(0, Math.min(1, category.weight)),
      description: category.description,
      subCategories: Array.isArray(category.subCategories)
        ? category.subCategories.filter((s): s is string => typeof s === 'string')
        : undefined,
    }
  })

  // Normalize weights to sum to 1.0
  const totalWeight = categories.reduce((sum, cat) => sum + cat.weight, 0)
  if (totalWeight > 0) {
    categories.forEach((cat) => {
      cat.weight = cat.weight / totalWeight
    })
  }

  return {
    categories,
    analysisSummary: response.analysisSummary,
  }
}

/**
 * Analyze user's YouTube data and generate a taste profile
 */
export async function analyzeTaste(input: TasteAnalysisInput): Promise<TasteAnalysisResult> {
  // Validate input
  if (input.subscriptions.length === 0 && input.likedVideos.length === 0) {
    throw new Error('No YouTube data available to analyze. Please sync your YouTube data first.')
  }

  const userPrompt = buildAnalysisPrompt(input)

  const messages: LLMMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: userPrompt },
  ]

  const response = await complete(messages, {
    temperature: 0.7,
    maxTokens: 2000,
  })

  return parseAnalysisResponse(response.content)
}
