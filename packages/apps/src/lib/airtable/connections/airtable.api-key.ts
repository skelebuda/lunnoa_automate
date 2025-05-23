import { createApiKeyConnection } from '@lunnoa-automate/toolkit';

export const airtableApiKey = createApiKeyConnection({
  id: 'airtable_connection_api-key',
  name: 'API Key',
  description: 'Connect using an API key',
});
