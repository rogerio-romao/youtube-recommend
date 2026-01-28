/**
 * GET /api/llm/status
 *
 * Returns the status of the LLM configuration
 */
import { isLLMConfigured, getLLMProvider } from '../../services/llm'

export default defineEventHandler(() => {
  const configured = isLLMConfigured()

  if (!configured) {
    return {
      configured: false,
      provider: null,
      model: null,
      message: 'No LLM provider configured. Set GITHUB_TOKEN environment variable.',
    }
  }

  const provider = getLLMProvider()

  return {
    configured: true,
    provider: provider.name,
    model: provider.getDefaultModel(),
    message: `LLM ready with ${provider.name} provider`,
  }
})
