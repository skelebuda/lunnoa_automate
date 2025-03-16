import { createApiKeyConnection } from '@lunnoa-automate/toolkit';

export const apifyApiKey = createApiKeyConnection({
  id: 'apify_connection_api-key',
  name: 'Api Key',
  description: 'Connect to Apify using an API Key',
});
