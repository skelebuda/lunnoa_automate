import { createApiKeyConnection } from '@lunnoa-automate/toolkit';

export const firecrawlApiKey = createApiKeyConnection({
  id: 'firecrawl_connection_api-key',
  name: 'Api Key',
  description: 'Connect using an API Key',
});
