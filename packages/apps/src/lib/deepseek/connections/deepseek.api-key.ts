import { createApiKeyConnection } from '@lunnoa-automate/toolkit';

export const deepSeekApiKey = createApiKeyConnection({
  id: 'deepseek_connection_api-key',
  name: 'API Key',
  description: 'Connect using an API key',
});
