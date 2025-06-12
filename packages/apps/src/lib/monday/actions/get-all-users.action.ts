import { createAction } from '@lunnoa-automate/toolkit';
import { z } from 'zod';
import { shared } from '../shared/monday.shared';

export const getAllUsers = createAction({
  id: 'monday_action_get-all-users',
  name: 'Get All Users',
  description: 'Retrieves a list of all users in the account with their IDs, names, and emails.',
  inputConfig: [],
  aiSchema: z.object({}),
  run: async ({ http, workspaceId, connection }) => {
    const query = `query { users { id name email } }`;

    const data = await shared.mondayApiRequest({
      http,
      workspaceId,
      connection,
      query,
    });

    return { users: data.users };
  },
  mockRun: async () => {
    return {
      users: [
        { id: '12345', name: 'John Doe', email: 'john.doe@example.com' },
        { id: '67890', name: 'Jane Smith', email: 'jane.smith@example.com' },
      ],
    };
  },
}); 