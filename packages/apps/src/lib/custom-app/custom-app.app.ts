import { createApp } from '@lunnoa-automate/toolkit';

import { runCustomApp } from './actions/run-custom-app.action';
import { runCustomAppSingle } from './actions/run-custom-app-single.action';

// Function to fetch workflows that could be moved to a shared utility


export const customApp = createApp({
  id: 'custom-app',
  name: 'Custom App',
  logoUrl:
    'https://lecca-io.s3.us-east-2.amazonaws.com/assets/apps/flow-control.svg',
  description: 'Internal app for custom actions, list of internally pulished apps',
  actions: [
    runCustomApp,
  ],
  triggers: [],
  connections: [],
});

