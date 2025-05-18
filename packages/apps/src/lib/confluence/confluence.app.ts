import { createApp } from '@lunnoa-automate/toolkit';

import { readWikiPage } from './actions/read-wiki-page.action';
import { confluenceApiKeyConnection } from './connections/confluence.api-key';

export const confluence = createApp({
  id: 'confluence',
  name: 'Confluence',
  description: 'Automate your Confluence workspace: read, update, and manage wiki pages.',
  logoUrl: 'https://www.svgrepo.com/show/353597/confluence.svg',
  actions: [
    readWikiPage,
    // Add more actions here
  ],
  triggers: [],
  connections: [confluenceApiKeyConnection],
}); 