import { createApiKeyConnection } from '@lunnoa-automate/toolkit';

export const confluenceApiKeyConnection = createApiKeyConnection({
  id: 'confluence_connection_api-key',
  name: 'API Key',
  description: 'Connect to Confluence Cloud using an API Token. You can create one at https://id.atlassian.com/manage-profile/security/api-tokens',
}); 