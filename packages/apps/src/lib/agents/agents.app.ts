import { createApp } from '@lunnoa-automate/toolkit';

import { listAgents } from './actions/list-agents.action';
import { messageAgent } from './actions/message-agent.action';

export const agents = createApp({
  id: 'agents',
  name: 'Agents',
  description: `Message and manage your AI agents.`,
  logoUrl: 'https://lecca-io.s3.us-east-2.amazonaws.com/assets/apps/agents.svg',
  actions: [messageAgent, listAgents],
  triggers: [],
  connections: [],
});
