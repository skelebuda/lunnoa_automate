import { createApp } from '@lunnoa-automate/toolkit';

import { concatenate } from './actions/concatenate.action';
import { replace } from './actions/replace.action';
import { search } from './actions/search.action';
import { split } from './actions/split.action';

export const text = createApp({
  id: 'text',
  name: 'Text Tools',
  description: `Text (string) tools to manage text data`,
  logoUrl: 'https://lecca-io.s3.us-east-2.amazonaws.com/assets/apps/text.svg',
  actions: [concatenate, replace, search, split],
  triggers: [],
  connections: [],
});
