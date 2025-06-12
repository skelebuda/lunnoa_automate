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
    'https://lecca-io.s3.us-east-2.amazonaws.com/assets/apps/monday.svg',
  actions: [createItem, getUserTasks, getAllUsers],
  triggers: [],
  connections: [mondayOAuth2],
});
