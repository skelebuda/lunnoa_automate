import { createApiKeyConnection } from '@lunnoa-automate/toolkit';

export const serperApiKey = createApiKeyConnection({
  id: 'serper_connection_api-key',
  name: 'API Key',
  description: 'Connect to Apify using an API Key',
});
