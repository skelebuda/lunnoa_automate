import { createApiKeyConnection } from '@lunnoa-automate/toolkit';

export const geminiApiKey = createApiKeyConnection({
  id: 'gemini_connection_api-key',
  name: 'API Key',
  description: 'Connect using an API key',
});
