import { createApp } from "@lunnoa-automate/toolkit"

import { retrieveMeetings } from './actions/retrieve-meetings.action';
import { guidepointApiKey } from './connections/guidepoint.api-key';

export const guidepoint = createApp({
  id: 'guidepoint',
  name: 'Guidepoint',
  description: 'Guidepoint is an expert network platform that connects organizations with vetted specialists for on-demand insights and research.',
  logoUrl: 'https://www.jetro.go.jp/ext_images/_Newsroom/2018/3rd/0712b1.jpg',
  actions: [retrieveMeetings],
  triggers: [],
  connections: [guidepointApiKey],
});
