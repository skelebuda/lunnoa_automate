import { createApp } from '@lunnoa-automate/toolkit';

import { extractStaticWebsiteContent } from './actions/extract-static-website-content.action';
import { extractWebsiteContent } from './actions/extract-website-content.action';
import { googleSearch } from './actions/google-search.action';

export const web = createApp({
  id: 'web',
  name: 'Web',
  description: `Access the web using pre-built actions`,
  logoUrl: 'https://lecca-io.s3.us-east-2.amazonaws.com/assets/apps/web.svg',
  actions: [googleSearch, extractStaticWebsiteContent, extractWebsiteContent],
  triggers: [],
  connections: [],
});
