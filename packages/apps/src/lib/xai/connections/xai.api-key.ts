import { createApiKeyConnection } from '@lunnoa-automate/toolkit';

export const xAiApiKey = createApiKeyConnection({
  id: 'xai_connection_api-key',
  name: 'API Key',
  description: 'Connect using an API key',
});
