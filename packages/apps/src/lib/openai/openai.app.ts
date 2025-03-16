import { createApp } from '@lunnoa-automate/toolkit';

import { chatFromText } from './actions/chat-from-text.action';
import { createEmbedding } from './actions/create-embedding.action';
import { openaiApiKey } from './connections/openai.api-key';

export const openai = createApp({
  id: 'openai',
  name: 'OpenAI',
  description:
    'OpenAI is a powerful AI model provider that can be used to generate human-like text and images.',
  logoUrl: 'https://lecca-io.s3.us-east-2.amazonaws.com/assets/apps/openai.svg',
  actions: [chatFromText, createEmbedding],
  triggers: [],
  connections: [openaiApiKey],
});
