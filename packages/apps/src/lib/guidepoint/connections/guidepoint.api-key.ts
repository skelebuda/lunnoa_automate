import { createApiKeyConnection } from '@lunnoa-automate/toolkit';

export const guidepointApiKey = createApiKeyConnection({
  id: 'guidepoint_connection_api-key',
  name: 'API Key',
  description: 'Connect using an API Key',
});
