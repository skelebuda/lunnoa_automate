import { createApiKeyConnection } from '@lunnoa-automate/toolkit';

export const salesRabbitApiKey = createApiKeyConnection({
  id: 'sales-rabbit_connection_api-key',
  name: 'API Key',
  description: 'Connect using an API key',
});
