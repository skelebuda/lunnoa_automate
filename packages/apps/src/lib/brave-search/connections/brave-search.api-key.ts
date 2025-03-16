import { createApiKeyConnection } from '@lunnoa-automate/toolkit';

export const braveSearchApiKey = createApiKeyConnection({
  id: 'brave-search_connection_api-key',
  name: 'API Key',
  description: 'Connect to Apify using an API Key',
});
