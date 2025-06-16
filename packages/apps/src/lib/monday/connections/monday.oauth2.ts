import { createOAuth2Connection } from '@lunnoa-automate/toolkit';

export const mondayOAuth2 = createOAuth2Connection({
  id: 'monday_connection_oauth2',
  name: 'OAuth2',
  description: 'Connect using OAuth2',
  inputConfig: [],
  authorizeUrl: 'https://auth.monday.com/oauth2/authorize',
  tokenUrl: 'https://auth.monday.com/oauth2/token',
  getClientId: () => process.env.INTEGRATION_MONDAY_CLIENT_ID,
  getClientSecret: () => process.env.INTEGRATION_MONDAY_CLIENT_SECRET,
  scopeDelimiter: ' ',
  scopes: [
    'me:read',
    'boards:read',
    'boards:write',
    'docs:read',
    'docs:write',
    'workspaces:read',
    'workspaces:write',
    'users:read',
    'account:read',
    'notifications:write',
    'updates:read',
    'updates:write',
    'assets:read',
    'tags:read',
  ],
  extraAuthParams: {
    owner: 'user',
  },
  authorizationMethod: 'body',
  redirectToLocalHostInDevelopment: true,
});
