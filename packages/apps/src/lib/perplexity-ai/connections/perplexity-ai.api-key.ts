import { createApiKeyConnection } from '@lunnoa-automate/toolkit';

export const perplexityAiApiKey = createApiKeyConnection({
  id: 'perplexity-ai_connection_api-key',
  name: 'API Key',
  description: 'Connect using an API key',
});
