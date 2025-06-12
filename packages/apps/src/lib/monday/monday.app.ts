import { createApp } from '@lunnoa-automate/toolkit';
import { mondayOAuth2 } from './connections/monday.oauth2';
import { createItem } from './actions/create-item.action';
import { getUserTasks } from './actions/get-user-tasks.action';
import { getAllUsers } from './actions/get-all-users.action';

export const monday = createApp({
  id: 'monday',
  name: 'monday.com',
  description:
    'monday.com is a Work Operating System (Work OS) that powers teams to run projects and workflows with confidence.',
  logoUrl:
    'https://images.seeklogo.com/logo-png/39/2/monday-logo-png_seeklogo-394605.png',
  actions: [createItem, getUserTasks, getAllUsers],
  triggers: [],
  connections: [mondayOAuth2],
});
